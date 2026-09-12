/**
 * 庫存 / 銷貨 Web App 後端
 * 綁在試算表 1d-z5mWe6_olI2hXZ5Qg0gzBkiTkGcmgUge35QVqeZhQ
 *
 * 部署：部署 > 新增部署作業 > 類型「網頁應用程式」
 *   執行身分：我
 *   存取權：知道連結的任何人
 * 部署後把網址貼到 api.js 的 API_URL。
 */

var SS_ID = '1d-z5mWe6_olI2hXZ5Qg0gzBkiTkGcmgUge35QVqeZhQ';
var PRODUCTS = 'products';
var SALES = 'sales';
var PRODUCT_HEADERS = ['id', 'name', 'price', 'initialStock', 'updatedAt'];
var SALES_HEADERS = ['timestamp', 'productId', 'productName', 'qty', 'note', 'batchId', 'unitPrice', 'payment'];

/**
 * 一次性整理 products 欄位：刪掉第 6 欄以後的殘留資料，並寫上正確的 6 欄標題。
 * 已經整理過時不會做事，重跑安全。
 */
function cleanupProductColumns() {
  var sh = sheet_(PRODUCTS);
  var lastCol = sh.getLastColumn();
  var head = lastCol ? sh.getRange(1, 1, 1, lastCol).getValues()[0]
                         .map(function (v) { return String(v).trim(); })
                     : [];

  if (lastCol === PRODUCT_HEADERS.length && head[3] === 'initialStock') {
    return '已經整理過了，沒有動作（目前標題：' + head.slice(0, 5).join(', ') + '）';
  }

  // 資料只用得到 A~E，第 6 欄以後都是殘留
  var removed = 0;
  if (lastCol > 5) {
    sh.deleteColumns(6, lastCol - 5);
    removed = lastCol - 5;
  }

  sh.getRange(1, 1, 1, PRODUCT_HEADERS.length)
    .setValues([PRODUCT_HEADERS])
    .setFontWeight('bold');
  sh.setFrozenRows(1);

  return '刪掉 ' + removed + ' 欄殘留資料，標題已改為：' + PRODUCT_HEADERS.join(', ');
}

/**
 * 一次性回填：舊的銷貨紀錄沒有 unitPrice 欄，用商品「目前的售價」補上。
 * 只有在售價尚未調整過的情況下才準確 —— 之後新增的紀錄都會自己帶單價。
 * 已經有值的列不會被覆蓋，可以安全重跑。
 */
function backfillSalePrices() {
  var sh = sheet_(SALES);
  var last = sh.getLastRow();
  if (last < 2) return '沒有紀錄';

  var prices = {};
  listProducts().forEach(function (p) { prices[p.id] = p.price; });

  var range = sh.getRange(2, 1, last - 1, SALES_HEADERS.length);
  var rows = range.getValues();
  var filled = 0, missing = 0;
  for (var i = 0; i < rows.length; i++) {
    if (!rows[i][0]) continue;
    if (rows[i][6] !== '' && rows[i][6] !== null) continue;    // 已有值就跳過
    var id = String(rows[i][1]);
    if (prices[id] === undefined) { missing++; continue; }     // 商品已刪除
    rows[i][6] = prices[id];
    filled++;
  }
  range.setValues(rows);
  return '回填 ' + filled + ' 筆單價' + (missing ? '，' + missing + ' 筆因商品已刪除而無法回填' : '');
}

/** 只跑一次：建立工作表與標題列（已存在則只補標題） */
function setupSheets() {
  var ss = SpreadsheetApp.openById(SS_ID);
  ensureSheet_(ss, PRODUCTS, PRODUCT_HEADERS);
  ensureSheet_(ss, SALES, SALES_HEADERS);
  return '完成';
}

