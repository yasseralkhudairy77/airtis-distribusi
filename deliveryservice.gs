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
    items: orderDisplay.details || [],
    driver: suratJalan.driver || '',
    armada: suratJalan.armada || '',
    status_kirim: suratJalan.status_kirim || '',
    catatan_kirim: suratJalan.catatan_kirim || '',
    sales_nama: salesOrder.sales_nama || '',
    pic_customer: salesOrder.pic_customer || '',
    no_hp_customer: salesOrder.no_hp_customer || '',
    term_pembayaran: salesOrder.term_pembayaran || '',
    total: orderDisplay.total_order || salesOrder.total || '',
    catatan_order: salesOrder.catatan || ''
  };
}

function markOrderDelivered(noSo, userId, catatanKirim) {
  return updateDeliveryOrderStatus_(noSo, userId, 'Terkirim', 'Terkirim', catatanKirim);
}

function completeOrder(noSo, userId, catatanKirim) {
  return updateDeliveryOrderStatus_(noSo, userId, 'Selesai', 'Selesai', catatanKirim);
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
