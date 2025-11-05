// Use the global api provided by js file (api-mock.js exposes window.api)
const api = window.api;

let session = null; // {role, matricula, name}

// Utils
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

// Init
function init(){
  // Hook nav (if present)
  const navItems = $$('#mainNav .nav-item');
  if(navItems && navItems.length) navItems.forEach(el=> el.addEventListener('click', (e)=>{ setRoute(el.dataset.route); }));

  // Login: prefer inline login form (#loginForm). If a modal/button exists, wire it defensively.
  const loginForm = $('#loginForm');
  if(loginForm){ loginForm.addEventListener('submit', (ev)=>{ ev.preventDefault(); doLogin(); }); }
  const btnLogin = $('#btnLogin'); if(btnLogin) btnLogin.addEventListener('click', ()=> showLogin(true));
  const loginCancel = $('#loginCancel'); if(loginCancel) loginCancel.addEventListener('click', ()=> showLogin(false));
  const loginSubmit = $('#loginSubmit'); if(loginSubmit) loginSubmit.addEventListener('click', doLogin);
  const exportGradesBtn = $('#exportGrades');
  if(exportGradesBtn) exportGradesBtn.addEventListener('click', async ()=>{
    if(!session || !session.matricula) return alert('Inicia sesión');
    const csv = await api.exportGradesCSV(session.matricula);
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${session.matricula}_grades.csv`; a.click(); URL.revokeObjectURL(url);
  });
  // PDF export buttons
  const downloadTiraBtn = document.getElementById('downloadTira');
  if(downloadTiraBtn) downloadTiraBtn.addEventListener('click', async ()=>{
    if(!session || !session.matricula) return alert('Inicia sesión');
    await exportGradesPDF(session.matricula);
  });
  const accountExportBtn = document.getElementById('accountExport');
  if(accountExportBtn) accountExportBtn.addEventListener('click', async ()=>{
    if(!session || !session.matricula) return alert('Inicia sesión');
    await exportAccountPDF(session.matricula);
  });

  // Try restore session from sessionStorage
  const s = sessionStorage.getItem('saes_session');
  if(s){ session = JSON.parse(s); awaitRender(); }

  // Trigger page-level welcome animation (outside login)
  animatePageWelcome('Bienvenido a A.L.M.A.');
}

// Create and animate page-level welcome text (big, elegant letters)
function animatePageWelcome(text){
  const container = document.getElementById('pageWelcome');
  if(!container) return;
  // Respect reduced motion
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  container.innerHTML = '';
  const inner = document.createElement('div'); inner.className = 'welcome-inner';
  // Split text into chars keeping spaces
  const chars = Array.from(text);
  chars.forEach((ch, i)=>{
    const span = document.createElement('span');
    span.className = 'letter';
    // Larger letters for letters, smaller for punctuation/space
    if(ch.match(/[A-Za-zÁÉÍÓÚÑáéíóúñ]/)) span.classList.add('large');
    if(ch.trim()==='') span.classList.add('punctuation');
    span.textContent = ch;
    // stagger delay
    const delay = i * 70; // ms
    span.style.setProperty('--delay', delay + 'ms');
    inner.appendChild(span);
  });
  container.appendChild(inner);
  // Ensure container is visible to assistive tech and visually
  try{ container.removeAttribute('aria-hidden'); }catch(e){}
  container.style.visibility = 'visible';
  // trigger animation after small timeout so CSS can pick up animation-delay
  // Only run the animation the first time per session
  const shownFlag = sessionStorage.getItem('saes_welcome_shown');
  if(mq && mq.matches){
    // reduced motion -> show static and mark as shown
    container.querySelectorAll('.letter').forEach(s => { s.style.opacity = '1'; s.style.transform = 'none'; });
    sessionStorage.setItem('saes_welcome_shown', '1');
    return;
  }

  if(!shownFlag){
    setTimeout(()=>{
      container.classList.add('play');
      // mark as shown for this session so it won't replay on reload
      sessionStorage.setItem('saes_welcome_shown', '1');
    }, 120);
  } else {
    // Already shown this session: reveal letters statically (no animation)
    container.querySelectorAll('.letter').forEach(s => { s.style.opacity = '1'; s.style.transform = 'none'; });
  }

  // Fallback: if for some reason letters are not rendering (font not loaded or CSS conflict), insert a plain H1
  setTimeout(()=>{
    const anyVisible = Array.from(container.querySelectorAll('.letter')).some(el => el.offsetWidth > 0 || el.offsetHeight > 0);
    if(!anyVisible){
      const fallback = document.createElement('h1');
      fallback.className = 'page-welcome-fallback display-serif';
      fallback.textContent = text;
      fallback.style.margin = '0';
      fallback.style.opacity = '0.98';
      fallback.style.color = 'var(--color-primary-2)';
      fallback.style.fontSize = 'clamp(24px, 6vw, 56px)';
      fallback.style.letterSpacing = '0.6px';
      container.innerHTML = ''; container.appendChild(fallback);
    }
  }, 300);
}

// Sidebar toggle for small screens (show/hide)
function toggleSidebar(){
  const sb = document.getElementById('sidebar');
  if(!sb) return;
  sb.style.display = (sb.style.display === 'none' || sb.style.display === '') ? 'block' : 'none';
}

// Toast helper
function toast(message, timeout=3000){
  let wrap = document.querySelector('.toast-wrap');
  if(!wrap){ wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = message; wrap.appendChild(t);
  setTimeout(()=>{ t.style.opacity = '0'; setTimeout(()=> t.remove(), 300); }, timeout);
}

// PDF generation using jsPDF (cliente)
async function exportGradesPDF(matricula){
  // cargar datos
  const grades = await api.getGrades(matricula);
  const summary = await api.getSummary(matricula);
  // acceso a jsPDF UMD
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const margin = 40;
  let y = 40;
  // Header
  doc.setFontSize(16); doc.setTextColor('#0B2545'); doc.text('ALMA - Tira de Materias', margin, y); y += 22;
  doc.setFontSize(10); doc.setTextColor('#333'); doc.text(`Nombre: ${summary?.name || ''}`, margin, y); y += 14;
  doc.text(`Matrícula: ${matricula}`, margin, y); y += 18;
  doc.text(`Periodo: ${summary?.period || '2025-2'}`, margin, y); y += 18;

  // Table header
  y += 6;
  const startX = margin;
  doc.setFillColor('#F4F6F8');
  doc.rect(startX, y, 500, 18, 'F');
  doc.setFontSize(10); doc.setTextColor('#0B2545');
  doc.text('Materia', startX + 6, y + 13);
  doc.text('Profesor', startX + 200, y + 13);
  doc.text('Final', startX + 360, y + 13);
  y += 26;

  // Rows
  doc.setFontSize(10); doc.setTextColor('#222');
  grades.forEach(g => {
    doc.text(g.nombreMateria || g.materiaId || '', startX + 6, y);
    doc.text(g.profesor || '', startX + 200, y);
    doc.text(String(g.final || ''), startX + 360, y);
    y += 16;
    if(y > 720){ doc.addPage(); y = 40; }
  });

  // Footer
  doc.setFontSize(9); doc.setTextColor('#666');
  doc.text('Documento generado desde SAES (demo).', margin, 780);
  doc.save(`${matricula}_tira_materias.pdf`);
}

async function exportAccountPDF(matricula){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const margin = 40; let y = 40;
  const fin = await api.getFinancial(matricula);
  doc.setFontSize(16); doc.setTextColor('#0B2545'); doc.text('ALMA - Estado de Cuenta', margin, y); y += 22;
  doc.setFontSize(10); doc.text(`Matrícula: ${matricula}`, margin, y); y += 16;
  doc.text(`Saldo actual: ${((fin.balance||0)).toFixed(2)}`, margin, y); y += 18;
  doc.text('Movimientos:', margin, y); y += 14;
  (fin.movements||[]).forEach(m => {
    const line = `${new Date(m.date).toLocaleDateString()} — ${m.desc||m.description||''} — ${m.amount||0}`;
    doc.text(line, margin + 10, y); y += 14;
    if(y > 720){ doc.addPage(); y = 40; }
  });
  doc.save(`${matricula}_estado_cuenta.pdf`);
}

function setRoute(route){
  $$('.view').forEach(v=> v.classList.remove('active'));
  const view = $(`#view-${route}`) || $('#view-dashboard');
  view.classList.add('active');
  $$('#mainNav .nav-item').forEach(n=> n.classList.toggle('active', n.dataset.route===route));
}

function showLogin(show){
  $('#modalLogin').classList.toggle('hidden', !show);
}

async function doLogin(){
  const user = $('#loginUser').value.trim();
  const pass = $('#loginPass').value.trim();
  try{
    const res = await api.login(user, pass);
    if(res.role==='student'){
      session = { role:'student', matricula: res.matricula, name: res.name };
    } else if(res.role==='teacher'){
      session = { role:'teacher', id: res.id, name: res.name };
    }
    sessionStorage.setItem('saes_session', JSON.stringify(session));
    // Exit auth-only mode so the rest of the app/nav becomes visible
    try{ document.body.classList.remove('auth-only'); }catch(e){}
    showLogin(false);
    // Redirect to the proper view for the role
    if(session.role === 'student') setRoute('dashboard');
    else if(session.role === 'teacher') setRoute('teacher');
    await awaitRender();
    toast('Sesión iniciada: ' + (session.name||session.id));
  }catch(err){ alert(err.message); }
}

async function awaitRender(){
  // Update header / user mini
  const userNameEl = $('#userName'); if(userNameEl) userNameEl.textContent = session.name || 'Usuario';
  const userMatEl = $('#userMatricula'); if(userMatEl) userMatEl.textContent = session.matricula || '';
  const avatarLgEl = $('#avatarLg'); if(avatarLgEl) avatarLgEl.textContent = (session.name||'U').split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase();
  const btnLoginEl = $('#btnLogin'); if(btnLoginEl){ btnLoginEl.textContent = 'Cerrar sesión'; try{ btnLoginEl.removeEventListener('click', ()=> showLogin(true)); }catch(e){} btnLoginEl.addEventListener('click', doLogout); }

  // Load summary and grades
  if(session.role === 'student'){
    const sum = await api.getSummary(session.matricula);
    if(sum){ $('#gpa').textContent = sum.gpa; $('#periodAvg').textContent = sum.periodAverage; $('#credits').textContent = sum.creditsApproved; $('#currentPeriod').textContent = sum.period || '2025-2'; }
    renderGrades(await api.getGrades(session.matricula));
    renderNotifications(await api.getNotifications(session.matricula));
    const fin = await api.getFinancial(session.matricula);
    $('#balance strong').textContent = ` ${fin.balance.toFixed(2)}`;
  }
}

function doLogout(){
  session = null; sessionStorage.removeItem('saes_session');
  try{ document.body.classList.add('auth-only'); }catch(e){}
  location.reload();
}

function renderGrades(list){
  const tbody = $('#gradesTable tbody');
  if(!list || list.length===0){ tbody.innerHTML = '<tr><td colspan="5" class="muted">No hay calificaciones para el periodo seleccionado.</td></tr>'; return; }
  tbody.innerHTML = list.map(g=> `<tr><td>${g.nombreMateria}</td><td>${g.profesor}</td><td>${g.parciales.join(', ')}</td><td>${g.final}</td><td><span class="badge">${g.estado}</span></td></tr>`).join('');
}

function renderNotifications(list){
  const el = $('#notificationsList');
  if(!list || list.length===0){ el.innerHTML = '<div class="muted">Sin notificaciones.</div>'; return; }
  el.innerHTML = list.map(n=> `<div class="notif"><div>${n.message}</div><div class="muted">${new Date(n.date).toLocaleString()}</div></div>`).join('');
}

// Render for requests view
async function initRequests(){
  const reqSubmit = $('#reqSubmit');
  if(!reqSubmit) return;
  reqSubmit.addEventListener('click', async ()=>{
    if(!session || !session.matricula) return alert('Inicia sesión');
    const typeEl = $('#reqType'); const descEl = $('#reqDesc');
    const type = typeEl ? typeEl.value : 'otro'; const desc = descEl ? descEl.value.trim() : '';
    const reqResult = $('#reqResult'); if(reqResult) reqResult.textContent = 'Enviando...';
    const res = await api.postRequest(session.matricula, { type, description: desc });
    if(reqResult) reqResult.textContent = `Solicitud enviada: ${res.id}`;
    renderNotifications(await api.getNotifications(session.matricula));
  });
}

// Map interactivity
function initMap(){
  $$('.map-pin').forEach(p=> p.addEventListener('click', (e)=>{
    const aula = e.target.dataset.aula;
    $('#mapInfo').textContent = `Aula: ${aula} — Ver información o cómo llegar (demo).`;
  }));
}

// Account view
async function initAccount(){
  const accountSummary = $('#accountSummary');
  if(!session || !session.matricula){ if(accountSummary) accountSummary.textContent = 'Inicia sesión para ver el estado de cuenta.'; return; }
  const f = await api.getFinancial(session.matricula);
  if(accountSummary) accountSummary.innerHTML = `Saldo actual: <strong>${(f.balance||0).toFixed(2)}</strong><div class="mt-8">Movimientos (${(f.movements||[]).length}):</div>` +
    `<ul>` + (f.movements||[]).map(m=>`<li>${new Date(m.date).toLocaleDateString()} — ${m.desc||m.description||''} — ${m.amount||0}</li>`).join('') + `</ul>`;
  const accountExport = $('#accountExport'); if(accountExport) accountExport.addEventListener('click', ()=> alert('Exportar movimientos (demo)'));
}

// Teacher capture UI
async function initTeacherCapture(){
  const container = $('#teacherCapture');
  if(!session || session.role!=='teacher'){
    container.innerHTML = '<div class="muted">Inicie sesión como docente para capturar calificaciones.</div>';
    return;
  }
  container.innerHTML = `
    <div class="form-row"><label>Grupo</label><select id="capGroup"></select></div>
    <div class="form-row"><label>Estudiante</label><select id="capStudent"></select></div>
    <div class="form-row"><label>Materia</label><input id="capMateria" /></div>
    <div class="form-row"><label>Parciales (coma separadas)</label><input id="capParciales" /></div>
    <div class="form-row"><label>Calificación Final</label><input id="capFinal" type="number" step="0.1" /></div>
    <div class="form-row"><button id="capSubmit" class="btn">Guardar calificación</button></div>
    <div id="capResult" class="muted mt-8"></div>
  `;
  // Load groups and students
  const groups = await api.getGroupsForTeacher(session.id);
  const students = await api.getStudentsForTeacher(session.id);
  const selG = $('#capGroup'); selG.innerHTML = groups.map(g=>`<option value="${g.id}">${g.name}</option>`).join('');
  const selS = $('#capStudent'); selS.innerHTML = students.map(s=>`<option value="${s.matricula}">${s.nombre} (${s.matricula})</option>`).join('');
  $('#capSubmit').addEventListener('click', async ()=>{
    const matricula = $('#capStudent').value; const materia = $('#capMateria').value.trim();
    const parc = $('#capParciales').value.split(',').map(x=>parseFloat(x.trim())||0);
    const final = parseFloat($('#capFinal').value)||0;
    const grade = { matricula, materiaId: materia, nombreMateria: materia, profesor: session.name, parciales: parc, final, periodo: '2025-2', estado: final>=6 ? 'Aprobada':'Reprobada' };
    await api.postGrade(grade);
    $('#capResult').textContent = 'Calificación guardada.';
  });
}

// When route changes, initialize view-specific JS
function onRouteChange(route){
  if(route==='requests') initRequests();
  if(route==='schedule') initMap();
  if(route==='account') initAccount();
  if(route==='grades') initTeacherCapture();
  // Dashboard route: refresh student content
  if(route==='dashboard') awaitRender();
  // Teacher route: initialize teacher tools
  if(route==='teacher') initTeacherCapture();
}

// Patch setRoute to call onRouteChange
const _setRoute = setRoute; // keep reference
setRoute = function(route){ _setRoute(route); onRouteChange(route); };

// Start
init();
