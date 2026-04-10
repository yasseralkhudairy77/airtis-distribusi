function createSuratJalan(noSo, options) {
  var salesOrder = findSalesOrderByNoSo_(noSo);
  var orderDisplay = buildSalesOrderClientRow_(salesOrder);

  if (!salesOrder) {
    throw new Error('Sales order tidak ditemukan untuk no_so: ' + noSo);
  }

  if (normalizeText_(salesOrder.status_order) !== 'siap kirim') {
    throw new Error('Surat jalan hanya bisa dibuat untuk order dengan status Siap Kirim');
  }

  if (findSuratJalanByNoSo_(noSo)) {
    throw new Error('Surat jalan sudah pernah dibuat untuk no_so: ' + noSo);
  }

  var now = getNowParts_();
  var payload = options || {};
  var noSuratJalan = generateDocNumber_(APP_CONFIG.DOC_PREFIX.SURAT_JALAN);
  var tanggalKirim = payload.tanggal_kirim || salesOrder.tanggal_kirim_rencana || now.tanggal;

  appendRowByHeaders_(APP_CONFIG.SHEETS.SURAT_JALAN, {
    no_surat_jalan: noSuratJalan,
    no_so: noSo,
    tanggal_cetak: now.tanggal + ' ' + now.jam,
    tanggal_kirim: tanggalKirim,
    customer_id: salesOrder.customer_id,
    nama_customer: salesOrder.nama_customer_input,
    alamat_kirim: salesOrder.alamat_kirim,
    item: orderDisplay.item_summary || salesOrder.item,
    qty: orderDisplay.qty_summary || salesOrder.qty,
    driver: payload.driver || '',
    armada: payload.armada || '',
    status_kirim: payload.status_kirim || 'Siap Kirim',
    catatan_kirim: payload.catatan_kirim || ''
  });

  return {
    success: true,
    no_so: noSo,
    no_surat_jalan: noSuratJalan,
    status_kirim: payload.status_kirim || 'Siap Kirim'
  };
}

function getSuratJalanPrintData(noSo) {
  var suratJalan = findSuratJalanByNoSo_(noSo);

  if (!suratJalan) {
    throw new Error('Surat jalan tidak ditemukan untuk no_so: ' + noSo);
  }

  var salesOrder = findSalesOrderByNoSo_(noSo) || {};
  var orderDisplay = buildSalesOrderClientRow_(salesOrder);

  return {
    no_surat_jalan: suratJalan.no_surat_jalan || '',
    no_so: suratJalan.no_so || '',
    tanggal_cetak: suratJalan.tanggal_cetak || '',
    tanggal_kirim: suratJalan.tanggal_kirim || '',
    customer_id: suratJalan.customer_id || '',
    nama_customer: suratJalan.nama_customer || salesOrder.nama_customer_input || '',
    alamat_kirim: suratJalan.alamat_kirim || salesOrder.alamat_kirim || '',
    item: suratJalan.item || orderDisplay.item_summary || salesOrder.item || '',
    qty: suratJalan.qty || orderDisplay.qty_summary || salesOrder.qty || '',
    items: (orderDisplay.details || []).map(function(detail) {
      return {
        nama_item: detail.nama_item || '',
        qty: Number(detail.qty_terkirim || detail.qty || 0),
        satuan: detail.satuan || '',
        harga: Number(detail.harga_final || detail.harga || 0),
        diskon: Number(detail.diskon_final || detail.diskon || 0),
        subtotal: Number(detail.subtotal_final || detail.subtotal || 0)
      };
    }),
    driver: suratJalan.driver || '',
    armada: suratJalan.armada || '',
    status_kirim: suratJalan.status_kirim || '',
    catatan_kirim: suratJalan.catatan_kirim || '',
    sales_nama: salesOrder.sales_nama || '',
    pic_customer: salesOrder.pic_customer || '',
    no_hp_customer: salesOrder.no_hp_customer || '',
    term_pembayaran: salesOrder.term_pembayaran || '',
    subtotal: orderDisplay.subtotal_final || salesOrder.subtotal_final || salesOrder.subtotal || '',
    diskon: orderDisplay.diskon_final || salesOrder.diskon_final || salesOrder.diskon || '',
    total: orderDisplay.total_final || salesOrder.total_final || salesOrder.total || '',
    catatan_order: salesOrder.catatan || ''
  };
}

function markOrderDelivered(noSo, userId, catatanKirim) {
  return updateDeliveryOrderStatus_(noSo, userId, 'Terkirim', 'Terkirim', catatanKirim);
}

