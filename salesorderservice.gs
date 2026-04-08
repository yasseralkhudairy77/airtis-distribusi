function submitSalesOrder(payload) {
  validateSalesOrderPayload_(payload);

  var now = getNowParts_();
  var noSo = generateDocNumber_(APP_CONFIG.DOC_PREFIX.SALES_ORDER);
  var customerCheck = buildOrderCustomerCheck_(payload);
  var prioritasKirim = resolvePrioritasKirim_(payload.tanggal_kirim_rencana, now.timestamp);
  var salesOrderRow = {
    no_so: noSo,
    tanggal_order: now.tanggal,
    jam_order: now.jam,
    sales_id: payload.sales_id,
    sales_nama: payload.sales_nama,
    jenis_customer: payload.jenis_customer,
    customer_id: customerCheck.customer_id,
    nama_customer_input: customerCheck.nama_customer_input,
    alamat_kirim: payload.alamat_kirim,
    link_google_maps: payload.link_google_maps || '',
    latitude: payload.latitude || '',
    longitude: payload.longitude || '',
    pic_customer: payload.pic_customer,
    no_hp_customer: payload.no_hp_customer,
    item: payload.item,
    qty: payload.qty,
    harga: payload.harga,
    diskon: payload.diskon || 0,
    subtotal: payload.subtotal,
    total: payload.total,
    term_pembayaran: payload.term_pembayaran,
    status_pembayaran_customer: customerCheck.status_pembayaran_customer,
    total_tunggakan: customerCheck.total_tunggakan,
    jumlah_nota_overdue: customerCheck.jumlah_nota_overdue,
    tanggal_jatuh_tempo_terdekat: customerCheck.tanggal_jatuh_tempo_terdekat,
    catatan_piutang: customerCheck.catatan_piutang,
    status_order: customerCheck.status_order,
    prioritas_kirim: prioritasKirim,
    tanggal_kirim_rencana: payload.tanggal_kirim_rencana,
    catatan: payload.catatan || '',
    butuh_persetujuan: customerCheck.butuh_persetujuan,
    alasan_hold: customerCheck.alasan_hold
  };

  appendRowByHeaders_(APP_CONFIG.SHEETS.SALES_ORDER, salesOrderRow);
  logStatusOrder_(noSo, '', salesOrderRow.status_order, payload.sales_id, salesOrderRow.alasan_hold);

  if (salesOrderRow.butuh_persetujuan === 'Ya') {
    createApprovalOrder_(noSo, payload.sales_id, salesOrderRow.alasan_hold);
  }

  return {
    success: true,
    no_so: noSo,
    status_order: salesOrderRow.status_order,
    butuh_persetujuan: salesOrderRow.butuh_persetujuan,
    alasan_hold: salesOrderRow.alasan_hold
  };
}

function testSubmitSalesOrderAman() {
  var result = submitSalesOrder({
    sales_id: 'U001',
    sales_nama: 'Andi Sales',
    jenis_customer: 'Lama',
    customer_id: 'CUST001',
    alamat_kirim: 'Jl. Raya Bekasi No. 12, Bekasi',
    link_google_maps: '',
    latitude: '',
    longitude: '',
    pic_customer: 'Pak Joko',
    no_hp_customer: '081300000001',
    item: 'AIRTIS Galon 19L',
    qty: 10,
    harga: 18000,
    diskon: 0,
    subtotal: 180000,
    total: 180000,
    term_pembayaran: 'Cash',
    tanggal_kirim_rencana: Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, 'yyyy-MM-dd'),
    catatan: 'Test order customer lancar'
  });

  console.log(JSON.stringify(result));
}

function testSubmitSalesOrderHold() {
  var result = submitSalesOrder({
    sales_id: 'U001',
    sales_nama: 'Andi Sales',
    jenis_customer: 'Lama',
    customer_id: 'CUST002',
    alamat_kirim: 'Jl. Industri No. 8, Cikarang',
    link_google_maps: '',
    latitude: '',
    longitude: '',
    pic_customer: 'Ibu Rina',
    no_hp_customer: '081300000002',
    item: 'AIRTIS Galon 19L',
    qty: 20,
    harga: 18000,
    diskon: 0,
    subtotal: 360000,
    total: 360000,
    term_pembayaran: 'Tempo 7 Hari',
    tanggal_kirim_rencana: Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, 'yyyy-MM-dd'),
    catatan: 'Test order customer menunggak'
  });

  console.log(JSON.stringify(result));
}