function ensureSheet_(ss, name, headers) {
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  var first = sh.getRange(1, 1, 1, headers.length).getValues()[0];
  var needs = false;
  for (var i = 0; i < headers.length; i++) {
    if (String(first[i]).trim() !== headers[i]) { needs = true; break; }
  }
  if (needs) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function sheet_(name) {
  var sh = SpreadsheetApp.openById(SS_ID).getSheetByName(name);
  if (!sh) throw new Error('找不到工作表：' + name);
  return sh;
}

// ---------- 路由 ----------

function doGet(e) {
  var p = (e && e.parameter) || {};
  var out;
  try {
    out = { ok: true, data: route_(p.action, p) };
  } catch (err) {
    out = { ok: false, error: String(err && err.message ? err.message : err) };
  }
  return reply_(out, p.callback);
}

/* 圖片走 POST（網址塞不下 base64）。body 是 JSON 字串，用 text/plain 送避免 preflight。 */
function doPost(e) {
  var p = {};
  try {
    if (e && e.postData && e.postData.contents) p = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply_({ ok: false, error: '無法解析請求內容：' + err }, null);
  }
  if (e && e.parameter) {
    Object.keys(e.parameter).forEach(function (k) {
      if (p[k] === undefined) p[k] = e.parameter[k];
    });
  }
  try {
    return reply_({ ok: true, data: route_(p.action, p) }, p.callback);
  } catch (err2) {
    return reply_({ ok: false, error: String(err2 && err2.message ? err2.message : err2) }, p.callback);
  }
}

function route_(action, p) {
  switch (action) {
    case 'list':   return listProducts();
    case 'create': return createProduct(p);
    case 'update': return updateProduct(p);
    case 'delete': return deleteProduct(p.id);
    case 'sale':   return recordSale(p);
    case 'batchSale': return batchSale(p);
    case 'sales':  return listSales(Number(p.limit) || 50, Number(p.offset) || 0);
    case 'deleteSale': return deleteSale(p);
    case 'deleteBatch': return deleteBatch(p);
    case 'summary': return salesSummary();
    case 'payments': return paymentMethods();
    case 'updateSaleMeta': return updateSaleMeta(p);
    default: throw new Error('未知的 action：' + action);
  }
}

function reply_(obj, callback) {
  var json = JSON.stringify(obj);
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

// ---------- 商品 ----------

/**
 * 每個商品的銷貨總量。
 * 庫存不另外存，一律由「初始庫存 − 銷貨加總」算出來，
 * 這樣刪除銷貨紀錄時庫存自動就正確，不需要任何還原邏輯。
 */
function salesTotals_() {
  var sh = sheet_(SALES);
  var last = sh.getLastRow();
  var totals = {};
  if (last < 2) return totals;
  var rows = sh.getRange(2, 2, last - 1, 3).getValues();   // B:productId, C:name, D:qty
  for (var i = 0; i < rows.length; i++) {
    var id = String(rows[i][0]);
    if (!id) continue;
    totals[id] = (totals[id] || 0) + num_(rows[i][2]);
  }
  return totals;
}

function listProducts() {
  var sh = sheet_(PRODUCTS);
  var last = sh.getLastRow();
  if (last < 2) return [];
  var rows = sh.getRange(2, 1, last - 1, PRODUCT_HEADERS.length).getValues();
  var totals = salesTotals_();
  var out = [];
  for (var i = 0; i < rows.length; i++) {
    if (!rows[i][0]) continue;
    out.push(rowToProduct_(rows[i], totals));
  }
  return out;
}

function rowToProduct_(r, totals) {
  var id = String(r[0]);
  var initial = num_(r[3]);
  var sold = (totals || {})[id] || 0;
  return {
    id: id,
    name: String(r[1]),
    price: num_(r[2]),
    initialStock: initial,
    sold: sold,
    stock: initial - sold,          // 算出來的，不存在試算表裡
    updatedAt: r[4] ? formatTs_(r[4]) : ''
  };
}

function num_(v) {
  var n = Number(v);
  return isNaN(n) ? 0 : n;
}

function formatTs_(v) {
  var d = (v instanceof Date) ? v : new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}

function createProduct(p) {
  var name = String(p.name || '').trim();
  if (!name) throw new Error('商品名稱必填');

  // 冪等：同一個 reqId 只會真的寫入一次。
  // 瀏覽器重送、使用者重整後重複送出、雙分頁，都只會產生一列。
  var reqId = String(p.reqId || '').trim();
  var cache = CacheService.getScriptCache();
  var cacheKey = reqId ? 'create:' + reqId : '';
  if (cacheKey) {
    var hit = cache.get(cacheKey);
    if (hit) return JSON.parse(hit);
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    if (cacheKey) {
      var hit2 = cache.get(cacheKey);   // 取得鎖之後再確認一次
      if (hit2) return JSON.parse(hit2);
    }
    var sh = sheet_(PRODUCTS);
    var id = 'P' + Date.now();
    var initial = p.initialStock !== undefined ? p.initialStock : p.stock;
    var row = [id, name, num_(p.price), num_(initial), new Date()];
    sh.appendRow(row);
    var created = rowToProduct_(row, salesTotals_());
    if (cacheKey) cache.put(cacheKey, JSON.stringify(created), 21600); // 6 小時
    return created;
  } finally {
    lock.releaseLock();
  }
}

/** 依 id 找列號；找不到回 -1 */
function findRow_(sh, id) {
  var last = sh.getLastRow();
  if (last < 2) return -1;
  var ids = sh.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

function updateProduct(p) {
  var id = String(p.id || '');
  if (!id) throw new Error('缺少 id');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = sheet_(PRODUCTS);
    var row = findRow_(sh, id);
    if (row < 0) throw new Error('找不到商品：' + id);
    var cur = sh.getRange(row, 1, 1, PRODUCT_HEADERS.length).getValues()[0];
    if (p.name !== undefined)  cur[1] = String(p.name);
    if (p.price !== undefined) cur[2] = num_(p.price);
    var initial = p.initialStock !== undefined ? p.initialStock : p.stock;
    if (initial !== undefined) cur[3] = num_(initial);
    cur[4] = new Date();
    sh.getRange(row, 1, 1, PRODUCT_HEADERS.length).setValues([cur]);
    return rowToProduct_(cur, salesTotals_());
  } finally {
    lock.releaseLock();
  }
}

function deleteProduct(id) {
  if (!id) throw new Error('缺少 id');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = sheet_(PRODUCTS);
    var row = findRow_(sh, id);
    if (row < 0) throw new Error('找不到商品：' + id);
    sh.deleteRow(row);
    return { id: String(id), deleted: true };
  } finally {
    lock.releaseLock();
  }
}

// ---------- 銷貨 ----------

function recordSale(p) {
  var id = String(p.productId || '');
  var qty = num_(p.qty);
  if (!id) throw new Error('缺少商品');
  if (!(qty > 0)) throw new Error('數量必須大於 0');
  if (!String(p.payment || '').trim()) throw new Error('請選擇金流方式');

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = sheet_(PRODUCTS);
    var row = findRow_(sh, id);
    if (row < 0) throw new Error('找不到商品：' + id);

    var cur = sh.getRange(row, 1, 1, PRODUCT_HEADERS.length).getValues()[0];
    var stock = num_(cur[3]) - (salesTotals_()[id] || 0);
    if (qty > stock) throw new Error('庫存不足：' + cur[1] + ' 目前剩 ' + stock);

    // 只寫銷貨紀錄，庫存是算出來的，不需要（也不該）改商品列
    sheet_(SALES).appendRow([new Date(), id, String(cur[1]), qty,
                             String(p.note || ''), String(p.reqId || ('s' + Date.now())),
                             num_(cur[2]),     // 記下當下的單價，日後改價不影響歷史
                             String(p.payment || '')]);

    return { id: id, name: String(cur[1]), qty: qty, stock: stock - qty };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 一次登錄多筆銷貨。整批原子：任一項庫存不足就全部不寫入。
 * p.items 格式："P123:3,P456:5"
 */
function batchSale(p) {
  var items = parseItems_(String(p.items || ''));
  if (!items.length) throw new Error('沒有要送出的商品');
  if (!String(p.payment || '').trim()) throw new Error('請選擇金流方式');

  var reqId = String(p.reqId || '').trim();
  var batchId = reqId || ('b' + Date.now());
  var cache = CacheService.getScriptCache();
  var cacheKey = reqId ? 'sale:' + reqId : '';
  if (cacheKey) {
    var hit = cache.get(cacheKey);
    if (hit) return JSON.parse(hit);
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    if (cacheKey) {
      var hit2 = cache.get(cacheKey);
      if (hit2) return JSON.parse(hit2);
    }
    var sh = sheet_(PRODUCTS);
    var last = sh.getLastRow();
    if (last < 2) throw new Error('尚無商品');

    var range = sh.getRange(2, 1, last - 1, PRODUCT_HEADERS.length);
    var rows = range.getValues();
    var totals = salesTotals_();

    var index = {};
    for (var i = 0; i < rows.length; i++) {
      if (rows[i][0]) index[String(rows[i][0])] = i;
    }

    // 先全部驗證，通過才寫
    var errors = [];
    for (var j = 0; j < items.length; j++) {
      var it = items[j];
      if (!(it.id in index)) { errors.push('找不到商品：' + it.id); continue; }
      var r = rows[index[it.id]];
      if (!(it.qty > 0)) { errors.push(r[1] + ' 數量必須大於 0'); continue; }
      var avail = num_(r[3]) - (totals[it.id] || 0);
      if (it.qty > avail) {
        errors.push(r[1] + ' 庫存不足（需 ' + it.qty + '，剩 ' + avail + '）');
      }
    }
    if (errors.length) throw new Error(errors.join('；'));

    var now = new Date();
    var note = String(p.note || '');
    var payment = String(p.payment || '');
    var salesRows = [];
    var result = [];

    for (var k = 0; k < items.length; k++) {
      var item = items[k];
      var row = rows[index[item.id]];
      var left = num_(row[3]) - (totals[item.id] || 0) - item.qty;
      salesRows.push([now, item.id, String(row[1]), item.qty, note, batchId, num_(row[2]), payment]);
      result.push({ id: item.id, name: String(row[1]), qty: item.qty, stock: left });
    }

    // 商品列完全不動，只 append 銷貨紀錄
    sheet_(SALES).getRange(sheet_(SALES).getLastRow() + 1, 1, salesRows.length, SALES_HEADERS.length)
      .setValues(salesRows);

    if (cacheKey) cache.put(cacheKey, JSON.stringify(result), 21600);
    return result;
  } finally {
    lock.releaseLock();
  }
}

function parseItems_(raw) {
  var out = [];
  var seen = {};
  raw.split(',').forEach(function (chunk) {
    if (!chunk) return;
    var parts = chunk.split(':');
    var id = String(parts[0] || '').trim();
    var qty = num_(parts[1]);
    if (!id || !(qty > 0)) return;
    if (seen[id]) { out[seen[id] - 1].qty += qty; return; }
    out.push({ id: id, qty: qty });
    seen[id] = out.length;
  });
  return out;
}

/**
 * 由新到舊列出銷貨紀錄。
 * 回傳的 row 是試算表列號，刪除時用來定位（刪之前會再核對內容）。
 */
/**
 * 刪掉一整個批次（同一次送出的所有品項）。庫存由銷貨加總算出，刪完自動還原。
 * 用 batchId 找列，不靠列號，所以不怕位移。
 */
function deleteBatch(p) {
  var batchId = String(p.batchId || '').trim();
  if (!batchId) throw new Error('缺少批次 ID');

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sh = sheet_(SALES);
    var last = sh.getLastRow();
    if (last < 2) throw new Error('沒有紀錄');

    var rows = sh.getRange(2, 1, last - 1, SALES_HEADERS.length).getValues();
    var hits = [];
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i][5] || '') === batchId) hits.push({ row: i + 2, data: rows[i] });
    }
    if (!hits.length) throw new Error('這個批次已經不存在了，請重新整理');

    var removed = hits.map(function (h) {
      return { productId: String(h.data[1]), productName: String(h.data[2]), qty: num_(h.data[3]) };
    });

    // 由下往上刪，列號才不會在過程中位移
    hits.sort(function (a, b) { return b.row - a.row; });
    hits.forEach(function (h) { sh.deleteRow(h.row); });

    return { batchId: batchId, count: removed.length, items: removed };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 銷貨彙總。掃一次 sales 全表算出總計、每日小計、各商品小計。
 *
 * 金額用「當時記下的 unitPrice」，不是商品現在的售價，
 * 所以之後調價不會讓歷史金額跟著跑掉。
 * 沒有 unitPrice 的舊紀錄（跑過 backfillSalePrices 前）算 0，並回報筆數。
 */
