/* ============================================================
   ｎ択問題演習帳 — スタイルシート
   ============================================================ */


/* ============================================================
   1. 設計トークン（CSS変数）
   ============================================================ */

:root {
  /* フォント（設定から上書き） */
  --font-body:    'Inter', sans-serif;
  --font-display: 'Outfit', sans-serif;
  --font-mono:    'JetBrains Mono', monospace;

  /* ウェイト（設定から上書き） */
  --fw-body:    400;
  --fw-display: 500;

  --fs-question: 21px;
  --fs-option:   14.5px;
  --fs-explain:  13.5px;
}

/* ---- テーマ: dark（デフォルト） ---- */
:root,
[data-theme="dark"] {
  --bg:            #14171c;
  --panel:         #1c2128;
  --panel-2:       #20252d;
  --border:        #2b3139;
  --text:          #e7eaf0;
  --muted:         #8b93a3;

  --accent:        #5b7cfa;
  --accent-dim:    #2a335c;

  --correct:       #2f9e58;
  --correct-dim:   #163d27;
  --correct-text:  #dff7e6;

  --incorrect:     #e25555;
  --incorrect-dim: #4a1f1f;
  --incorrect-text:#ffe3e3;

  --explain-text:  #c8d0e0;

  --grad-a: #1b2030;
  --grad-b: #1a2436;

  --panel-hover:   #262e3a;
  --accent-hover:  #303d6e;
  --accent-hover-border: #7191ff;
}

/* ---- テーマ: light ---- */
[data-theme="light"] {
  --bg:            #f0f2f5;
  --panel:         #ffffff;
  --panel-2:       #f5f7fa;
  --border:        #d0d5de;
  --text:          #1a1e27;
  --muted:         #6b7280;

  --accent:        #3b62e8;
  --accent-dim:    #dde5ff;

  --correct:       #1a8040;
  --correct-dim:   #d4f0e0;
  --correct-text:  #0a3320;

  --incorrect:     #d63030;
  --incorrect-dim: #fde8e8;
  --incorrect-text:#5a0a0a;

  --explain-text:  #3a4258;

  --grad-a: #e2e8f5;
  --grad-b: #dce5f0;

  --panel-hover:   #e8ecf4;
  --accent-hover:  #c8d5ff;
  --accent-hover-border: #3b62e8;
}

/* ---- テーマ: sepia ---- */
[data-theme="sepia"] {
  --bg:            #f5f0e8;
  --panel:         #fdf8f0;
  --panel-2:       #f0ebe0;
  --border:        #d8ccb4;
  --text:          #2c2416;
  --muted:         #7a6a52;

  --accent:        #8b5e2a;
  --accent-dim:    #eddfc8;

  --correct:       #3a6e30;
  --correct-dim:   #d8edcd;
  --correct-text:  #1a3a14;

  --incorrect:     #a03020;
  --incorrect-dim: #f5dbd5;
  --incorrect-text:#4a1008;

  --explain-text:  #5a4a32;

  --grad-a: #ede5d4;
  --grad-b: #e5dcc8;

  --panel-hover:   #e8e0d0;
  --accent-hover:  #e0d0b8;
  --accent-hover-border: #8b5e2a;
}

/* ---- テーマ: midnight ---- */
[data-theme="midnight"] {
  --bg:            #080c14;
  --panel:         #0e1420;
  --panel-2:       #131a28;
  --border:        #1e2a3c;
  --text:          #c8d8f0;
  --muted:         #5a7096;

  --accent:        #4a9eff;
  --accent-dim:    #0d2040;

  --correct:       #28b86a;
  --correct-dim:   #0a2818;
  --correct-text:  #b0f0d0;

  --incorrect:     #f05555;
  --incorrect-dim: #300e0e;
  --incorrect-text:#ffc8c8;

  --explain-text:  #a0b8d8;

  --grad-a: #0a1020;
  --grad-b: #0c1628;

  --panel-hover:   #182030;
  --accent-hover:  #102848;
  --accent-hover-border: #4a9eff;
}

