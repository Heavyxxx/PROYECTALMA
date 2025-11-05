// ALMA Bot — simple floating assistant (UI + hooks)
(function(){
  function initAlmaBot(){
    if(document.getElementById('almaBot')) return;
    const bot = document.createElement('div'); bot.id = 'almaBot'; bot.className = 'alma-bot';
    bot.innerHTML = `
      <button aria-label="ALMA Bot" class="alma-btn">🤖</button>
      <div class="alma-panel hidden" role="dialog" aria-label="ALMA Bot" aria-hidden="true">
        <div class="alma-header">ALMA — Asistente</div>
        <div class="alma-body">
          <div class="alma-msg">Hola — puedo ayudarte con trámites, exportar tu tira o revisar tu horario.</div>
          <div class="alma-actions">
            <button class="btn small" data-action="export">Exportar tira</button>
            <button class="btn small" data-action="tramite">Solicitar trámite</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(bot);
    bot.querySelector('.alma-btn').addEventListener('click', ()=>{
      const panel = bot.querySelector('.alma-panel'); panel.classList.toggle('hidden'); panel.setAttribute('aria-hidden', panel.classList.contains('hidden'));
    });
    bot.querySelectorAll('[data-action]').forEach(b=> b.addEventListener('click', (e)=>{
      const a = e.target.dataset.action;
      if(a==='export') window.setTimeout(()=> window.showToast && window.showToast('Iniciando exportación...'), 10);
      if(a==='tramite') window.setTimeout(()=> window.showToast && window.showToast('Formulario de trámite abierto'), 10);
      // trigger actual actions when possible
      if(a==='export'){
        try{ if(window.setRoute) window.setRoute('dashboard'); window.exportGradesCSVHandler && window.exportGradesCSVHandler(); }
        catch(err){ console.warn('alma export failed', err); }
      }
    }));
  }
  // Basic styles inserted dynamically to keep single file
  const css = `
  .alma-bot{position:fixed;right:18px;bottom:18px;z-index:120;font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial;}
  .alma-btn{width:56px;height:56px;border-radius:999px;border:0;background:var(--color-accent);color:white;font-size:20px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(11,18,32,0.12)}
  .alma-panel{width:320px;margin-bottom:12px;background:var(--color-surface);border-radius:12px;padding:12px;border:1px solid rgba(11,18,32,0.06);box-shadow:var(--shadow-sm);opacity:0;transform:translateY(8px);transition:opacity 220ms var(--anim-spring), transform 220ms var(--anim-spring);display:flex;flex-direction:column;gap:10px}
  .alma-panel.hidden{opacity:0; transform:translateY(8px); pointer-events:none}
  .alma-panel:not(.hidden){opacity:1; transform:none; pointer-events:auto}
  .alma-header{font-weight:700;margin-bottom:4px;display:flex;align-items:center;justify-content:space-between;gap:8px}
  .alma-body{display:flex;flex-direction:column;gap:10px;padding:6px 0;max-height:360px;overflow:hidden}
  .alma-msg{padding:10px;border-radius:10px;background:rgba(11,18,32,0.04);line-height:1.3}
  .alma-actions{display:flex;gap:10px;justify-content:flex-end;padding-top:6px}
  .alma-actions .btn{padding:8px 10px;font-size:13px}
  /* Chat-specific styles (used by ollama-bot) */
  .ollama-chat{display:flex;flex-direction:column;gap:8px}
  .ollama-messages{max-height:220px;overflow:auto;padding:6px;display:flex;flex-direction:column;gap:8px}
  .ollama-msg{max-width:100%;padding:8px 10px;border-radius:10px;word-wrap:break-word}
  .ollama-msg.user{align-self:flex-end;background:linear-gradient(180deg, rgba(139,30,47,0.12), rgba(139,30,47,0.06));color:var(--color-text)}
  .ollama-msg.bot{align-self:flex-start;background:rgba(11,18,32,0.04);color:var(--color-text)}
  .ollama-input{display:flex;gap:8px;padding-top:6px}
  .ollama-input .form-control{flex:1;padding:8px 10px}
  .ollama-input .btn{padding:8px 10px}
  @media (max-width:420px){ .alma-panel{width:280px} .ollama-messages{max-height:180px} }
  `;
  const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
  // init on DOM ready
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', initAlmaBot); else initAlmaBot();
})();
