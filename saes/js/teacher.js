// teacher.js — lógica de la vista de docente
(function(){
  const api = window.api;
  const $ = s => document.querySelector(s);

  async function loadGroups(){
    // try to infer teacher id from session storage for better demo fidelity
    let teacherId = 100;
    try{ const s = JSON.parse(sessionStorage.getItem('saes_session')||'null'); if(s && (s.id||s.id===0)) teacherId = s.id; }catch(e){}
    const groups = await api.getGroupsForTeacher(teacherId);
    const ul = document.getElementById('groupList'); if(!ul) return;
    ul.innerHTML = (groups||[]).map(g=>`<li class="timeline-item">${g.name} <button class="btn small" data-group="${g.id}">Abrir</button></li>`).join('');
    // add click + keyboard activation to group buttons
    document.querySelectorAll('#groupList [data-group]').forEach(b=>{
      b.addEventListener('click', (e)=> openGroup(e.target.dataset.group));
      b.setAttribute('tabindex', '0');
      b.addEventListener('keydown', (ev)=>{ if(ev.key==='Enter' || ev.key===' ') { ev.preventDefault(); openGroup(b.dataset.group); } });
    });
    // update KPI
    const groupsCount = document.getElementById('groupsCount'); if(groupsCount) groupsCount.textContent = (groups||[]).length;
  }

  function openGroup(groupId){
    const area = document.getElementById('gradeCaptureArea'); if(!area) return;
    area.innerHTML = `<div class="muted">Captura para grupo ${groupId}</div><div class="form-row"><label class="form-label">Materia</label><input id="capMateria" class="form-control"/></div><div class="form-row"><label class="form-label">Estudiante</label><select id="capStudent" class="form-control"></select></div><div class="form-row"><label class="form-label">Parciales</label><input id="capParciales" class="form-control" placeholder="8.0,9.0"/></div><div class="form-row"><label class="form-label">Final</label><input id="capFinal" class="form-control" type="number"/></div><div class="form-row"><button id="capSubmit" class="btn">Guardar</button></div><div id="capResult" class="muted-small"></div>`;
    populateStudents();
    const btn = document.getElementById('capSubmit'); if(btn) btn.addEventListener('click', saveGrade);
  }

  async function populateStudents(){
    const sel = document.getElementById('capStudent'); if(!sel) return;
    let teacherId = 100; try{ const s = JSON.parse(sessionStorage.getItem('saes_session')||'null'); if(s && (s.id||s.id===0)) teacherId = s.id; }catch(e){}
    const students = await api.getStudentsForTeacher(teacherId);
    sel.innerHTML = (students||[]).map(s=>`<option value="${s.matricula}">${s.nombre} (${s.matricula})</option>`).join('');
    const studentsCount = document.getElementById('studentsCount'); if(studentsCount) studentsCount.textContent = (students||[]).length;
  }

  async function saveGrade(){
    const matricula = (document.getElementById('capStudent')||{}).value; const materia = (document.getElementById('capMateria')||{}).value; const parc = (document.getElementById('capParciales')||{}).value.split(',').map(x=>parseFloat(x.trim())||0); const final = parseFloat((document.getElementById('capFinal')||{}).value)||0;
    const grade = { matricula, materiaId: materia, nombreMateria: materia, profesor: 'Docente Demo', parciales: parc, final, periodo: '2025-2', estado: final>=6? 'Aprobada':'Reprobada' };
    await api.postGrade(grade);
    const res = document.getElementById('capResult'); if(res) res.textContent = 'Calificación guardada.';
    // update pending KPI
    const pending = document.getElementById('pendingCount'); if(pending) pending.textContent = Number(pending.textContent||0) - 1;
  }

  function bindQuick(){
    const btn = document.getElementById('btnQuickFail'); if(btn) btn.addEventListener('click', ()=>{
      // Demo: marcar al primer grupo/alumno con falta en pantalla
      const list = document.querySelectorAll('#groupList li');
      if(!list || list.length===0) return alert('No hay grupos para marcar');
      // show toast
      try{ window.toast && window.toast('Se marcaron faltas (demo)'); }catch(e){}
    });
  }

  // Wire export button and provide a teacher CSV export fallback
  function bindExportReport(){
    const btn = document.getElementById('exportReport'); if(!btn) return;
    btn.addEventListener('click', async ()=>{
      // For demo, reutilizamos exportGradesCSVHandler if available
      if(window.exportGradesCSVHandler){ try{ await window.exportGradesCSVHandler(); return; }catch(e){} }
      alert('Exportar reportes (demo)');
    });
  }

  function init(){ loadGroups(); bindQuick(); bindExportReport(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
