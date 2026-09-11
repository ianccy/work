/*
 * 共用對話框：確認 / 處理中 / 完成 / 失敗
 * 取代原生 confirm 與 alert，三頁共用同一份。
 *
 * 用法：
 *   ovConfirm('刪除？', '副標', '<div class="ov-row">…</div>', '刪除', true)
 *     -> Promise<boolean>
 *   ovState('loading' | 'ok' | 'err', 標題, 副標, 明細 html)
 */

(function () {
  var overlay, ovIcon, ovTitle, ovSub, ovDetail, ovActions, ovCancel, ovOk, ovClose;
  var timer = null;
  var resolver = null;

  function build() {
    overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.id = 'overlay';
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="ov-box" role="dialog" aria-modal="true" aria-labelledby="ovTitle">' +
        '<div class="ov-icon" id="ovIcon"></div>' +
        '<p class="ov-title" id="ovTitle"></p>' +
        '<p class="ov-sub" id="ovSub"></p>' +
        '<div class="ov-detail" id="ovDetail" hidden></div>' +
        '<div class="ov-actions" id="ovActions" hidden>' +
          '<button type="button" class="ghost" id="ovCancel">取消</button>' +
          '<button type="button" id="ovOk">確定</button>' +
        '</div>' +
        '<button type="button" class="ghost" id="ovClose" hidden>完成</button>' +
      '</div>';
    document.body.appendChild(overlay);

    ovIcon = overlay.querySelector('#ovIcon');
    ovTitle = overlay.querySelector('#ovTitle');
    ovSub = overlay.querySelector('#ovSub');
    ovDetail = overlay.querySelector('#ovDetail');
    ovActions = overlay.querySelector('#ovActions');
    ovCancel = overlay.querySelector('#ovCancel');
    ovOk = overlay.querySelector('#ovOk');
    ovClose = overlay.querySelector('#ovClose');

    ovOk.addEventListener('click', function () { ovHide(true); });
    ovCancel.addEventListener('click', function () { ovHide(false); });
    ovClose.addEventListener('click', function () { ovHide(false); });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay && !overlay.classList.contains('loading')) ovHide(false);
    });
    document.addEventListener('keydown', function (e) {
      if (overlay.hidden || overlay.classList.contains('loading')) return;
      if (e.key === 'Escape') ovHide(false);
    });
  }

  function icon(state) {
    return state === 'loading' ? '<span class="ov-spin"></span>'
         : state === 'ok'      ? '<span class="ov-check">✓</span>'
         : state === 'err'     ? '<span class="ov-cross">！</span>'
         : state === 'danger'  ? '<span class="ov-warn">🗑</span>'
                               : '<span class="ov-warn">💾</span>';
  }

  function base(state, title, sub, detail) {
    if (!overlay) build();
    clearTimeout(timer);
    overlay.hidden = false;
    overlay.className = 'overlay ' + state;
    ovTitle.textContent = title;
    ovSub.textContent = sub || '';
    ovSub.hidden = !sub;
    ovIcon.innerHTML = icon(state);
    if (detail) { ovDetail.innerHTML = detail; ovDetail.hidden = false; }
    else { ovDetail.hidden = true; }
  }

  window.ovConfirm = function (title, sub, detail, okText, danger) {
    base(danger === false ? 'ask-save' : 'danger', title, sub, detail);
    ovActions.hidden = false;
    ovClose.hidden = true;
    ovOk.textContent = okText || '確定';
    ovOk.className = (danger === false) ? '' : 'danger-solid';
    ovOk.focus();
    return new Promise(function (resolve) { resolver = resolve; });
  };

  window.ovState = function (state, title, sub, detail) {
    base(state, title, sub, detail);
    ovActions.hidden = true;
    ovClose.hidden = (state === 'loading');
    ovClose.textContent = state === 'ok' ? '完成' : '知道了';
    if (state === 'ok') timer = setTimeout(function () { ovHide(); }, 2600);
  };

  window.ovHide = function (answer) {
    if (!overlay) return;
    clearTimeout(timer);
    overlay.hidden = true;
    if (resolver) { var r = resolver; resolver = null; r(answer === true); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();

/*
 * 區塊載入遮罩
 *
 * 重新抓資料時，舊數字還留在畫面上，很容易被誤讀成新的。
 * 用半透明遮罩蓋住該區塊並擋掉點擊，直到資料換新為止。
 *
 *   withMask(container, apiCall(...))   -> 回傳同一個 promise
 */
(function () {
  function ensureMask(el) {
    var m = el.querySelector(':scope > .busy-mask');
    if (m) return m;
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    m = document.createElement('div');
    m.className = 'busy-mask';
    m.innerHTML = '<span class="busy-inner"><span class="ov-spin"></span><span class="busy-text">更新中…</span></span>';
    el.appendChild(m);
    return m;
  }

  window.showMask = function (el, text) {
    if (!el) return;
    var m = ensureMask(el);
    if (text) m.querySelector('.busy-text').textContent = text;
    m.dataset.n = String((Number(m.dataset.n) || 0) + 1);   // 同時多個請求時用計數，避免早收
    m.classList.add('on');
  };

  window.hideMask = function (el) {
    if (!el) return;
    var m = el.querySelector(':scope > .busy-mask');
    if (!m) return;
    var n = Math.max(0, (Number(m.dataset.n) || 1) - 1);
    m.dataset.n = String(n);
    if (n === 0) m.classList.remove('on');
  };

  window.withMask = function (el, promise, text) {
    showMask(el, text);
    return Promise.resolve(promise).then(
      function (v) { hideMask(el); return v; },
      function (e) { hideMask(el); throw e; }
    );
  };
})();
