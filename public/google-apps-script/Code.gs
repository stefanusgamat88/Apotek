/**
 * ==============================================================================
 * APOTEKPOS - BACKEND GOOGLE APPS SCRIPT (GAS) + GOOGLE SHEETS
 * Versi: 2.0.0
 * 
 * Panduan Pemasangan:
 * 1. Buka Google Sheets baru di browser (misal: "Database ApotekPOS")
 * 2. Klik menu "Ekstensi" (Extensions) -> "Apps Script"
 * 3. Hapus semua kode default di Code.gs, lalu paste seluruh skrip ini
 * 4. Klik ikon Save (Simpan)
 * 5. Klik tombol biru "Deploy" (Terapkan) di kanan atas -> "New deployment" (Penerapan baru)
 * 6. Pilih jenis "Web app" (Aplikasi Web)
 *    - Description: ApotekPOS API
 *    - Execute as: Me (akun Anda)
 *    - Who has access: Anyone (Siapa saja)  <-- PENTING agar web app bisa mengakses API!
 * 7. Klik "Deploy", beri izin akses Google jika diminta
 * 8. Salin "Web app URL" (format: https://script.google.com/macros/s/.../exec)
 * 9. Tempelkan URL tersebut ke menu Pengaturan ApotekPOS -> Google Apps Script
 * ==============================================================================
 */

var SHEETS = {
  OBAT: 'Obat',
  TRANSAKSI: 'Transaksi',
  DETAIL_TRANSAKSI: 'DetailTransaksi',
  MUTASI_STOK: 'MutasiStok',
  PELANGGAN: 'Pelanggan',
  SUPPLIER: 'Supplier',
  PENGATURAN: 'Pengaturan'
};