function validateSalesOrderPayload_(payload) {
  var requiredFields = [
    'sales_id',
    'sales_nama',
    'jenis_customer',
    'alamat_kirim',
    'pic_customer',
    'no_hp_customer',
    'item',
    'qty',
    'harga',
    'subtotal',
    'total',
    'term_pembayaran',
    'tanggal_kirim_rencana'
  ];

  requiredFields.forEach(function(field) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
      throw new Error('Field wajib belum diisi: ' + field);
    }
  });

  if (normalizeText_(payload.jenis_customer) === 'lama' && !payload.customer_id) {
    throw new Error('Customer lama wajib memilih customer_id');
  }
}

function buildOrderCustomerCheck_(payload) {
  if (normalizeText_(payload.jenis_customer) === 'baru') {
    return {
      customer_id: payload.customer_id || '',
      nama_customer_input: payload.nama_customer_input || '',
      status_pembayaran_customer: 'Lancar',
      total_tunggakan: 0,
      jumlah_nota_overdue: 0,
      tanggal_jatuh_tempo_terdekat: '',
      catatan_piutang: '',
      status_order: 'Siap Kirim',
      butuh_persetujuan: 'Tidak',
      alasan_hold: ''
    };
  }

  var eligibility = checkCustomerEligibility(payload.customer_id);
  var customer = eligibility.customer || {};

  return {
    customer_id: payload.customer_id,
    nama_customer_input: customer.nama_customer || payload.nama_customer_input || '',
    status_pembayaran_customer: customer.status_pembayaran || '',
    total_tunggakan: Number(customer.total_tunggakan || 0),
    jumlah_nota_overdue: Number(customer.jumlah_nota_overdue || 0),
    tanggal_jatuh_tempo_terdekat: customer.tanggal_jatuh_tempo_terdekat || '',
    catatan_piutang: customer.catatan_piutang || customer.catatan || '',
    status_order: eligibility.butuh_persetujuan === 'Ya' ? 'Menunggu Persetujuan' : 'Siap Kirim',
    butuh_persetujuan: eligibility.butuh_persetujuan,
    alasan_hold: eligibility.alasan_hold
  };
}

function resolvePrioritasKirim_(tanggalKirimRencana, currentDate) {
  if (!tanggalKirimRencana) {
    return 'Jadwal Biasa';
  }

  var today = new Date(currentDate);
  today.setHours(0, 0, 0, 0);

  var tanggalKirim = new Date(tanggalKirimRencana);
  tanggalKirim.setHours(0, 0, 0, 0);

  var diffDays = Math.round((tanggalKirim.getTime() - today.getTime()) / 86400000);

  if (diffDays === 0) {
    return 'Same Day Opsional';
  }

  if (diffDays === 1) {
    return 'H-1 Wajib';
  }

  return 'Jadwal Biasa';
}

function createApprovalOrder_(noSo, diajukanOleh, alasanApproval) {
  var now = getNowParts_();

  appendRowByHeaders_(APP_CONFIG.SHEETS.APPROVAL_ORDER, {
    approval_id: generateDocNumber_(APP_CONFIG.DOC_PREFIX.APPROVAL),
    no_so: noSo,
    tanggal_pengajuan: now.tanggal + ' ' + now.jam,
    diajukan_oleh: diajukanOleh,
    alasan_approval: alasanApproval || 'Perlu persetujuan manual',
    status_approval: 'Menunggu',
    diputuskan_oleh: '',
    tanggal_keputusan: '',
    catatan_approval: ''
  });
}

function logStatusOrder_(noSo, statusLama, statusBaru, diubahOleh, catatan) {
  var now = getNowParts_();

  appendRowByHeaders_(APP_CONFIG.SHEETS.LOG_STATUS_ORDER, {
    log_id: generateDocNumber_('LOG'),
    no_so: noSo,
    tanggal: now.tanggal,
    jam: now.jam,
    status_lama: statusLama || '',
    status_baru: statusBaru,
    diubah_oleh: diubahOleh || '',
    catatan: catatan || ''
  });
}
