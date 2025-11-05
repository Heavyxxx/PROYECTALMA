// Encapsular todo en IIFE para evitar colisiones globales
(function(){
  // Use the global api provided by js file (api-mock.js exposes window.api)
  const api = window.api;

  let session = null; // {role, matricula, name}

  // Utils (local to this module)
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // Init
  async function init(){
  // Hook nav (if present)
  const navItems = $$('#mainNav .nav-item');
  if(navItems && navItems.length) navItems.forEach(el=> el.addEventListener('click', (e)=>{ setRoute(el.dataset.route); }));

  // Login: prefer inline login form (#loginForm). If a modal/button exists, wire it defensively.
  const loginForm = $('#loginForm');
  if(loginForm){ loginForm.addEventListener('submit', (ev)=>{ ev.preventDefault(); doLogin(); }); }
  // Also attach click to the login form submit button to be defensive
  try{
    const loginBtn = document.querySelector('#loginForm button[type="submit"]');
    if(loginBtn) loginBtn.addEventListener('click', (ev)=>{ ev.preventDefault(); doLogin(); });
  }catch(e){ /* ignore */ }
  const btnLogin = $('#btnLogin'); if(btnLogin) btnLogin.addEventListener('click', ()=> showLogin(true));
  const loginCancel = $('#loginCancel'); if(loginCancel) loginCancel.addEventListener('click', ()=> showLogin(false));
  const loginSubmit = $('#loginSubmit'); if(loginSubmit) loginSubmit.addEventListener('click', doLogin);
  const exportGradesBtn = $('#exportGrades');
  if(exportGradesBtn) exportGradesBtn.addEventListener('click', async ()=>{
    // delegate to helper (handles absence of session)
    try{ await exportGradesCSVHandler(); }catch(e){ console.warn('CSV export failed', e); alert('Error al exportar CSV'); }
  });
  // topbar PDF export (mirror of downloadTira)
  const downloadTiraTop = document.getElementById('downloadTiraTop');
  if(downloadTiraTop) downloadTiraTop.addEventListener('click', async ()=>{ if(!session || !session.matricula) return alert('Inicia sesión'); await exportGradesPDF(session.matricula); });
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
  if(s){
    try{ session = JSON.parse(s); 
      // If a session exists, exit auth-only view and navigate to their dashboard
      try{ document.body.classList.remove('auth-only'); }catch(e){}
      if(session && session.role === 'teacher') setRoute('teacher');
      else setRoute('dashboard');
      awaitRender();
    }catch(e){ console.warn('Failed restoring session', e); }
  }

  // Trigger page-level welcome animation (outside login)
  // Only show the large page welcome on auth-only (login) screens — avoid repeating it inside dashboards
  try{
    if((!session || session === null) && document.body.classList.contains('auth-only')){
      // If another script (e.g., js/login.js) already rendered #pageWelcome, don't duplicate it
      const pw = document.getElementById('pageWelcome');
      if(pw && pw.children && pw.children.length > 0){
        // already rendered by page-specific script; skip
      } else {
        animatePageWelcome('Bienvenido a A.L.M.A.');
      }
    }
  }catch(e){ /* ignore */ }
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
  const summary = await api.getSummary ? await api.getSummary(matricula) : null;
  // acceso a jsPDF UMD
  const { jsPDF } = window.jspdf || {};
  if(!jsPDF){
    alert('jsPDF no disponible');
    return;
  }
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const margin = 40;
  let y = 40;
  // Header (accent bar + title)
  try{
    doc.setFillColor('#8B1E2F');
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 36, 'F');
    doc.setFontSize(18); doc.setTextColor('#ffffff'); doc.text('A.L.M.A. — Tira de Materias', margin, 26);
  }catch(e){
    doc.setFontSize(16); doc.setTextColor('#0B2545'); doc.text('ALMA - Tira de Materias', margin, y); y += 22;
  }
  y += 12;
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
  (grades||[]).forEach(g => {
    doc.text(g.nombreMateria || g.materiaId || g.materia || '', startX + 6, y);
    doc.text(g.profesor || '', startX + 200, y);
    doc.text(String(g.final || g.calificacion || ''), startX + 360, y);
    y += 16;
    if(y > 720){ doc.addPage(); y = 40; }
  });

  // Footer
  doc.setFontSize(9); doc.setTextColor('#666');
  doc.text('Documento generado desde SAES (demo).', margin, 780);
  doc.save(`${matricula}_tira_materias.pdf`);
}

// CSV export helper (used by topbar button)
async function exportGradesCSVHandler(){
  const s = session || JSON.parse(sessionStorage.getItem('saes_session')||'null');
  if(!s || !s.matricula) return alert('Inicia sesión para exportar.');
  const csv = await api.exportGradesCSV(s.matricula);
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${s.matricula}_grades.csv`; a.click(); URL.revokeObjectURL(url);
}
// expose CSV helper globally so widgets (ALMA Bot) can call it
try{ window.exportGradesCSVHandler = exportGradesCSVHandler; }catch(e){/* ignore when not allowed */}

async function exportAccountPDF(matricula){
  const { jsPDF } = window.jspdf || {};
  if(!jsPDF){ alert('jsPDF no disponible'); return; }
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const margin = 40; let y = 40;
  const fin = await api.getFinancial ? await api.getFinancial(matricula) : { balance: 0, movements: [] };
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
  try{
    const current = document.querySelector('.view.active');
    if(current){
      current.classList.add('fade-out');
      // after small delay hide it
      setTimeout(()=>{ try{ current.classList.remove('active','fade-out'); }catch(e){} }, 220);
    }
  }catch(e){/* ignore */}
  const view = $(`#view-${route}`) || $('#view-dashboard');
  if(view){
    // ensure previous active removed
    $$('.view').forEach(v=> v.classList.remove('active'));
    // add fade-in animation then mark active
    view.classList.add('fade-in');
    // ensure browser applies animation
    setTimeout(()=>{ view.classList.add('active'); view.classList.remove('fade-in'); }, 16 + 60);
  }
  $$('#mainNav .nav-item').forEach(n=> n.classList.toggle('active', n.dataset.route===route));
}

// (routing wrapper moved lower to include onRouteChange)

function showLogin(show){
  const modal = $('#modalLogin');
  if(!modal) return;
  modal.classList.toggle('hidden', !show);
}

async function doLogin(){
  const user = ($('#loginUser') && $('#loginUser').value) ? $('#loginUser').value.trim() : '';
  const pass = ($('#loginPass') && $('#loginPass').value) ? $('#loginPass').value.trim() : '';
  console.log('[saes] doLogin start', { user });
  try{
    console.log('[saes] calling api.login', { user, passProvided: !!pass });
    const res = await api.login(user, pass);
    console.log('[saes] api.login response', res);
    if(!res) throw new Error('No se recibió respuesta del servidor al intentar autenticar.');
    if(res.role==='student'){
      session = { role:'student', matricula: res.matricula || res.username, name: res.name || res.displayName || res.username };
    } else if(res.role==='teacher'){
      session = { role:'teacher', id: res.id || res.username, name: res.name || res.displayName || res.username };
    }
    sessionStorage.setItem('saes_session', JSON.stringify(session));
    // Exit auth-only mode so the rest of the app/nav becomes visible
    try{ document.body.classList.remove('auth-only'); }catch(e){}
    showLogin(false);
    // Special demo: allow a 'dual' view showing both student and teacher interfaces
    const uname = String(user || '').toLowerCase();
    if(uname === 'ambos' || uname === 'both' || uname === 'demoall'){
      // mark a demo dual session
      session = Object.assign({}, session, { role: 'dual' });
      sessionStorage.setItem('saes_session', JSON.stringify(session));
      setRoute('dual');
      // initialize both sides
      await awaitRender();
      try{ await initTeacherCapture(); }catch(e){}
    } else {
      // Redirect to the proper view for the role
      if(session.role === 'student') setRoute('dashboard');
      else if(session.role === 'teacher') setRoute('teacher');
      await awaitRender();
    }
    console.log('[saes] doLogin success', session);
    toast('Sesión iniciada: ' + (session.name||session.id));
  }catch(err){
    // Log full error to console for debugging and show user-friendly message
    console.error('[saes] doLogin failed', err);
    try{ toast('Error iniciando sesión: ' + (err && err.message ? err.message : 'Error desconocido')); }catch(e){}
    // also surface alert to ensure the user sees it in environments without visible toasts
    try{ alert(err && err.message ? err.message : 'Error al iniciar sesión'); }catch(e){ console.error('alert failed', e); }
  }
}

async function awaitRender(){
  // Update header / user mini
  const userNameEl = $('#userName'); if(userNameEl) userNameEl.textContent = session.name || 'Usuario';
  const userMatEl = $('#userMatricula'); if(userMatEl) userMatEl.textContent = session.matricula || '';
  const avatarLgEl = $('#avatarLg'); if(avatarLgEl) avatarLgEl.textContent = (session.name||'U').split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase();
  const btnLoginEl = $('#btnLogin'); if(btnLoginEl){ btnLoginEl.textContent = 'Cerrar sesión'; try{ btnLoginEl.removeEventListener('click', ()=> showLogin(true)); }catch(e){} btnLoginEl.addEventListener('click', doLogout); }

  // Load summary and grades
  if(session.role === 'student'){
    const sum = api.getSummary ? await api.getSummary(session.matricula) : null;
    if(sum){
      const gpaEl = $('#gpa'); if(gpaEl) gpaEl.textContent = sum.gpa;
      const periodAvgEl = $('#periodAvg'); if(periodAvgEl) periodAvgEl.textContent = sum.periodAverage;
      const creditsEl = $('#credits'); if(creditsEl) creditsEl.textContent = sum.creditsApproved;
      const currentPeriodEl = $('#currentPeriod'); if(currentPeriodEl) currentPeriodEl.textContent = sum.period || '2025-2';
      const userGreeting = $('#userGreeting'); if(userGreeting) userGreeting.textContent = sum.name || session.name || 'Alumno';
    }
    try{ renderGrades(await api.getGrades(session.matricula)); }catch(e){ console.warn('renderGrades failed', e); }
    try{ renderNotifications(await api.getNotifications(session.matricula)); }catch(e){ console.warn('renderNotifications failed', e); }
    const fin = api.getFinancial ? await api.getFinancial(session.matricula) : { balance:0 };
    const balEl = $('#balance'); if(balEl) balEl.textContent = (fin.balance||0).toFixed(2);
  }
  // If dual demo session, also populate the dual view elements
  if(session.role === 'dual'){
    const sum = api.getSummary ? await api.getSummary(session.matricula) : null;
    if(sum){ const gpaDual = $('#gpa_dual'); if(gpaDual) gpaDual.textContent = sum.gpa; }
    try{
      const grades = await api.getGrades(session.matricula);
      const tbody = document.querySelector('#gradesTable_dual tbody');
      if(tbody){ tbody.innerHTML = grades.map(g=>`<tr><td>${g.nombreMateria||g.materia}</td><td>${g.profesor||''}</td><td>${g.final||''}</td></tr>`).join(''); }
    }catch(e){ console.warn('dual grades failed', e); }
    // initialize teacher capture in the dual panel
    try{
      const groups = await api.getGroupsForTeacher(session.id);
      const students = await api.getStudentsForTeacher(session.id);
      const dual = document.getElementById('teacherCapture_dual');
      if(dual){
        dual.innerHTML = `
          <div class="form-row"><label>Grupo</label><select id="capGroup_dual"></select></div>
          <div class="form-row"><label>Estudiante</label><select id="capStudent_dual"></select></div>
          <div class="form-row"><label>Materia</label><input id="capMateria_dual" /></div>
          <div class="form-row"><label>Parciales</label><input id="capParciales_dual" /></div>
          <div class="form-row"><label>Final</label><input id="capFinal_dual" type="number" step="0.1" /></div>
          <div class="form-row"><button id="capSubmit_dual" class="btn">Guardar</button></div>
          <div id="capResult_dual" class="muted mt-8"></div>`;
        const selG = $('#capGroup_dual'); if(selG) selG.innerHTML = (groups||[]).map(g=>`<option value="${g.id}">${g.name}</option>`).join('');
        const selS = $('#capStudent_dual'); if(selS) selS.innerHTML = (students||[]).map(s=>`<option value="${s.matricula||s.username}">${(s.nombre||s.displayName||s.username||s.matricula) || ''}</option>`).join('');
        const submit = document.getElementById('capSubmit_dual'); if(submit) submit.addEventListener('click', async ()=>{
          const matricula = (document.getElementById('capStudent_dual')||{}).value || session.matricula;
          const materia = (document.getElementById('capMateria_dual')||{}).value || 'MateriaDemo';
          const parc = ((document.getElementById('capParciales_dual')||{}).value||'').split(',').map(x=>parseFloat(x.trim())||0);
          const final = parseFloat((document.getElementById('capFinal_dual')||{}).value) || 0;
          const grade = { matricula, materiaId: materia, nombreMateria: materia, profesor: session.name || 'Docente', parciales: parc, final, periodo: '2025-2', estado: final>=6?'Aprobada':'Reprobada'};
          await api.postGrade ? await api.postGrade(grade) : null;
          (document.getElementById('capResult_dual')||{}).textContent = 'Calificación guardada.';
        });
      }
    }catch(e){ console.warn('init dual teacher failed', e); }
  }
}

function doLogout(){
  session = null; sessionStorage.removeItem('saes_session');
  try{ document.body.classList.add('auth-only'); }catch(e){}
  location.reload();
}

function renderGrades(list){
  const tbody = $('#gradesTable tbody');
  if(!tbody){
    // If table doesn't exist, try to find modern container
    const table = document.getElementById('gradesTable');
    if(table && table.querySelector('tbody')) table.querySelector('tbody').innerHTML = (list && list.length) ? list.map(g=> `<tr><td>${g.nombreMateria||g.materia}</td><td>${g.profesor||''}</td><td>${(g.parciales||[]).join ? (g.parciales||[]).join(', ') : (g.parciales||'')}</td><td>${g.final||''}</td><td><span class="badge">${g.estado||''}</span></td></tr>`).join('') : '<tr><td colspan="5" class="muted">No hay calificaciones para el periodo seleccionado.</td></tr>';
    return;
  }
  if(!list || list.length===0){ tbody.innerHTML = '<tr><td colspan="5" class="muted">No hay calificaciones para el periodo seleccionado.</td></tr>'; return; }
  tbody.innerHTML = list.map(g=> `<tr><td>${g.nombreMateria||g.materia}</td><td>${g.profesor||''}</td><td>${(g.parciales||[]).join ? (g.parciales||[]).join(', ') : (g.parciales||'')}</td><td>${g.final||''}</td><td><span class="badge">${g.estado||''}</span></td></tr>`).join('');
}

function renderNotifications(list){
  const el = $('#notificationsList');
  if(!el) return;
  if(!list || list.length===0){ el.innerHTML = '<div class="muted">Sin notificaciones.</div>'; return; }
  el.innerHTML = list.map(n=> `<div class="notif"><div>${n.message||n.text}</div><div class="muted">${new Date(n.date).toLocaleString()}</div></div>`).join('');
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
    const res = api.postRequest ? await api.postRequest(session.matricula, { type, description: desc }) : { id: 'R'+Date.now() };
    if(reqResult) reqResult.textContent = `Solicitud enviada: ${res.id}`;
    renderNotifications(await (api.getNotifications ? api.getNotifications(session.matricula) : []));
  });
}