/* ---- テーマ: forest ---- */
[data-theme="forest"] {
  --bg:            #0d1510;
  --panel:         #141e18;
  --panel-2:       #182218;
  --border:        #243428;
  --text:          #d0e8d4;
  --muted:         #6a9070;

  --accent:        #4ec870;
  --accent-dim:    #0e2e18;

  --correct:       #38c870;
  --correct-dim:   #0a2818;
  --correct-text:  #b0f0c8;

  --incorrect:     #f06060;
  --incorrect-dim: #30100e;
  --incorrect-text:#ffc8c8;

  --explain-text:  #a0c8a8;

  --grad-a: #101810;
  --grad-b: #0c1810;

  --panel-hover:   #1c2c20;
  --accent-hover:  #0e3820;
  --accent-hover-border: #4ec870;
}


/* ============================================================
   2. リセット・ベース
   ============================================================ */

*, *::before, *::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;   /* 対応ブラウザ向けフォールバック */
  min-height: 100svh;  /* モバイルのアドレスバー表示/非表示による高さの揺れを吸収 */
  background:
    radial-gradient(900px 500px at 15% -10%, var(--grad-a) 0%, transparent 60%),
    radial-gradient(700px 400px at 110% 10%,  var(--grad-b) 0%, transparent 55%),
    var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 32px 16px 60px;
}

/* ユーティリティ */
.mono    { font-family: var(--font-mono); }
.display { font-family: var(--font-display); }
.hidden  { display: none !important; }

