(() => {
  const install = () => {
    const viewer = document.getElementById('viewer');
    if (!viewer || document.getElementById('secretBypass')) return;

    const button = document.createElement('button');
    button.id = 'secretBypass';
    button.type = 'button';
    button.textContent = '⌁';
    button.title = 'Developer bypass — skip simulated pipeline';
    button.setAttribute('aria-label', 'Skip simulated reconstruction pipeline');
    button.hidden = true;

    const style = document.createElement('style');
    style.textContent = `
      #secretBypass {
        position:absolute;right:12px;bottom:12px;z-index:20;width:26px;height:26px;
        border:1px solid rgba(91,231,255,.16);border-radius:7px;background:rgba(5,16,24,.55);
        color:rgba(91,231,255,.18);font:700 14px/1 Inter,sans-serif;cursor:pointer;
        opacity:.08;transition:opacity .2s,transform .2s,border-color .2s,color .2s;
        backdrop-filter:blur(6px);
      }
      #secretBypass:hover {opacity:1;transform:scale(1.08);color:#5be7ff;border-color:rgba(91,231,255,.55);}
      #secretBypass:active {transform:scale(.94);}
    `;
    document.head.appendChild(style);
    viewer.appendChild(button);

    const sync = () => {
      const screen = document.getElementById('processingScreen');
      button.hidden = !screen || screen.hidden;
    };

    const observer = new MutationObserver(sync);
    observer.observe(document.getElementById('processingScreen'), { attributes:true, attributeFilter:['hidden','style'] });
    sync();

    button.addEventListener('click', () => {
      const screen = document.getElementById('processingScreen');
      if (!screen || screen.hidden) return;

      window.__meshforgeBypass = true;
      window.__pipelineProgress = 1;

      // Prefer the real pipeline completion hook so internal state is cleared too.
      if (typeof window.__meshforgeFinishPipeline === 'function') {
        window.__meshforgeFinishPipeline();
        button.hidden = true;
        return;
      }

      // Compatibility fallback for an older cached app.js.
      const deadline = window.__pipelineEnd;
      if (Number.isFinite(deadline)) {
        try {
          const proto = Object.getPrototypeOf(performance);
          const originalProtoNow = proto.now;
          const originalOwnNow = performance.now;
          proto.now = () => deadline + 1000;
          performance.now = () => deadline + 1000;
          setTimeout(() => {
            try { proto.now = originalProtoNow; } catch {}
            try { performance.now = originalOwnNow; } catch {}
          }, 1500);
        } catch {}
      }

      setTimeout(() => {
        screen.hidden = true;
        screen.style.display = 'none';
        const placeholder = document.getElementById('outputPlaceholder');
        if (placeholder) placeholder.style.display = 'none';
        const loading = document.getElementById('modelLoading');
        if (loading) { loading.hidden = true; loading.style.display = 'none'; }
        const canvas = viewer.querySelector('canvas');
        if (canvas) canvas.style.visibility = 'visible';
        const download = document.getElementById('downloadBtn');
        if (download) download.hidden = false;
        const status = document.getElementById('modelStatus');
        if (status) { status.textContent = '● VIEW READY'; status.classList.add('online'); }
        const badge = document.getElementById('inputBadge');
        if (badge) badge.textContent = 'BYPASSED';
        const process = document.getElementById('processBtn');
        if (process) { process.disabled = false; process.classList.remove('processing'); process.innerHTML = '<span>✓</span> Reconstruction Complete'; }
        button.hidden = true;
      }, 120);
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();