/**
 * 曾經用過的金流方式，最常用的排前面。
 * 直接從 sales 既有的值推導，不另外維護一張設定表 ——
 * 使用者在試算表手動補的值也會自動出現在選單裡。
 */
function paymentMethods() {
  var sh = sheet_(SALES);
  var last = sh.getLastRow();
  if (last < 2) return [];
  var rows = sh.getRange(2, 8, last - 1, 1).getValues();
  var count = {};
  for (var i = 0; i < rows.length; i++) {
    var v = String(rows[i][0] || '').trim();
    if (!v) continue;
    count[v] = (count[v] || 0) + 1;
  }
  return Object.keys(count)
    .map(function (k) { return { name: k, count: count[k] }; })
    .sort(function (a, b) { return b.count - a.count || a.name.localeCompare(b.name, 'zh-Hant'); });
}

function salesSummary() {
  var sh = sheet_(SALES);
  var last = sh.getLastRow();
  var empty = { total: { count: 0, qty: 0, amount: 0 }, byDate: [], byProduct: [], byPayment: [], noPrice: 0 };
  if (last < 2) return empty;

  var rows = sh.getRange(2, 1, last - 1, SALES_HEADERS.length).getValues();
  var tz = Session.getScriptTimeZone();
  var byDate = {}, byProduct = {}, byPayment = {};
  var total = { count: 0, qty: 0, amount: 0 };
  var noPrice = 0;

  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0]) continue;
    var qty = num_(r[3]);
    var price = num_(r[6]);
    if (!price) noPrice++;
    var amount = price * qty;

    var d = (r[0] instanceof Date) ? r[0] : new Date(r[0]);
    var key = isNaN(d.getTime()) ? String(r[0]) : Utilities.formatDate(d, tz, 'yyyy-MM-dd');

    if (!byDate[key]) byDate[key] = { date: key, count: 0, qty: 0, amount: 0 };
    byDate[key].count++; byDate[key].qty += qty; byDate[key].amount += amount;

    var name = String(r[2]);
    if (!byProduct[name]) byProduct[name] = { name: name, count: 0, qty: 0, amount: 0 };
    byProduct[name].count++; byProduct[name].qty += qty; byProduct[name].amount += amount;

    var pay = String(r[7] || '').trim() || '（未填）';
    if (!byPayment[pay]) byPayment[pay] = { name: pay, count: 0, qty: 0, amount: 0 };
    byPayment[pay].count++; byPayment[pay].qty += qty; byPayment[pay].amount += amount;

    total.count++; total.qty += qty; total.amount += amount;
  }

  var dates = Object.keys(byDate).map(function (k) { return byDate[k]; })
    .sort(function (a, b) { return a.date < b.date ? 1 : -1; });          // 新到舊
  var prods = Object.keys(byProduct).map(function (k) { return byProduct[k]; })
    .sort(function (a, b) { return b.amount - a.amount || b.qty - a.qty; });

  var pays = Object.keys(byPayment).map(function (k) { return byPayment[k]; })
    .sort(function (a, b) { return b.amount - a.amount || b.count - a.count; });

  return { total: total, byDate: dates, byProduct: prods, byPayment: pays, noPrice: noPrice };
}

