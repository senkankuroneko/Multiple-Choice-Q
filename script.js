const STORAGE_KEY = 'nquiz_progress_v1';
const DATA_KEY = 'nquiz_dataset_v1';
const IMG_KEY = 'nquiz_images_v1';
const CHECK_KEY = 'nquiz_checks_v1';
const SETS_KEY  = 'nquiz_sets_v1';
const RIPPLE_KEY = 'nquiz_ripple_v1';
const FONT_KEY   = 'nquiz_font_v1';

let rippleEnabled = false;

const SAMPLE_TSV =
`チェック\t問題\t解説\t正解\t誤答1\t誤答2\t誤答3
0\t「正答」を押してください。2回目のクリックで解答判定となります。\t解説がある場合は「ここ」に表示されます。正解の選択肢を再度押すと次の問題に進みます。\t正答\t誤答（選択肢はランダムに並ぶ）\t誤答（誤答数は自由に増やせる）
1\t左上のチェックボックスで、問題にマークできます。現在は、この問題にだけチェックが付いている状態です。問題一覧からも切り替え可能です。\t\t動作確認ができた！\t誤答（最終画面で誤答問題にまとめてチェックもできます）\t
0\tこの問題の答えは「○」です。\t正解を「○」「×」にした問題は正誤問題として認識され、「○」「×」が選択肢となります。\t○`;

let dataset = [];
let order = [];          // index order to traverse (1..n by No)
let progressIndex = 0;   // furthest unanswered position
let viewIndex = 0;
let answeredOnce = false;
let pendingSelection = null;
let statusMap = {};      // keyed by quiz.no -> {status, shuffled, selected}
let imageMap = {};       // keyed by quiz.no -> base64 data URL
let reviewQueue = [];    // indices of incorrect questions during review mode
let isReviewMode = false;
let savedProgressIndex = 0;
let isShuffled = false;
let originalOrder = [];
let checkMap = {};       // keyed by quiz.no -> bool
let isCheckMode = false; // チェック済み問題のみ演習モード
let fullDataset = [];    // チェックモード前のフルデータセット退避用

const cardEl = document.getElementById('cardEl');
const stubList = document.getElementById('stubList');
const sidebarCount = document.getElementById('sidebarCount');
const editorOverlay = document.getElementById('editorOverlay');
const dataInput = document.getElementById('dataInput');
const editorMsg = document.getElementById('editorMsg');
const imgNoSelect = document.getElementById('imgNoSelect');
const imgFileInput = document.getElementById('imgFileInput');
const imagePreviewWrap = document.getElementById('imagePreviewWrap');
const imgMsg = document.getElementById('imgMsg');
const clearImgBtn = document.getElementById('clearImgBtn');

document.getElementById('editBtn').onclick = openEditor;
document.getElementById('sidebarReviewBtn').onclick = startIncorrectReview;
document.getElementById('shuffleBtn').onclick = toggleShuffle;
document.getElementById('checkModeBtn').onclick = toggleCheckMode;
document.getElementById('panelCloseBtn').onclick = closeEditor;
document.getElementById('editorOverlay').onclick = e => {
  if (e.target === document.getElementById('editorOverlay')) closeEditor();
};
document.getElementById('loadSampleBtn').onclick = () => dataInput.value = SAMPLE_TSV;
document.getElementById('applyBtn').onclick = applyEditorData;
document.getElementById('resetBtn').onclick = () => {
  if (confirm('進捗をすべてリセットして最初の問題から始めますか？')) restart(true);
};
imgNoSelect.onchange = renderImagePreview;
clearImgBtn.onclick = () => {
  const no = imgNoSelect.value;
  if (!no) return;
  delete imageMap[no];
  saveImageMap();
  renderImagePreview();
  imgMsg.textContent = `No.${no} の画像を削除しました。`;
  imgMsg.className = 'editor-msg ok';
};
imgFileInput.onchange = handleImageUpload;