// Map interactivity
function initMap(){
  const pins = $$('.map-pin');
  if(!pins || pins.length===0) return;
  pins.forEach(p=> p.addEventListener('click', (e)=>{
    const aula = e.target.dataset.aula;
    const mi = $('#mapInfo'); if(mi) mi.textContent = `Aula: ${aula} — Ver información o cómo llegar (demo).`;
  }));
}

// Account view
async function initAccount(){
  const accountSummary = $('#accountSummary');
  if(!session || !session.matricula){ if(accountSummary) accountSummary.textContent = 'Inicia sesión para ver el estado de cuenta.'; return; }
  const f = api.getFinancial ? await api.getFinancial(session.matricula) : { balance:0, movements:[] };
  if(accountSummary) accountSummary.innerHTML = `Saldo actual: <strong>${(f.balance||0).toFixed(2)}</strong><div class="mt-8">Movimientos (${(f.movements||[]).length}):</div>` +
    `<ul>` + (f.movements||[]).map(m=>`<li>${new Date(m.date).toLocaleDateString()} — ${m.desc||m.description||''} — ${m.amount||0}</li>`).join('') + `</ul>`;
  const accountExport = $('#accountExport'); if(accountExport) accountExport.addEventListener('click', ()=> alert('Exportar movimientos (demo)'));
}

