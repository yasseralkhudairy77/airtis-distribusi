function getCurrentUserProfile(userId) {
  var user = getCurrentUserRecord_(userId);

  if (!user) {
    return {
      email: '',
      user_id: '',
      nama_user: '',
      role: '',
      role_key: '',
      status_aktif: '',
      authorized: false
    };
  }

  return {
    email: user.email || '',
    user_id: user.user_id || '',
    nama_user: user.nama_user || '',
    role: user.role || '',
    role_key: normalizeRoleKey_(user.role),
    status_aktif: user.status_aktif || '',
    authorized: true
  };
}

function getUserProfileByUserId(userId) {
  return getCurrentUserProfile(userId);
}

function requireAuthorizedUser_(userId) {
  var user = getCurrentUserRecord_(userId);

  if (!user) {
    throw new Error('Akses ditolak. User ID belum terdaftar atau status user tidak aktif di MASTER_USER.');
  }

  return user;
}

function requireCurrentUserRole_(allowedRoles, userId) {
  var user = requireAuthorizedUser_(userId);
  var roleKeys = (allowedRoles || []).map(function(role) {
    return normalizeRoleKey_(role);
  });
  var userRoleKey = normalizeRoleKey_(user.role);

  if (roleKeys.indexOf(userRoleKey) === -1) {
    throw new Error('Akses ditolak. Role Anda (' + (user.role || '-') + ') tidak memiliki otorisasi untuk proses ini.');
  }

  return user;
}

function getCurrentUserRecord_(userId) {
  var normalizedUserId = normalizeText_(userId);

  if (!normalizedUserId) {
    return null;
  }

  return getSheetData_(APP_CONFIG.SHEETS.MASTER_USER).find(function(user) {
    return normalizeText_(user.user_id) === normalizedUserId &&
      normalizeText_(user.status_aktif) === 'aktif';
  }) || null;
}

function normalizeRoleKey_(role) {
  var value = normalizeText_(role);

  if (value === 'csadmin' || value === 'cs/admin') {
    return 'cs_admin';
  }

  return value.replace(/[^a-z0-9]+/g, '_');
}