function parseDataset(raw, hasHeader, hasExplain){
  const delim = raw.includes('\t') ? '\t' : ',';
  const lines = raw.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < (hasHeader ? 2 : 1)) throw new Error('データが不足しています（最低1行が必要）。');

  const dataRows = hasHeader ? lines.slice(1) : lines;
  const list = [];
  const newCheckMap = {};

  dataRows.forEach(line => {
    const cols = line.split(delim).map(c => c.trim());

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
  const hasCheckCol = dataRows.some(line => {
    const c = line.split(delim)[0].trim();
    return c === '0' || c === '1';
  });
  if (hasCheckCol) {
    checkMap = newCheckMap;
    saveCheckMap();
  }

  return list;
}

function shuffle(arr){
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function saveDataset(){
  try { localStorage.setItem(DATA_KEY, JSON.stringify(dataset)); } catch(e){}
}
function saveImageMap(){
  try { localStorage.setItem(IMG_KEY, JSON.stringify(imageMap)); }
  catch(e){
    imgMsg.textContent = '保存に失敗しました（容量超過の可能性）。画像サイズを小さくしてください。';
    imgMsg.className = 'editor-msg err';
  }
}
function loadImageMap(){
  try {
    const raw = localStorage.getItem(IMG_KEY);
    imageMap = raw ? JSON.parse(raw) : {};
  } catch(e){ imageMap = {}; }
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
    imageMap[no] = reader.result;
    saveImageMap();
    renderImagePreview();
    imgMsg.textContent = `No.${no} に画像を設定しました。`;
    imgMsg.className = 'editor-msg ok';
    imgFileInput.value = '';
  };
  reader.onerror = () => {
    imgMsg.textContent = '画像の読み込みに失敗しました。';
    imgMsg.className = 'editor-msg err';
  };
  reader.readAsDataURL(file);
}
function populateImgNoSelect(){
  imgNoSelect.innerHTML = dataset.map((q, i) => {
    const label = q.question.length > 20 ? q.question.slice(0, 20) + '…' : q.question;
    return `<option value="${escapeHtml(q.no)}">Q${i + 1}: ${escapeHtml(label)}</option>`;
  }).join('');
  renderImagePreview();
}
function renderImagePreview(){
  const no = imgNoSelect.value;
  const url = imageMap[no];
  imagePreviewWrap.innerHTML = url
    ? `<img src="${url}" alt="">`
    : `<span class="none">この問題には画像が設定されていません</span>`;
}
function saveProgress(){
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      statusMap, progressIndex
    }));
  } catch(e){}
}
function loadProgress(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!parsed.statusMap) return false;
    statusMap = parsed.statusMap;
    progressIndex = parsed.progressIndex || 0;
    return true;
  } catch(e){ return false; }
}

// ○×問題の判定：正解・誤答の全選択肢が○か×のバリエーションのみで構成されているか
const TF_MARU = ['○', '〇', 'まる', '正', '◯'];
const TF_BATSU = ['×', '✕', 'ばつ', '誤', 'バツ'];
const TF_ALL = [...TF_MARU, ...TF_BATSU];

// ○×問題の判定：正解が○か×のバリエーションであれば○✕問題とみなす
function isTrueFalse(q){
  return TF_ALL.includes(q.answer.trim());
}

// ○×問題のとき、固定順（○→×）で返す（誤答列の有無を問わない）
function normalizeTrueFalseOpts(q){
  return ['○', '×'];
}

// ○×問題のとき、元の正解値が○系か×系かを判定して正規化した値を返す
function normalizeTFAnswer(answer){
  const v = answer.trim();
  if (TF_MARU.includes(v)) return '○';
  if (TF_BATSU.includes(v)) return '×';
  return answer;
}

function initStatusMap(){
  statusMap = {};
  dataset.forEach(q => {
    let opts;
    if (isTrueFalse(q)) {
      opts = normalizeTrueFalseOpts(q); // 固定順・正規化済み
    } else {
      opts = [q.answer, ...q.dummies];
      shuffle(opts);
    }
    statusMap[q.no] = { status: 'unanswered', shuffled: opts, selected: null };
  });
}