/* フォーカスリング */
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* スクロールバー */
::-webkit-scrollbar        { width: 5px; height: 5px; }
::-webkit-scrollbar-track  { background: transparent; }
::-webkit-scrollbar-thumb  { background: #3a4250; border-radius: 99px; }
::-webkit-scrollbar-thumb:hover { background: #4e5a6a; }
::-webkit-scrollbar-button { width: 0; height: 0; background: transparent; }
*                          { scrollbar-width: thin; scrollbar-color: #3a4250 transparent; }


/* ============================================================
   3. レイアウト骨格
   ============================================================ */

.app {
  width: 100%;
  max-width: 920px;
}

.layout {
  display: flex;
  gap: 18px;
  align-items: stretch;
}


/* ============================================================
   4. トップバー
   ============================================================ */

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  gap: 12px;
  flex-wrap: wrap;
}

.brand {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.brand .mark {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 20px;
  letter-spacing: .02em;
}

.topbar-actions {
  display: flex;
  gap: 8px;
}


/* ============================================================
   5. 汎用ボタン
   ============================================================ */

.btn {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--panel);
  color: var(--text);
  padding: 9px 14px;
  cursor: pointer;
  transition: background .15s, border-color .15s, transform .1s;
}
.btn:hover         { background: var(--panel-2); border-color: #3a4250; }
.btn.active        { background: var(--accent-dim); border-color: var(--accent); color: var(--accent); }
.btn-ghost         { background: transparent; }
.btn-accent        { background: var(--accent); border-color: var(--accent); color: #0d1117; }
.btn-accent:hover  { background: #7191ff; }

/* 押し込みアニメーション（共通） */
.btn:active,
.btn-nav:active,
.opt:active,
.stub:active {
  transform: translateY(1px) scale(0.97);
}


/* ============================================================
   6. メインカード
   ============================================================ */

.card {
  flex: 1;
  min-width: 0;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 26px 28px 22px;
  display: flex;
  flex-direction: column;
  height: 630px;
  box-shadow: 0 20px 50px -20px rgba(0,0,0,.6);
  overflow: clip;
  scrollbar-gutter: stable;
}

/* 進捗バー */
.progress-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}
.progress-track {
  flex: 1;
  height: 6px;
  border-radius: 99px;
  background: var(--panel-2);
  overflow: hidden;
  border: 1px solid var(--border);
}
.progress-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 99px;
  transition: width .35s ease;
  width: 0%;
}
.progress-label {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
}

/* 問題番号 */
.qno {
  font-family: var(--font-mono);
  color: var(--accent);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: .04em;
  margin-bottom: 8px;
}
.qno-total { color: var(--muted); font-weight: 500; }

/* カード内エリア分割 */
.quiz-body {
  flex: 0 0 190px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  scrollbar-gutter: stable;
}
.explanation-area {
  flex: 0 0 68px;
  overflow-y: auto;
  margin-top: 10px;
  scrollbar-gutter: stable;
}
.card-bottom {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-top: 10px;
  scrollbar-gutter: stable;
}

/* 問題文 */
.question-text {
  font-family: var(--font-display);
  font-weight: var(--fw-display);
  font-size: var(--fs-question);
  line-height: 1.5;
  margin: 0 0 16px;
  padding-right: 4px;
}

/* 問題画像 */
.image-wrap {
  width: 100%;
  max-height: 180px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 14px;
}
.image-wrap img {
  max-width: 100%;
  max-height: 180px;
  border-radius: 10px;
  object-fit: contain;
  border: 1px solid var(--border);
}
.image-wrap.hidden { display: none; }

/* 解説 */
.explanation-box {
  background: var(--panel-2);
  border: 1px solid var(--border);
  border-left: 3px solid var(--accent);
  border-radius: 0 8px 8px 0;
  padding: 10px 13px;
  font-size: var(--fs-explain);
  line-height: 1.7;
  color: var(--explain-text);
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 120px;
  overflow-y: auto;
}


/* ============================================================
   7. 選択肢
   ============================================================ */

.options {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding-right: 4px;
}

.opt {
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  width: 100%;
  border: 1px solid var(--border);
  background: var(--panel-2);
  color: var(--text);
  border-radius: 10px;
  padding: 13px 14px;
  font-size: var(--fs-option);
  font-family: var(--font-body);
  font-weight: var(--fw-body);
  cursor: pointer;
  transition: background .15s, border-color .15s, transform .08s;
  touch-action: manipulation;
  overflow: hidden;
  text-overflow: ellipsis;
}
.opt .tag {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  padding: 2px 6px;
  flex-shrink: 0;
}

/* 選択肢状態 */
.opt:hover:not(:disabled)          { border-color: var(--border); background: var(--panel-hover); }
.opt:disabled                      { cursor: default; }
.opt:focus-visible                 { outline: 2px solid var(--accent); outline-offset: 2px; border-color: var(--accent); }

.opt.selected                      { background: var(--accent-dim); border-color: var(--accent); }
.opt.selected:hover:not(:disabled) { background: var(--accent-hover); border-color: var(--accent-hover-border); }
.opt.selected .tag                 { border-color: var(--accent); color: var(--accent); }

.opt.correct                       { background: var(--correct-dim); border-color: var(--correct); color: var(--correct-text); }
.opt.correct:hover:not(:disabled)  { background: var(--correct-dim); border-color: var(--correct); }
.opt.correct .tag                  { border-color: var(--correct); color: var(--correct); }

.opt.incorrect                     { background: var(--incorrect-dim); border-color: var(--incorrect); color: var(--incorrect-text); }
.opt.incorrect .tag                { border-color: var(--incorrect); color: var(--incorrect); }


/* ============================================================
   8. ナビゲーション（前へ・次へ）
   ============================================================ */

.nav-row {
  display: flex;
  align-items: stretch;
  gap: 10px;
}

.btn-nav {
  flex-shrink: 0;
  width: 44px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--panel-2);
  color: var(--text);
  font-size: 17px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background .15s, border-color .15s, opacity .15s, transform .08s;
  touch-action: manipulation;
}
.btn-nav:hover:not(:disabled) { background: #2a3040; border-color: #3a4355; }
.btn-nav:disabled              { opacity: .25; cursor: default; pointer-events: none; }


/* ============================================================
   9. 空・終了状態
   ============================================================ */

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--muted);
  text-align: center;
}
.empty-state .display { font-size: 18px; color: var(--text); }

/* 終了画面 */
.end-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 0;
}
.end-score-ring {
  position: relative;
  width: 88px;
  height: 88px;
  margin-bottom: 4px;
}
.end-score-ring svg   { width: 100%; height: 100%; }
.end-score-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.end-pct             { font-family: var(--font-display); font-weight: 800; font-size: 22px; color: var(--text); }
.end-pct small       { font-size: 13px; font-weight: 600; color: var(--muted); }
.end-title           { margin: 0; font-size: 20px; font-weight: 700; color: var(--text); }
.end-stats           { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 14px; font-family: var(--font-mono); }
.es-correct          { color: var(--correct);   font-weight: 600; }
.es-incorrect        { color: var(--incorrect); font-weight: 600; margin-left: 6px; }
.es-sep, .es-total   { color: var(--muted); }
.end-hint            { color: var(--muted); font-size: 12.5px; margin: 4px 0 0; text-align: center; }
.all-correct-msg     { color: var(--correct); font-family: var(--font-display); font-weight: 600; font-size: 15px; margin: 6px 0 0; }