function verifyDeliveredOrder(noSo, userId, payload) {
  var suratJalan = findSuratJalanByNoSo_(noSo);
  var salesOrder = findSalesOrderByNoSo_(noSo);
  var verificationPayload = payload || {};
  var submittedItems = Array.isArray(verificationPayload.items) ? verificationPayload.items : [];
  var orderDetails;
  var detailMap = {};
  var totals;
  var now;

  if (!suratJalan) {
    throw new Error('Surat jalan tidak ditemukan untuk no_so: ' + noSo);
  }

  if (!salesOrder) {
    throw new Error('Sales order tidak ditemukan untuk no_so: ' + noSo);
  }

  if (normalizeText_(suratJalan.status_kirim) !== 'terkirim') {
    throw new Error('Verifikasi CS hanya bisa dilakukan untuk surat jalan berstatus Terkirim.');
  }

  ensureSheetHeadersContain_(APP_CONFIG.SHEETS.SALES_ORDER, APP_CONFIG.HEADERS.SALES_ORDER);
  ensureSheetHeadersContain_(APP_CONFIG.SHEETS.SALES_ORDER_DETAIL, APP_CONFIG.HEADERS.SALES_ORDER_DETAIL);

  orderDetails = getSalesOrderDetailsByNoSo_(noSo);

  if (!orderDetails.length) {
    throw new Error('Detail order tidak ditemukan. Verifikasi CS membutuhkan detail item.');
  }

  orderDetails.forEach(function(detail) {
    detailMap[String(detail.detail_id || '').trim()] = detail;
  });

  totals = submittedItems.reduce(function(result, item, index) {
    var detailId = String(item.detail_id || '').trim();
    var sourceDetail = detailMap[detailId];
    var qtyTerkirim;
    var hargaFinal;
    var diskonFinal;
    var subtotalFinal;

    if (!detailId || !sourceDetail) {
      throw new Error('Baris verifikasi ke-' + (index + 1) + ' tidak cocok dengan detail order.');
    }

    qtyTerkirim = Number(item.qty_terkirim || 0);
    hargaFinal = Number(item.harga_final || 0);
    diskonFinal = Number(item.diskon_final || 0);
    subtotalFinal = Number(item.subtotal_final);

    if (qtyTerkirim < 0) {
      throw new Error('Qty terkirim untuk item ' + sourceDetail.nama_item + ' tidak boleh negatif.');
    }

    if (hargaFinal < 0) {
      throw new Error('Harga final untuk item ' + sourceDetail.nama_item + ' tidak boleh negatif.');
    }

    if (diskonFinal < 0) {
      throw new Error('Diskon final untuk item ' + sourceDetail.nama_item + ' tidak boleh negatif.');
    }

    if (isNaN(subtotalFinal)) {
      subtotalFinal = (qtyTerkirim * hargaFinal) - diskonFinal;
    }

    if (subtotalFinal < 0) {
      throw new Error('Subtotal final untuk item ' + sourceDetail.nama_item + ' tidak valid.');
    }

    updateRowByKey_(APP_CONFIG.SHEETS.SALES_ORDER_DETAIL, 'detail_id', detailId, {
      qty_terkirim: qtyTerkirim,
      harga_final: hargaFinal,
      diskon_final: diskonFinal,
      subtotal_final: subtotalFinal
    });

    result.subtotal += qtyTerkirim * hargaFinal;
    result.diskon += diskonFinal;
    result.total += subtotalFinal;
    return result;
  }, {
    subtotal: 0,
    diskon: 0,
    total: 0
  });

  now = getNowParts_();

  updateRowByKey_(APP_CONFIG.SHEETS.SALES_ORDER, 'no_so', noSo, {
    subtotal_final: totals.subtotal,
    diskon_final: totals.diskon,
    total_final: totals.total,
    status_verifikasi_cs: 'Sudah Dicek',
    diverifikasi_oleh: userId,
    tanggal_verifikasi_cs: now.tanggal + ' ' + now.jam,
    catatan_verifikasi_cs: verificationPayload.catatan_verifikasi_cs || ''
  });

  return {
    success: true,
    no_so: noSo,
    status_verifikasi_cs: 'Sudah Dicek',
    subtotal_final: totals.subtotal,
    diskon_final: totals.diskon,
    total_final: totals.total
  };
}

