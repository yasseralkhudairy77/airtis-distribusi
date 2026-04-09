function getCustomers() {
  return getSheetData_(APP_CONFIG.SHEETS.MASTER_CUSTOMER);
}

function getActiveCustomers() {
  return getCustomers().filter(function(customer) {
    return normalizeText_(customer.status_customer) !== 'ditahan';
  });
}

function getCustomerByCode(kodeCustomer) {
  var customer = findCustomerByCode_(kodeCustomer);

  if (!customer) {
    throw new Error('Customer tidak ditemukan: ' + kodeCustomer);
  }

  return buildCustomerStatusResult_(customer);
}

function checkCustomerEligibility(kodeCustomer) {
  var customer = findCustomerByCode_(kodeCustomer);

  if (!customer) {
    return {
      found: false,
      eligible: false,
      butuh_persetujuan: 'Ya',
      alasan_hold: 'Customer tidak ditemukan'
    };
  }

  return buildCustomerStatusResult_(customer);
}

function testGetCustomers() {
  Logger.log(getCustomers());
}

function testCheckCustomerEligibility() {
  Logger.log(checkCustomerEligibility('CUST001'));
  Logger.log(checkCustomerEligibility('CUST002'));
  Logger.log(checkCustomerEligibility('CUST003'));
}

function findCustomerByCode_(kodeCustomer) {
  var targetCode = normalizeText_(kodeCustomer);

  return getCustomers().find(function(customer) {
    return normalizeText_(customer.kode_customer) === targetCode;
  }) || null;
}

function buildCustomerStatusResult_(customer) {
  var statusCustomer = normalizeText_(customer.status_customer);
  var statusPembayaran = normalizeText_(customer.status_pembayaran);
  var isHold = statusCustomer === 'menunggak' ||
    statusCustomer === 'ditahan' ||
    statusPembayaran === 'menunggak' ||
    statusPembayaran === 'ditahan';
  var alasanHold = buildCustomerHoldReason_(customer);

  if (!isHold) {
    alasanHold = '';
  }

  return {
    found: true,
    eligible: !isHold,
    butuh_persetujuan: isHold ? 'Ya' : 'Tidak',
    alasan_hold: alasanHold,
    customer: customer
  };
}

function buildCustomerHoldReason_(customer) {
  var statusCustomer = normalizeText_(customer.status_customer);
  var statusPembayaran = normalizeText_(customer.status_pembayaran);
  var totalTunggakan = Number(customer.total_tunggakan || 0);
  var jumlahNotaOverdue = Number(customer.jumlah_nota_overdue || 0);
  var tanggalJatuhTempo = formatCustomerDate_(customer.tanggal_jatuh_tempo_terdekat);
  var catatanPiutang = String(customer.catatan_piutang || customer.catatan || '').trim();
  var parts = [];

  if (statusCustomer === 'ditahan' || statusPembayaran === 'ditahan') {
    parts.push('Customer ditahan');
  } else if (statusCustomer === 'menunggak' || statusPembayaran === 'menunggak') {
    parts.push('Customer menunggak');
  }

  if (totalTunggakan > 0) {
    parts.push('Total tunggakan: ' + formatNumberServer_(totalTunggakan));
  }

  if (jumlahNotaOverdue > 0) {
    parts.push('Nota overdue: ' + jumlahNotaOverdue);
  }

  if (tanggalJatuhTempo) {
    parts.push('JT terdekat: ' + tanggalJatuhTempo);
  }

  if (catatanPiutang) {
    parts.push('Catatan: ' + catatanPiutang);
  }

  return parts.join('. ') || '';
}

function formatCustomerDate_(value) {
  if (!value) {
    return '';
  }

  if (value instanceof Date) {
    return Utilities.formatDate(value, APP_CONFIG.TIMEZONE, 'yyyy-MM-dd');
  }

  return String(value).trim();
}

function formatNumberServer_(value) {
  return Number(value || 0).toLocaleString('id-ID');
}

function ensureCustomerMasterForNewOrder_(payload) {
  var existingCustomer = findExistingCustomerForNewOrder_(payload);

  if (existingCustomer) {
    return existingCustomer;
  }

  var customerRow = {
    kode_customer: generateNextCustomerCode_(),
    nama_customer: String(payload.nama_customer_input || '').trim(),
    tipe_customer: 'Retail',
    kategori_customer: 'Customer Baru',
    alamat: String(payload.alamat_kirim || '').trim(),
    link_google_maps: String(payload.link_google_maps || '').trim(),
    pic: String(payload.pic_customer || '').trim(),
    no_hp: String(payload.no_hp_customer || '').trim(),
    latitude: String(payload.latitude || '').trim(),
    longitude: String(payload.longitude || '').trim(),
    status_customer: 'Baru',
    status_pembayaran: 'Lancar',
    total_tunggakan: 0,
    jumlah_nota_overdue: 0,
    tanggal_jatuh_tempo_terdekat: '',
    catatan_piutang: '',
    limit_tunggakan: 0,
    catatan: 'Auto dibuat dari sales order customer baru'
  };

  appendRowByHeaders_(APP_CONFIG.SHEETS.MASTER_CUSTOMER, customerRow);
  return customerRow;
}

function findExistingCustomerForNewOrder_(payload) {
  var targetName = normalizeText_(payload.nama_customer_input);
  var targetPhone = normalizeText_(payload.no_hp_customer);

  if (!targetName) {
    return null;
  }

  return getCustomers().find(function(customer) {
    var customerName = normalizeText_(customer.nama_customer);
    var customerPhone = normalizeText_(customer.no_hp);

    if (customerName !== targetName) {
      return false;
    }

    if (!targetPhone) {
      return true;
    }

    return customerPhone === targetPhone;
  }) || null;
}

function generateNextCustomerCode_() {
  var maxNumber = 0;

  getCustomers().forEach(function(customer) {
    var match = String(customer.kode_customer || '').trim().toUpperCase().match(/^CUST(\d+)$/);
    var numberValue;

    if (!match) {
      return;
    }

    numberValue = Number(match[1] || 0);
    if (numberValue > maxNumber) {
      maxNumber = numberValue;
    }
  });

  return 'CUST' + String(maxNumber + 1).padStart(3, '0');
}