// Teacher capture UI
async function initTeacherCapture(){
  const container = $('#teacherCapture');
  if(!container) return;
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
  const groups = api.getGroupsForTeacher ? await api.getGroupsForTeacher(session.id) : [];
  const students = api.getStudentsForTeacher ? await api.getStudentsForTeacher(session.id) : [];
  const selG = $('#capGroup'); selG && (selG.innerHTML = (groups||[]).map(g=>`<option value="${g.id}">${g.name}</option>`).join(''));
  const selS = $('#capStudent'); selS && (selS.innerHTML = (students||[]).map(s=>`<option value="${s.matricula||s.username}">${(s.nombre||s.displayName||s.username||s.matricula)}</option>`).join(''));
  const btn = $('#capSubmit'); if(btn) btn.addEventListener('click', async ()=>{
    const matricula = ($('#capStudent')||{}).value || session.matricula;
    const materia = ($('#capMateria')||{}).value.trim() || 'MateriaDemo';
    const parc = ($('#capParciales')||{}).value.split(',').map(x=>parseFloat(x.trim())||0);
    const final = parseFloat($('#capFinal')?.value) || 0;
    const grade = { matricula, materiaId: materia, nombreMateria: materia, profesor: session.name, parciales: parc, final, periodo: '2025-2', estado: final>=6 ? 'Aprobada':'Reprobada' };
    if(api.postGrade) await api.postGrade(grade);
    $('#capResult') && ($('#capResult').textContent = 'Calificación guardada.');
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

  // Patch setRoute to call onRouteChange and update URL hash/history
  const _setRoute = (typeof window.setRoute === 'function') ? window.setRoute : function(route){
    // no-op fallback
  };
  // Install global setRoute that delegates to previous one and triggers onRouteChange
  window.setRoute = function(route){
    try{ _setRoute(route); }catch(e){ console.warn('setRoute error', e); }
    try{ onRouteChange(route); }catch(e){ console.warn('onRouteChange error', e); }
    try{ if(window && window.history && window.history.pushState) window.history.pushState({}, '', '#'+route); else location.hash = route; }catch(e){}
  };

  // Start
  init();

})();