function completeOrder(noSo, userId, catatanKirim) {
  var salesOrder = findSalesOrderByNoSo_(noSo);
  var result;

  if (!salesOrder) {
    throw new Error('Sales order tidak ditemukan untuk no_so: ' + noSo);
  }

  if (String(salesOrder.status_verifikasi_cs || '').trim() !== 'Sudah Dicek') {
    throw new Error('Order belum bisa selesai. CS wajib simpan verifikasi qty dan nominal final terlebih dahulu.');
  }

  result = updateDeliveryOrderStatus_(noSo, userId, 'Selesai', 'Selesai', catatanKirim);

  updateRowByKey_(APP_CONFIG.SHEETS.SALES_ORDER, 'no_so', noSo, {
    status_export_kledo: 'Siap Export'
  });

  result.status_export_kledo = 'Siap Export';
  return result;
}

function generateKledoExportFile(noSo, currentUser) {
  var salesOrder = buildSalesOrderClientRow_(findSalesOrderByNoSo_(noSo) || {});
  var suratJalan = findSuratJalanByNoSo_(noSo) || {};
  var exportRows;
  var csvLines;
  var fileName;

  if (!salesOrder.no_so) {
    throw new Error('Sales order tidak ditemukan untuk no_so: ' + noSo);
  }

  if (normalizeText_(salesOrder.status_order) !== 'selesai') {
    throw new Error('Export Kledo hanya bisa dibuat untuk order yang sudah Selesai.');
  }

  if (String(salesOrder.status_verifikasi_cs || '').trim() !== 'Sudah Dicek') {
    throw new Error('Order belum diverifikasi CS. Export Kledo belum bisa dibuat.');
  }

  exportRows = buildKledoExportRows_(salesOrder, suratJalan);
  csvLines = [APP_CONFIG.KLEDO_EXPORT.HEADERS].concat(exportRows).map(function(row) {
    return row.map(escapeCsvCell_).join(',');
  });
  fileName = [
    APP_CONFIG.KLEDO_EXPORT.FILE_PREFIX,
    String(salesOrder.no_so || '').replace(/[^A-Za-z0-9_-]/g, '_'),
    Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, 'yyyyMMdd-HHmmss')
  ].join('-') + '.csv';

  return {
    success: true,
    no_so: salesOrder.no_so,
    file_name: fileName,
    csv_content: csvLines.join('\r\n')
  };
}

function markKledoOrderExported(noSo, currentUser, catatanExport) {
  var salesOrder = findSalesOrderByNoSo_(noSo);
  var now = getNowParts_();

  if (!salesOrder) {
    throw new Error('Sales order tidak ditemukan untuk no_so: ' + noSo);
  }

  if (String(salesOrder.status_export_kledo || '').trim() !== 'Siap Export') {
    throw new Error('Order belum berada pada status Siap Export.');
  }

  updateRowByKey_(APP_CONFIG.SHEETS.SALES_ORDER, 'no_so', noSo, {
    status_export_kledo: 'Sudah Export',
    tanggal_export_kledo: now.tanggal + ' ' + now.jam,
    diekspor_oleh: currentUser.user_id || '',
    catatan_export_kledo: String(catatanExport || '').trim()
  });

  return {
    success: true,
    no_so: noSo,
    status_export_kledo: 'Sudah Export'
  };
}

function buildKledoExportRows_(salesOrder, suratJalan) {
  var details = Array.isArray(salesOrder.details) ? salesOrder.details : [];

  if (!details.length) {
    throw new Error('Detail item order tidak ditemukan untuk export Kledo.');
  }

  return details.map(function(detail) {
    var qty = Number(detail.qty_terkirim || detail.qty || 0);
    var harga = Number(detail.harga_final || detail.harga || 0);
    var diskon = Number(detail.diskon_final || detail.diskon || 0);

    return [
      salesOrder.nama_customer_input || '',
      '',
      salesOrder.alamat_kirim || '',
      salesOrder.no_hp_customer || '',
      '',
      salesOrder.no_so || '',
      '',
      formatKledoDate_(salesOrder.tanggal_order || ''),
      formatKledoDate_(salesOrder.tanggal_jatuh_tempo || ''),
      APP_CONFIG.KLEDO_EXPORT.WAREHOUSE_NAME,
      buildKledoOrderNote_(salesOrder),
      formatKledoDate_(suratJalan.tanggal_kirim || salesOrder.tanggal_kirim_rencana || ''),
      suratJalan.armada || '',
      '',
      APP_CONFIG.KLEDO_EXPORT.INCLUDE_TAX,
      detail.nama_item || '',
      detail.kode_item || '',
      '',
      qty > 0 ? String(qty) : '0',
      detail.satuan || '',
      String(diskon || 0),
      '',
      String(harga || 0),
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      'Webapp ATS'
    ];
  });
}