function restart(clearStorage){
  if (clearStorage) {
    try { localStorage.removeItem(STORAGE_KEY); } catch(e){}
  }
  initStatusMap();
  progressIndex = 0;
  viewIndex = 0;
  saveProgress();
  renderSidebar();
  renderCard(0);
}

function saveCheckMap(){
  try { localStorage.setItem(CHECK_KEY, JSON.stringify(checkMap)); } catch(e){}
}
function loadCheckMap(){
  try {
    const raw = localStorage.getItem(CHECK_KEY);
    checkMap = raw ? JSON.parse(raw) : {};
  } catch(e){ checkMap = {}; }
}
function toggleCheck(no){
  checkMap[no] = !checkMap[no];
  saveCheckMap();
  const val = checkMap[no];

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
  const n = dataset.filter(q => checkMap[q.no]).length;
  if (isCheckMode) {
    btn.classList.add('active');
    btn.textContent = `☑ チェックモード中 (${n})`;
  } else {
    btn.classList.remove('active');
    btn.textContent = n > 0 ? `☑ チェック問題のみ (${n})` : '☑ チェック問題のみ';
  }
}
function toggleCheckMode(){
  const checked = dataset.filter(q => checkMap[q.no]);
  if (!isCheckMode) {
    if (checked.length === 0) {
      alert('チェックが付いている問題がありません。');
      return;
    }
    if (!confirm(`チェック済み ${checked.length} 問のみで演習を開始しますか？`)) return;
    fullDataset = dataset;
    dataset = checked.map((q, i) => ({ ...q, no: String(i + 1) }));
    isCheckMode = true;
  } else {
    dataset = fullDataset;
    isCheckMode = false;
  }
  updateCheckModeBtn();
  restart(true);
}
function markIncorrectChecked(){
  // 誤答問題すべてにチェックを付ける
  let count = 0;
  dataset.forEach(q => {
    if (statusMap[q.no] && statusMap[q.no].status === 'incorrect') {
      checkMap[q.no] = true;
      count++;
    }
  });
  saveCheckMap();
  renderSidebar();
  updateCheckModeBtn();
  return count;
}

// セット保存・ロード・エクスポート
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
function renderSavedSetsList(){
  const container = document.getElementById('savedSetsList');
  if (!container) return;
  const sets = loadSavedSets();
  const names = Object.keys(sets);
  if (names.length === 0) {
    container.innerHTML = `<div style="font-size:12.5px;color:var(--muted);">保存済みセットはありません</div>`;
    return;
  }
  container.innerHTML = names.map(name => {
    const nos = sets[name];
    return `<div style="display:flex;align-items:center;gap:8px;font-size:12.5px;">
      <span style="flex:1;color:var(--text);">${escapeHtml(name)} <span style="color:var(--muted);">(${nos.length}問)</span></span>
      <button class="btn btn-ghost" style="padding:4px 10px;font-size:12px;" onclick="loadSet('${escapeHtml(name)}')">演習開始</button>
      <button class="btn btn-ghost" style="padding:4px 10px;font-size:12px;" onclick="applySetAsChecks('${escapeHtml(name)}')">チェックに適用</button>
      <button class="btn btn-ghost" style="padding:4px 10px;font-size:12px;color:var(--incorrect);" onclick="deleteSetUI('${escapeHtml(name)}')">削除</button>
    </div>`;
  }).join('');
}
function loadSet(name){
  const sets = loadSavedSets();
  const nos = sets[name];
  if (!nos) return;
  // nos は元データの no 配列。fullDataset から該当問題を抽出
  const src = isCheckMode ? fullDataset : dataset;
  const filtered = src.filter(q => nos.includes(q.no));
  if (filtered.length === 0) { alert('該当する問題が見つかりません（問題データが変更された可能性があります）'); return; }
  if (!isCheckMode) fullDataset = dataset;
  dataset = filtered.map((q, i) => ({ ...q, no: String(i + 1) }));
  isCheckMode = true;
  updateCheckModeBtn();
  restart(true);
  closeEditor();
}
function applySetAsChecks(name){
  const sets = loadSavedSets();
  const nos = sets[name];
  if (!nos) return;
  const src = isCheckMode ? fullDataset : dataset;
  src.forEach(q => { checkMap[q.no] = nos.includes(q.no); });
  saveCheckMap();
  renderSidebar();
  updateCheckModeBtn();
  document.getElementById('setMsg').textContent = `「${name}」のチェックを適用しました。`;
  document.getElementById('setMsg').className = 'editor-msg ok';
}
function deleteSetUI(name){
  if (!confirm(`「${name}」を削除しますか？`)) return;
  deleteSet(name);
  renderSavedSetsList();
}

