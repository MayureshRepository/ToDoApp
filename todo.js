// ====== State & Persistence ======
const STORAGE_KEY = 'todos-v2';
const THEME_KEY = 'todo-theme';
let tasks = load();
let filter = 'all'; // all | active | completed

function load(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] }catch{ return [] } }
function persist(){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)) }catch{} }

// ====== Elements ======
const $ = id => document.getElementById(id);
const listEl = $('list');
const template = $('itemTemplate');
const composer = $('composer');
const newTask = $('newTask');
const leftCount = $('leftCount');
const statTotal = $('statTotal');
const statDone = $('statDone');
const meta = $('meta');
const toast = $('toast');
const segmented = document.querySelector('.segmented');
const segIndicator = document.querySelector('.seg-indicator');
const chips = [...document.querySelectorAll('.chip')];
const progressBar = $('progressBar');
const ringFill = $('ringFill');
const pctEl = $('pct');
const RING_LEN = 2 * Math.PI * 52;

// ====== Utilities ======
let toastTimer;
function toastMsg(msg){
  toast.textContent = msg; toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> toast.classList.remove('show'), 1600);
}
function fmtDate(ts){
  const d = new Date(ts), now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'});
  return sameDay ? `Today, ${time}` : d.toLocaleDateString([], {month:'short', day:'numeric'}) + `, ${time}`;
}
function paintHeader(){
  const now = new Date(), h = now.getHours();
  $('greeting').textContent = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  $('today').textContent = now.toLocaleDateString([], {weekday:'long', month:'long', day:'numeric'});
}
function updateProgress(done, total){
  const pct = total ? Math.round((done/total)*100) : 0;
  ringFill.style.strokeDashoffset = String(RING_LEN * (1 - pct/100));
  pctEl.textContent = pct + '%';
  progressBar.setAttribute('aria-valuenow', String(pct));
  progressBar.setAttribute('aria-label', pct + '% complete');

  const left = total - done;
  $('subtitle').textContent =
    !total ? "Nothing planned yet — add your first task." :
    !left  ? "All done. Enjoy the rest of your day ✨" :
    `You have ${left} task${left === 1 ? '' : 's'} to go.`;
}
function moveIndicator(){
  const active = chips.find(c => c.dataset.filter === filter);
  if(!active) return;
  segIndicator.style.width = active.offsetWidth + 'px';
  segIndicator.style.transform = `translateX(${active.offsetLeft}px)`;
}
function animateOut(id, then){
  const li = listEl.querySelector(`li.item[data-id="${id}"]`);
  if(!li || matchMedia('(prefers-reduced-motion: reduce)').matches){ then(); return; }
  li.classList.add('leaving');
  li.addEventListener('animationend', then, { once:true });
}

// ====== CRUD ======
function addTask(text){
  text = text.trim(); if(!text) return false;
  tasks.unshift({ id: Date.now(), text, done:false, created: Date.now() });
  persist(); render(); toastMsg('Task added');
  return true;
}
function toggleTask(id){ const t = tasks.find(t=>t.id===id); if(!t) return; t.done = !t.done; persist(); render(); if(t.done) toastMsg('Nice — task completed'); }
function updateTask(id, text){
  const t = tasks.find(t=>t.id===id); if(!t) return;
  const next = text.trim();
  if(next && next !== t.text){ t.text = next; persist(); toastMsg('Task updated'); }
  render();
}
function removeTask(id){ animateOut(id, ()=>{ tasks = tasks.filter(t=>t.id!==id); persist(); render(); toastMsg('Task removed'); }); }
function clearCompleted(){
  const n = tasks.filter(t=>t.done).length;
  if(!n){ toastMsg('No completed tasks'); return; }
  tasks = tasks.filter(t=>!t.done); persist(); render(); toastMsg(`Cleared ${n} task${n===1?'':'s'}`);
}
function toggleAll(){ if(!tasks.length) return; const allDone = tasks.every(t=>t.done); tasks.forEach(t=> t.done = !allDone); persist(); render(); }

// ====== Rendering ======
const EMPTY = {
  all:       ['A clean slate', 'Add a task above to get started.'],
  active:    ['Nothing left to do', 'Everything is checked off. 🎉'],
  completed: ['No completed tasks yet', 'Finish something and it will show up here.'],
};
const EMPTY_ART = `
<svg viewBox="0 0 120 90" fill="none" aria-hidden="true">
  <rect x="22" y="14" width="76" height="62" rx="12" fill="var(--brand-soft)"/>
  <rect x="32" y="28" width="10" height="10" rx="5" stroke="var(--brand)" stroke-width="2.5"/>
  <rect x="48" y="30" width="38" height="6" rx="3" fill="var(--stroke-strong)"/>
  <rect x="32" y="46" width="10" height="10" rx="5" fill="var(--brand)"/>
  <rect x="48" y="48" width="28" height="6" rx="3" fill="var(--stroke-strong)"/>
  <circle cx="98" cy="18" r="4" fill="var(--brand-2)" opacity=".6"/>
  <circle cx="16" cy="66" r="3" fill="var(--brand)" opacity=".5"/>
</svg>`;