function buildKledoOrderNote_(salesOrder) {
  var notes = [];

  if (salesOrder.catatan) {
    notes.push('Order: ' + salesOrder.catatan);
  }

  if (salesOrder.catatan_verifikasi_cs) {
    notes.push('Verifikasi CS: ' + salesOrder.catatan_verifikasi_cs);
  }

  return notes.join(' | ');
}

function formatKledoDate_(value) {
  var normalized = normalizeSheetDateToYmd_(value);
  var match = String(normalized || '').match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!match) {
    return '';
  }

  return [match[3], match[2], match[1]].join('/');
}

function escapeCsvCell_(value) {
  var text = String(value === undefined || value === null ? '' : value);
  return '"' + text.replace(/"/g, '""') + '"';
}

function testCreateSuratJalanFromLatestReadyOrder() {
  var salesOrder = getLatestSalesOrderByStatus_('Siap Kirim');

  if (!salesOrder) {
    throw new Error('Tidak ada order Siap Kirim untuk dites');
  }

  console.log(JSON.stringify(createSuratJalan(salesOrder.no_so, {
    driver: 'Dedi',
    armada: 'B 9123 KXA',
    catatan_kirim: 'Surat jalan test'
  })));
}

function testCreateSuratJalanByNoSo() {
  console.log(JSON.stringify(createSuratJalan('ISI_NO_SO_DI_SINI', {
    driver: 'Dedi',
    armada: 'B 9123 KXA',
    catatan_kirim: 'Surat jalan test manual'
  })));
}

function testCreateSuratJalanManual() {
  console.log(JSON.stringify(createSuratJalan('SO-20260406232617', {
    driver: '',
    armada: '',
    catatan_kirim: 'Surat jalan dari order webapp'
  })));
}

function testMarkLatestDelivered() {
  var suratJalan = getLatestSuratJalanByStatus_('Siap Kirim');

  if (!suratJalan) {
    throw new Error('Tidak ada surat jalan dengan status Siap Kirim untuk dites');
  }

  console.log(JSON.stringify(markOrderDelivered(suratJalan.no_so, 'U002', 'Barang sudah dikirim')));
}

function testCompleteLatestOrder() {
  var suratJalan = getLatestSuratJalanByStatus_('Terkirim');

  if (!suratJalan) {
    throw new Error('Tidak ada surat jalan dengan status Terkirim untuk dites');
  }

  console.log(JSON.stringify(completeOrder(suratJalan.no_so, 'U002', 'Order selesai')));
}

function findSuratJalanByNoSo_(noSo) {
  return getSheetData_(APP_CONFIG.SHEETS.SURAT_JALAN).find(function(row) {
    return String(row.no_so).trim() === String(noSo).trim();
  }) || null;
}

function getLatestSalesOrderByStatus_(statusOrder) {
  var rows = getSheetData_(APP_CONFIG.SHEETS.SALES_ORDER).filter(function(row) {
    return normalizeText_(row.status_order) === normalizeText_(statusOrder);
  });

  if (!rows.length) {
    return null;
  }

  return rows[rows.length - 1];
}

function getLatestSuratJalanByStatus_(statusKirim) {
  var rows = getSheetData_(APP_CONFIG.SHEETS.SURAT_JALAN).filter(function(row) {
    return normalizeText_(row.status_kirim) === normalizeText_(statusKirim);
  });

  if (!rows.length) {
    return null;
  }

  return rows[rows.length - 1];
}

function updateDeliveryOrderStatus_(noSo, userId, statusKirimBaru, statusOrderBaru, catatanKirim) {
  var suratJalan = findSuratJalanByNoSo_(noSo);

  if (!suratJalan) {
    throw new Error('Surat jalan tidak ditemukan untuk no_so: ' + noSo);
  }

  var salesOrder = findSalesOrderByNoSo_(noSo);

  if (!salesOrder) {
    throw new Error('Sales order tidak ditemukan untuk no_so: ' + noSo);
  }

  updateRowByKey_(APP_CONFIG.SHEETS.SURAT_JALAN, 'no_so', noSo, {
    status_kirim: statusKirimBaru,
    catatan_kirim: catatanKirim || suratJalan.catatan_kirim || ''
  });

  updateRowByKey_(APP_CONFIG.SHEETS.SALES_ORDER, 'no_so', noSo, {
    status_order: statusOrderBaru
  });

  logStatusOrder_(noSo, salesOrder.status_order, statusOrderBaru, userId, catatanKirim || statusKirimBaru);

  return {
    success: true,
    no_so: noSo,
    status_kirim: statusKirimBaru,
    status_order: statusOrderBaru
  };
}
