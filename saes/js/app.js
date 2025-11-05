import api from './api-mock.js';

let session = null; // {role, matricula, name}

// Utils
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

// Init
function init(){
  // Hook nav
  $$('#mainNav .nav-item').forEach(el=> el.addEventListener('click', (e)=>{ setRoute(el.dataset.route); }));
  $('#btnLogin').addEventListener('click', ()=> showLogin(true));
  $('#loginCancel').addEventListener('click', ()=> showLogin(false));
  $('#loginSubmit').addEventListener('click', doLogin);
  $('#exportGrades').addEventListener('click', async ()=>{
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
    showLogin(false);
    await awaitRender();
    toast('Sesión iniciada: ' + (session.name||session.id));
  }catch(err){ alert(err.message); }
}

async function awaitRender(){
  // Update header / user mini
  $('#userName').textContent = session.name || 'Usuario';
  $('#userMatricula').textContent = session.matricula || '';
  $('#avatarLg').textContent = (session.name||'U').split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase();
  $('#btnLogin').textContent = 'Cerrar sesión';
  $('#btnLogin').removeEventListener('click', ()=> showLogin(true));
  $('#btnLogin').addEventListener('click', doLogout);

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
  session = null; sessionStorage.removeItem('saes_session'); location.reload();
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
  $('#reqSubmit').addEventListener('click', async ()=>{
    if(!session || !session.matricula) return alert('Inicia sesión');
    const type = $('#reqType').value; const desc = $('#reqDesc').value.trim();
    $('#reqResult').textContent = 'Enviando...';
    const res = await api.postRequest(session.matricula, { type, description: desc });
    $('#reqResult').textContent = `Solicitud enviada: ${res.id}`;
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
  if(!session || !session.matricula) { $('#accountSummary').textContent = 'Inicia sesión para ver el estado de cuenta.'; return; }
  const f = await api.getFinancial(session.matricula);
  $('#accountSummary').innerHTML = `Saldo actual: <strong>${(f.balance||0).toFixed(2)}</strong><div class="mt-8">Movimientos (${(f.movements||[]).length}):</div>` +
    `<ul>` + (f.movements||[]).map(m=>`<li>${new Date(m.date).toLocaleDateString()} — ${m.desc||m.description||''} — ${m.amount||0}</li>`).join('') + `</ul>`;
  $('#accountExport').addEventListener('click', ()=> alert('Exportar movimientos (demo)'));
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
}

// Patch setRoute to call onRouteChange
const _setRoute = setRoute; // keep reference
setRoute = function(route){ _setRoute(route); onRouteChange(route); };

// Start
init();
