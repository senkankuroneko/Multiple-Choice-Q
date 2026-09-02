// script.js
// このファイルは js/ 配下のモジュールから自動生成されたバンドルです。
// file:// で直接開いても動作するよう、ES modules ではなく通常の <script> として読み込みます。
// ソースの編集は js/ 配下の各モジュールで行い、再度バンドルしてください。

(function(){
'use strict';


// ==== state.js ====
// state.js
// アプリ全体の定数と、共有するミュータブルな状態をまとめるモジュール。
// 他モジュールは `state` オブジェクトのプロパティを直接読み書きする
// （state 自体の再代入はしない。プロパティの変更のみ）。

const STORAGE_KEY = 'nquiz_progress_v1';
const DATA_KEY    = 'nquiz_dataset_v1';
const IMG_KEY     = 'nquiz_images_v1';
const CHECK_KEY   = 'nquiz_checks_v1';
const SETS_KEY    = 'nquiz_sets_v1';
const FONT_KEY    = 'nquiz_font_v1';
const THEME_KEY   = 'nquiz_theme_v1';
const FS_KEY      = 'nquiz_fontsize_v1';

const THEMES = [
  { id: 'dark',     label: 'ダーク（デフォルト）' },
  { id: 'midnight', label: 'ミッドナイト' },
  { id: 'forest',   label: 'フォレスト' },
  { id: 'light',    label: 'ライト' },
  { id: 'sepia',    label: 'セピア' },
];

// フォント定義: { id, label, body, display, mono, googleUrl }
const FONT_PRESETS = [
  {
    id: 'ibmplex',
    label: 'IBM Plex Sans JP（デフォルト）',
    body: "'IBM Plex Sans JP','IBM Plex Sans',sans-serif",
    display: "'IBM Plex Sans JP','IBM Plex Sans',sans-serif",
    mono: "'IBM Plex Mono',monospace",
    googleUrl: 'family=IBM+Plex+Sans+JP:wght@300;400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600',
  },
  {
    id: 'noto',
    label: 'Noto Sans JP',
    body: "'Noto Sans JP',sans-serif",
    display: "'Noto Sans JP',sans-serif",
    mono: "'JetBrains Mono',monospace",
    googleUrl: 'family=Noto+Sans+JP:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600',
  },
  {
    id: 'notoserifJP',
    label: 'Noto Serif JP（明朝）',
    body: "'Noto Serif JP',serif",
    display: "'Noto Serif JP',serif",
    mono: "'JetBrains Mono',monospace",
    googleUrl: 'family=Noto+Serif+JP:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600',
  },
  {
    id: 'kosugi',
    label: 'Kosugi Maru（丸ゴシック）',
    body: "'Kosugi Maru',sans-serif",
    display: "'Kosugi Maru',sans-serif",
    mono: "'JetBrains Mono',monospace",
    googleUrl: 'family=Kosugi+Maru&family=JetBrains+Mono:wght@400;500;600',
  },
];

const SAMPLE_TSV =
`チェック\t問題\t解説\t正解\t誤答1\t誤答2\t誤答3
0\t「正答」を押してください。2回目のクリックで解答判定となります。\t解説がある場合は「ここ」に表示されます。正解の選択肢を再度押すと次の問題に進みます。\t正答\t誤答（選択肢はランダムに並ぶ）\t誤答（誤答数は自由に増やせる）
1\t左上のチェックボックスで、問題にマークできます。現在は、この問題にだけチェックが付いている状態です。問題一覧からも切り替え可能です。\t\t動作確認ができた！\t誤答（最終画面で誤答問題にまとめてチェックもできます）\t
0\tこの問題の答えは「○」です。\t正解を「○」「×」にした問題は正誤問題として認識され、「○」「×」が選択肢となります。\t○`;

// ○×問題の判定に使う語彙
const TF_MARU  = ['○', '〇', 'まる', '正', '◯'];
const TF_BATSU = ['×', '✕', 'ばつ', '誤', 'バツ'];
const TF_ALL   = [...TF_MARU, ...TF_BATSU];

/**
 * アプリ全体で共有するミュータブルな状態。
 * どのモジュールからも `state.xxx = ...` の形でプロパティを更新する。
 */
const state = {
  dataset: [],
  progressIndex: 0,      // 最も先まで進んだ未回答位置
  viewIndex: 0,           // 現在表示中の位置
  answeredOnce: false,
  pendingSelection: null,
  statusMap: {},          // key: quiz.no -> {status, shuffled, selected}
  imageMap: {},           // key: quiz.no -> base64 data URL
  reviewQueue: [],        // 復習モード中の誤答問題インデックス列
  isReviewMode: false,
  savedProgressIndex: 0,
  isShuffled: false,
  checkMap: {},           // key: quiz.no -> bool
  isCheckMode: false,     // チェック済み問題のみ演習モード
  fullDataset: [],        // チェックモード前のフルデータセット退避用
  currentThemeId: 'dark',
  currentFontId: 'default',
};

// ==== dom.js ====
// dom.js
// 繰り返し参照するDOM要素をまとめて取得する。
// script は body 末尾で type="module" 読み込みのため、
// このモジュール評価時点で対象要素は既にパース済み。

const cardEl           = document.getElementById('cardEl');
const stubList         = document.getElementById('stubList');
const sidebarCount     = document.getElementById('sidebarCount');
const editorOverlay    = document.getElementById('editorOverlay');
const dataInput        = document.getElementById('dataInput');
const editorMsg        = document.getElementById('editorMsg');
const imgNoSelect      = document.getElementById('imgNoSelect');
const imgFileInput     = document.getElementById('imgFileInput');
const imagePreviewWrap = document.getElementById('imagePreviewWrap');
const imgMsg           = document.getElementById('imgMsg');
const clearImgBtn      = document.getElementById('clearImgBtn');

// ==== storage.js ====
// storage.js
// localStorage の読み書きをすべてここに集約する。
// 呼び出し側は try/catch を意識せず使える。

// --- 進捗（回答状況） ---
function saveProgress(){
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      statusMap: state.statusMap,
      progressIndex: state.progressIndex,
    }));
  } catch(e){}
}
function loadProgress(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!parsed.statusMap) return false;
    state.statusMap = parsed.statusMap;
    state.progressIndex = parsed.progressIndex || 0;
    return true;
  } catch(e){ return false; }
}

// --- 問題データセット ---
function saveDataset(){
  try { localStorage.setItem(DATA_KEY, JSON.stringify(state.dataset)); } catch(e){}
}
function loadDatasetRaw(){
  try { return localStorage.getItem(DATA_KEY); } catch(e){ return null; }
}

// --- 画像 ---
function saveImageMap(){
  try {
    localStorage.setItem(IMG_KEY, JSON.stringify(state.imageMap));
    return true;
  } catch(e){
    return false;
  }
}
function loadImageMap(){
  try {
    const raw = localStorage.getItem(IMG_KEY);
    state.imageMap = raw ? JSON.parse(raw) : {};
  } catch(e){ state.imageMap = {}; }
}