function listSales(limit, offset) {
  var sh = sheet_(SALES);
  var last = sh.getLastRow();
  if (last < 2) return { items: [], total: 0, hasMore: false };

  var total = last - 1;
  offset = Math.max(0, offset || 0);
  var end = last - offset;                       // 這一頁最新的那列
  if (end < 2) return { items: [], total: total, hasMore: false };
  var count = Math.min(limit, end - 1);
  var start = end - count + 1;

  var rows = sh.getRange(start, 1, count, SALES_HEADERS.length).getValues();
  var items = [];
  for (var i = rows.length - 1; i >= 0; i--) {
    items.push({
      row: start + i,
      timestamp: formatTs_(rows[i][0]),
      productId: String(rows[i][1]),
      productName: String(rows[i][2]),
      qty: num_(rows[i][3]),
      note: String(rows[i][4]),
      batchId: String(rows[i][5] || ''),
      unitPrice: num_(rows[i][6]),
      amount: num_(rows[i][6]) * num_(rows[i][3]),
      payment: String(rows[i][7] || '')
    });
  }
  return { items: items, total: total, hasMore: offset + count < total };
}

/**
 * 刪除一筆銷貨紀錄。庫存是由銷貨加總算出來的，刪掉之後自動就還原了。
 * 刪之前核對 row 上的內容是否仍與前端看到的一致，
 * 避免別人同時新增/刪除造成列號位移而誤刪。
 */
