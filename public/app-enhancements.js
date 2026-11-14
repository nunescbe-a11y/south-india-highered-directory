// ==========================================================================
// NUNES HigherEd Studio - UX & Interactive Design Enhancements
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Toast Notification Helper
  let toastEl = document.getElementById('nunes-toast');
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'nunes-toast';
    document.body.appendChild(toastEl);
  }

  window.showNunesToast = function(msg, icon = '✓') {
    toastEl.innerHTML = `<span style="color:#34d399">${icon}</span> <span>${msg}</span>`;
    toastEl.classList.add('show');
    clearTimeout(window._nunesToastTimer);
    window._nunesToastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2800);
  };

  // 2. Global Shortcut: Ctrl+K or / to focus search
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' || (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA')) {
      e.preventDefault();
      const searchInput = document.querySelector('input[placeholder*="Spotlight"], input[placeholder*="Search"]');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
        window.showNunesToast('Spotlight search focused (ESC to cancel)', '🔍');
      }
    }
  });

  // 3. Monitor Copy Actions for Instant Toast Feedback
  document.addEventListener('click', (e) => {
    const copyBtn = e.target.closest('button');
    if (copyBtn) {
      const text = copyBtn.innerText || copyBtn.getAttribute('title') || '';
      if (text.includes('Copy') || text.includes('copy') || copyBtn.querySelector('svg')) {
        setTimeout(() => {
          if (copyBtn.innerText.includes('Copied')) {
            window.showNunesToast('Copied to clipboard!', '📋');
          }
        }, 150);
      }
    }
  });

  // 4. Brand Header Badge Upgrade
  const checkHeader = setInterval(() => {
    const brandBtn = document.querySelector('header button.font-display');
    if (brandBtn && !brandBtn.dataset.enhanced) {
      brandBtn.dataset.enhanced = 'true';
      brandBtn.innerHTML = `
        <span style="display:inline-flex;align-items:center;gap:10px;">
          <span style="background:linear-gradient(135deg, #1e3a8a, #2563eb);color:#fff;padding:3px 9px;border-radius:8px;font-size:12px;font-weight:900;letter-spacing:0.5px;box-shadow:0 2px 6px rgba(37,99,235,0.3);">NUNES</span>
          <span style="font-size:16px;font-weight:800;letter-spacing:-0.03em;color:#0f172a;">TN &amp; Kerala HigherEd</span>
          <span style="display:inline-flex;align-items:center;gap:5px;background:#ecfdf5;color:#065f46;border:1px solid #6ee7b7;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;">
            <span style="width:6px;height:6px;background:#10b981;border-radius:50%;box-shadow:0 0 0 2px rgba(16,185,129,0.3);"></span>
            4,990 CENSUS
          </span>
        </span>
      `;
      clearInterval(checkHeader);
    }
  }, 200);

  setTimeout(() => clearInterval(checkHeader), 10000);
});
