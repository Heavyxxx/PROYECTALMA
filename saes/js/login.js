// js/login.js
// Animación letra-por-letra para #pageWelcome (respeta prefers-reduced-motion)
// Hooks: form submit (id=loginForm) debe ser manejado por tu app (doLogin / api-mock), aquí solo se previene default.

(function(){
  const text = 'Bienvenido a A.L.M.A.';
  const container = document.getElementById('pageWelcome');
  // If the page has a static welcome element, don't override it
  if(container && container.classList.contains('page-welcome-static')){
    // nothing to do — static welcome is already present
  } else if(container){
    const mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    container.innerHTML = '';
    const inner = document.createElement('div');
    inner.className = 'welcome-inner';
    Array.from(text).forEach((ch, i) => {
      const sp = document.createElement('span');
      sp.className = 'letter';
      sp.textContent = ch;
      // delay via inline style
      sp.style.setProperty('--delay', `${i * 70}ms`);
      sp.style.animationDelay = `${i * 70}ms`;
      inner.appendChild(sp);
    });
    container.appendChild(inner);
    if(!mq){
      // trigger animation (add class to allow CSS to pick up animation-delay)
      setTimeout(()=> container.classList.add('play'), 50);
    } else {
      // respect reduced motion: reveal immediately
      container.querySelectorAll('.letter').forEach(l => { l.style.opacity = '1'; l.style.transform = 'none'; });
    }
  }

  // Lightweight form hookup: prevent default and delegate to existing app.doLogin if present
  const form = document.getElementById('loginForm');
  if(form){
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const user = document.getElementById('loginUser')?.value;
      const pass = document.getElementById('loginPass')?.value;
      // Prefer existing global doLogin or window.api.login integration
      if(typeof window.doLogin === 'function'){
        try{ window.doLogin(user, pass); }catch(e){ console.warn('doLogin handler failed', e); }
        return;
      }
      // fallback: store demo session (for local preview only)
      try{
        if(window.api && typeof window.api.login === 'function'){
          window.api.login(user, pass).then(res => {
            // Minimal demo behaviour: set session and reload
            const session = res.role === 'student' ? { role:'student', matricula: res.matricula||user, name: res.name||user } : { role: res.role, id: res.id||user, name: res.name||user };
            sessionStorage.setItem('saes_session', JSON.stringify(session));
            location.href = 'student.html';
          }).catch(err => {
            alert(err.message || 'Error autenticando');
          });
        } else {
          // No API: fake a session for demo
          sessionStorage.setItem('saes_session', JSON.stringify({ role:'student', matricula: user || 'A12345', name: 'Alumno Demo' }));
          location.href = 'student.html';
        }
      }catch(e){ console.error(e); alert('Error al iniciar sesión (demo)'); }
    });
  }
})();