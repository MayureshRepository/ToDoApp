// ====== State & Persistence ======
const STORAGE_KEY = 'todos-v2';
let tasks = load();
let filter = 'all'; // all | active | completed

function load(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] }catch{ return [] } }
function persist(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)) }

// ====== Elements ======
const listEl = document.getElementById('list');
const template = document.getElementById('itemTemplate');
const newTask = document.getElementById('newTask');
const addBtn = document.getElementById('addBtn');
const leftCount = document.getElementById('leftCount');
const meta = document.getElementById('meta');
const toast = document.getElementById('toast');
const chips = [...document.querySelectorAll('.chip')];
const progressBar = document.getElementById('progressBar');
const fab = document.getElementById('fab');

// ====== Utilities ======
function toastMsg(msg){
  toast.textContent = msg; toast.classList.add('show');
  setTimeout(()=> toast.classList.remove('show'), 1200);
}
function fmtDate(ts){ const d = new Date(ts); return d.toLocaleString([], {dateStyle:'medium', timeStyle:'short'}); }
function updateProgress(){
  const total = tasks.length || 1;
  const done = tasks.filter(t=>t.done).length;
  const pct = Math.round((done/total)*100);
  progressBar.style.width = pct + '%';
  progressBar.setAttribute('aria-valuenow', String(pct));
  progressBar.setAttribute('aria-label', pct + '% complete');
}

// ====== CRUD ======
function addTask(text){
  text = text.trim(); if(!text) return;
  const task = { id: Date.now(), text, done:false, created: Date.now() };
  tasks.unshift(task); persist(); render(); toastMsg('Task added');
}
function toggleTask(id){ const t = tasks.find(t=>t.id===id); if(!t) return; t.done = !t.done; persist(); render(); }
function updateTask(id, text){ const t = tasks.find(t=>t.id===id); if(!t) return; t.text = text.trim() || t.text; persist(); render(); toastMsg('Task updated'); }
function removeTask(id){ tasks = tasks.filter(t=>t.id!==id); persist(); render(); toastMsg('Task removed'); }
function clearCompleted(){ tasks = tasks.filter(t=>!t.done); persist(); render(); toastMsg('Cleared completed'); }
function toggleAll(){ const allDone = tasks.length && tasks.every(t=>t.done); tasks.forEach(t=> t.done = !allDone); persist(); render(); }

// ====== Rendering ======
function render(){
  listEl.innerHTML = '';
  const visible = tasks.filter(t=> filter==='active' ? !t.done : filter==='completed' ? t.done : true);

  if(!visible.length){
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'No tasks here. Add one!';
    listEl.append(empty);
  } else {
    for(const t of visible){
      const node = template.content.firstElementChild.cloneNode(true);
      node.dataset.id = String(t.id);
      const cb = node.querySelector('.checkbox');
      const title = node.querySelector('.title');
      const metaEl = node.querySelector('.meta');

      cb.checked = t.done;
      title.textContent = t.text;
      metaEl.textContent = 'Created ' + fmtDate(t.created);
      if(t.done) node.classList.add('completed');

      listEl.append(node);
    }
  }

  const left = tasks.filter(t=>!t.done).length;
  leftCount.textContent = left;
  meta.textContent = tasks.length ? `${tasks.length} total • ${new Date().toLocaleDateString()}` : '';

  chips.forEach(ch => ch.setAttribute('aria-pressed', String(ch.dataset.filter===filter)));
  updateProgress();
}

// ====== Events ======
addBtn.addEventListener('click', ()=> { addTask(newTask.value); newTask.value=''; newTask.focus(); });
newTask.addEventListener('keydown', e=>{ if(e.key==='Enter'){ addTask(newTask.value); newTask.value=''; }});
fab.addEventListener('click', ()=>{ if(newTask.value.trim()){ addTask(newTask.value); newTask.value=''; } else { newTask.focus(); }});

listEl.addEventListener('click', e=>{
  const li = e.target.closest('li.item'); if(!li) return;
  const id = Number(li.dataset.id);
  if(e.target.closest('.remove')){ removeTask(id); return; }
  if(e.target.closest('.edit')){ startInlineEdit(li, id); return; }
  if(e.target.matches('input.checkbox')){ toggleTask(id); return; }
});

function startInlineEdit(li, id){
  const t = tasks.find(t=>t.id===id); if(!t) return;
  const titleEl = li.querySelector('.title');
  const input = document.createElement('input');
  input.className = 'edit-input'; input.value = t.text; input.setAttribute('aria-label','Edit task');
  titleEl.replaceWith(input); input.focus();
  const done = ()=> updateTask(id, input.value);
  input.addEventListener('blur', done);
  input.addEventListener('keydown', (e)=>{ if(e.key==='Enter') done(); if(e.key==='Escape') render(); });
}

document.getElementById('clearCompleted').addEventListener('click', clearCompleted);
document.getElementById('selectAll').addEventListener('click', toggleAll);
document.querySelector('.filters').addEventListener('click', e=>{
  const btn = e.target.closest('.chip'); if(!btn) return;
  filter = btn.dataset.filter; render();
});

// initial paint
render();