// フォント定義
// { label, body, display, mono, googleUrl }
const FONT_PRESETS = [
  {
    id:'default',
    label:'Inter / Outfit（デフォルト）',
    body:"'Inter',sans-serif",
    display:"'Outfit',sans-serif",
    mono:"'JetBrains Mono',monospace",
    googleUrl:'family=Outfit:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600'
  },
  {
    id:'ibmplex',
    label:'IBM Plex Sans JP',
    body:"'IBM Plex Sans JP','IBM Plex Sans',sans-serif",
    display:"'IBM Plex Sans JP','IBM Plex Sans',sans-serif",
    mono:"'IBM Plex Mono',monospace",
    googleUrl:'family=IBM+Plex+Sans+JP:wght@300;400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600'
  },
  {
    id:'noto',
    label:'Noto Sans JP',
    body:"'Noto Sans JP',sans-serif",
    display:"'Noto Sans JP',sans-serif",
    mono:"'JetBrains Mono',monospace",
    googleUrl:'family=Noto+Sans+JP:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600'
  },
  {
    id:'notoserifJP',
    label:'Noto Serif JP（明朝）',
    body:"'Noto Serif JP',serif",
    display:"'Noto Serif JP',serif",
    mono:"'JetBrains Mono',monospace",
    googleUrl:'family=Noto+Serif+JP:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600'
  },
  {
    id:'kosugi',
    label:'Kosugi Maru（丸ゴシック）',
    body:"'Kosugi Maru',sans-serif",
    display:"'Kosugi Maru',sans-serif",
    mono:"'JetBrains Mono',monospace",
    googleUrl:'family=Kosugi+Maru&family=JetBrains+Mono:wght@400;500;600'
  },
  {
    id:'yusei',
    label:'Yusei Magic（ゆせいマジック）',
    body:"'Yusei Magic',sans-serif",
    display:"'Yusei Magic',sans-serif",
    mono:"'JetBrains Mono',monospace",
    googleUrl:'family=Yusei+Magic&family=JetBrains+Mono:wght@400;500;600'
  },
];

let currentFontId = 'default';

function saveFontSetting(id){
  try { localStorage.setItem(FONT_KEY, id); } catch(e){}
}
function loadFontSetting(){
  try { currentFontId = localStorage.getItem(FONT_KEY) || 'default'; } catch(e){}
}
function saveFontWeights(fwBody, fwDisplay){
  try { localStorage.setItem(FONT_KEY + '_w', JSON.stringify({fwBody, fwDisplay})); } catch(e){}
}
function loadFontWeights(){
  try {
    const raw = localStorage.getItem(FONT_KEY + '_w');
    if (!raw) return { fwBody:'400', fwDisplay:'600' };
    return JSON.parse(raw);
  } catch(e){ return { fwBody:'400', fwDisplay:'600' }; }
}
function applyFontWeights(fwBody, fwDisplay){
  const root = document.documentElement;
  root.style.setProperty('--fw-body',    fwBody);
  root.style.setProperty('--fw-display', fwDisplay);
}
function applyFont(id){
  const preset = FONT_PRESETS.find(p => p.id === id) || FONT_PRESETS[0];
  currentFontId = preset.id;

  let linkEl = document.getElementById('google-fonts-link');
  if (!linkEl) {
    linkEl = document.createElement('link');
    linkEl.id = 'google-fonts-link';
    linkEl.rel = 'stylesheet';
    document.head.appendChild(linkEl);
  }
  linkEl.href = `https://fonts.googleapis.com/css2?${preset.googleUrl}&display=swap`;

  const root = document.documentElement;
  root.style.setProperty('--font-body',    preset.body);
  root.style.setProperty('--font-display', preset.display);
  root.style.setProperty('--font-mono',    preset.mono);
}

