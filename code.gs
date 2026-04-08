function doGet() {
  return HtmlService.createTemplateFromFile('layout')
    .evaluate()
    .setTitle(APP_CONFIG.APP_NAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getAppBootstrap() {
  var currentUser = getCurrentUserProfile();

  return {
    appName: APP_CONFIG.APP_NAME,
    currentUser: currentUser,
    brandLogoDataUrl: getBrandLogoDataUrl_(),
    sheets: APP_CONFIG.SHEETS,
    orderStatus: APP_CONFIG.ORDER_STATUS,
    customerStatus: APP_CONFIG.CUSTOMER_STATUS,
    approvalStatus: APP_CONFIG.APPROVAL_STATUS,
    deliveryPriority: APP_CONFIG.DELIVERY_PRIORITY,
    printConfig: APP_CONFIG.PRINT
  };
}

function include(filename) {
  return HtmlService.createTemplateFromFile(filename)
    .evaluate()
    .getContent();
}

function toClientValue_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, APP_CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
  }

  if (Array.isArray(value)) {
    return value.map(function(item) {
      return toClientValue_(item);
    });
  }

  if (value && typeof value === 'object') {
    var result = {};
    Object.keys(value).forEach(function(key) {
      result[key] = toClientValue_(value[key]);
    });
    return result;
  }

  return value;
}

function getSalesOrderFormData(userId) {
  var currentUser = requireCurrentUserRole_(['Sales'], userId);

  return toClientValue_({
    customers: getActiveCustomers(),
    currentUser: currentUser,
    users: [currentUser],
    products: getProductCatalog_(),
    deliveryPriority: APP_CONFIG.DELIVERY_PRIORITY,
    customerType: APP_CONFIG.CUSTOMER_TYPE
  });
}

function getApproverDashboardData(userId) {
  var currentUser = requireCurrentUserRole_(['Approver'], userId);
  var approvals = getSheetData_(APP_CONFIG.SHEETS.APPROVAL_ORDER).filter(function(row) {
    return normalizeText_(row.status_approval) === 'menunggu';
  });

  return toClientValue_({
    currentUser: currentUser,
    approvers: [currentUser],
    approvals: approvals.map(function(approval) {
      var order = findSalesOrderByNoSo_(approval.no_so) || {};

      return {
        no_so: approval.no_so,
        approval_id: approval.approval_id,
        tanggal_pengajuan: approval.tanggal_pengajuan,
        diajukan_oleh: approval.diajukan_oleh,
        alasan_approval: approval.alasan_approval,
        status_approval: approval.status_approval,
        customer: order.nama_customer_input || '',
        alamat_kirim: order.alamat_kirim || '',
        item: order.item || '',
        qty: order.qty || '',
        total: order.total || '',
        status_order: order.status_order || '',
        status_pembayaran_customer: order.status_pembayaran_customer || '',
        total_tunggakan: order.total_tunggakan || '',
        jumlah_nota_overdue: order.jumlah_nota_overdue || '',
        tanggal_jatuh_tempo_terdekat: order.tanggal_jatuh_tempo_terdekat || '',
        catatan_piutang: order.catatan_piutang || ''
      };
    })
  });
}

function getAdminDashboardData(userId) {
  var currentUser = requireCurrentUserRole_(['CS/Admin'], userId);
  var salesOrders = getSheetData_(APP_CONFIG.SHEETS.SALES_ORDER);
  var deliveryOrders = getSheetData_(APP_CONFIG.SHEETS.SURAT_JALAN);
  var suratJalanByNoSo = {};

  deliveryOrders.forEach(function(row) {
    suratJalanByNoSo[String(row.no_so || '').trim()] = true;
  });

  var readyOrders = salesOrders.filter(function(row) {
    return normalizeText_(row.status_order) === 'siap kirim';
  }).filter(function(row) {
    return !suratJalanByNoSo[String(row.no_so || '').trim()];
  });
  var tomorrowPlanDate = getTomorrowDateString_();
  var tomorrowOrders = salesOrders.filter(function(row) {
    return shouldIncludeTomorrowOrder_(row, tomorrowPlanDate);
  });

  return toClientValue_({
    currentUser: currentUser,
    admins: [currentUser],
    customers: getActiveCustomers(),
    products: getProductCatalog_(),
    tomorrowPlanDate: tomorrowPlanDate,
    tomorrowOrders: tomorrowOrders,
    readyOrders: readyOrders,
    deliveryOrders: deliveryOrders
  });
}

function getTomorrowDateString_() {
  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return Utilities.formatDate(tomorrow, APP_CONFIG.TIMEZONE, 'yyyy-MM-dd');
}

function shouldIncludeTomorrowOrder_(row, tomorrowDate) {
  var tanggalRencana = String(row.tanggal_kirim_rencana || '').trim();
  var statusOrder = normalizeText_(row.status_order);

  if (tanggalRencana !== String(tomorrowDate || '').trim()) {
    return false;
  }

  return ['draft', 'menunggu persetujuan', 'disetujui', 'siap kirim'].indexOf(statusOrder) !== -1;
}

