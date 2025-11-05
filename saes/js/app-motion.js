// Small motion/helpers for dashboard (skeletons, countUp)
(function(){
  function renderTableSkeleton(tbody, rows=4, cols=4){
    if(!tbody) return;
    tbody.innerHTML = '';
    for(let r=0;r<rows;r++){
      const tr = document.createElement('tr');
      for(let c=0;c<cols;c++){
        const td = document.createElement('td');
        td.className = 'skeleton';
        td.style.minHeight = '14px';
        td.style.background = 'linear-gradient(90deg, rgba(0,0,0,0.04), rgba(0,0,0,0.02))';
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
  }

  function countUp(el, to, duration=800){
    if(!el) return;
    const start = 0; const diff = to - start; const startTime = performance.now();
    function step(now){
      const t = Math.min(1, (now - startTime)/duration);
      const v = Math.round(start + diff * t);
      el.textContent = v;
      if(t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function fadeIn(el, duration=300){
    if(!el) return;
    el.style.opacity = 0; el.style.transform = 'translateY(6px)';
    el.style.transition = `opacity ${duration}ms var(--easing), transform ${duration}ms var(--easing)`;
    requestAnimationFrame(()=>{ el.style.opacity = 1; el.style.transform = 'translateY(0)'; });
    setTimeout(()=>{ el.style.transition=''; }, duration+50);
  }

  function fadeOut(el, duration=220){
    if(!el) return;
    el.style.opacity = 1; el.style.transform = 'translateY(0)';
    el.style.transition = `opacity ${duration}ms var(--easing), transform ${duration}ms var(--easing)`;
    requestAnimationFrame(()=>{ el.style.opacity = 0; el.style.transform = 'translateY(6px)'; });
    setTimeout(()=>{ try{ if(el.parentNode) el.parentNode.removeChild(el); }catch(e){} }, duration+80);
  }

  window.appMotion = { renderTableSkeleton, countUp, fadeIn, fadeOut };
})();