function doGet(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  var action = params.action || 'ping';
  var result = { success: false };

  try {
    if (action === 'ping') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      result = {
        success: true,
        message: 'Koneksi Google Apps Script berhasil terhubung ke Google Sheets!',
        sheetName: ss.getName(),
        sheetUrl: ss.getUrl(),
        timestamp: new Date().toISOString()
      };
    } else if (action === 'getData' || action === 'pullAll') {
      result = getAllDataFromSheets();
    } else {
      result = { success: false, message: 'Aksi GET tidak dikenali: ' + action };
    }
  } catch (err) {
    result = { success: false, message: 'Terjadi error di GAS doGet: ' + err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var result = { success: false };

  try {
    var payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }

    var action = payload.action || 'ping';

    if (action === 'ping') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      result = {
        success: true,
        message: 'Koneksi Google Apps Script POST berhasil!',
        sheetName: ss.getName(),
        timestamp: new Date().toISOString()
      };
    } 
    else if (action === 'setupSheets') {
      result = setupAllSheets();
    } 
    else if (action === 'syncAll' || action === 'pushAll') {
      result = syncAllDataToSheets(payload.data || {});
    } 
    else if (action === 'saveTransaction') {
      result = appendTransaction(payload.transaction);
    } 
    else if (action === 'pullAll') {
      result = getAllDataFromSheets();
    } 
    else {
      result = { success: false, message: 'Aksi POST tidak dikenali: ' + action };
    }
  } catch (err) {
    result = { success: false, message: 'Terjadi error di GAS doPost: ' + err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function setupAllSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var headerColor = '#059669';
  var textColor = '#ffffff';

  var shObat = getOrCreateSheet(ss, SHEETS.OBAT);
  var obatHeaders = [
    'ID Obat', 'Barcode', 'SKU', 'Nama Obat', 'Nama Generik', 'Kategori',
    'Indikasi', 'Butuh Resep', 'Satuan Dasar', 'Multi Satuan JSON', 'Stok', 
    'Min Stok', 'Harga Beli (HPP)', 'Harga Jual', 'Expired Date', 'No Batch', 
    'Pabrik/PBF', 'Rak Lokasi', 'Total Terjual', 'Terakhir Terjual'
  ];
  formatHeaderRow(shObat, obatHeaders, headerColor, textColor);

  var shTx = getOrCreateSheet(ss, SHEETS.TRANSAKSI);
  var txHeaders = [
    'ID Transaksi', 'No Faktur', 'Tanggal & Waktu', 'Kasir', 'Pelanggan',
    'No Telepon', 'Metode Bayar', 'Subtotal', 'Diskon', 'Pajak', 
    'Total Belanja', 'Nominal Bayar', 'Kembalian', 'Total HPP', 'Laba Bersih',
    'Status', 'Catatan', 'Ringkasan Item'
  ];
  formatHeaderRow(shTx, txHeaders, headerColor, textColor);

  var shDetail = getOrCreateSheet(ss, SHEETS.DETAIL_TRANSAKSI);
  var detailHeaders = [
    'ID Transaksi', 'No Faktur', 'ID Obat', 'Nama Obat', 'Satuan Dipilih',
    'Qty', 'Harga Satuan', 'Diskon Item (%)', 'Subtotal'
  ];
  formatHeaderRow(shDetail, detailHeaders, headerColor, textColor);

  var shMutasi = getOrCreateSheet(ss, SHEETS.MUTASI_STOK);
  var mutasiHeaders = [
    'ID Mutasi', 'Tanggal & Waktu', 'ID Obat', 'Nama Obat', 'Tipe Mutasi',
    'Jumlah (Qty)', 'Sisa Stok Akhir', 'No Referensi', 'Keterangan/Batch'
  ];
  formatHeaderRow(shMutasi, mutasiHeaders, headerColor, textColor);

  var shCust = getOrCreateSheet(ss, SHEETS.PELANGGAN);
  var custHeaders = [
    'ID Pelanggan', 'Nama Lengkap', 'No Telepon', 'Email', 'Alamat',
    'Catatan Alergi', 'Total Transaksi', 'Total Belanja', 'Tanggal Daftar'
  ];
  formatHeaderRow(shCust, custHeaders, headerColor, textColor);

  var shSup = getOrCreateSheet(ss, SHEETS.SUPPLIER);
  var supHeaders = [
    'ID Supplier', 'Nama PBF/Distributor', 'Kontak Person', 'No Telepon',
    'Email', 'Alamat', 'Jatuh Tempo (Hari)', 'Status'
  ];
  formatHeaderRow(shSup, supHeaders, headerColor, textColor);

  var shSet = getOrCreateSheet(ss, SHEETS.PENGATURAN);
  var setHeaders = ['Kunci Pengaturan', 'Nilai Pengaturan', 'Keterangan'];
  formatHeaderRow(shSet, setHeaders, headerColor, textColor);

  return {
    success: true,
    message: 'Semua lembar kerja database ApotekPOS berhasil dibuat & diformat!',
    spreadsheetUrl: ss.getUrl()
  };
}

function syncAllDataToSheets(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (data.medicines && Array.isArray(data.medicines)) {
    var sh = getOrCreateSheet(ss, SHEETS.OBAT);
    clearDataRows(sh);
    if (data.medicines.length > 0) {
      var rows = data.medicines.map(function(m) {
        return [
          m.id || '', m.barcode || '', m.sku || '', m.name || '', m.genericName || '',
          m.category || '', m.indication || '', m.requiresPrescription ? 'Ya' : 'Tidak',
          m.baseUnit || '', JSON.stringify(m.units || []), m.stock || 0, m.minStock || 0,
          m.buyPrice || 0, m.sellPrice || 0, m.expiredDate || '', m.batchNumber || '',
          m.manufacturer || '', m.locationRack || '', m.totalSold || 0, m.lastSoldDate || ''
        ];
      });
      sh.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    }
  }

  if (data.transactions && Array.isArray(data.transactions)) {
    var shTx = getOrCreateSheet(ss, SHEETS.TRANSAKSI);
    var shDet = getOrCreateSheet(ss, SHEETS.DETAIL_TRANSAKSI);
    clearDataRows(shTx);
    clearDataRows(shDet);

    var txRows = [];
    var detRows = [];

    data.transactions.forEach(function(tx) {
      var itemSummary = (tx.items || []).map(function(it) {
        return it.medicine.name + ' (' + it.quantity + ' ' + (it.selectedUnit ? it.selectedUnit.name : '') + ')';
      }).join(', ');

      txRows.push([
        tx.id || '', tx.invoiceNumber || '', tx.timestamp || '', tx.cashierName || '',
        tx.customerName || 'Umum', tx.customerPhone || '-', tx.paymentMethod || 'cash',
        tx.subtotal || 0, tx.discount || 0, tx.tax || 0, tx.total || 0,
        tx.amountPaid || 0, tx.change || 0, tx.totalHPP || 0, tx.netProfit || 0,
        tx.status || 'completed', tx.notes || '', itemSummary
      ]);

      (tx.items || []).forEach(function(it) {
        detRows.push([
          tx.id || '', tx.invoiceNumber || '', it.medicine.id || '', it.medicine.name || '',
          it.selectedUnit ? it.selectedUnit.name : '', it.quantity || 1, it.unitPrice || 0,
          it.discountPercent || 0, it.subtotal || 0
        ]);
      });
    });

    if (txRows.length > 0) {
      shTx.getRange(2, 1, txRows.length, txRows[0].length).setValues(txRows);
    }
    if (detRows.length > 0) {
      shDet.getRange(2, 1, detRows.length, detRows[0].length).setValues(detRows);
    }
  }

  if (data.customers && Array.isArray(data.customers)) {
    var shCust = getOrCreateSheet(ss, SHEETS.PELANGGAN);
    clearDataRows(shCust);
    if (data.customers.length > 0) {
      var custRows = data.customers.map(function(c) {
        return [
          c.id || '', c.name || '', c.phone || '', c.email || '', c.address || '',
          c.allergies || '', c.totalTransactions || 0, c.totalSpent || 0, c.registeredDate || ''
        ];
      });
      shCust.getRange(2, 1, custRows.length, custRows[0].length).setValues(custRows);
    }
  }

  if (data.suppliers && Array.isArray(data.suppliers)) {
    var shSup = getOrCreateSheet(ss, SHEETS.SUPPLIER);
    clearDataRows(shSup);
    if (data.suppliers.length > 0) {
      var supRows = data.suppliers.map(function(s) {
        return [
          s.id || '', s.name || '', s.contactPerson || '', s.phone || '',
          s.email || '', s.address || '', s.termDays || 30, s.status || 'active'
        ];
      });
      shSup.getRange(2, 1, supRows.length, supRows[0].length).setValues(supRows);
    }
  }

  if (data.stockMovements && Array.isArray(data.stockMovements)) {
    var shMut = getOrCreateSheet(ss, SHEETS.MUTASI_STOK);
    clearDataRows(shMut);
    if (data.stockMovements.length > 0) {
      var mutRows = data.stockMovements.map(function(m) {
        return [
          m.id || '', m.date || '', m.medicineId || '', m.medicineName || '',
          m.type || '', m.quantity || 0, m.finalStock || 0, m.reference || '', m.notes || ''
        ];
      });
      shMut.getRange(2, 1, mutRows.length, mutRows[0].length).setValues(mutRows);
    }
  }

  if (data.settings) {
    var shSet = getOrCreateSheet(ss, SHEETS.PENGATURAN);
    clearDataRows(shSet);
    var setRows = [
      ['pharmacyName', data.settings.pharmacyName || '', 'Nama Apotek'],
      ['pharmacyTagline', data.settings.pharmacyTagline || '', 'Slogan Apotek'],
      ['address', data.settings.address || '', 'Alamat Lengkap'],
      ['city', data.settings.city || '', 'Kota / Kabupaten'],
      ['phone', data.settings.phone || '', 'Nomor Telepon / WhatsApp'],
      ['siaNumber', data.settings.siaNumber || '', 'Surat Izin Apotek (SIA)'],
      ['sipaNumber', data.settings.sipaNumber || '', 'Surat Izin Praktik Apoteker (SIPA)'],
      ['pharmacistName', data.settings.pharmacistName || '', 'Nama Apoteker Pengelola Apotek (APA)'],
      ['printerPaperWidth', data.settings.printerPaperWidth || '58mm', 'Ukuran Kertas Struk Kasir'],
      ['enableTax', data.settings.enableTax ? 'Ya' : 'Tidak', 'Pajak Aktif'],
      ['taxRate', data.settings.taxRate || 0, 'Tarif Pajak %'],
      ['receiptFooter', data.settings.receiptFooter || '', 'Pesan Footer Struk Kasir'],
      ['lastSynced', new Date().toISOString(), 'Waktu Sinkronisasi Terakhir']
    ];
    shSet.getRange(2, 1, setRows.length, setRows[0].length).setValues(setRows);
  }

  return {
    success: true,
    message: 'Seluruh data ApotekPOS berhasil diunggah dan disimpan ke Google Sheets!',
    timestamp: new Date().toISOString()
  };
}

function appendTransaction(tx) {
  if (!tx) return { success: false, message: 'Objek transaksi kosong' };

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var shTx = getOrCreateSheet(ss, SHEETS.TRANSAKSI);
  var shDet = getOrCreateSheet(ss, SHEETS.DETAIL_TRANSAKSI);
  var shMut = getOrCreateSheet(ss, SHEETS.MUTASI_STOK);

  var itemSummary = (tx.items || []).map(function(it) {
    return it.medicine.name + ' (' + it.quantity + ' ' + (it.selectedUnit ? it.selectedUnit.name : '') + ')';
  }).join(', ');

  shTx.appendRow([
    tx.id || '', tx.invoiceNumber || '', tx.timestamp || new Date().toISOString(),
    tx.cashierName || '', tx.customerName || 'Umum', tx.customerPhone || '-',
    tx.paymentMethod || 'cash', tx.subtotal || 0, tx.discount || 0, tx.tax || 0,
    tx.total || 0, tx.amountPaid || 0, tx.change || 0, tx.totalHPP || 0,
    tx.netProfit || 0, tx.status || 'completed', tx.notes || '', itemSummary
  ]);

  (tx.items || []).forEach(function(it) {
    shDet.appendRow([
      tx.id || '', tx.invoiceNumber || '', it.medicine.id || '', it.medicine.name || '',
      it.selectedUnit ? it.selectedUnit.name : '', it.quantity || 1, it.unitPrice || 0,
      it.discountPercent || 0, it.subtotal || 0
    ]);

    shMut.appendRow([
      'mut-' + new Date().getTime() + '-' + Math.floor(Math.random()*1000),
      tx.timestamp || new Date().toISOString(),
      it.medicine.id || '',
      it.medicine.name || '',
      'out',
      it.quantity || 1,
      '',
      tx.invoiceNumber || '',
      'Penjualan Kasir POS'
    ]);
  });

  return {
    success: true,
    message: 'Transaksi faktur ' + tx.invoiceNumber + ' berhasil dicatat di Google Sheets!'
  };
}

function getAllDataFromSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return {
    success: true,
    message: 'Data berhasil ditarik dari Google Sheets',
    data: {
      medicines: readSheetData(ss, SHEETS.OBAT),
      transactions: readSheetData(ss, SHEETS.TRANSAKSI),
      customers: readSheetData(ss, SHEETS.PELANGGAN),
      suppliers: readSheetData(ss, SHEETS.SUPPLIER),
      stockMovements: readSheetData(ss, SHEETS.MUTASI_STOK)
    },
    timestamp: new Date().toISOString()
  };
}

function getOrCreateSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  return sheet;
}

function formatHeaderRow(sheet, headers, bgColor, textColor) {
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setBackground(bgColor);
  headerRange.setFontColor(textColor);
  headerRange.setFontWeight('bold');
  headerRange.setFontFamily('Plus Jakarta Sans');
  sheet.setFrozenRows(1);
}

function clearDataRows(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow > 1 && lastCol > 0) {
    sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  }
}

function readSheetData(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return [];

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  return rows.map(function(row) {
    var obj = {};
    headers.forEach(function(h, idx) {
      obj[h] = row[idx];
    });
    return obj;
  });
}
