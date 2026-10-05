/**
 * L&D portal connector (read-only).
 *  ?action=sheets&key=KEY            -> the 4 tabs of the L&D master sheet (values + hyperlinks)
 *  ?action=folder&key=KEY            -> every file in the Drive folder (and sub-folders)
 *  ?action=file&key=KEY&id=FILEID    -> one file as base64
 * Runs as the account that deploys it.
 */
const SECRET    = 'CHANGE-THIS-TO-A-LONG-RANDOM-WORD';
const SHEET_ID  = '1pWpMpCJwdrsDt5EVZ8VhhNaue0SaiH6dIWJxw57TZsA';   // L&D master sheet (test copy)
const FOLDER_ID = '1IQaLGXovuIo4ZEafcGbtmTWgE6JyzB1v';              // Drive folder with attendance / CSA files
const TABS      = ['Master data', 'Conversion data', 'Interview process', 'JD & DB'];

function doGet(e) {
  try {
    const p = e.parameter || {};
    if (p.key !== SECRET) return out({ error: 'Wrong or missing key' });
    const a = p.action || (p.id ? 'file' : 'sheets');
    if (a === 'sheets') return out(readSheets());
    if (a === 'folder') return out({ files: listFolder(DriveApp.getFolderById(FOLDER_ID), '') });
    if (a === 'file')   return out(readFile(p.id));
    return out({ error: 'Unknown action' });
  } catch (err) { return out({ error: String(err) }); }
}

function readSheets() {
  const ss = SpreadsheetApp.openById(SHEET_ID), res = { sheets: {}, links: {} };
  const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
  TABS.forEach(name => {
    const sh = ss.getSheets().find(s => norm(s.getName()) === norm(name));
    if (!sh) { res.sheets[name] = []; res.links[name] = {}; return; }
    const nr = sh.getLastRow(), nc = sh.getLastColumn();
    if (!nr || !nc) { res.sheets[name] = []; res.links[name] = {}; return; }
    const rng = sh.getRange(1, 1, nr, nc), vals = rng.getDisplayValues(), rich = rng.getRichTextValues(), fx = rng.getFormulas(), L = {};
    for (let r = 0; r < nr; r++) for (let c = 0; c < nc; c++) {
      let u = null; const rt = rich[r][c];
      if (rt) { u = rt.getLinkUrl(); if (!u) { const runs = rt.getRuns(); for (let k = 0; k < runs.length && !u; k++) u = runs[k].getLinkUrl(); } }
      if (!u && fx[r][c]) { const m = String(fx[r][c]).match(/HYPERLINK\(\s*"([^"]+)"/i); if (m) u = m[1]; }
      if (u) (L[r] = L[r] || {})[c] = u;
    }
    res.sheets[name] = vals; res.links[name] = L;
  });
  return res;
}

function listFolder(folder, path) {
  let o = [];
  const fi = folder.getFiles();
  while (fi.hasNext()) { const f = fi.next(); o.push({ id: f.getId(), name: f.getName(), mime: f.getMimeType(), path: path, updated: f.getLastUpdated().getTime() }); }
  const fo = folder.getFolders();
  while (fo.hasNext()) { const d = fo.next(); o = o.concat(listFolder(d, path + d.getName() + '/')); }
  return o;
}

function readFile(id) {
  if (!id) return { error: 'No file id' };
  const file = DriveApp.getFileById(id), mime = file.getMimeType();
  let blob;
  if (mime === MimeType.GOOGLE_SHEETS) {
    blob = UrlFetchApp.fetch('https://docs.google.com/spreadsheets/d/' + id + '/export?format=xlsx',
      { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() } }).getBlob();
  } else blob = file.getBlob();
  return { name: file.getName(), mime: mime, b64: Utilities.base64Encode(blob.getBytes()) };
}

function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