/**
 * 修改銷貨紀錄的備註與金流。
 * 備註和金流是整筆交易的屬性，所以有 batchId 時整批一起改；
 * 沒有 batchId 的舊紀錄則用列號 + 內容核對改單列。
 * 只動 note 與 payment，不碰數量與單價 —— 那會影響庫存與結算。
 */
function updateSaleMeta(p) {
  var hasNote = p.note !== undefined;
  var hasPay = p.payment !== undefined;
  if (!hasNote && !hasPay) throw new Error('沒有要修改的欄位');

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = sheet_(SALES);
    var last = sh.getLastRow();
    if (last < 2) throw new Error('沒有紀錄');

    var rows = sh.getRange(2, 1, last - 1, SALES_HEADERS.length).getValues();
    var targets = [];
    var batchId = String(p.batchId || '').trim();

    if (batchId) {
      for (var i = 0; i < rows.length; i++) {
        if (String(rows[i][5] || '') === batchId) targets.push(i);
      }
      if (!targets.length) throw new Error('這個批次已經不存在了，請重新整理');
    } else {
      var row = Number(p.row);
      if (!(row >= 2) || row > last) throw new Error('找不到這筆紀錄，請重新整理');
      var idx = row - 2;
      if (String(rows[idx][1]) !== String(p.productId) || num_(rows[idx][3]) !== Number(p.qty)) {
        throw new Error('紀錄已被其他人變更，請重新整理後再改');
      }
      targets.push(idx);
    }

    // 只寫回會變動的兩欄，避免覆蓋掉其他人同時改的內容
    targets.forEach(function (i) {
      if (hasNote) sh.getRange(i + 2, 5).setValue(String(p.note));
      if (hasPay) sh.getRange(i + 2, 8).setValue(String(p.payment));
    });

    return { count: targets.length,
             note: hasNote ? String(p.note) : null,
             payment: hasPay ? String(p.payment) : null };
  } finally {
    lock.releaseLock();
  }
}