function saveRippleSetting(){
  try { localStorage.setItem(RIPPLE_KEY, rippleEnabled ? '1' : '0'); } catch(e){}
}
function loadRippleSetting(){
  try { rippleEnabled = localStorage.getItem(RIPPLE_KEY) === '1'; } catch(e){}
}
function createRipple(e){
  if (!rippleEnabled) return;
  const target = e.currentTarget;
  // ripple-host クラスが必要
  if (!target.classList.contains('ripple-host')) return;
  const rect = target.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = (e.clientX ?? (e.touches?.[0]?.clientX ?? rect.left + rect.width/2)) - rect.left - size/2;
  const y = (e.clientY ?? (e.touches?.[0]?.clientY ?? rect.top + rect.height/2)) - rect.top - size/2;
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
  target.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}
function attachRippleToCard(){
  // card内の opt と btn-nav に波紋を付ける
  cardEl.querySelectorAll('.opt, .btn-nav').forEach(el => {
    el.classList.add('ripple-host');
    el.addEventListener('pointerdown', createRipple);
  });
}

function toggleShuffle(){
  const msg = isShuffled
    ? 'シャッフルを解除すると回答はリセットされます。続けますか？'
    : 'シャッフルすると回答はリセットされます。続けますか？';
  if (!confirm(msg)) return;
  isShuffled = !isShuffled;
  const btn = document.getElementById('shuffleBtn');
  if (isShuffled) {
    // データセットをシャッフルして再スタート
    const shuffled = [...dataset];
    shuffle(shuffled);
    // no を振り直して順番を保持
    shuffled.forEach((q, i) => { q.no = String(i + 1); });
    dataset = shuffled;
    btn.classList.add('active');
    btn.textContent = 'シャッフル中';
  } else {
    // 元の順序に戻す（保存データから再ロード）
    try {
      const raw = localStorage.getItem(DATA_KEY);
      if (raw) dataset = JSON.parse(raw);
    } catch(e){}
    dataset.forEach((q, i) => { q.no = String(i + 1); });
    btn.classList.remove('active');
    btn.textContent = 'シャッフル';
  }
  restart(true);
}

function boot(){
  let raw = null;
  try { raw = localStorage.getItem(DATA_KEY); } catch(e){}
  if (raw) {
    try {
      dataset = JSON.parse(raw);
      // 旧データに explanation フィールドがない場合は補完
      dataset.forEach(q => { if (q.explanation === undefined) q.explanation = ''; });
    } catch(e){ dataset = null; }
  }
  if (!dataset || dataset.length === 0) {
    dataset = parseDataset(SAMPLE_TSV, true, true);
    saveDataset();
  }
  loadImageMap();
  loadCheckMap();
  loadRippleSetting();
  loadFontSetting();
  applyFont(currentFontId);
  const { fwBody, fwDisplay } = loadFontWeights();
  applyFontWeights(fwBody, fwDisplay);

  const restored = loadProgress();
  if (!restored || Object.keys(statusMap).length !== dataset.length) {
    initStatusMap();
    progressIndex = 0;
  }
  viewIndex = Math.min(progressIndex, dataset.length - 1);
  renderSidebar();
  renderCard(viewIndex);
  updateCheckModeBtn();
}

