function getSpreadsheet_() {
  return SpreadsheetApp.openById(APP_CONFIG.SPREADSHEET_ID);
}

function getSheetByName_(sheetName) {
  var sheet = getSpreadsheet_().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Sheet tidak ditemukan: ' + sheetName);
  }
  return sheet;
}

function getSheetByNameOrNull_(sheetName) {
  return getSpreadsheet_().getSheetByName(sheetName);
}

function nowIso_() {
  return Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
}

function generateDocNumber_(prefix) {
  var stamp = Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, 'yyyyMMddHHmmss');
  return prefix + '-' + stamp;
}

function toBooleanLabel_(value) {
  return value ? 'Ya' : 'Tidak';
}

function getSheetData_(sheetName) {
  var sheet = getSheetByName_(sheetName);
  var values = sheet.getDataRange().getValues();

  if (!values || values.length < 2) {
    return [];
  }

  var headers = values[0];
  var rows = values.slice(1);

  return rows
    .filter(function(row) {
      return row.join('').toString().trim() !== '';
    })
    .map(function(row) {
      return mapRowToObject_(headers, row);
    });
}

function mapRowToObject_(headers, row) {
  var obj = {};

  headers.forEach(function(header, index) {
    obj[header] = row[index];
  });

  return obj;
}

function normalizeText_(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeSheetDateToYmd_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, APP_CONFIG.TIMEZONE, 'yyyy-MM-dd');
  }

  return String(value || '').trim();
}

function appendRowByHeaders_(sheetName, data) {
  var sheet = getSheetByName_(sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = headers.map(function(header) {
    return Object.prototype.hasOwnProperty.call(data, header) ? data[header] : '';
  });

  sheet.appendRow(row);
}

function getNowParts_() {
  var now = new Date();

  return {
    tanggal: Utilities.formatDate(now, APP_CONFIG.TIMEZONE, 'yyyy-MM-dd'),
    jam: Utilities.formatDate(now, APP_CONFIG.TIMEZONE, 'HH:mm:ss'),
    timestamp: now
  };
}

function updateRowByKey_(sheetName, keyField, keyValue, updates) {
  var sheet = getSheetByName_(sheetName);
  var values = sheet.getDataRange().getValues();

  if (!values || values.length < 2) {
    throw new Error('Sheet belum memiliki data: ' + sheetName);
  }

  var headers = values[0];
  var keyIndex = headers.indexOf(keyField);

  if (keyIndex === -1) {
    throw new Error('Kolom key tidak ditemukan: ' + keyField);
  }

  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    if (String(values[rowIndex][keyIndex]).trim() === String(keyValue).trim()) {
      headers.forEach(function(header, columnIndex) {
        if (Object.prototype.hasOwnProperty.call(updates, header)) {
          values[rowIndex][columnIndex] = updates[header];
        }
      });

      sheet.getRange(rowIndex + 1, 1, 1, headers.length).setValues([values[rowIndex]]);
      return mapRowToObject_(headers, values[rowIndex]);
    }
  }

  throw new Error('Data tidak ditemukan di ' + sheetName + ' untuk ' + keyField + ': ' + keyValue);
}

function ensureSheetHeadersContain_(sheetName, headers) {
  var spreadsheet = getSpreadsheet_();
  var sheet = spreadsheet.getSheetByName(sheetName);
  var safeHeaders = headers || [];
  var currentHeaders;
  var missingHeaders;

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
    if (safeHeaders.length) {
      sheet.getRange(1, 1, 1, safeHeaders.length).setValues([safeHeaders]);
      sheet.setFrozenRows(1);
    }
    return sheet;
  }

  currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  missingHeaders = safeHeaders.filter(function(header) {
    return currentHeaders.indexOf(header) === -1;
  });

  if (missingHeaders.length) {
    sheet.getRange(1, currentHeaders.length + 1, 1, missingHeaders.length).setValues([missingHeaders]);
  }

  sheet.setFrozenRows(1);
  return sheet;
}