function render(){
  listEl.innerHTML = '';
  const visible = tasks.filter(t=> filter==='active' ? !t.done : filter==='completed' ? t.done : true);

  if(!visible.length){
    const [h, p] = EMPTY[filter];
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.innerHTML = `${EMPTY_ART}<h3></h3><p></p>`;
    empty.querySelector('h3').textContent = h;
    empty.querySelector('p').textContent = p;
    listEl.append(empty);
  } else {
    visible.forEach((t, i) => {
      const node = template.content.firstElementChild.cloneNode(true);
      node.dataset.id = String(t.id);
      node.style.animationDelay = Math.min(i, 10) * 25 + 'ms';
      node.querySelector('.checkbox').checked = t.done;
      node.querySelector('.title').textContent = t.text;
      node.querySelector('.meta').textContent = fmtDate(t.created);
      if(t.done) node.classList.add('completed');
      listEl.append(node);
    });
  }

  const total = tasks.length;
  const done = tasks.filter(t=>t.done).length;
  const left = total - done;
  statTotal.textContent = total;
  leftCount.textContent = left;
  statDone.textContent = done;
  segmented.querySelector('[data-count="all"]').textContent = total;
  segmented.querySelector('[data-count="active"]').textContent = left;
  segmented.querySelector('[data-count="completed"]').textContent = done;
  meta.textContent = total ? `${left} of ${total} remaining` : 'No tasks yet';

  chips.forEach(ch => ch.setAttribute('aria-pressed', String(ch.dataset.filter===filter)));
  moveIndicator();
  updateProgress(done, total);
}

// ====== Events ======
composer.addEventListener('submit', e=>{
  e.preventDefault();
  if(addTask(newTask.value)) newTask.value = '';
  newTask.focus();
});

listEl.addEventListener('click', e=>{
  const li = e.target.closest('li.item'); if(!li) return;
  const id = Number(li.dataset.id);
  if(e.target.closest('.remove')){ removeTask(id); return; }
  if(e.target.closest('.edit')){ startInlineEdit(li, id); return; }
  if(e.target.matches('input.checkbox')){ toggleTask(id); return; }
});
listEl.addEventListener('dblclick', e=>{
  const title = e.target.closest('.title'); if(!title) return;
  const li = title.closest('li.item');
  startInlineEdit(li, Number(li.dataset.id));
});

function startInlineEdit(li, id){
  const t = tasks.find(t=>t.id===id); if(!t) return;
  const titleEl = li.querySelector('.title'); if(!titleEl) return;
  const input = document.createElement('input');
  input.className = 'edit-input'; input.value = t.text; input.maxLength = 200;
  input.setAttribute('aria-label','Edit task');
  titleEl.replaceWith(input); input.focus(); input.select();
  let finished = false;
  const finish = save => { if(finished) return; finished = true; save ? updateTask(id, input.value) : render(); };
  input.addEventListener('blur', ()=> finish(true));
  input.addEventListener('keydown', e=>{
    if(e.key==='Enter') finish(true);
    if(e.key==='Escape') finish(false);
  });
}

$('clearCompleted').addEventListener('click', clearCompleted);
$('selectAll').addEventListener('click', toggleAll);
segmented.addEventListener('click', e=>{
  const btn = e.target.closest('.chip'); if(!btn) return;
  filter = btn.dataset.filter; render();
});

// Theme toggle — dark by default, choice remembered per browser
const themeToggle = $('themeToggle');
function applyTheme(theme){
  document.documentElement.dataset.theme = theme;
  $('themeColor').setAttribute('content', theme === 'light' ? '#f4f3ff' : '#0b0a16');
  themeToggle.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
}
themeToggle.addEventListener('click', ()=>{
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  applyTheme(next);
  try{ localStorage.setItem(THEME_KEY, next) }catch{}
});
applyTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');

// Keyboard shortcut: "/" or "n" focuses the input
document.addEventListener('keydown', e=>{
  if(e.target.matches('input, textarea')) return;
  if(e.key === '/' || e.key.toLowerCase() === 'n'){ e.preventDefault(); newTask.focus(); }
});

window.addEventListener('resize', moveIndicator);
document.fonts?.ready.then(moveIndicator);

// initial paint
paintHeader();
render();