function openEditor(){
  dataInput.value = '';
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (raw) {
      const ds = JSON.parse(raw);
      const header = 'チェック\t問題\t解説\t正解\t誤答1\t誤答2';
      const rows = ds.map(q => [checkMap[q.no] ? '1' : '0', q.question, q.explanation||'', q.answer, ...q.dummies].join('\t'));
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
  populateImgNoSelect();
  renderSavedSetsList();
  // セット保存ボタンのワイヤリング（毎回付け直し）
  document.getElementById('saveSetBtn').onclick = () => {
    const name = document.getElementById('setNameInput').value.trim();
    if (!name) { document.getElementById('setMsg').textContent='セット名を入力してください'; document.getElementById('setMsg').className='editor-msg err'; return; }
    const checkedOnly = document.getElementById('setCheckedOnlyCk').checked;
    const targets = checkedOnly ? dataset.filter(q => checkMap[q.no]) : dataset;
    if (checkedOnly && targets.length === 0) { document.getElementById('setMsg').textContent='チェックが付いている問題がありません'; document.getElementById('setMsg').className='editor-msg err'; return; }
    const nos = targets.map(q => q.no);
    saveSetToStorage(name, nos);
    renderSavedSetsList();
    document.getElementById('setNameInput').value = '';
    document.getElementById('setMsg').textContent = `「${name}」を保存しました（${nos.length}問）`;
    document.getElementById('setMsg').className = 'editor-msg ok';
  };
  document.getElementById('exportSetBtn').onclick = () => {
    const checkedOnly = document.getElementById('setCheckedOnlyCk').checked;
    const targets = checkedOnly ? dataset.filter(q => checkMap[q.no]) : dataset;
    if (checkedOnly && targets.length === 0) { document.getElementById('setMsg').textContent='チェックが付いている問題がありません'; document.getElementById('setMsg').className='editor-msg err'; return; }
    const header = 'チェック\t問題\t解説\t正解\t誤答1\t誤答2';
    const rows = targets.map(q => [checkMap[q.no] ? '1' : '0', q.question, q.explanation||'', q.answer, ...q.dummies].join('\t'));
    const tsv = [header, ...rows].join('\n');
    const blob = new Blob([tsv], { type: 'text/tab-separated-values' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = checkedOnly ? 'checked_questions.tsv' : 'all_questions.tsv';
    a.click();
    URL.revokeObjectURL(a.href);
  };
  editorOverlay.classList.remove('hidden');
  // 波紋設定チェックボックスの初期化
  const rippleCk = document.getElementById('rippleEnabledCk');
  rippleCk.checked = rippleEnabled;
  rippleCk.onchange = () => {
    rippleEnabled = rippleCk.checked;
    saveRippleSetting();
  };

  // フォント選択セレクタの初期化
  const fontSel = document.getElementById('fontSelect');
  fontSel.innerHTML = FONT_PRESETS.map(p =>
    `<option value="${p.id}" ${p.id === currentFontId ? 'selected' : ''}>${p.label}</option>`
  ).join('');
  const curPreset = FONT_PRESETS.find(p => p.id === currentFontId) || FONT_PRESETS[0];
  fontSel.style.fontFamily = curPreset.body;
  fontSel.onchange = () => {
    applyFont(fontSel.value);
    saveFontSetting(fontSel.value);
    const np = FONT_PRESETS.find(p => p.id === fontSel.value) || FONT_PRESETS[0];
    fontSel.style.fontFamily = np.body;
  };

  // ウェイトセレクタ初期化
  const weights = loadFontWeights();
  const fwBodySel    = document.getElementById('fwBodySelect');
  const fwDisplaySel = document.getElementById('fwDisplaySelect');
  fwBodySel.value    = weights.fwBody;
  fwDisplaySel.value = weights.fwDisplay;
  fwBodySel.onchange = () => {
    applyFontWeights(fwBodySel.value, fwDisplaySel.value);
    saveFontWeights(fwBodySel.value, fwDisplaySel.value);
  };
  fwDisplaySel.onchange = () => {
    applyFontWeights(fwBodySel.value, fwDisplaySel.value);
    saveFontWeights(fwBodySel.value, fwDisplaySel.value);
  };
}
function closeEditor(){
  editorOverlay.classList.add('hidden');
}
function applyEditorData(){
  try {
    const hasHeader  = document.getElementById('hasHeaderCk').checked;
    const hasExplain = document.getElementById('hasExplainCk').checked;
    const parsed = parseDataset(dataInput.value, hasHeader, hasExplain);
    dataset = parsed;
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

function answeredCount(){
  return dataset.filter(q => statusMap[q.no].status !== 'unanswered').length;
}

function renderSidebar(){
  stubList.innerHTML = '';
  const answered = answeredCount();
  const incorrectCount = dataset.filter(q => statusMap[q.no].status === 'incorrect').length;
  sidebarCount.textContent = `${answered}/${dataset.length}`;
  const reviewBtn = document.getElementById('sidebarReviewBtn');
  if (incorrectCount > 0) {
    reviewBtn.textContent = `誤答 ${incorrectCount}問を復習`;
    reviewBtn.classList.remove('hidden');
  } else {
    reviewBtn.classList.add('hidden');
  }
  dataset.forEach((q, idx) => {
    const rec = statusMap[q.no];
    const div = document.createElement('div');
    div.className = 'stub';
    div.id = `stub-${q.no}`;
    if (rec.status === 'correct') div.classList.add('is-correct');
    if (rec.status === 'incorrect') div.classList.add('is-incorrect');

    const locked = rec.status === 'unanswered'
      && (isReviewMode ? !reviewQueue.includes(idx) : idx !== progressIndex);
    if (locked) div.classList.add('locked');

    const snippet = q.question.length > 12 ? q.question.slice(0, 12) + '…' : q.question;
    const checked = !!checkMap[q.no];
    div.innerHTML = `
      <button class="stub-ck-btn${checked ? ' checked' : ''}" data-no="${escapeHtml(q.no)}" title="チェック切り替え">${checked ? '✓' : '　'}</button>
      <span class="num">${escapeHtml(snippet)}</span>
      <span class="dot"></span>`;
    if (checked) div.classList.add('is-checked');

    // チェックボタン：クリックでトグルのみ（ジャンプしない）
    div.querySelector('.stub-ck-btn').addEventListener('click', e => {
      e.stopPropagation();
      toggleCheck(q.no);
      // ボタン自身の見た目を即更新
      const btn = e.currentTarget;
      const nowChecked = !!checkMap[q.no];
      btn.textContent = nowChecked ? '✓' : '　';
      btn.classList.toggle('checked', nowChecked);
      div.classList.toggle('is-checked', nowChecked);
    });

    div.onclick = () => {
      if (rec.status !== 'unanswered' || idx === progressIndex) {
        viewIndex = idx;
        renderCard(idx);
      }
    };
    stubList.appendChild(div);
  });
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function renderCard(idx){
  // 前の問題のキーハンドラをクリア
  if (cardEl._keyHandler) {
    document.removeEventListener('keydown', cardEl._keyHandler);
    cardEl._keyHandler = null;
  }
  if (dataset.length === 0) {
    cardEl.innerHTML = `<div class="empty-state"><div class="display">問題がありません</div><div>右上の「問題を編集」からデータを追加してください。</div></div>`;
    return;
  }
  if (idx >= dataset.length) {
    const incorrectItems = dataset.filter(q => statusMap[q.no].status === 'incorrect');
    const correctCount  = dataset.filter(q => statusMap[q.no].status === 'correct').length;
    const incorrectCount = incorrectItems.length;
    const pct = Math.round((correctCount / dataset.length) * 100);

    const reviewBtnHtml = incorrectCount > 0 ? `
      <button class="btn-review-incorrect" id="reviewIncorrectBtn">
        誤答 ${incorrectCount} 問を復習する
      </button>
      <button class="btn-review-incorrect" id="checkIncorrectBtn" style="background:var(--accent-dim);border-color:var(--accent);color:#c8d8ff;">
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
          <span class="es-total">${dataset.length} 問</span>
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
    const allStubs = document.querySelectorAll('.stub.current');
    allStubs.forEach(el => el.classList.remove('current'));
    return;
  }

  viewIndex = idx;
  const q = dataset[idx];
  const rec = statusMap[q.no];
  const pct = Math.round((answeredCount() / dataset.length) * 100);

  document.querySelectorAll('.stub').forEach(el => el.classList.remove('current'));
  const stubEl = document.getElementById(`stub-${q.no}`);
  if (stubEl) {
    stubEl.classList.add('current');
    stubEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  const imageUrl = imageMap[q.no];
  const imageHtml = imageUrl
    ? `<div class="image-wrap"><img src="${imageUrl}" alt=""></div>`
    : `<div class="image-wrap hidden"></div>`;

  const isReview = rec.status !== 'unanswered';
  pendingSelection = null;
  answeredOnce = isReview;

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
    ? `<div class="explanation-box${isReview ? '' : ' hidden'}" id="explanationBox">${escapeHtml(q.explanation)}</div>`
    : '';

  // ◀ 前へ：viewIndex > 0 かつ 1つ前が回答済みか現在地まで
  const canPrev = viewIndex > 0;
  // ▶ 次へ：回答済みで次がある、または未回答で回答後（progressIndex が進んでいる）
  const canNext = isReviewMode
    ? reviewQueue.indexOf(viewIndex) < reviewQueue.length - 1
    : viewIndex < progressIndex;

  cardEl.innerHTML = `
    <div class="progress-row">
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div class="progress-label mono">${answeredCount()}/${dataset.length}</div>
    </div>
    <div class="quiz-body">
      ${imageHtml}
      <div class="qno mono">
        <label class="check-label">
          <input type="checkbox" class="q-checkbox" data-no="${escapeHtml(q.no)}" ${checkMap[q.no] ? 'checked' : ''}>
          <span class="check-mark"></span>
        </label>
        Q${idx + 1} <span class="qno-total">/ ${dataset.length}</span>
      </div>
      <p class="question-text">${escapeHtml(q.question)}</p>
    </div>
    <div class="explanation-area">
      ${explanationHtml}
    </div>
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

  attachRippleToCard();
}

function handleOptionClick(btn, q, rec, displayAnswer){
  if (answeredOnce) return;
  const value = btn.dataset.opt;

  if (pendingSelection === btn) {
    confirmAnswer(btn, value, q, rec, displayAnswer);
    return;
  }
  cardEl.querySelectorAll('.opt').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  pendingSelection = btn;
}

function confirmAnswer(btn, value, q, rec, displayAnswer){
  answeredOnce = true;
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

  if (viewIndex === progressIndex) {
    progressIndex = Math.min(progressIndex + 1, dataset.length);
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

function startIncorrectReview(){
  reviewQueue = dataset
    .map((q, i) => ({ q, i }))
    .filter(({ q }) => statusMap[q.no].status === 'incorrect')
    .map(({ q, i }) => i);

  reviewQueue.forEach(i => {
    const q = dataset[i];
    const rec = statusMap[q.no];
    let opts;
    if (isTrueFalse(q)) {
      opts = normalizeTrueFalseOpts(q);
    } else {
      opts = [q.answer, ...q.dummies];
      shuffle(opts);
    }
    rec.status = 'unanswered';
    rec.shuffled = opts;
    rec.selected = null;
  });

  isReviewMode = true;
  savedProgressIndex = progressIndex;   // 現在地を退避
  progressIndex = reviewQueue[0];
  viewIndex = reviewQueue[0];
  saveProgress();
  renderSidebar();
  renderCard(reviewQueue[0]);
}

function handlePrev(){
  if (isReviewMode) {
    const pos = reviewQueue.indexOf(viewIndex);
    if (pos > 0) renderCard(reviewQueue[pos - 1]);
    return;
  }
  if (viewIndex > 0) renderCard(viewIndex - 1);
}

function handleNext(){
  if (isReviewMode) {
    const pos = reviewQueue.indexOf(viewIndex);
    if (pos !== -1 && pos + 1 < reviewQueue.length) {
      const next = reviewQueue[pos + 1];
      viewIndex = next;
      progressIndex = next;
      renderCard(next);
    } else {
      // 復習キュー終了 → progressIndex を元に戻して通常フローへ
      isReviewMode = false;
      reviewQueue = [];
      progressIndex = savedProgressIndex;
      viewIndex = progressIndex;
      saveProgress();
      renderSidebar();
      renderCard(progressIndex);
    }
    return;
  }
  if (viewIndex < progressIndex) {
    renderCard(viewIndex + 1);
  } else {
    renderCard(progressIndex);
  }
}

boot();