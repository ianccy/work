/* 共用 API 層：用 JSONP 呼叫 Apps Script Web App（避開 CORS） */

// 部署 Apps Script 後，把 /exec 結尾的網址貼在這裡
var API_URL = 'https://script.google.com/macros/s/AKfycbwATgVjp0bUx9LUn7X16L3A5ktcwdqrOeDMF749IEapaF0ioF_4IWdElO7__XaGPuWm/exec';

function apiCall(action, params) {
  return new Promise(function (resolve, reject) {
    if (!API_URL) {
      reject(new Error('尚未設定 API_URL，請先部署 Apps Script 並把網址貼進 inventory/api.js'));
      return;
    }

    var cb = 'cb_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
    var qs = ['action=' + encodeURIComponent(action), 'callback=' + cb];
    params = params || {};
    Object.keys(params).forEach(function (k) {
      if (params[k] === undefined || params[k] === null) return;
      qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));
    });

    var script = document.createElement('script');
    var timer = setTimeout(function () {
      cleanup();
      reject(new Error('連線逾時，請確認 Web App 已部署且存取權為「知道連結的任何人」'));
    }, 20000);

    function cleanup() {
      clearTimeout(timer);
      delete window[cb];
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    window[cb] = function (res) {
      cleanup();
      if (res && res.ok) resolve(res.data);
      else reject(new Error((res && res.error) || '未知錯誤'));
    };

    script.onerror = function () {
      cleanup();
      reject(new Error('無法連線到 Apps Script'));
    };

    script.src = API_URL + '?' + qs.join('&');
    document.body.appendChild(script);
  });
}

/* 每次「一個動作」用一個 reqId；重送同一個 reqId 後端不會重複寫入 */
function newReqId() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

/*
 * 商品圖放在同 repo 的 images/，檔名就是商品名稱。
 * 不需要在試算表存欄位，代價是商品改名後圖片會對不到（改名時記得一起改檔名）。
 */
function imageSrc(p) {
  if (!p || !p.name) return '';
  return 'images/' + encodeURIComponent(p.name) + '.jpg';
}

/** 圖片不存在時換成佔位圖示，不要留破圖 */
/*
 * 找不到商品圖時的預設圖。
 * 用內嵌 SVG，不必多一次請求，也不會因為檔案不存在再觸發一次 onerror。
 */
var PLACEHOLDER_IMG = 'data:image/svg+xml,<svg%20xmlns="http://www.w3.org/2000/svg"%20viewBox="0%200%2064%2064"><rect%20width="64"%20height="64"%20fill="%23fff3e8"/><g%20fill="none"%20stroke="%23ffc9ae"%20stroke-width="3.2"%20stroke-linecap="round"%20stroke-linejoin="round"><rect%20x="11"%20y="15"%20width="42"%20height="34"%20rx="6"/><path%20d="M11%2039l11-10%209%208%208-10%2014%2012"/></g><circle%20cx="24"%20cy="27"%20r="3.6"%20fill="%23ffc9ae"/></svg>';

function imgFallback(el) {
  if (el.dataset.ph) return;        // 已經換過就不再處理，避免無限迴圈
  el.dataset.ph = '1';
  el.src = PLACEHOLDER_IMG;
  el.classList.add('is-placeholder');
}

/* 排序偏好記在瀏覽器（私密瀏覽、停用 cookie 時會失敗，靜默略過） */
function loadSort(key, fallback) {
  try {
    var raw = localStorage.getItem('inv.sort.' + key);
    if (!raw) return fallback;
    var v = JSON.parse(raw);
    if (!v || typeof v.by !== 'string' || typeof v.asc !== 'boolean') return fallback;
    return v;
  } catch (e) { return fallback; }
}

function saveSort(key, by, asc) {
  try { localStorage.setItem('inv.sort.' + key, JSON.stringify({ by: by, asc: asc })); }
  catch (e) { /* 存不進去就算了，不影響功能 */ }
}

/* 畫面上的訊息列 */
function showMsg(el, text, type) {
  el.textContent = text;
  el.className = 'msg ' + (type || 'info');
  el.hidden = false;
  if (type === 'ok') {
    clearTimeout(showMsg._t);
    showMsg._t = setTimeout(function () { el.hidden = true; }, 4000);
  }
}