function deleteSale(p) {
  var row = Number(p.row);
  if (!(row >= 2)) throw new Error('列號不正確');

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = sheet_(SALES);
    if (row > sh.getLastRow()) throw new Error('這筆紀錄已經不存在了，請重新整理');

    var cur = sh.getRange(row, 1, 1, SALES_HEADERS.length).getValues()[0];
    var curId = String(cur[1]);
    var curQty = num_(cur[3]);

    if (String(p.productId) !== curId || Number(p.qty) !== curQty) {
      throw new Error('紀錄已被其他人變更，請重新整理後再刪');
    }

    // 庫存是算出來的，刪掉這列之後自然就回來了，不必改商品
    sh.deleteRow(row);

    var prod = listProducts().filter(function (x) { return x.id === curId; })[0];
    return {
      row: row,
      productId: curId,
      productName: String(cur[2]),
      qty: curQty,
      stock: prod ? prod.stock : null      // null = 商品已被刪掉
    };
  } finally {
    lock.releaseLock();
  }
}

// ---------- 自我測試 ----------

/** 在編輯器選這個函式按執行，會跑完整流程並自動清掉測試資料 */
function runSelfTest() {
  var log = [];
  function check(label, cond, extra) {
    log.push((cond ? 'PASS ' : 'FAIL ') + label + (extra ? '  ' + extra : ''));
    if (!cond) throw new Error('自我測試失敗：' + label + '\n' + log.join('\n'));
  }

  setupSheets();

  var p = createProduct({ name: '__test__', price: 30, initialStock: 5 });
  check('建立商品有 id', !!p.id);
  check('初始庫存 = 5', p.initialStock === 5);
  check('尚未銷貨，剩餘 = 5', p.stock === 5);
  check('已售 = 0', p.sold === 0);

  var rid = 'selftest-' + Date.now();
  var a = createProduct({ name: '__idem__', price: 1, initialStock: 1, reqId: rid });
  var bb = createProduct({ name: '__idem__', price: 1, initialStock: 1, reqId: rid });
  check('相同 reqId 回傳同一筆', a.id === bb.id);
  check('相同 reqId 只寫入一列',
        listProducts().filter(function (x) { return x.name === '__idem__'; }).length === 1);
  deleteProduct(a.id);

  var found = listProducts().filter(function (x) { return x.id === p.id; });
  check('list 找得到新商品', found.length === 1);

  var u = updateProduct({ id: p.id, price: 35, initialStock: 8 });
  check('更新售價 = 35', u.price === 35);
  check('更新初始庫存 = 8', u.initialStock === 8);

  var s = recordSale({ productId: p.id, qty: 3, note: '__test__' });
  check('銷貨後剩 5', s.stock === 5);
  var afterSale = listProducts().filter(function (x) { return x.id === p.id; })[0];
  check('商品列的初始庫存沒被改動', afterSale.initialStock === 8);
  check('已售 = 3', afterSale.sold === 3);
  check('算出來的剩餘 = 5', afterSale.stock === 5);

  var salesBefore = listSales(5, 0);
  check('銷貨紀錄有寫入', salesBefore.items.length > 0 && salesBefore.items[0].productId === p.id);

  var overflowed = false;
  try {
    recordSale({ productId: p.id, qty: 999 });
  } catch (err) {
    overflowed = true;
  }
  check('超賣被擋下', overflowed);
  check('超賣後庫存沒變', listProducts().filter(function (x) { return x.id === p.id; })[0].stock === 5);

  var p2 = createProduct({ name: '__test2__', price: 2, initialStock: 4 });
  var batch = batchSale({ items: p.id + ':2,' + p2.id + ':1', note: '__test__' });
  check('整批銷貨兩項', batch.length === 2);
  check('整批後 A 剩 3', batch[0].stock === 3);
  check('整批後 B 剩 3', batch[1].stock === 3);

  var atomicBlocked = false;
  try {
    batchSale({ items: p.id + ':1,' + p2.id + ':999' });
  } catch (err2) {
    atomicBlocked = true;
  }
  check('整批中有一項不足時被擋下', atomicBlocked);
  var after = listProducts();
  function stockOf(id) { return after.filter(function (x) { return x.id === id; })[0].stock; }
  check('原子性：A 庫存沒被扣', stockOf(p.id) === 3);
  check('原子性：B 庫存沒被扣', stockOf(p2.id) === 3);

  // 彙總
  var sum = salesSummary();
  check('彙總有 total / byDate / byProduct / byPayment',
        !!sum.total && Array.isArray(sum.byDate) && Array.isArray(sum.byProduct) && Array.isArray(sum.byPayment));
  var payTotal = sum.byPayment.reduce(function (a, x) { return a + x.amount; }, 0);
  check('各金流金額加總 = 總金額', payTotal === sum.total.amount, payTotal + ' vs ' + sum.total.amount);
  var mineSum = sum.byProduct.filter(function (x) { return x.name === '__test__'; })[0];
  check('彙總算得到 __test__', !!mineSum, JSON.stringify(mineSum));
  check('彙總的件數與金額對得上', mineSum.amount === mineSum.qty * 35,
        'amount=' + mineSum.amount + ' qty=' + mineSum.qty);
  var dateSum = sum.byDate.reduce(function (a, d) { return a + d.qty; }, 0);
  check('每日小計加總 = 總件數', dateSum === sum.total.qty, dateSum + ' vs ' + sum.total.qty);
  var prodSum = sum.byProduct.reduce(function (a, d) { return a + d.amount; }, 0);
  check('各商品金額加總 = 總金額', prodSum === sum.total.amount, prodSum + ' vs ' + sum.total.amount);

  // 整批刪除
  var bid = 'selftest-batch-' + Date.now();
  var beforeA = listProducts().filter(function (x) { return x.id === p.id; })[0].stock;
  var beforeB = listProducts().filter(function (x) { return x.id === p2.id; })[0].stock;
  batchSale({ reqId: bid, items: p.id + ':1,' + p2.id + ':1', note: '__batch__' });
  var listed = listSales(10, 0).items.filter(function (x) { return x.batchId === bid; });
  check('同一批的 batchId 一致', listed.length === 2);
  var edited = updateSaleMeta({ batchId: bid, note: '__edited__', payment: '__pay__' });
  check('整批改備註/金流回報 2 筆', edited.count === 2, JSON.stringify(edited));
  var after2 = listSales(10, 0).items.filter(function (x) { return x.batchId === bid; });
  check('備註已更新', after2.every(function (x) { return x.note === '__edited__'; }));
  check('金流已更新', after2.every(function (x) { return x.payment === '__pay__'; }));
  check('數量未被動到', after2.every(function (x) { return x.qty === 1; }));

  var db = deleteBatch({ batchId: bid });
  check('整批刪除回報 2 筆', db.count === 2);
  check('整批刪除沒有改動初始庫存',
        listProducts().filter(function (x) { return x.id === p.id; })[0].initialStock === 8);
  var afterA = listProducts().filter(function (x) { return x.id === p.id; })[0].stock;
  var afterB = listProducts().filter(function (x) { return x.id === p2.id; })[0].stock;
  check('整批刪除後 A 庫存還原', afterA === beforeA);
  check('整批刪除後 B 庫存還原', afterB === beforeB);
  check('整批刪除後查不到', listSales(10, 0).items.filter(function (x) { return x.batchId === bid; }).length === 0);

  // 刪銷貨紀錄要把庫存加回來
  var beforeStock = listProducts().filter(function (x) { return x.id === p.id; })[0].stock;
  var recent = listSales(5, 0);
  check('listSales 回傳 items/total', !!recent.items && typeof recent.total === 'number');
  var mine = recent.items.filter(function (x) { return x.productId === p.id; })[0];
  check('找得到剛剛那筆銷貨', !!mine);
  var del = deleteSale({ row: mine.row, productId: mine.productId, qty: mine.qty });
  check('刪除銷貨後剩餘自動還原', del.stock === beforeStock + mine.qty);

  var mismatchBlocked = false;
  try { deleteSale({ row: 2, productId: 'nope', qty: 999 }); } catch (e4) { mismatchBlocked = true; }
  check('內容不符時擋下', mismatchBlocked);

  deleteProduct(p2.id);
  deleteProduct(p.id);
  check('刪除後 list 找不到', listProducts().filter(function (x) { return x.id === p.id; }).length === 0);

  // 清掉測試用的銷貨紀錄
  var sh = sheet_(SALES);
  for (var r = sh.getLastRow(); r >= 2; r--) {
    var pid = String(sh.getRange(r, 2).getValue());
    if (pid === p.id || pid === p2.id) sh.deleteRow(r);
  }

  log.push('全部通過');
  Logger.log(log.join('\n'));
  return log.join('\n');
}