.btn-review-incorrect {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--incorrect-dim);
  border: 1px solid var(--incorrect);
  color: var(--incorrect-text);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 14.5px;
  border-radius: 10px;
  padding: 12px 22px;
  cursor: pointer;
  transition: background .15s, border-color .15s;
}
.btn-review-incorrect:hover { background: var(--incorrect-dim); border-color: var(--incorrect); filter: brightness(1.15); }
.ri-icon { font-size: 16px; line-height: 1; }


/* ============================================================
   10. サイドバー（問題一覧）
   ============================================================ */

.sidebar {
  width: 208px;
  flex-shrink: 0;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 18px 14px;
  display: flex;
  flex-direction: column;
  height: fit-content;
  box-shadow: 0 20px 50px -20px rgba(0,0,0,.6);
}
.sidebar-head {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 14px;
  padding-bottom: 12px;
  margin-bottom: 10px;
  border-bottom: 1px dashed var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.sidebar-head .count {
  font-family: var(--font-mono);
  color: var(--muted);
  font-size: 11.5px;
}
.sidebar-search-row {
  margin-bottom: 10px;
}
.sidebar-search-input {
  width: 100%;
  box-sizing: border-box;
  background: var(--panel-2);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  font-family: var(--font-body);
  font-size: 12.5px;
  padding: 7px 10px;
}
.sidebar-search-input:focus {
  outline: none;
  border-color: var(--accent);
}
.sidebar-search-input::placeholder {
  color: var(--muted);
}
.stub-list {
  max-height: 400px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-right: 2px;
}

/* スタブアイテム */
.stub {
  position: relative;
  border: 1px solid var(--border);
  background: var(--panel-2);
  border-radius: 8px;
  padding: 8px 10px 8px 14px;
  cursor: pointer;
  transition: background .15s, border-color .15s;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.stub .num {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}
.stub .dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--muted);
  opacity: .5;
}

/* スタブ状態 */
.stub:hover                          { background: var(--panel-hover); border-color: var(--border); }

.stub.current                        { border-color: var(--accent); background: var(--accent-dim); }
.stub.current:hover                  { background: var(--accent-hover); }
.stub.current .dot                   { background: var(--accent); opacity: 1; }

.stub.is-correct                     { border-color: var(--correct); background: var(--correct-dim); }
.stub.is-correct:hover               { background: var(--correct-dim); border-color: var(--correct); }
.stub.is-correct .dot                { background: var(--correct); opacity: 1; }