function submitSalesOrderFromForm(userId, formData) {
  var currentUser = requireCurrentUserRole_(['Sales'], userId);
  var payload = {
    sales_id: currentUser.user_id,
    sales_nama: currentUser.nama_user,
    jenis_customer: formData.jenis_customer,
    customer_id: formData.customer_id,
    nama_customer_input: formData.nama_customer_input,
    alamat_kirim: formData.alamat_kirim,
    link_google_maps: formData.link_google_maps,
    latitude: formData.latitude,
    longitude: formData.longitude,
    pic_customer: formData.pic_customer,
    no_hp_customer: formData.no_hp_customer,
    item: formData.item,
    qty: Number(formData.qty || 0),
    harga: Number(formData.harga || 0),
    diskon: Number(formData.diskon || 0),
    subtotal: Number(formData.subtotal || 0),
    total: Number(formData.total || 0),
    term_pembayaran: formData.term_pembayaran,
    tanggal_kirim_rencana: formData.tanggal_kirim_rencana,
    catatan: formData.catatan
  };

  validateSalesNewCustomerFields_(payload);

  return submitSalesOrder(payload);
}

function approveOrderFromDashboard(userId, formData) {
  var currentUser = requireCurrentUserRole_(['Approver'], userId);
  return approveOrder(formData.no_so, currentUser.user_id, formData.catatan_approval || '');
}

function rejectOrderFromDashboard(userId, formData) {
  var currentUser = requireCurrentUserRole_(['Approver'], userId);
  return rejectOrder(formData.no_so, currentUser.user_id, formData.catatan_approval || '');
}

function createSuratJalanFromDashboard(userId, formData) {
  requireCurrentUserRole_(['CS/Admin'], userId);

  return createSuratJalan(formData.no_so, {
    driver: formData.driver || '',
    armada: formData.armada || '',
    catatan_kirim: formData.catatan_kirim || ''
  });
}

function markOrderDeliveredFromDashboard(userId, formData) {
  var currentUser = requireCurrentUserRole_(['CS/Admin'], userId);
  return markOrderDelivered(formData.no_so, currentUser.user_id, formData.catatan_kirim || '');
}

function completeOrderFromDashboard(userId, formData) {
  var currentUser = requireCurrentUserRole_(['CS/Admin'], userId);
  return completeOrder(formData.no_so, currentUser.user_id, formData.catatan_kirim || '');
}

function submitAgentOrderFromAdmin(userId, formData) {
  var currentUser = requireCurrentUserRole_(['CS/Admin'], userId);
  var catatan = formData.catatan || '';
  var catatanGabungan = '[AGEN/CS] Input oleh ' + currentUser.nama_user;

  if (catatan) {
    catatanGabungan += ' | ' + catatan;
  }

  return submitSalesOrder({
    sales_id: currentUser.user_id,
    sales_nama: currentUser.nama_user + ' (CS/Admin)',
    jenis_customer: formData.jenis_customer,
    customer_id: formData.customer_id,
    nama_customer_input: formData.nama_customer_input,
    alamat_kirim: formData.alamat_kirim,
    link_google_maps: formData.link_google_maps,
    latitude: Number(formData.latitude || 0) || '',
    longitude: Number(formData.longitude || 0) || '',
    pic_customer: formData.pic_customer,
    no_hp_customer: formData.no_hp_customer,
    item: formData.item,
    qty: Number(formData.qty || 0),
    harga: Number(formData.harga || 0),
    diskon: Number(formData.diskon || 0),
    subtotal: Number(formData.subtotal || 0),
    total: Number(formData.total || 0),
    term_pembayaran: formData.term_pembayaran,
    tanggal_kirim_rencana: formData.tanggal_kirim_rencana,
    catatan: catatanGabungan
  });
}

function getSuratJalanPrintDataFromDashboard(userId, noSo) {
  requireCurrentUserRole_(['CS/Admin'], userId);
  return toClientValue_(getSuratJalanPrintData(noSo));
}

function validateSalesNewCustomerFields_(payload) {
  var requiredFields;

  if (String(payload.jenis_customer || '').trim().toLowerCase() !== 'baru') {
    return;
  }

  requiredFields = [
    { key: 'nama_customer_input', label: 'Nama Customer' },
    { key: 'pic_customer', label: 'PIC Customer' },
    { key: 'alamat_kirim', label: 'Alamat Kirim' },
    { key: 'no_hp_customer', label: 'No. HP Customer' },
    { key: 'link_google_maps', label: 'Link Google Maps' }
  ];

  requiredFields.forEach(function(field) {
    if (!String(payload[field.key] || '').trim()) {
      throw new Error(field.label + ' wajib diisi untuk customer baru.');
    }
  });
}

function getProductCatalog_() {
  return [
    { kode_item: 'PRD001', nama_item: 'AIRTIS Galon 19L', harga_default: 0, satuan: 'pcs' },
    { kode_item: 'PRD002', nama_item: 'AIRTIS Refill galon 19L', harga_default: 0, satuan: 'pcs' },
    { kode_item: 'PRD003', nama_item: 'AIRTIS Cup 150 ml', harga_default: 0, satuan: 'dus' },
    { kode_item: 'PRD004', nama_item: 'AIRTIS Cup 220 ml', harga_default: 0, satuan: 'dus' },
    { kode_item: 'PRD005', nama_item: 'AIRTIS Botol 220 ml', harga_default: 0, satuan: 'dus' },
    { kode_item: 'PRD006', nama_item: 'AIRTIS Botol 330 ml', harga_default: 0, satuan: 'dus' },
    { kode_item: 'PRD007', nama_item: 'AIRTIS Botol 600 ml', harga_default: 0, satuan: 'dus' },
    { kode_item: 'PRD008', nama_item: 'AIRTIS Botol 1500 ml', harga_default: 0, satuan: 'dus' }
  ];
}

function getBrandLogoDataUrl_() {
  return 'data:image/webp;base64,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';
}

function testGetApproverDashboardData() {
  console.log(JSON.stringify(getApproverDashboardData('U003')));
}

function testGetAdminDashboardData() {
  console.log(JSON.stringify(getAdminDashboardData('U020')));
}
