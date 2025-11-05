// Accessible toast helper — exposes `window.showToast(message, timeout)`
(function(){
  function createWrap(){
    let wrap = document.querySelector('.toast-wrap');
    if(!wrap){
      wrap = document.createElement('div');
      wrap.className = 'toast-wrap';
      wrap.setAttribute('aria-live','polite');
      wrap.setAttribute('aria-atomic','true');
      document.body.appendChild(wrap);
    }
    return wrap;
  }

  function showToast(message, timeout=3500){
    const wrap = createWrap();
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = message;
    t.setAttribute('role','status');
    wrap.appendChild(t);
    // entrance
    requestAnimationFrame(()=> t.style.opacity = '1');
    setTimeout(()=>{
      t.style.opacity = '0';
      setTimeout(()=> t.remove(), 300);
    }, timeout);
  }

  window.showToast = showToast;
  // backward compat alias used in some files
  window.toast = showToast;
})();
