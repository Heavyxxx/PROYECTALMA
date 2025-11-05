// student.js — lógica de la vista de estudiante
(async function(){
  const api = window.api;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  function bindLogout(){
    const btn = document.getElementById('btnLogout');
    if(btn) btn.addEventListener('click', ()=>{ sessionStorage.removeItem('saes_session'); window.location.href='index.html'; });
  }

  async function loadGrades(){
    const session = JSON.parse(sessionStorage.getItem('saes_session')||'null');
    if(!session) return;
    const tbody = document.querySelector('#gradesTable tbody');
    if(!tbody) return;
    // show skeleton while loading
    try{ window.appMotion && window.appMotion.renderTableSkeleton(tbody, 4, 5); }catch(e){}
    const grades = await api.getGrades(session.matricula);
    if(!grades || grades.length===0){ tbody.innerHTML = '<tr><td colspan="5" class="muted">No hay calificaciones.</td></tr>'; return; }
    tbody.innerHTML = grades.map(g=> `<tr><td>${g.nombreMateria}</td><td>${g.profesor||''}</td><td>${(g.parciales||[]).join(', ')}</td><td>${g.final}</td><td><span class="badge">${g.estado}</span></td></tr>`).join('');
    // animate table into view
    try{ const table = document.getElementById('gradesTable'); window.appMotion && window.appMotion.fadeIn(table); }catch(e){}
  }

  async function loadSummary(){
    const session = JSON.parse(sessionStorage.getItem('saes_session')||'null');
    if(!session) return;
    const sum = await api.getSummary(session.matricula);
    if(sum){
      const gpaEl = $('#gpa'); if(gpaEl) gpaEl.textContent = sum.gpa;
      const creditsEl = $('#credits'); if(creditsEl) creditsEl.textContent = sum.creditsApproved || sum.credits || '—';
  const userGreeting = $('#userGreeting'); if(userGreeting) userGreeting.textContent = sum.name || session.name || 'Alumno';
      const userName = $('#userName'); if(userName) userName.textContent = sum.name;
      const userMat = $('#userMatricula'); if(userMat) userMat.textContent = sum.matricula;
    }
  }

  async function initTimeline(){
    const el = document.getElementById('timelineWidget'); if(!el) return;
    el.innerHTML = '';
    const sample = [
      {time:'08:00', text:'Clase: Cálculo Diferencial — Aula 101'},
      {time:'10:30', text:'Entrega de proyecto — Programación'},
      {time:'14:00', text:'Tutoría en línea — Matemáticas'}
    ];
    sample.forEach(it=>{ const div = document.createElement('div'); div.className='timeline-item'; div.innerHTML = `<strong>${it.time}</strong> — ${it.text}`; el.appendChild(div); });
  }

  function bindRequests(){
    const btn = document.getElementById('reqSubmit');
    if(!btn) return;
    btn.addEventListener('click', async ()=>{
      const type = (document.getElementById('reqType')||{}).value || 'otro';
      const desc = (document.getElementById('reqDesc')||{}).value || '';
      const session = JSON.parse(sessionStorage.getItem('saes_session')||'null');
      if(!session) return alert('Inicia sesión');
      const res = await api.postRequest(session.matricula, { type, description: desc });
      const out = document.getElementById('reqResult'); if(out) out.textContent = `Solicitud enviada: ${res.id}`;
      const notifs = await api.getNotifications(session.matricula); renderNotifications(notifs);
    });
  }

  function renderNotifications(list){
    const el = document.getElementById('notificationsList'); if(!el) return;
    if(!list || list.length===0){ el.innerHTML = '<div class="muted">Sin notificaciones.</div>'; return; }
    el.innerHTML = list.map(n=>`<div class="timeline-item">${n.message} <div class="muted-small">${new Date(n.date).toLocaleString()}</div></div>`).join('');
  }

  function bindExports(){
    const btn = document.getElementById('downloadTira');
    if(!btn) return;
    btn.addEventListener('click', async ()=>{
      const session = JSON.parse(sessionStorage.getItem('saes_session')||'null'); if(!session) return;
      if(window.exportGradesPDF) await window.exportGradesPDF(session.matricula);
      else alert('Exportador no disponible');
    });
  }

  function bindTopbarExport(){
    const csvBtn = document.getElementById('exportGrades');
    if(!csvBtn) return;
    csvBtn.addEventListener('click', async ()=>{
      const session = JSON.parse(sessionStorage.getItem('saes_session')||'null'); if(!session) return alert('Inicia sesión');
      if(window.exportGradesCSVHandler) return await window.exportGradesCSVHandler();
      alert('Exportador CSV no disponible');
    });
  }

  // period filter
  function bindPeriodFilter(){
    const sel = document.getElementById('periodSelect'); if(!sel) return;
    sel.addEventListener('change', async ()=>{
      const val = sel.value; const session = JSON.parse(sessionStorage.getItem('saes_session')||'null'); if(!session) return;
      // re-fetch grades with optional period
      try{ window.appMotion && window.appMotion.renderTableSkeleton(document.querySelector('#gradesTable tbody'), 4, 5); }catch(e){}
      const grades = await api.getGrades(session.matricula, val==='all'? undefined : val);
      const tbody = document.querySelector('#gradesTable tbody');
      if(!grades || grades.length===0) { tbody.innerHTML = '<tr><td colspan="5" class="muted">No hay calificaciones.</td></tr>'; return; }
      tbody.innerHTML = grades.map(g=> `<tr><td>${g.nombreMateria}</td><td>${g.profesor||''}</td><td>${(g.parciales||[]).join(', ')}</td><td>${g.final}</td><td><span class="badge">${g.estado}</span></td></tr>`).join('');
      try{ window.appMotion && window.appMotion.fadeIn(document.getElementById('gradesTable')); }catch(e){}
    });
  }

  // init
  function init(){
    bindLogout(); bindExports(); bindRequests();
    bindTopbarExport(); bindPeriodFilter();
    loadSummary(); loadGrades(); initTimeline();
    (async ()=>{ const s = JSON.parse(sessionStorage.getItem('saes_session')||'null'); if(s){ const nots = await api.getNotifications(s.matricula); renderNotifications(nots); }})();
    // Bind navigation items (elements with data-route)
    try{
      document.querySelectorAll('.nav-item').forEach(el=>{
        el.addEventListener('click', ()=>{ const r = el.dataset.route; if(r && window.setRoute) window.setRoute(r); });
        el.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); const r = el.dataset.route; if(r && window.setRoute) window.setRoute(r); } });
      });
    }catch(e){/* ignore */}
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