// --- チェック状態 ---
function saveCheckMap(){
  try { localStorage.setItem(CHECK_KEY, JSON.stringify(state.checkMap)); } catch(e){}
}
function loadCheckMap(){
  try {
    const raw = localStorage.getItem(CHECK_KEY);
    state.checkMap = raw ? JSON.parse(raw) : {};
  } catch(e){ state.checkMap = {}; }
}

// --- 保存済み問題セット ---
function loadSavedSets(){
  try {
    const raw = localStorage.getItem(SETS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch(e){ return {}; }
}
function saveSetToStorage(name, nos){
  const sets = loadSavedSets();
  sets[name] = nos;
  try { localStorage.setItem(SETS_KEY, JSON.stringify(sets)); } catch(e){}
}
function deleteSet(name){
  const sets = loadSavedSets();
  delete sets[name];
  try { localStorage.setItem(SETS_KEY, JSON.stringify(sets)); } catch(e){}
}

// --- テーマ ---
function saveTheme(id){
  try { localStorage.setItem(THEME_KEY, id); } catch(e){}
}
function loadTheme(){
  try { state.currentThemeId = localStorage.getItem(THEME_KEY) || 'dark'; } catch(e){}
}

// --- フォント ---
function saveFontSetting(id){
  try { localStorage.setItem(FONT_KEY, id); } catch(e){}
}
function loadFontSetting(){
  try { state.currentFontId = localStorage.getItem(FONT_KEY) || 'default'; } catch(e){}
}
function saveFontWeights(fwBody, fwDisplay){
  try { localStorage.setItem(FONT_KEY + '_w', JSON.stringify({ fwBody, fwDisplay })); } catch(e){}
}
function loadFontWeights(){
  try {
    const raw = localStorage.getItem(FONT_KEY + '_w');
    if (!raw) return { fwBody: '400', fwDisplay: '500' };
    return JSON.parse(raw);
  } catch(e){ return { fwBody: '400', fwDisplay: '500' }; }
}

// --- 文字サイズ ---
function saveFontSizes(q, o, e){
  try { localStorage.setItem(FS_KEY, JSON.stringify({ q, o, e })); } catch(err){}
}
function loadFontSizes(){
  try { return JSON.parse(localStorage.getItem(FS_KEY)) || {}; } catch(e){ return {}; }
}

// --- 表示設定の一括初期化 ---
function clearDisplaySettings(){
  try {
    localStorage.removeItem(THEME_KEY);
    localStorage.removeItem(FONT_KEY);
    localStorage.removeItem(FONT_KEY + '_w');
    localStorage.removeItem(FS_KEY);
  } catch(e){}
}

// --- 全データのバックアップ（エクスポート／インポート） ---
// 問題データ・チェック状態・進捗・画像・保存済みセット・表示設定をまとめて
// 1つのJSONとして書き出し／復元する。
const BACKUP_KEYS = [STORAGE_KEY, DATA_KEY, IMG_KEY, CHECK_KEY, SETS_KEY, THEME_KEY, FONT_KEY, FONT_KEY + '_w', FS_KEY];

function exportAllData(){
  const dump = {};
  BACKUP_KEYS.forEach(k => {
    try {
      const v = localStorage.getItem(k);
      if (v !== null) dump[k] = v;
    } catch(e){}
  });
  return JSON.stringify({ app: 'nquiz', version: 1, exportedAt: new Date().toISOString(), data: dump }, null, 2);
}

function importAllData(jsonStr){
  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch(e){
    throw new Error('ファイルの形式が正しくありません（JSONとして読み取れませんでした）。');
  }
  if (!parsed || typeof parsed !== 'object' || !parsed.data) {
    throw new Error('バックアップファイルの内容が正しくありません。');
  }
  BACKUP_KEYS.forEach(k => {
    try {
      if (Object.prototype.hasOwnProperty.call(parsed.data, k)) {
        localStorage.setItem(k, parsed.data[k]);
      } else {
        localStorage.removeItem(k);
      }
    } catch(e){}
  });
}

// ==== parser.js ====
// parser.js
// TSV/CSV テキストを問題データセットへ変換するパーサー群。

/**
 * 引用符( " )で囲われたフィールド内の改行・タブ・カンマ・
 * エスケープされた引用符("")に対応したCSV/TSV行パーサー
 * （スプレッドシートからの複数行セルのコピペにも対応）
 */
function parseCsvRows(raw, delim){
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const len = raw.length;
  while (i < len) {
    const ch = raw[i];
    if (inQuotes) {
      if (ch === '"') {
        if (raw[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += ch; i++; continue;
    } else {
      if (ch === '"' && field === '') { inQuotes = true; i++; continue; }
      if (ch === delim) { row.push(field); field = ''; i++; continue; }
      if (ch === '\r') { i++; continue; }
      if (ch === '\n') { row.push(field); field = ''; rows.push(row); row = []; i++; continue; }
      field += ch; i++; continue;
    }
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

/**
 * フィールドに区切り文字・改行・引用符が含まれる場合は
 * CSV/TSV仕様に沿って引用符で囲む
 */
function csvEscapeField(value, delim){
  const v = String(value ?? '');
  if (v.includes(delim) || v.includes('\n') || v.includes('\r') || v.includes('"')) {
    return '"' + v.replace(/"/g, '""') + '"';
  }
  return v;
}

/**
 * TSV/CSVテキストを問題データセット配列にパースする。
 * 列の並び：チェック(0/1,任意), 問題文, 解説(任意), 正解, 誤答1, 誤答2…
 * チェック列があった場合は state.checkMap を上書きして保存する。
 */
function parseDataset(raw, hasHeader, hasExplain){
  const delim = raw.includes('\t') ? '\t' : ',';
  let rows = parseCsvRows(raw, delim).map(cols => cols.map(c => c.trim()));
  rows = rows.filter(cols => cols.some(c => c !== ''));
  if (rows.length < (hasHeader ? 2 : 1)) throw new Error('データが不足しています（最低1行が必要）。');

  const dataRows = hasHeader ? rows.slice(1) : rows;
  const list = [];
  const newCheckMap = {};

  dataRows.forEach(cols => {
    // 1列目が 0/1 のときはチェック列あり
    let offset = 0;
    let checkVal = false;
    if (cols[0] === '0' || cols[0] === '1') {
      checkVal = cols[0] === '1';
      offset = 1;
    }

    const question = cols[offset + 0];
    if (!question) return;
    let explanation = '', answer = '', dummies = [];
    if (hasExplain) {
      explanation = cols[offset + 1] || '';
      answer      = cols[offset + 2] || '';
      dummies     = cols.slice(offset + 3).filter(c => c !== '');
    } else {
      answer  = cols[offset + 1] || '';
      dummies = cols.slice(offset + 2).filter(c => c !== '');
    }
    if (!answer) return;

    const no = String(list.length + 1);
    newCheckMap[no] = checkVal;
    list.push({ no, question, explanation, answer, dummies });
  });

  if (list.length === 0) throw new Error('有効な問題行が見つかりませんでした。列の並びを確認してください。');

  // チェック列があったデータならcheckMapを上書き
  const hasCheckCol = dataRows.some(cols => cols[0] === '0' || cols[0] === '1');
  if (hasCheckCol) {
    state.checkMap = newCheckMap;
    saveCheckMap();
  }

  return list;
}

// ==== quizLogic.js ====
// quizLogic.js
// 問題データそのものに対するロジック（○×判定・シャッフル・状態初期化）。

function shuffle(arr){
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** ○×問題の判定：正解が○か×のバリエーションであれば○×問題とみなす */
function isTrueFalse(q){
  return TF_ALL.includes(q.answer.trim());
}

/** ○×問題のとき、固定順（○→×）で返す（誤答列の有無を問わない） */
function normalizeTrueFalseOpts(){
  return ['○', '×'];
}

/** ○×問題のとき、元の正解値が○系か×系かを判定して正規化した値を返す */
function normalizeTFAnswer(answer){
  const v = answer.trim();
  if (TF_MARU.includes(v)) return '○';
  if (TF_BATSU.includes(v)) return '×';
  return answer;
}

/** 現在の state.dataset に基づき statusMap を初期化する（選択肢の順序もここで決定） */
function initStatusMap(){
  state.statusMap = {};
  state.dataset.forEach(q => {
    let opts;
    if (isTrueFalse(q)) {
      opts = normalizeTrueFalseOpts(); // 固定順・正規化済み
    } else {
      opts = [q.answer, ...q.dummies];
      shuffle(opts);
    }
    state.statusMap[q.no] = { status: 'unanswered', shuffled: opts, selected: null };
  });
}

function answeredCount(){
  return state.dataset.filter(q => state.statusMap[q.no].status !== 'unanswered').length;
}

// ==== displaySettings.js ====
// displaySettings.js
// テーマ・フォント・フォントウェイト・文字サイズなど、見た目に関する設定。

// デフォルトの文字サイズ（px）
const DEFAULT_FS = { q: '21', o: '14.5', e: '13.5' };

function applyTheme(id){
  state.currentThemeId = id;
  document.documentElement.setAttribute('data-theme', id);
}

function applyFontWeights(fwBody, fwDisplay){
  const root = document.documentElement;
  root.style.setProperty('--fw-body', fwBody);
  root.style.setProperty('--fw-display', fwDisplay);
}

function applyFont(id){
  const preset = FONT_PRESETS.find(p => p.id === id) || FONT_PRESETS[0];
  state.currentFontId = preset.id;

  let linkEl = document.getElementById('google-fonts-link');
  if (!linkEl) {
    linkEl = document.createElement('link');
    linkEl.id = 'google-fonts-link';
    linkEl.rel = 'stylesheet';
    document.head.appendChild(linkEl);
  }
  linkEl.href = `https://fonts.googleapis.com/css2?${preset.googleUrl}&display=swap`;

  const root = document.documentElement;
  root.style.setProperty('--font-body', preset.body);
  root.style.setProperty('--font-display', preset.display);
  root.style.setProperty('--font-mono', preset.mono);
}

function applyFontSizes(q, o, e){
  const r = document.documentElement;
  r.style.setProperty('--fs-question', q + 'px');
  r.style.setProperty('--fs-option', o + 'px');
  r.style.setProperty('--fs-explain', e + 'px');
}

/** 起動時：保存済みの表示設定をすべて読み込んで適用する */
function initDisplaySettings(){
  loadFontSetting();
  applyFont(state.currentFontId);
  const { fwBody, fwDisplay } = loadFontWeights();
  applyFontWeights(fwBody, fwDisplay);
  loadTheme();
  applyTheme(state.currentThemeId);

  const fs = loadFontSizes();
  applyFontSizes(fs.q || DEFAULT_FS.q, fs.o || DEFAULT_FS.o, fs.e || DEFAULT_FS.e);
}

/**
 * 表示設定パネルの各コントロール（フォントウェイト・テーマ・文字サイズ）を
 * 現在の設定値で同期する。設定初期化ボタンからも呼び出される。
 */
function syncDisplaySettingsUI(){
  // ウェイトセレクタ初期化
  const weights = loadFontWeights();
  const fwBodySel    = document.getElementById('fwBodySelect');
  const fwDisplaySel = document.getElementById('fwDisplaySelect');
  fwBodySel.value    = weights.fwBody;
  fwDisplaySel.value = weights.fwDisplay;
  const onWeightChange = () => {
    applyFontWeights(fwBodySel.value, fwDisplaySel.value);
    saveFontWeights(fwBodySel.value, fwDisplaySel.value);
  };
  fwBodySel.onchange = onWeightChange;
  fwDisplaySel.onchange = onWeightChange;

  // テーマセレクタ初期化
  const themeSel = document.getElementById('themeSelect');
  if (themeSel) {
    themeSel.innerHTML = THEMES.map(t =>
      `<option value="${t.id}" ${t.id === state.currentThemeId ? 'selected' : ''}>${t.label}</option>`
    ).join('');
    themeSel.onchange = () => {
      applyTheme(themeSel.value);
      saveTheme(themeSel.value);
    };
  }

  // フォントセレクタの選択状態も同期
  const fontSel = document.getElementById('fontSelect');
  if (fontSel) fontSel.value = state.currentFontId;

  // 文字サイズスライダーの初期化
  const fsQRange = document.getElementById('fsQuestionRange');
  const fsORange = document.getElementById('fsOptionRange');
  const fsERange = document.getElementById('fsExplainRange');
  const fsQVal   = document.getElementById('fsQuestionVal');
  const fsOVal   = document.getElementById('fsOptionVal');
  const fsEVal   = document.getElementById('fsExplainVal');

  const curFs = loadFontSizes();
  const qVal = curFs.q || DEFAULT_FS.q;
  const oVal = curFs.o || DEFAULT_FS.o;
  const eVal = curFs.e || DEFAULT_FS.e;

  fsQRange.value = qVal; fsQVal.textContent = qVal + 'px';
  fsORange.value = oVal; fsOVal.textContent = oVal + 'px';
  fsERange.value = eVal; fsEVal.textContent = eVal + 'px';

  const onSizeChange = () => {
    fsQVal.textContent = fsQRange.value + 'px';
    fsOVal.textContent = fsORange.value + 'px';
    fsEVal.textContent = fsERange.value + 'px';
    applyFontSizes(fsQRange.value, fsORange.value, fsERange.value);
    saveFontSizes(fsQRange.value, fsORange.value, fsERange.value);
  };
  fsQRange.oninput = onSizeChange;
  fsORange.oninput = onSizeChange;
  fsERange.oninput = onSizeChange;
}

/** 表示設定（テーマ・フォント・ウェイト・文字サイズ）を初期値に戻す */
function resetDisplaySettings(){
  clearDisplaySettings();

  applyTheme('dark');
  applyFont(FONT_PRESETS[0].id);
  applyFontWeights('400', '500');
  applyFontSizes(DEFAULT_FS.q, DEFAULT_FS.o, DEFAULT_FS.e);

  syncDisplaySettingsUI();

  const msg = document.getElementById('resetDisplayMsg');
  if (msg) { msg.textContent = '表示設定を初期化しました'; msg.className = 'editor-msg ok'; }
}

// ==== render.js ====
// render.js
// サイドバーの問題一覧とメインカード（問題・選択肢・終了画面）の描画。

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** 問題文・解説向けの簡易整形：改行を<br>に、__text__ をアンダーライン<u>に変換 */
function formatRichText(s){
  let html = escapeHtml(s);
  html = html.replace(/__(.+?)__/g, '<u>$1</u>');
  html = html.replace(/\n/g, '<br>');
  return html;
}

function renderSidebar(){
  stubList.innerHTML = '';
  const answered = answeredCount();
  const incorrectCount = state.dataset.filter(q => state.statusMap[q.no].status === 'incorrect').length;
  sidebarCount.textContent = `${answered}/${state.dataset.length}`;
  const reviewBtn = document.getElementById('sidebarReviewBtn');
  if (incorrectCount > 0) {
    reviewBtn.textContent = `誤答 ${incorrectCount}問を復習`;
    reviewBtn.classList.remove('hidden');
  } else {
    reviewBtn.classList.add('hidden');
  }
  state.dataset.forEach((q, idx) => {
    const rec = state.statusMap[q.no];
    const div = document.createElement('div');
    div.className = 'stub';
    div.id = `stub-${q.no}`;
    if (rec.status === 'correct') div.classList.add('is-correct');
    if (rec.status === 'incorrect') div.classList.add('is-incorrect');

    const locked = rec.status === 'unanswered'
      && (state.isReviewMode ? !state.reviewQueue.includes(idx) : idx !== state.progressIndex);
    if (locked) div.classList.add('locked');

    const snippet = q.question.length > 12 ? q.question.slice(0, 12) + '…' : q.question;
    const checked = !!state.checkMap[q.no];
    div.dataset.search = q.question.toLowerCase();
    div.innerHTML = `
      <button class="stub-ck-btn${checked ? ' checked' : ''}" data-no="${escapeHtml(q.no)}" title="チェック切り替え">${checked ? '✓' : ''}</button>
      <span class="num">${escapeHtml(snippet)}</span>
      <span class="dot"></span>`;
    if (checked) div.classList.add('is-checked');

    // チェックボタン：クリックでトグルのみ（ジャンプしない）
    div.querySelector('.stub-ck-btn').addEventListener('click', e => {
      e.stopPropagation();
      toggleCheck(q.no);
      // ボタン自身の見た目を即更新
      const btn = e.currentTarget;
      const nowChecked = !!state.checkMap[q.no];
      btn.textContent = nowChecked ? '✓' : '';
      btn.classList.toggle('checked', nowChecked);
      div.classList.toggle('is-checked', nowChecked);
    });

    div.onclick = () => {
      if (rec.status !== 'unanswered' || idx === state.progressIndex) {
        state.viewIndex = idx;
        renderCard(idx);
      }
    };
    stubList.appendChild(div);
  });

  // サイドバー再描画のたびに、検索中であればフィルタを再適用する
  const searchInput = document.getElementById('stubSearchInput');
  if (searchInput && searchInput.value) filterStubs(searchInput.value);
}

/** 問題文の部分一致でサイドバーの問題一覧を絞り込む（データ自体は変更しない） */
function filterStubs(query){
  const q = query.trim().toLowerCase();
  document.querySelectorAll('.stub').forEach(el => {
    const match = !q || (el.dataset.search || '').includes(q);
    el.style.display = match ? '' : 'none';
  });
}

function renderEndScreen(){
  const incorrectItems = state.dataset.filter(q => state.statusMap[q.no].status === 'incorrect');
  const correctCount   = state.dataset.filter(q => state.statusMap[q.no].status === 'correct').length;
  const incorrectCount = incorrectItems.length;
  const pct = Math.round((correctCount / state.dataset.length) * 100);

  const reviewBtnHtml = incorrectCount > 0 ? `
    <button class="btn-review-incorrect" id="reviewIncorrectBtn">
      誤答 ${incorrectCount} 問を復習する
    </button>
    <button class="btn-review-incorrect" id="checkIncorrectBtn" style="background:var(--accent-dim);border-color:var(--accent);color:var(--text);">
      ✓　誤答問題にチェックを付ける
    </button>` : `<p class="all-correct-msg">全問正解！　お疲れ様でした</p>`;

  cardEl.innerHTML = `
    <div class="end-screen">
      <div class="end-score-ring">
        <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
          <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border)" stroke-width="7"/>
          <circle cx="40" cy="40" r="34" fill="none"
            stroke="${pct === 100 ? 'var(--correct)' : 'var(--accent)'}"
            stroke-width="7"
            stroke-linecap="round"
            stroke-dasharray="${2 * Math.PI * 34}"
            stroke-dashoffset="${2 * Math.PI * 34 * (1 - pct / 100)}"
            transform="rotate(-90 40 40)"/>
        </svg>
        <div class="end-score-label">
          <span class="end-pct">${pct}<small>%</small></span>
        </div>
      </div>
      <p class="end-title display">演習終了</p>
      <p class="end-stats">
        <span class="es-correct">正解 ${correctCount}</span>
        <span class="es-sep">/</span>
        <span class="es-total">${state.dataset.length} 問</span>
        ${incorrectCount > 0 ? `<span class="es-incorrect">誤答 ${incorrectCount}</span>` : ''}
      </p>
      ${reviewBtnHtml}
      <p class="end-hint">問題一覧から各問題を個別に振り返れます</p>
    </div>`;

  if (incorrectCount > 0) {
    document.getElementById('reviewIncorrectBtn').onclick = startIncorrectReview;
    document.getElementById('checkIncorrectBtn').onclick = () => {
      const n = markIncorrectChecked();
      document.getElementById('checkIncorrectBtn').textContent = `✓ ${n}問にチェックを付けました`;
      document.getElementById('checkIncorrectBtn').disabled = true;
    };
  }
  document.querySelectorAll('.stub.current').forEach(el => el.classList.remove('current'));
}

function renderCard(idx){
  // 前の問題のキーハンドラをクリア
  if (cardEl._keyHandler) {
    document.removeEventListener('keydown', cardEl._keyHandler);
    cardEl._keyHandler = null;
  }
  if (state.dataset.length === 0) {
    cardEl.innerHTML = `<div class="empty-state"><div class="display">問題がありません</div><div>右上の「問題を編集」からデータを追加してください。</div></div>`;
    return;
  }
  if (idx >= state.dataset.length) {
    renderEndScreen();
    return;
  }

  state.viewIndex = idx;
  const q = state.dataset[idx];
  const rec = state.statusMap[q.no];
  const pct = Math.round((answeredCount() / state.dataset.length) * 100);

  document.querySelectorAll('.stub').forEach(el => el.classList.remove('current'));
  const stubEl = document.getElementById(`stub-${q.no}`);
  if (stubEl) stubEl.classList.add('current');

  const imageUrl = state.imageMap[q.no];
  const imageHtml = imageUrl
    ? `<div class="image-wrap"><img src="${imageUrl}" alt=""></div>`
    : `<div class="image-wrap hidden"></div>`;

  const isReview = rec.status !== 'unanswered';
  state.pendingSelection = null;
  state.answeredOnce = isReview;

  // ○✕問題のとき正解値を正規化して比較に使う
  const tf = isTrueFalse(q);
  const displayAnswer = tf ? normalizeTFAnswer(q.answer) : q.answer;

  const optionsHtml = rec.shuffled.map((opt, i) => {
    let cls = 'opt';
    if (isReview) {
      if (opt === displayAnswer) cls += ' correct';
      else if (opt === rec.selected) cls += ' incorrect';
    }
    const label = i + 1;
    return `<button class="${cls}" data-opt="${escapeHtml(opt)}" data-idx="${i}" ${isReview ? 'disabled' : ''}>
      <span class="tag mono">${label}</span><span>${escapeHtml(opt)}</span>
    </button>`;
  }).join('');

  const explanationHtml = q.explanation
    ? `<div class="explanation-area"><div class="explanation-box${isReview ? '' : ' hidden'}" id="explanationBox">${formatRichText(q.explanation)}</div></div>`
    : '';

  // ◀ 前へ：viewIndex > 0 かつ 1つ前が回答済みか現在地まで
  const canPrev = state.viewIndex > 0;
  // ▶ 次へ：回答済みで次がある、または未回答で回答後（progressIndex が進んでいる）
  const canNext = state.isReviewMode
    ? state.reviewQueue.indexOf(state.viewIndex) < state.reviewQueue.length - 1
    : state.viewIndex < state.progressIndex;

  cardEl.innerHTML = `
    <div class="progress-row">
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
    </div>
    <div class="quiz-body">
      ${imageHtml}
      <div class="qno mono">
        <label class="check-label">
          <input type="checkbox" class="q-checkbox" data-no="${escapeHtml(q.no)}" ${state.checkMap[q.no] ? 'checked' : ''}>
          <span class="check-mark"></span>
        </label>
        Q${idx + 1} <span class="qno-total">/ ${state.dataset.length}</span>
      </div>
      <p class="question-text">${formatRichText(q.question)}</p>
    </div>
    ${explanationHtml}
    <div class="card-bottom">
      <div class="nav-row">
        <button class="btn-nav" id="prevBtn" ${canPrev ? '' : 'disabled'}>◀</button>
        <div class="options" style="flex:1;">${optionsHtml}</div>
        <button class="btn-nav" id="nextBtn" ${canNext ? '' : 'disabled'}>▶</button>
      </div>
    </div>
  `;

  if (!isReview) {
    cardEl.querySelectorAll('.opt').forEach(btn => {
      btn.addEventListener('click', () => handleOptionClick(btn, q, rec, displayAnswer));
    });
  } else {
    // 復習画面：正解ボタンはクリックで次へ
    cardEl.querySelectorAll('.opt').forEach(btn => {
      if (btn.dataset.opt === displayAnswer) {
        btn.disabled = false;
        btn.addEventListener('click', handleNext);
      }
    });
  }
  document.getElementById('prevBtn').addEventListener('click', handlePrev);
  document.getElementById('nextBtn').addEventListener('click', handleNext);

  // チェックボックス
  const ck = cardEl.querySelector('.q-checkbox');
  if (ck) ck.addEventListener('change', () => toggleCheck(q.no));

  // 数字キー入力で選択肢をクリック（未回答時のみ、PCフォーカス不要）
  if (!isReview) {
    const keyHandler = (e) => {
      const n = parseInt(e.key);
      if (isNaN(n) || n < 1) return;
      const btn = cardEl.querySelector(`.opt[data-idx="${n - 1}"]`);
      if (btn && !btn.disabled) btn.click();
    };
    document.addEventListener('keydown', keyHandler);
    // 次の問題に移ったらリスナーを外す
    cardEl._keyHandler = keyHandler;
  }
  if (cardEl._keyHandler && isReview) {
    document.removeEventListener('keydown', cardEl._keyHandler);
    cardEl._keyHandler = null;
  }
}

// ==== answer.js ====
// answer.js
// 解答判定（1回目の選択→2回目のクリックで確定）・ナビゲーション・復習フロー。

function handleOptionClick(btn, q, rec, displayAnswer){
  if (state.answeredOnce) return;
  const value = btn.dataset.opt;

  // 2回目のクリック（同じボタン）で確定
  if (state.pendingSelection === btn) {
    confirmAnswer(btn, value, q, rec, displayAnswer);
    return;
  }
  cardEl.querySelectorAll('.opt').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  state.pendingSelection = btn;
}

function confirmAnswer(btn, value, q, rec, displayAnswer){
  state.answeredOnce = true;
  btn.classList.remove('selected');
  rec.selected = value;

  const allBtns = cardEl.querySelectorAll('.opt');
  if (value === displayAnswer) {
    btn.classList.add('correct');
    rec.status = 'correct';
    // 正解ボタンだけ有効のまま残してクリックで次へ進めるようにする
    allBtns.forEach(b => { if (b !== btn) b.disabled = true; });
    btn.addEventListener('click', handleNext);
  } else {
    btn.classList.add('incorrect');
    rec.status = 'incorrect';
    allBtns.forEach(b => {
      if (b.dataset.opt === displayAnswer) {
        b.classList.add('correct');
        // 正解ボタンはクリックで次へ進めるよう有効のまま残す
        b.addEventListener('click', handleNext);
      } else {
        b.disabled = true;
      }
    });
  }

  if (state.viewIndex === state.progressIndex) {
    state.progressIndex = Math.min(state.progressIndex + 1, state.dataset.length);
  }
  saveProgress();
  renderSidebar();
  // 解説を表示
  const exBox = document.getElementById('explanationBox');
  if (exBox) exBox.classList.remove('hidden');
  // ▶ ボタンを有効化
  const nextBtn = document.getElementById('nextBtn');
  if (nextBtn) nextBtn.disabled = false;
}

/** 誤答問題だけを順番に振り返る復習モードを開始する（選択肢を再シャッフルし未回答に戻す） */
function startIncorrectReview(){
  state.reviewQueue = state.dataset
    .map((q, i) => ({ q, i }))
    .filter(({ q }) => state.statusMap[q.no].status === 'incorrect')
    .map(({ i }) => i);

  state.reviewQueue.forEach(i => {
    const q = state.dataset[i];
    const rec = state.statusMap[q.no];
    let opts;
    if (isTrueFalse(q)) {
      opts = normalizeTrueFalseOpts();
    } else {
      opts = [q.answer, ...q.dummies];
      shuffle(opts);
    }
    rec.status = 'unanswered';
    rec.shuffled = opts;
    rec.selected = null;
  });

  state.isReviewMode = true;
  state.savedProgressIndex = state.progressIndex; // 現在地を退避
  state.progressIndex = state.reviewQueue[0];
  state.viewIndex = state.reviewQueue[0];
  saveProgress();
  renderSidebar();
  renderCard(state.reviewQueue[0]);
}

function handlePrev(){
  if (state.isReviewMode) {
    const pos = state.reviewQueue.indexOf(state.viewIndex);
    if (pos > 0) renderCard(state.reviewQueue[pos - 1]);
    return;
  }
  if (state.viewIndex > 0) renderCard(state.viewIndex - 1);
}

function handleNext(){
  if (state.isReviewMode) {
    const pos = state.reviewQueue.indexOf(state.viewIndex);
    if (pos !== -1 && pos + 1 < state.reviewQueue.length) {
      const next = state.reviewQueue[pos + 1];
      state.viewIndex = next;
      state.progressIndex = next;
      renderCard(next);
    } else {
      // 復習キュー終了 → progressIndex を元に戻して通常フローへ
      state.isReviewMode = false;
      state.reviewQueue = [];
      state.progressIndex = state.savedProgressIndex;
      state.viewIndex = state.progressIndex;
      saveProgress();
      renderSidebar();
      renderCard(state.progressIndex);
    }
    return;
  }
  if (state.viewIndex < state.progressIndex) {
    renderCard(state.viewIndex + 1);
  } else {
    renderCard(state.progressIndex);
  }
}

/** 誤答だった問題すべてにチェックを付ける。付けた件数を返す */
function markIncorrectChecked(){
  let count = 0;
  state.dataset.forEach(q => {
    if (state.statusMap[q.no] && state.statusMap[q.no].status === 'incorrect') {
      state.checkMap[q.no] = true;
      count++;
    }
  });
  saveCheckMap();
  renderSidebar();
  updateCheckModeBtn();
  return count;
}

// ==== checkMode.js ====
// checkMode.js
// 問題ごとのチェック状態、「チェック問題のみ」モード、シャッフルの切り替え。

function toggleCheck(no){
  state.checkMap[no] = !state.checkMap[no];
  saveCheckMap();
  const val = state.checkMap[no];

  // サイドバースタブ更新
  const stub = document.getElementById(`stub-${no}`);
  if (stub) {
    stub.classList.toggle('is-checked', val);
    const ckBtn = stub.querySelector('.stub-ck-btn');
    if (ckBtn) {
      ckBtn.classList.toggle('checked', val);
      ckBtn.textContent = val ? '✓' : '　';
    }
  }

  // カードのチェックボックス更新（問題一覧側からトグルされた場合）
  const cardCk = document.querySelector('.q-checkbox');
  if (cardCk && cardCk.dataset.no === no) {
    cardCk.checked = val;
  }

  updateCheckModeBtn();
}

function updateCheckModeBtn(){
  const btn = document.getElementById('checkModeBtn');
  if (!btn) return;
  const n = state.dataset.filter(q => state.checkMap[q.no]).length;
  if (state.isCheckMode) {
    btn.classList.add('active');
    btn.textContent = `チェックモード中 (${n})`;
  } else {
    btn.classList.remove('active');
    btn.textContent = n > 0 ? `チェック問題のみ (${n})` : 'チェック問題のみ';
  }
}

function toggleCheckMode(){
  const checked = state.dataset.filter(q => state.checkMap[q.no]);
  if (!state.isCheckMode) {
    if (checked.length === 0) {
      alert('チェックが付いている問題がありません。');
      return;
    }
    if (!confirm(`チェック済み ${checked.length} 問のみで演習を開始しますか？`)) return;
    state.fullDataset = state.dataset;
    state.dataset = checked.map((q, i) => ({ ...q, no: String(i + 1) }));
    state.isCheckMode = true;
  } else {
    if (!confirm('チェックモードを解除すると回答はリセットされます。続けますか？')) return;
    state.dataset = state.fullDataset;
    state.isCheckMode = false;
  }
  updateCheckModeBtn();
  restart(true);
}

function toggleShuffle(){
  const msg = state.isShuffled
    ? 'シャッフルを解除すると回答はリセットされます。続けますか？'
    : 'シャッフルすると回答はリセットされます。続けますか？';
  if (!confirm(msg)) return;
  state.isShuffled = !state.isShuffled;
  const btn = document.getElementById('shuffleBtn');
  if (state.isShuffled) {
    // データセットをシャッフルして再スタート
    const shuffled = [...state.dataset];
    shuffle(shuffled);
    // no を振り直して順番を保持
    shuffled.forEach((q, i) => { q.no = String(i + 1); });
    state.dataset = shuffled;
    btn.classList.add('active');
    btn.textContent = 'シャッフル中';
  } else {
    // 元の順序に戻す（保存データから再ロード）
    try {
      const raw = loadDatasetRaw();
      if (raw) state.dataset = JSON.parse(raw);
    } catch(e){}
    state.dataset.forEach((q, i) => { q.no = String(i + 1); });
    btn.classList.remove('active');
    btn.textContent = 'シャッフル';
  }
  restart(true);
}

// ==== images.js ====
// images.js
// 問題ごとの画像割り当て（アップロード・プレビュー・選択肢の生成）。

function populateImgNoSelect(){
  imgNoSelect.innerHTML = state.dataset.map((q, i) => {
    const label = q.question.length > 20 ? q.question.slice(0, 12) + '…' : q.question;
    return `<option value="${escapeHtml(q.no)}">Q${i + 1}：${escapeHtml(label)}</option>`;
  }).join('');
  renderImagePreview();
}

function renderImagePreview(){
  const no = imgNoSelect.value;
  const url = state.imageMap[no];
  imagePreviewWrap.innerHTML = url
    ? `<img src="${url}" alt="">`
    : `<span class="none">この問題には画像が設定されていません</span>`;
}

function handleImageUpload(){
  const no = imgNoSelect.value;
  const file = imgFileInput.files[0];
  if (!no || !file) return;
  if (file.size > 1.5 * 1024 * 1024) {
    imgMsg.textContent = 'ファイルが大きすぎます（1.5MB以下を推奨）。';
    imgMsg.className = 'editor-msg err';
    imgFileInput.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const prevValue = state.imageMap[no];
    state.imageMap[no] = reader.result;
    const ok = saveImageMap();
    if (ok) {
      renderImagePreview();
      imgMsg.textContent = `No.${no} に画像を設定しました。`;
      imgMsg.className = 'editor-msg ok';
    } else {
      // 保存に失敗した場合はメモリ上の変更も取り消し、正しい状態を表示する
      if (prevValue === undefined) delete state.imageMap[no];
      else state.imageMap[no] = prevValue;
      renderImagePreview();
      imgMsg.textContent = '保存に失敗しました（容量超過の可能性）。画像サイズを小さくしてください。';
      imgMsg.className = 'editor-msg err';
    }
    imgFileInput.value = '';
  };
  reader.onerror = () => {
    imgMsg.textContent = '画像の読み込みに失敗しました。';
    imgMsg.className = 'editor-msg err';
  };
  reader.readAsDataURL(file);
}

// ==== sets.js ====
// sets.js
// 名前付き問題セットの保存・演習開始・チェックへの適用・削除。
// （元コードのグローバル onclick="loadSet(...)" 方式は、
//  addEventListener によるイベント委譲に置き換えている）

function renderSavedSetsList(){
  const container = document.getElementById('savedSetsList');
  if (!container) return;
  const sets = loadSavedSets();
  const names = Object.keys(sets);
  if (names.length === 0) {
    container.innerHTML = `<div style="font-size:12.5px;color:var(--muted);">保存済みセットはありません</div>`;
    return;
  }
  container.innerHTML = '';
  names.forEach(name => {
    const nos = sets[name];
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:12.5px;';
    row.innerHTML = `
      <span style="flex:1;color:var(--text);">${escapeHtml(name)} <span style="color:var(--muted);">(${nos.length}問)</span></span>
      <button class="btn btn-ghost" style="padding:4px 10px;font-size:12px;" data-action="load">演習開始</button>
      <button class="btn btn-ghost" style="padding:4px 10px;font-size:12px;" data-action="apply-checks">チェックに適用</button>
      <button class="btn btn-ghost" style="padding:4px 10px;font-size:12px;color:var(--incorrect);" data-action="delete">削除</button>
    `;
    row.querySelector('[data-action="load"]').addEventListener('click', () => loadSet(name));
    row.querySelector('[data-action="apply-checks"]').addEventListener('click', () => applySetAsChecks(name));
    row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteSetUI(name));
    container.appendChild(row);
  });
}

function loadSet(name){
  const sets = loadSavedSets();
  const nos = sets[name];
  if (!nos) return;
  // nos は元データの no 配列。fullDataset から該当問題を抽出
  const src = state.isCheckMode ? state.fullDataset : state.dataset;
  const filtered = src.filter(q => nos.includes(q.no));
  if (filtered.length === 0) { alert('該当する問題が見つかりません（問題データが変更された可能性があります）'); return; }
  if (!state.isCheckMode) state.fullDataset = state.dataset;
  state.dataset = filtered.map((q, i) => ({ ...q, no: String(i + 1) }));
  state.isCheckMode = true;
  updateCheckModeBtn();
  restart(true);
  closeEditor();
}

function applySetAsChecks(name){
  const sets = loadSavedSets();
  const nos = sets[name];
  if (!nos) return;
  const src = state.isCheckMode ? state.fullDataset : state.dataset;
  src.forEach(q => { state.checkMap[q.no] = nos.includes(q.no); });
  saveCheckMap();
  renderSidebar();
  updateCheckModeBtn();
  document.getElementById('setMsg').textContent = `「${name}」のチェックを適用しました。`;
  document.getElementById('setMsg').className = 'editor-msg ok';
}

function deleteSetUI(name){
  if (!confirm(`「${name}」を削除しますか？`)) return;
  deleteSetStorage(name);
  renderSavedSetsList();
}

// ==== editor.js ====
// editor.js
// 「設定」パネル（データ編集・インポート・セット保存・画像・表示設定）の開閉と配線。

function openEditor(){
  dataInput.value = '';
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (raw) {
      const ds = JSON.parse(raw);
      const header = 'チェック\t問題\t解説\t正解\t誤答1\t誤答2';
      const rows = ds.map(q => [state.checkMap[q.no] ? '1' : '0', q.question, q.explanation || '', q.answer, ...q.dummies].map(v => csvEscapeField(v, '\t')).join('\t'));
      dataInput.value = [header, ...rows].join('\n');
    } else {
      dataInput.value = SAMPLE_TSV;
    }
  } catch(e) {
    dataInput.value = SAMPLE_TSV;
  }
  editorMsg.textContent = '';
  editorMsg.className = 'editor-msg';
  imgMsg.textContent = '';
  imgMsg.className = 'editor-msg';
  document.getElementById('importMsg').textContent = '';

  // ファイルインポート共通処理
  function handleImportFile(file){
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      dataInput.value = e.target.result;
      document.getElementById('importMsg').textContent = `「${file.name}」を読み込みました`;
      document.getElementById('importMsg').className = 'editor-msg ok';
    };
    reader.onerror = () => {
      document.getElementById('importMsg').textContent = 'ファイルの読み込みに失敗しました';
      document.getElementById('importMsg').className = 'editor-msg err';
    };
    reader.readAsText(file, 'UTF-8');
  }

  // ファイル選択
  const importInput = document.getElementById('importFileInput');
  importInput.value = '';
  importInput.onchange = () => handleImportFile(importInput.files[0]);

  // ドラッグ＆ドロップ
  const dropZone = document.getElementById('dropZone');
  dropZone.ondragover = e => { e.preventDefault(); dropZone.classList.add('drag-over'); };
  dropZone.ondragleave = () => dropZone.classList.remove('drag-over');
  dropZone.ondrop = e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleImportFile(file);
  };

  // クリップボードから貼り付け
  document.getElementById('pasteClipboardBtn').onclick = async () => {
    const msgEl = document.getElementById('importMsg');
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        throw new Error('unsupported');
      }
      const text = await navigator.clipboard.readText();
      if (!text) {
        msgEl.textContent = 'クリップボードが空です';
        msgEl.className = 'editor-msg err';
        return;
      }
      dataInput.value = text;
      msgEl.textContent = 'クリップボードから貼り付けました';
      msgEl.className = 'editor-msg ok';
    } catch (err) {
      msgEl.textContent = 'クリップボードを読み取れませんでした（権限が必要です。テキストエリアに直接ペーストしてください）';
      msgEl.className = 'editor-msg err';
    }
  };
  populateImgNoSelect();
  renderSavedSetsList();

  // セット保存ボタンのワイヤリング（毎回付け直し）
  document.getElementById('saveSetBtn').onclick = () => {
    const name = document.getElementById('setNameInput').value.trim();
    if (!name) { document.getElementById('setMsg').textContent = 'セット名を入力してください'; document.getElementById('setMsg').className = 'editor-msg err'; return; }
    const checkedOnly = document.getElementById('setCheckedOnlyCk').checked;
    const targets = checkedOnly ? state.dataset.filter(q => state.checkMap[q.no]) : state.dataset;
    if (checkedOnly && targets.length === 0) { document.getElementById('setMsg').textContent = 'チェックが付いている問題がありません'; document.getElementById('setMsg').className = 'editor-msg err'; return; }
    const nos = targets.map(q => q.no);
    saveSetToStorage(name, nos);
    renderSavedSetsList();
    document.getElementById('setNameInput').value = '';
    document.getElementById('setMsg').textContent = `「${name}」を保存しました（${nos.length}問）`;
    document.getElementById('setMsg').className = 'editor-msg ok';
  };
  document.getElementById('exportSetBtn').onclick = () => {
    const checkedOnly = document.getElementById('setCheckedOnlyCk').checked;
    const targets = checkedOnly ? state.dataset.filter(q => state.checkMap[q.no]) : state.dataset;
    if (checkedOnly && targets.length === 0) { document.getElementById('setMsg').textContent = 'チェックが付いている問題がありません'; document.getElementById('setMsg').className = 'editor-msg err'; return; }
    const header = 'チェック\t問題\t解説\t正解\t誤答1\t誤答2';
    const rows = targets.map(q => [state.checkMap[q.no] ? '1' : '0', q.question, q.explanation || '', q.answer, ...q.dummies].map(v => csvEscapeField(v, '\t')).join('\t'));
    const tsv = [header, ...rows].join('\n');
    const blob = new Blob([tsv], { type: 'text/tab-separated-values' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = checkedOnly ? 'checked_questions.tsv' : 'all_questions.tsv';
    a.click();
    URL.revokeObjectURL(a.href);
  };
  editorOverlay.classList.remove('hidden');

  // フォント選択セレクタの初期化
  const fontSel = document.getElementById('fontSelect');
  fontSel.innerHTML = FONT_PRESETS.map(p =>
    `<option value="${p.id}" ${p.id === state.currentFontId ? 'selected' : ''}>${p.label}</option>`
  ).join('');
  const curPreset = FONT_PRESETS.find(p => p.id === state.currentFontId) || FONT_PRESETS[0];
  fontSel.style.fontFamily = curPreset.body;
  fontSel.onchange = () => {
    applyFont(fontSel.value);
    saveFontSetting(fontSel.value);
    const np = FONT_PRESETS.find(p => p.id === fontSel.value) || FONT_PRESETS[0];
    fontSel.style.fontFamily = np.body;
  };

  // ウェイト・テーマ・文字サイズなど表示設定UIの初期化
  syncDisplaySettingsUI();
}

function closeEditor(){
  editorOverlay.classList.add('hidden');
}

function applyEditorData(){
  try {
    if (answeredCount() > 0 && !confirm('現在の進捗（回答状況）は破棄されます。新しいデータを読み込みますか？')) {
      return;
    }
    const hasHeader  = document.getElementById('hasHeaderCk').checked;
    const hasExplain = document.getElementById('hasExplainCk').checked;
    const parsed = parseDataset(dataInput.value, hasHeader, hasExplain);
    state.dataset = parsed;
    saveDataset();
    restart(true);
    editorMsg.textContent = `${parsed.length}問を読み込みました。`;
    editorMsg.className = 'editor-msg ok';
    setTimeout(closeEditor, 600);
  } catch (e) {
    editorMsg.textContent = e.message;
    editorMsg.className = 'editor-msg err';
  }
}

// textarea内でTabキーを押したときフォーカス移動ではなくタブ文字を挿入する
function insertTabAtCursor(){
  const start = dataInput.selectionStart;
  const end   = dataInput.selectionEnd;
  const value = dataInput.value;
  dataInput.value = value.slice(0, start) + '\t' + value.slice(end);
  const pos = start + 1;
  dataInput.selectionStart = dataInput.selectionEnd = pos;
}

// ==== backup.js ====
// backup.js
// 問題データ・チェック・進捗・画像・表示設定をまとめてファイルに書き出し／復元する。

function handleExportBackup(){
  const json = exportAllData();
  const blob = new Blob([json], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 10);
  a.download = `nquiz_backup_${stamp}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function handleImportBackupFile(file){
  const msgEl = document.getElementById('backupMsg');
  if (!file) return;
  if (!confirm('現在のデータはすべてバックアップの内容で上書きされます。復元しますか？')) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      importAllData(reader.result);
      if (msgEl) {
        msgEl.textContent = '復元しました。ページを再読み込みします…';
        msgEl.className = 'editor-msg ok';
      }
      setTimeout(() => location.reload(), 500);
    } catch (e) {
      if (msgEl) {
        msgEl.textContent = e.message;
        msgEl.className = 'editor-msg err';
      }
    }
  };
  reader.onerror = () => {
    if (msgEl) {
      msgEl.textContent = 'ファイルの読み込みに失敗しました。';
      msgEl.className = 'editor-msg err';
    }
  };
  reader.readAsText(file, 'UTF-8');
}

// ==== quizController.js ====
// quizController.js
// アプリのエントリーポイントとなる制御関数（restart / boot）。

/** 進捗をリセットして最初の問題から再スタートする */
function restart(clearStorage){
  if (clearStorage) {
    try { localStorage.removeItem(STORAGE_KEY); } catch(e){}
  }
  initStatusMap();
  state.progressIndex = 0;
  state.viewIndex = 0;
  saveProgress();
  renderSidebar();
  renderCard(0);
}

/** アプリ起動時の初期化 */
function boot(){
  let raw = loadDatasetRaw();
  if (raw) {
    try {
      state.dataset = JSON.parse(raw);
      // 旧データに explanation フィールドがない場合は補完
      state.dataset.forEach(q => { if (q.explanation === undefined) q.explanation = ''; });
    } catch(e){ state.dataset = null; }
  }
  if (!state.dataset || state.dataset.length === 0) {
    state.dataset = parseDataset(SAMPLE_TSV, true, true);
    saveDataset();
  }
  loadImageMap();
  loadCheckMap();
  initDisplaySettings();

  const restored = loadProgress();
  if (!restored || Object.keys(state.statusMap).length !== state.dataset.length) {
    initStatusMap();
    state.progressIndex = 0;
  }
  state.viewIndex = Math.min(state.progressIndex, state.dataset.length - 1);
  renderSidebar();
  renderCard(state.viewIndex);
  updateCheckModeBtn();
}

// ==== main.js ====
// main.js
// トップバー・設定パネルの一度きりのボタン配線と、アプリの起動。

document.getElementById('editBtn').onclick = openEditor;
document.getElementById('sidebarReviewBtn').onclick = startIncorrectReview;
document.getElementById('shuffleBtn').onclick = toggleShuffle;
document.getElementById('checkModeBtn').onclick = toggleCheckMode;
document.getElementById('panelCloseBtn').onclick = closeEditor;
document.getElementById('editorOverlay').onclick = e => {
  if (e.target === document.getElementById('editorOverlay')) closeEditor();
};
document.getElementById('loadSampleBtn').onclick = () => { dataInput.value = SAMPLE_TSV; };
document.getElementById('applyBtn').onclick = applyEditorData;

// textarea内でTabキーを押したときフォーカス移動ではなくタブ文字を挿入する
dataInput.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    insertTabAtCursor();
  }
});
// スマホ等、物理Tabキーが無い環境向けのボタン
document.getElementById('tabInsertBtn').onclick = () => {
  dataInput.focus();
  insertTabAtCursor();
};
document.getElementById('resetBtn').onclick = () => {
  if (confirm('進捗をすべてリセットして最初の問題から始めますか？')) restart(true);
};

imgNoSelect.onchange = renderImagePreview;
clearImgBtn.onclick = () => {
  const no = imgNoSelect.value;
  if (!no) return;
  delete state.imageMap[no];
  saveImageMap();
  renderImagePreview();
  imgMsg.textContent = `No.${no} の画像を削除しました。`;
  imgMsg.className = 'editor-msg ok';
};
imgFileInput.onchange = handleImageUpload;

document.getElementById('resetDisplaySettingsBtn').onclick = () => {
  if (!confirm('テーマ・フォント・文字サイズなどの表示設定を初期値に戻しますか？（問題データやチェック状態は変更されません）')) return;
  resetDisplaySettings();
};

document.getElementById('exportBackupBtn').onclick = handleExportBackup;
document.getElementById('importBackupInput').onchange = (e) => {
  const file = e.target.files[0];
  if (file) handleImportBackupFile(file);
  e.target.value = '';
};

// サイドバー：問題の検索フィルタ
document.getElementById('stubSearchInput').addEventListener('input', (e) => {
  filterStubs(e.target.value);
});

// 設定パネル：タブ切り替え
document.querySelectorAll('.editor-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.editor-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    document.querySelectorAll('.editor-tab-content').forEach(panel => {
      panel.classList.toggle('hidden', panel.dataset.tabContent !== tab);
    });
  });
});

boot();

})();
