function getCurrentUserProfile() {
  var user = getCurrentUserRecord_();

  if (!user) {
    return {
      email: getCurrentUserEmail_(),
      user_id: '',
      nama_user: '',
      role: '',
      role_key: '',
      status_aktif: '',
      authorized: false
    };
  }

  return {
    email: user.email || getCurrentUserEmail_(),
    user_id: user.user_id || '',
    nama_user: user.nama_user || '',
    role: user.role || '',
    role_key: normalizeRoleKey_(user.role),
    status_aktif: user.status_aktif || '',
    authorized: true
  };
}

function requireAuthorizedUser_() {
  var user = getCurrentUserRecord_();

  if (!user) {
    throw new Error('Akses ditolak. Email login Anda belum terdaftar atau user tidak aktif di MASTER_USER.');
  }

  return user;
}

function requireCurrentUserRole_(allowedRoles) {
  var user = requireAuthorizedUser_();
  var roleKeys = (allowedRoles || []).map(function(role) {
    return normalizeRoleKey_(role);
  });
  var userRoleKey = normalizeRoleKey_(user.role);

  if (roleKeys.indexOf(userRoleKey) === -1) {
    throw new Error('Akses ditolak. Role Anda (' + (user.role || '-') + ') tidak memiliki otorisasi untuk proses ini.');
  }

  return user;
}

function getCurrentUserRecord_() {
  var email = normalizeText_(getCurrentUserEmail_());

  if (!email) {
    return null;
  }

  return getSheetData_(APP_CONFIG.SHEETS.MASTER_USER).find(function(user) {
    return normalizeText_(user.email) === email &&
      normalizeText_(user.status_aktif) === 'aktif';
  }) || null;
}

function getCurrentUserEmail_() {
  return Session.getActiveUser().getEmail() || '';
}

function normalizeRoleKey_(role) {
  var value = normalizeText_(role);

  if (value === 'csadmin' || value === 'cs/admin') {
    return 'cs_admin';
  }

  return value.replace(/[^a-z0-9]+/g, '_');
}