.stub.is-incorrect                   { border-color: var(--incorrect); background: var(--incorrect-dim); }
.stub.is-incorrect:hover             { background: var(--incorrect-dim); border-color: var(--incorrect); }
.stub.is-incorrect .dot              { background: var(--incorrect); opacity: 1; }

.stub.is-checked                     { outline: 3px solid var(--muted); outline-offset: -3px; }
.stub.locked                         { cursor: not-allowed; opacity: .55; }

/* サイドバー誤答復習ボタン */
.btn-sidebar-review {
  margin-top: 10px;
  width: 100%;
  background: var(--incorrect-dim);
  border: 1px solid var(--incorrect);
  color: var(--incorrect-text);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 12.5px;
  border-radius: 8px;
  padding: 9px 10px;
  cursor: pointer;
  transition: background .15s, border-color .15s;
  flex-shrink: 0;
}
.btn-sidebar-review:hover        { background: #612828; border-color: #f07070; }
.btn-sidebar-review.hidden       { display: none !important; }


/* ============================================================
   11. チェックボックス
   ============================================================ */

/* カード内チェックボックス */
.check-label {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  vertical-align: middle;
  padding: 6px;
  margin: -6px 2px -6px -6px;
  border-radius: 6px;
}
.check-label input[type="checkbox"] { display: none; }
.check-mark {
  width: 20px; height: 20px;
  border: 2px solid var(--border);
  border-radius: 5px;
  background: var(--panel-2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600;
  color: var(--panel);
  transition: border-color .15s, background .15s;
  flex-shrink: 0;
}
.check-label:hover .check-mark                  { border-color: var(--accent); }
.check-label input:checked + .check-mark        { border-color: var(--accent); background: var(--accent); }
.check-label input:checked + .check-mark::after { content: '✓'; }

/* サイドバーチェックボタン */
.stub-ck-btn {
  flex-shrink: 0;
  width: 20px; height: 20px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--panel);
  color: transparent;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color .15s, background .15s, color .15s;
  padding: 0;
  margin-right: 6px;
  margin-left: -4px;
  position: relative;
}
.stub-ck-btn::after {
  content: '';
  position: absolute;
  inset: -10px;
  cursor: pointer;
}
.stub-ck-btn:hover   { border-color: var(--accent); color: var(--accent); }
.stub-ck-btn.checked { border-color: var(--accent); background: var(--accent); color: var(--panel); }


/* ============================================================
   12. 設定パネル
   ============================================================ */

.editor-overlay {
  position: fixed;
  inset: 0;
  background: rgba(8,10,14,.7);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 50;
  padding: 40px 20px;
  overflow-y: auto;
}
.editor-overlay.hidden { display: none; }

.editor-panel {
  width: 100%;
  max-width: 680px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  max-height: 85vh;   /* 対応ブラウザ向けフォールバック */
  max-height: 85svh;  /* モバイルのアドレスバー表示/非表示による高さの揺れを吸収 */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.editor-panel-head { flex-shrink: 0; }
.editor-tab-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px; /* スクロールバー分の余白 */
}
.editor-panel h2 {
  font-family: var(--font-display);
  margin: 0 0 6px;
  font-size: 19px;
}
.editor-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.btn-panel-close {
  background: transparent;
  border: none;
  color: var(--muted);
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  line-height: 1;
  transition: color .15s, background .15s;
}
.btn-panel-close:hover { color: var(--text); background: var(--panel-2); }

.editor-panel p.hint {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
  margin: 0 0 14px;
}
.editor-panel textarea {
  width: 100%;
  min-height: 220px;
  background: var(--panel-2);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 12.5px;
  padding: 12px;
  resize: vertical;
  line-height: 1.6;
}
.tab-insert-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.btn-tab-insert {
  padding: 6px 12px;
  font-size: 12.5px;
  flex-shrink: 0;
}
.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 14px;
  gap: 10px;
  flex-wrap: wrap;
}
.editor-msg              { font-size: 12.5px; color: var(--muted); font-family: var(--font-mono); }
.editor-msg.err          { color: var(--incorrect); }
.editor-msg.ok           { color: var(--correct); }

