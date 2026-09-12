#!/usr/bin/env python3
"""
用內容雜湊為共用資源加上版本戳記。

CDN 會把 js/css 快取 4 小時（HTML 只有 10 分鐘），
不加戳記的話改了檔案使用者要等 4 小時才看得到。
改了內容 -> 雜湊變 -> 等於新網址，繞過快取；
沒改 -> 雜湊不變 -> 快取繼續生效。

每次改過 api.js / dialog.js / style.css 後執行：
    python3 bump-assets.py
"""
import hashlib, pathlib, re, sys

HERE = pathlib.Path(__file__).parent
ASSETS = ['api.js', 'dialog.js', 'style.css']
PAGES = ['price.html', 'sales.html', 'history.html', 'stock.html']

def digest(name):
    return hashlib.sha256((HERE / name).read_bytes()).hexdigest()[:8]

hashes = {a: digest(a) for a in ASSETS}
changed = []

for page in PAGES:
    path = HERE / page
    text = original = path.read_text()
    for asset, h in hashes.items():
        # src="api.js" 或 href="style.css"，可能已經帶著舊的 ?v=
        text = re.sub(
            r'((?:src|href)=")' + re.escape(asset) + r'(?:\?v=[0-9a-f]+)?(")',
            r'\g<1>' + asset + '?v=' + h + r'\g<2>',
            text)
    if text != original:
        path.write_text(text)
        changed.append(page)

print('資源雜湊：')
for a, h in hashes.items():
    print(f'  {a:<12} {h}')
print('更新的頁面：', ', '.join(changed) if changed else '無（版本已是最新）')
