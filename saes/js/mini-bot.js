// Mini in-browser chat bot for ALMA (client-side) - enhanced with FAQ, history, edit/delete, persistence and exports
(function(){
  // Simple local bot — all logic runs in the browser. No server required.
  // Extended FAQ mapping (keywords -> answers)
  const FAQ = [
    { keys: ['horario','horarios'], ans: 'El horario aparece en la sección "Horario" del panel de estudiante. Puedo mostrarte un ejemplo si lo pides.' },
    { keys: ['inscripción','inscribir','matrícula'], ans: 'Para inscribirte utiliza la opción "Inscripción" en Acciones rápidas. Si necesitas ayuda, dime tu duda.' },
    { keys: ['exportar','exportación','csv','pdf'], ans: 'Puedes exportar reportes desde los botones de Exportar (CSV/PDF) en cada vista.' },
    { keys: ['constancia'], ans: 'La constancia la puedes solicitar en Trámites — selecciona "Constancia" y envía la solicitud.' },
    { keys: ['calificaciones','nota','notas','gpa'], ans: 'Las calificaciones se ven en la tabla de Historial. Pide "generar ejemplo" para ver un ejemplo.' },
    { keys: ['trámite','trámites'], ans: 'En Trámites puedes solicitar documentos académicos. Describe el trámite que necesitas.' },
    { keys: ['pago','saldo','cuenta'], ans: 'El estado de cuenta aparece en la sección Cuenta. Si tienes problemas con un pago, dime el detalle.' },
    { keys: ['ayuda','problema','soporte'], ans: 'Cuéntame más del problema y te doy pasos concretos.' },
    { keys: ['gracias','thank'], ans: 'De nada — ¡me alegra ayudar!' }
  ];

  // conversation history kept in-memory and persisted in localStorage
  const LS_KEY = 'alma_mini_chat_history_v1';
  const history = [];

  function saveHistory(){
    try{ localStorage.setItem(LS_KEY, JSON.stringify(history)); }catch(e){/* ignore */}
  }
  function loadHistory(){
    try{
      const raw = localStorage.getItem(LS_KEY); if(!raw) return [];
      const arr = JSON.parse(raw); if(Array.isArray(arr)) return arr; return [];
    }catch(e){ return []; }
  }

  // helper: match FAQ by any key phrase (simple contains, case-insensitive)
  function matchFAQ(text){
    const t = (text||'').toLowerCase();
    for(const item of FAQ){
      for(const k of item.keys){ if(t.includes(k)) return item.ans; }
    }
    return null;
  }

  async function localReply(message){
    const text = (message || '').toLowerCase();
    if(!text) return "No recibí ningún mensaje.";

    // FAQ first (phrase matching)
    const faq = matchFAQ(text); if(faq) return faq;

    if(text.includes('hola') || text.includes('buenas')) return '¡Hola! Soy ALMA Bot — ¿en qué puedo ayudarte?';
    if(text.includes('generar ejemplo') || (text.includes('ejemplo') && history.some(h=>h.role==='user' && /nota|notas|calific/i.test(h.text)))){
      const sample = 'Ejemplo de calificaciones:\n- Matemáticas: 9.0\n- Física: 8.5\n- Historia: 9.5\nGPA: 9.0';
      return sample;
    }

    // fallback
    const fallbacks = [
      `Interesante — cuéntame más sobre "${message}".`,
      `Puedo ayudarte con tareas, notas y exportes. También puedo simular respuestas. Dime qué necesitas.`,
      `Echo: ${message}`
    ];
    return fallbacks[Math.floor(Math.random()*fallbacks.length)];
  }

  function init(){
    const panel = document.querySelector('#almaBot .alma-panel');
    if(!panel) return;
    const body = panel.querySelector('.alma-body');
    if(!body) return;
    if(panel.querySelector('.mini-chat')) return;

  const chatWrap = document.createElement('div'); chatWrap.className = 'mini-chat';
  // make the chat a floating panel so it can be moved via the bubble
  chatWrap.style.position = 'fixed';
  chatWrap.style.width = '320px';
  chatWrap.style.maxWidth = 'calc(100% - 24px)';
  chatWrap.style.boxShadow = '0 6px 22px rgba(0,0,0,0.12)';
  chatWrap.style.borderRadius = '8px';
  chatWrap.style.zIndex = 99999;
  chatWrap.style.background = '#fff';
  chatWrap.style.display = 'none';
  // default position (bottom-right)
  const POS_KEY = 'alma_mini_chat_pos_v1';
  const defaultPos = { right: 18, bottom: 90 };
  function savePos(pos){ try{ localStorage.setItem(POS_KEY, JSON.stringify(pos)); }catch(e){} }
  function loadPos(){ try{ const r = localStorage.getItem(POS_KEY); if(!r) return defaultPos; return JSON.parse(r); }catch(e){ return defaultPos; } }
  const savedPos = loadPos();
  if(savedPos.left !== undefined){ chatWrap.style.left = savedPos.left + 'px'; } else if(savedPos.right !== undefined){ chatWrap.style.right = savedPos.right + 'px'; }
  if(savedPos.top !== undefined){ chatWrap.style.top = savedPos.top + 'px'; } else if(savedPos.bottom !== undefined){ chatWrap.style.bottom = savedPos.bottom + 'px'; }

  chatWrap.innerHTML = `
      <div class="mini-toolbar" style="display:flex;gap:8px;padding:8px;border-bottom:1px solid #eee;">
        <button class="btn tiny" data-action="export-txt">Exportar TXT</button>
        <button class="btn tiny" data-action="export-json">Exportar JSON</button>
        <button class="btn tiny" data-action="export-csv">Exportar CSV</button>
        <button class="btn tiny" data-action="upload">Subir</button>
        <button class="btn tiny" data-action="clear">Limpiar</button>
      </div>
      <div class="mini-messages" aria-live="polite" style="max-height:300px;overflow:auto;padding:8px;display:flex;flex-direction:column;gap:6px;"></div>
      <div class="mini-input" style="display:flex;gap:8px;padding:8px;border-top:1px solid #eee;">
        <input class="form-control" placeholder="Escribe una pregunta al bot..." aria-label="Mensaje al bot" style="flex:1;padding:6px;border:1px solid #ccc;border-radius:4px;" />
        <button class="btn small" style="padding:6px 10px;">Enviar</button>
      </div>
    `;
  // append floating chat to body so it can overlay and be moved
  document.body.appendChild(chatWrap);

    const messages = chatWrap.querySelector('.mini-messages');
    const input = chatWrap.querySelector('input');
    const btn = chatWrap.querySelector('button');

    // floating bubble (draggable) similar to Messenger
    const bubble = document.createElement('button');
    bubble.className = 'mini-bubble';
    bubble.title = 'ALMA Bot';
    bubble.style.position = 'fixed';
    bubble.style.width = '56px'; bubble.style.height = '56px';
    bubble.style.borderRadius = '50%'; bubble.style.background = '#2b80ff'; bubble.style.color='#fff';
    bubble.style.border='none'; bubble.style.boxShadow='0 6px 18px rgba(43,128,255,0.24)';
    bubble.style.zIndex = 100000; bubble.style.display='flex'; bubble.style.alignItems='center'; bubble.style.justifyContent='center';
    bubble.style.cursor = 'grab';
    bubble.textContent = 'AL';
    // initial bubble position (near saved chat pos if present)
    const BPOS_KEY = 'alma_mini_bubble_pos_v1';
    function loadBubblePos(){ try{ const r = localStorage.getItem(BPOS_KEY); if(!r) return { right: 18, bottom: 18 }; return JSON.parse(r); }catch(e){ return { right: 18, bottom: 18 }; } }
    function saveBubblePos(p){ try{ localStorage.setItem(BPOS_KEY, JSON.stringify(p)); }catch(e){} }
    const bpos = loadBubblePos();
    if(bpos.left !== undefined) bubble.style.left = bpos.left + 'px'; else bubble.style.right = (bpos.right || 18) + 'px';
    if(bpos.top !== undefined) bubble.style.top = bpos.top + 'px'; else bubble.style.bottom = (bpos.bottom || 18) + 'px';
    document.body.appendChild(bubble);

    // Drag logic for bubble (pointer events)
    let dragging = false; let startX=0, startY=0, startLeft=0, startTop=0;
    bubble.addEventListener('pointerdown', (ev)=>{
      ev.preventDefault(); bubble.setPointerCapture(ev.pointerId); dragging = true; bubble.style.cursor='grabbing';
      startX = ev.clientX; startY = ev.clientY;
      const rect = bubble.getBoundingClientRect();
      startLeft = rect.left; startTop = rect.top;
    });
    window.addEventListener('pointermove', (ev)=>{
      if(!dragging) return;
      ev.preventDefault();
      const dx = ev.clientX - startX; const dy = ev.clientY - startY;
      let nx = startLeft + dx; let ny = startTop + dy;
      // constrain within viewport
      nx = Math.max(8, Math.min(window.innerWidth - bubble.offsetWidth - 8, nx));
      ny = Math.max(8, Math.min(window.innerHeight - bubble.offsetHeight - 8, ny));
      bubble.style.left = nx + 'px'; bubble.style.top = ny + 'px'; bubble.style.right = 'auto'; bubble.style.bottom = 'auto';
    });
    window.addEventListener('pointerup', (ev)=>{ if(!dragging) return; dragging=false; bubble.style.cursor='grab'; try{ bubble.releasePointerCapture && bubble.releasePointerCapture(ev.pointerId); }catch(e){}; const r = bubble.getBoundingClientRect(); saveBubblePos({ left: Math.round(r.left), top: Math.round(r.top) }); });

    // toggle chat visibility when clicking bubble
    bubble.addEventListener('click', (e)=>{
      // if was dragging, ignore click
      if(dragging) return;
      if(chatWrap.style.display === 'none'){
        chatWrap.style.display = 'block';
        // position chat near bubble if bubble has explicit coords
        const br = bubble.getBoundingClientRect();
        // place chat above bubble if there's space, else left
        const cw = chatWrap.offsetWidth || 320;
        if(br.top > 360){ chatWrap.style.left = Math.max(8, br.left - cw + bubble.offsetWidth) + 'px'; chatWrap.style.top = Math.max(8, br.top - chatWrap.offsetHeight - 8) + 'px'; chatWrap.style.right = 'auto'; chatWrap.style.bottom = 'auto'; }
        else { chatWrap.style.left = Math.max(8, br.left - cw + bubble.offsetWidth) + 'px'; chatWrap.style.top = Math.min(window.innerHeight - chatWrap.offsetHeight - 8, br.bottom + 8) + 'px'; }
      } else {
        chatWrap.style.display = 'none';
      }
    });

    // render history if present
    const persisted = loadHistory();
    if(persisted && persisted.length) {
      persisted.forEach(h => { history.push(h); appendRender(h, false); });
    }

    function makeId(){ return 'm_' + Date.now() + '_' + Math.floor(Math.random()*1000); }

    function appendRender(item, record=true){
      // item: { id, role, text, ts }
      const el = document.createElement('div'); el.className = 'mini-msg ' + (item.role==='user' ? 'user' : 'bot');
      el.style.margin = '6px 0'; el.style.padding = '8px'; el.style.borderRadius = '6px';
      el.style.display = 'flex'; el.style.alignItems = 'flex-start';
      // bubble
      const bubble = document.createElement('div'); bubble.style.flex='1'; bubble.textContent = item.text;
      if(item.role==='user'){
        bubble.style.background = '#e6f7ff'; bubble.style.alignSelf='flex-end'; bubble.style.textAlign='right';
      } else {
        bubble.style.background = '#f4f4f5'; bubble.style.alignSelf='flex-start'; bubble.style.textAlign='left';
      }
      bubble.style.padding='6px'; bubble.style.borderRadius='6px';
      // actions
      const actionsWrap = document.createElement('div'); actionsWrap.style.marginLeft='8px';
      const editBtn = document.createElement('button'); editBtn.textContent='✎'; editBtn.title='Editar'; editBtn.style.marginRight='4px';
      const delBtn = document.createElement('button'); delBtn.textContent='✖'; delBtn.title='Eliminar';
      actionsWrap.appendChild(editBtn); actionsWrap.appendChild(delBtn);

      el.appendChild(bubble); el.appendChild(actionsWrap);
      messages.appendChild(el); messages.scrollTop = messages.scrollHeight;

      // wire actions
      editBtn.addEventListener('click', ()=>{
        const newInput = document.createElement('input'); newInput.type='text'; newInput.value = item.text; newInput.style.flex='1';
        const saveBtn = document.createElement('button'); saveBtn.textContent='Guardar'; saveBtn.style.marginLeft='6px';
        const cancelBtn = document.createElement('button'); cancelBtn.textContent='Cancelar'; cancelBtn.style.marginLeft='6px';
        // replace bubble with editor
        el.replaceChild(newInput, bubble); actionsWrap.style.display='none';
        el.appendChild(saveBtn); el.appendChild(cancelBtn);
        saveBtn.addEventListener('click', ()=>{
          const newText = newInput.value.trim(); if(newText==='') return alert('El mensaje no puede estar vacío');
          bubble.textContent = newText; el.replaceChild(bubble, newInput); saveBtn.remove(); cancelBtn.remove(); actionsWrap.style.display='block';
          // update history
          item.text = newText; item.edited = new Date().toISOString(); saveHistory();
        });
        cancelBtn.addEventListener('click', ()=>{ el.replaceChild(bubble, newInput); saveBtn.remove(); cancelBtn.remove(); actionsWrap.style.display='block'; });
      });

      delBtn.addEventListener('click', ()=>{
        if(!confirm('Eliminar este mensaje?')) return;
        // remove from DOM and history
        const idx = history.findIndex(h => h.id === item.id);
        if(idx !== -1) history.splice(idx,1);
        saveHistory(); el.remove();
      });

      if(record){
        try{ history.push(item); saveHistory(); }catch(e){}
      }
    }

    function append(role, text){
      const it = { id: makeId(), role, text, ts: new Date().toISOString() };
      appendRender(it, true);
      return it;
    }

    function downloadFile(filename, content, type){ const blob = new Blob([content], { type: type || 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }

    function exportConversation(format){ if(!history.length) return alert('No hay conversación para exportar.'); if(format === 'json'){ downloadFile('chat-history.json', JSON.stringify(history, null, 2), 'application/json'); } else if(format === 'csv'){ const rows = [['ts','role','text']]; history.forEach(h=> rows.push([h.ts,h.role, h.text.replace(/"/g,'""')])); const csv = rows.map(r => r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n'); downloadFile('chat-history.csv', csv, 'text/csv'); } else { const lines = history.map(h => `${h.ts} - ${h.role.toUpperCase()}: ${h.text}`); downloadFile('chat-history.txt', lines.join('\n'), 'text/plain'); } }

    // upload endpoint (empty by default, set to real endpoint to enable)
    const UPLOAD_ENDPOINT = ''; // e.g. 'https://mi-api.example.com/chat-upload'
    async function uploadConversation(){
      if(!history.length) return alert('No hay conversación para subir.');
      if(!UPLOAD_ENDPOINT) return alert('No hay endpoint configurado. Edita UPLOAD_ENDPOINT en mini-bot.js si quieres subir la conversación.');
      try{
        const r = await fetch(UPLOAD_ENDPOINT, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ history }) });
        if(!r.ok) throw new Error('Status ' + r.status);
        const json = await r.json(); alert('Subida completada: ' + (json.message || JSON.stringify(json)) );
      }catch(e){ alert('Error subiendo conversación: ' + e.message); }
    }

    const toolbar = chatWrap.querySelector('.mini-toolbar');
    toolbar.addEventListener('click', (e)=>{
      const action = e.target && e.target.getAttribute && e.target.getAttribute('data-action');
      if(!action) return;
      if(action === 'export-txt') exportConversation('txt');
      if(action === 'export-json') exportConversation('json');
      if(action === 'export-csv') exportConversation('csv');
      if(action === 'upload') uploadConversation();
      if(action === 'clear') { messages.innerHTML=''; history.length = 0; saveHistory(); }
    });

    btn.addEventListener('click', async ()=>{
      const text = input.value.trim(); if(!text) return;
      const userItem = append('user', text);
      input.value='';
      // placeholder bot
      const placeholderItem = { id: makeId(), role:'bot', text: 'Escribiendo...', ts: new Date().toISOString() };
      appendRender(placeholderItem, true); // record placeholder so history length matches
      const reply = await localReply(text);
      // find placeholder DOM and replace text
      const phIndex = history.findIndex(h => h.id === placeholderItem.id);
      if(phIndex !== -1){ history[phIndex].text = reply; history[phIndex].ts = new Date().toISOString(); saveHistory(); }
      // re-render: simplest approach — update last placeholder element text
      const phEl = messages.querySelector('.mini-msg.bot:last-child'); if(phEl) phEl.querySelector('div').textContent = reply;
    });

    input.addEventListener('keydown', (e)=>{ if(e.key === 'Enter'){ e.preventDefault(); btn.click(); } });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