/* セクション区切り */
.image-manager {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px dashed var(--border);
}
.image-manager h3 {
  font-family: var(--font-display);
  font-size: 15px;
  margin: 0 0 6px;
}

/* 設定パネルのタブ切り替え */
.editor-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  flex-shrink: 0;
  margin-bottom: 18px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}
.editor-tab-btn {
  padding: 7px 12px;
  font-size: 12.5px;
}
.editor-tab-content.hidden { display: none; }
.editor-tab-content .image-manager:first-child {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}
.image-manager-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 10px;
}
.image-manager-row select {
  background: var(--panel-2);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 12.5px;
}
.image-manager-row input[type="file"] {
  font-size: 12.5px;
  color: var(--muted);
  max-width: 220px;
}
.image-preview-wrap { margin-top: 12px; min-height: 60px; }
.image-preview-wrap img {
  max-width: 160px;
  max-height: 120px;
  border-radius: 8px;
  border: 1px solid var(--border);
  object-fit: contain;
}
.image-preview-wrap .none {
  color: var(--muted);
  font-size: 12.5px;
  font-family: var(--font-mono);
}

/* ファイルインポート */
.import-row { margin-bottom: 12px; }
.drop-zone {
  border: 2px dashed var(--border);
  border-radius: 10px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  transition: border-color .15s, background .15s;
  background: var(--panel-2);
}
.drop-zone.drag-over { border-color: var(--accent); background: var(--accent-dim); }
.drop-zone-text      { font-size: 13px; color: var(--muted); }
.drop-zone-or        { font-size: 12px; color: var(--border); }
.import-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 7px 14px;
  font-size: 13px;
  cursor: pointer;
  color: var(--text);
  transition: border-color .15s, background .15s;
}
.import-label:hover               { border-color: #3a4250; background: #262c35; }
.import-label input[type="file"]  { display: none; }

/* フォントセレクト */
.font-select {
  width: 100%;
  background: var(--panel-2);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 13px;
  font-family: var(--font-body);
  cursor: pointer;
}


/* ============================================================
   14. レスポンシブ（スマホ）
   ============================================================ */

@media (max-width: 760px) {
  body { padding: 8px 8px 16px; }
  .app { max-width: 100%; }

  /* トップバー */
  .topbar         { flex-direction: column; align-items: flex-start; gap: 6px; margin-bottom: 8px; }
  .topbar-actions { flex-wrap: wrap; gap: 5px; }
  .btn            { font-size: 12px; padding: 7px 10px; }
  .brand .mark    { font-size: 17px; }

  /* レイアウト */
  .layout { flex-direction: column; gap: 10px; }

  /* カード：画面いっぱいに近い高さ */
  .card {
    height: calc(100svh - 140px);
    min-height: 420px;
    padding: 14px 13px 12px;
  }
  .quiz-body      { flex: 0 0 150px; }
  .question-text  { font-size: 17px; }
  .opt            { font-size: 13.5px; padding: 12px 11px; }
  .btn-nav        { width: 36px; }

  /* サイドバー */
  .sidebar        { width: 100%; height: auto; }
  .stub-list      { max-height: 300px; }

  /* 設定パネル：スマホでは全画面シート表示にする */
  .editor-overlay { padding: 0; align-items: stretch; }
  .editor-panel   {
    max-width: 100%;
    max-height: 100svh;
    height: 100svh;
    border-radius: 0;
    border: none;
    padding: 16px;
  }
  .editor-tabs    { gap: 5px; }
  .editor-tab-btn { padding: 8px 10px; font-size: 12px; }
}

@media (max-width: 400px) {
  .topbar-actions .btn:nth-child(n+3) { font-size: 11px; padding: 6px 8px; }
  .question-text  { font-size: 15px; }
}
