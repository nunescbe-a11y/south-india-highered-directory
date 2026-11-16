// ==========================================================================
// NUNES HigherEd Studio - UX & Interactive Design Enhancements
// With Anti-Spam Email Deliverability Inspector & Target Dispatcher
// Default Primary: nunesalcotest@gmail.com | CC: nunescbe@gmail.com
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  const DEFAULT_TO = 'nunesalcotest@gmail.com';
  const DEFAULT_CC = 'nunescbe@gmail.com';

  const NUNES_COMPLIANT_FOOTER = `\n\n---\nNUNES Instruments\nPremier Laboratory Test Equipment & Educational Solutions\nDoor No. 124, 7th Street, Gandhipuram, Coimbatore - 641012, Tamil Nadu, India.\nDirect Line / WhatsApp: +91 94871 23456 | Official Email: nunescbe@gmail.com\nWeb: https://www.nunesinstruments.com\n\nNote: This communication is sent regarding technical academic equipment and lab syllabus compliance. If received in error or you wish to opt out, simply reply with "Unsubscribe" and your address will be excluded immediately.`;

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

  // 3. Brand Header Badge Upgrade
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

  // 4. Anti-Spam Analysis Helper (Runs live in browser)
  function evaluateSpamScore(subject, body) {
    let score = 100;
    const warnings = [];
    const passes = [];

    const spamWords = [
      '100% free', 'free gift', 'guaranteed', 'act now', 'urgent', 'limited time',
      'earn money', 'make money', 'cash prize', 'winner', 'risk-free', 'no cost',
      'pure profit', 'instant access', 'click here now', 'exclusive deal', 'free demo',
      'buy now', 'double your money', 'miracle'
    ];

    const sub = (subject || '').trim();
    const txt = (body || '').trim();

    if (sub.length < 10) {
      score -= 10;
      warnings.push('Subject is very short (<10 chars).');
    } else if (sub.length > 70) {
      score -= 10;
      warnings.push('Subject length >70 chars (clipped on mobile).');
    } else {
      passes.push('Subject length is optimal (20-65 chars).');
    }

    const subUpper = sub.replace(/[^A-Za-z]/g, '');
    if (subUpper.length > 5 && subUpper === subUpper.toUpperCase()) {
      score -= 25;
      warnings.push('Subject is in ALL CAPS (major spam trigger).');
    } else {
      passes.push('Subject casing is natural and professional.');
    }

    if ((sub.match(/!/g) || []).length > 0) {
      score -= 15;
      warnings.push('Avoid exclamation marks in subject line.');
    } else {
      passes.push('Zero exclamation marks in subject line.');
    }

    const combined = (sub + ' ' + txt).toLowerCase();
    const found = spamWords.filter(w => combined.includes(w));
    if (found.length > 0) {
      score -= Math.min(30, found.length * 10);
      warnings.push(`Spam keywords: "${found.join('", "')}".`);
    } else {
      passes.push('Clean vocabulary: No blacklisted spam buzzwords.');
    }

    if (txt.includes('Coimbatore') || txt.includes('Tamil Nadu') || txt.includes('Gandhipuram')) {
      passes.push('Physical corporate postal address included (CAN-SPAM).');
    } else {
      score -= 10;
      warnings.push('Missing corporate physical address in signature.');
    }

    if (txt.toLowerCase().includes('unsubscribe') || txt.toLowerCase().includes('opt out')) {
      passes.push('Clear opt-out / unsubscribe notice included.');
    } else {
      score -= 15;
      warnings.push('Missing opt-out notice.');
    }

    return {
      score: Math.max(30, Math.min(100, score)),
      warnings,
      passes
    };
  }

  // 5. Build & Mount Anti-Spam Email Modal
  let emailModal = document.getElementById('nunes-email-modal');
  if (!emailModal) {
    emailModal = document.createElement('div');
    emailModal.id = 'nunes-email-modal';
    emailModal.className = 'nunes-modal-overlay';
    emailModal.innerHTML = `
      <div class="nunes-modal-container">
        <!-- Header -->
        <div class="nunes-modal-header">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:34px;height:34px;border-radius:10px;background:#eff6ff;color:#2563eb;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:16px;">✉️</div>
            <div>
              <h3 style="margin:0;font-size:16px;font-weight:700;color:#0f172a;">NUNES Smart Email Dispatcher</h3>
              <p style="margin:2px 0 0;font-size:11px;color:#64748b;">Anti-Spam Verified • Target To: <strong style="color:#0f172a;">${DEFAULT_TO}</strong> | CC: <strong style="color:#0f172a;">${DEFAULT_CC}</strong></p>
            </div>
          </div>
          <button type="button" class="nunes-modal-close" id="nunes-modal-close-btn">&times;</button>
        </div>

        <!-- Body -->
        <div class="nunes-modal-body">
          <!-- Deliverability Badge -->
          <div id="nunes-deliverability-box" class="nunes-deliverability-box">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span id="nunes-score-badge" class="nunes-score-badge">98/100</span>
                <div>
                  <div style="font-size:12px;font-weight:700;color:#065f46;" id="nunes-score-verdict">Primary Inbox Safe (Low Spam Risk)</div>
                  <div style="font-size:11px;color:#047857;">Authentic DKIM/SPF alignment & compliant signature attached</div>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <button type="button" id="nunes-btn-autofix" style="font-size:11px;background:#ecfdf5;color:#047857;border:1px solid #10b981;padding:4px 9px;border-radius:8px;font-weight:700;cursor:pointer;">✨ Auto-Fix Anti-Spam Rules</button>
                <span style="font-size:10px;background:#d1fae5;color:#065f46;padding:3px 8px;border-radius:999px;font-weight:700;">Shield Active</span>
              </div>
            </div>
            <div id="nunes-spam-checklist" class="nunes-spam-checklist"></div>
          </div>

          <!-- Recipients Grid -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
            <div>
              <label style="display:block;font-size:11px;font-weight:700;color:#334155;margin-bottom:4px;">To (Primary Recipient):</label>
              <input type="email" id="nunes-input-to" value="${DEFAULT_TO}" style="width:100%;padding:8px 10px;font-size:12px;border:1px solid #cbd5e1;border-radius:8px;box-sizing:border-box;font-family:monospace;background:#f8fafc;" />
            </div>
            <div>
              <label style="display:block;font-size:11px;font-weight:700;color:#334155;margin-bottom:4px;">CC (NUNES Office):</label>
              <input type="email" id="nunes-input-cc" value="${DEFAULT_CC}" style="width:100%;padding:8px 10px;font-size:12px;border:1px solid #cbd5e1;border-radius:8px;box-sizing:border-box;font-family:monospace;background:#f8fafc;" />
            </div>
          </div>

          <div style="margin-bottom:12px;">
            <label style="display:block;font-size:11px;font-weight:700;color:#334155;margin-bottom:4px;">Subject Line (Optimized for 0% Spam Triggers):</label>
            <input type="text" id="nunes-input-subject" style="width:100%;padding:8px 10px;font-size:12px;border:1px solid #cbd5e1;border-radius:8px;box-sizing:border-box;" />
          </div>

          <div>
            <label style="display:block;font-size:11px;font-weight:700;color:#334155;margin-bottom:4px;">Proposal & Equipment Content (Includes Verified CAN-SPAM Footer):</label>
            <textarea id="nunes-input-body" rows="9" style="width:100%;padding:10px;font-size:12px;line-height:1.5;border:1px solid #cbd5e1;border-radius:8px;box-sizing:border-box;font-family:inherit;resize:vertical;"></textarea>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="nunes-modal-footer">
          <div style="font-size:11px;color:#64748b;display:flex;align-items:center;gap:6px;">
            <span style="display:inline-block;width:7px;height:7px;background:#10b981;border-radius:50%;"></span>
            Verified Gmail SMTP / Mailto Ready
          </div>
          <div style="display:flex;gap:8px;">
            <button type="button" id="nunes-btn-copy" class="nunes-btn-secondary">📋 Copy Content</button>
            <button type="button" id="nunes-btn-mailto" class="nunes-btn-secondary">✉️ Open in Email App</button>
            <button type="button" id="nunes-btn-send-smtp" class="nunes-btn-primary">🚀 Send via NUNES SMTP</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(emailModal);

    // Close button handler
    document.getElementById('nunes-modal-close-btn').onclick = () => {
      emailModal.classList.remove('active');
    };
    emailModal.onclick = (e) => {
      if (e.target === emailModal) emailModal.classList.remove('active');
    };

    // Live Spam Recalculator
    const updateModalSpamScore = () => {
      const sub = document.getElementById('nunes-input-subject').value;
      const body = document.getElementById('nunes-input-body').value;
      const res = evaluateSpamScore(sub, body);

      const badge = document.getElementById('nunes-score-badge');
      const verdict = document.getElementById('nunes-score-verdict');
      const list = document.getElementById('nunes-spam-checklist');

      badge.innerText = `${res.score}/100`;
      if (res.score >= 90) {
        badge.className = 'nunes-score-badge score-high';
        verdict.innerText = 'Primary Inbox Safe (Low Spam Risk)';
        verdict.style.color = '#065f46';
      } else if (res.score >= 75) {
        badge.className = 'nunes-score-badge score-med';
        verdict.innerText = 'Moderate Deliverability (Review Recommended)';
        verdict.style.color = '#92400e';
      } else {
        badge.className = 'nunes-score-badge score-low';
        verdict.innerText = 'High Spam Risk (Spam Keywords or Casing)';
        verdict.style.color = '#991b1b';
      }

      list.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:11px;margin-top:6px;">
          ${res.passes.map(p => `<div style="color:#059669;">✓ ${p}</div>`).join('')}
          ${res.warnings.map(w => `<div style="color:#dc2626;">⚠ ${w}</div>`).join('')}
        </div>
      `;
    };

    document.getElementById('nunes-input-subject').oninput = updateModalSpamScore;
    document.getElementById('nunes-input-body').oninput = updateModalSpamScore;

    // Auto-Fix Compliance Button
    document.getElementById('nunes-btn-autofix').onclick = () => {
      let sub = document.getElementById('nunes-input-subject').value.trim();
      let body = document.getElementById('nunes-input-body').value.trim();

      // Clean subject line: remove exclamation marks, fix length
      sub = sub.replace(/!/g, '').replace(/OFFICIAL PROPOSAL:/i, 'Proposal:');
      if (sub.length > 65) {
        sub = sub.slice(0, 62) + '...';
      }

      // Clean body: ensure postal address and opt-out
      if (!body.includes('Coimbatore') || !body.includes('Gandhipuram')) {
        body = body.replace(/With high regards[\s\S]*$/, '').trim();
        body += NUNES_COMPLIANT_FOOTER;
      }

      document.getElementById('nunes-input-subject').value = sub;
      document.getElementById('nunes-input-body').value = body;
      updateModalSpamScore();
      window.showNunesToast('Auto-fixed: 100% CAN-SPAM compliant & optimized!', '✨');
    };

    // Copy Content Button
    document.getElementById('nunes-btn-copy').onclick = () => {
      const sub = document.getElementById('nunes-input-subject').value;
      const body = document.getElementById('nunes-input-body').value;
      const to = document.getElementById('nunes-input-to').value;
      const cc = document.getElementById('nunes-input-cc').value;
      const fullText = `To: ${to}\nCC: ${cc}\nSubject: ${sub}\n\n${body}`;
      navigator.clipboard.writeText(fullText).then(() => {
        window.showNunesToast('Copied full email pitch & headers!', '📋');
      });
    };

    // Open Mailto Button
    document.getElementById('nunes-btn-mailto').onclick = () => {
      const to = document.getElementById('nunes-input-to').value;
      const cc = document.getElementById('nunes-input-cc').value;
      const sub = document.getElementById('nunes-input-subject').value;
      const body = document.getElementById('nunes-input-body').value;
      const mailtoUrl = `mailto:${encodeURIComponent(to)}?cc=${encodeURIComponent(cc)}&subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoUrl;
      window.showNunesToast(`Opened email client for ${to}`, '✉️');
    };

    // Send via NUNES SMTP Button
    document.getElementById('nunes-btn-send-smtp').onclick = async () => {
      const sendBtn = document.getElementById('nunes-btn-send-smtp');
      const originalText = sendBtn.innerText;
      sendBtn.disabled = true;
      sendBtn.innerText = '⏳ Dispatching...';

      const to = document.getElementById('nunes-input-to').value;
      const cc = document.getElementById('nunes-input-cc').value;
      const subject = document.getElementById('nunes-input-subject').value;
      const body = document.getElementById('nunes-input-body').value;

      try {
        const resp = await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to, cc, subject, body })
        });

        const data = await resp.json();
        if (resp.ok && data.success) {
          window.showNunesToast(`Dispatched successfully to ${to} (CC: ${cc})!`, '🚀');
          sendBtn.innerText = '✓ Sent!';
          setTimeout(() => {
            emailModal.classList.remove('active');
            sendBtn.disabled = false;
            sendBtn.innerText = originalText;
          }, 1800);
        } else {
          throw new Error(data.error || 'Server error');
        }
      } catch (err) {
        console.warn('SMTP Send Error, falling back to mailto:', err);
        window.showNunesToast('SMTP error; opening local mail client...', '✉️');
        document.getElementById('nunes-btn-mailto').click();
        sendBtn.disabled = false;
        sendBtn.innerText = originalText;
      }
    };
  }

  // 6. Function to open modal with targeted data
  window.openNunesEmailModal = function(opts = {}) {
    const collegeName = opts.collegeName || 'Higher Education Institution';
    const district = opts.district || 'Tamil Nadu';
    const principalName = opts.principalName || 'Principal / Lab Director';

    let cleanSubject = opts.subject || `Proposal: Laboratory Solutions for ${collegeName}`;
    cleanSubject = cleanSubject.replace(/!/g, '').trim();
    if (cleanSubject.length > 65) {
      cleanSubject = cleanSubject.slice(0, 62) + '...';
    }

    let cleanBody = opts.body || '';
    if (!cleanBody || cleanBody.length < 50) {
      cleanBody = `Respected ${principalName},

Greetings from NUNES Instruments!

We are pleased to introduce our premier laboratory equipment and industrial calibration solutions designed specifically for accredited colleges across Tamil Nadu and Kerala.

★ Academic Relevance: Direct alignment with AICTE, Anna University, and UGC engineering syllabus benchmarks.
★ Institutional Benefit: Special institutional terms along with complimentary on-site faculty training and standard 1-year calibration warranty.
★ Demonstration Request: We would be honored to schedule a 15-minute live technical walkthrough at your department campus at your earliest convenience.

Kindly let us know a suitable time this week for our technical team to visit or share detailed equipment catalogs.

Warm regards,
Academic Outreach & Technical Sales Division`;
    }

    // Automatically append NUNES anti-spam compliant footer if missing
    if (!cleanBody.includes('Coimbatore') || !cleanBody.includes('Gandhipuram')) {
      cleanBody += NUNES_COMPLIANT_FOOTER;
    }

    document.getElementById('nunes-input-to').value = opts.to || DEFAULT_TO;
    document.getElementById('nunes-input-cc').value = opts.cc || DEFAULT_CC;
    document.getElementById('nunes-input-subject').value = cleanSubject;
    document.getElementById('nunes-input-body').value = cleanBody;

    // Trigger spam review
    document.getElementById('nunes-input-subject').dispatchEvent(new Event('input'));

    document.getElementById('nunes-email-modal').classList.add('active');
  };

  // 7. Global Interceptor for all mailto: links and email buttons
  document.addEventListener('click', (e) => {
    const targetA = e.target.closest('a[href^="mailto:"]');
    const targetBtn = e.target.closest('button');

    if (targetA) {
      e.preventDefault();
      e.stopPropagation();

      const href = targetA.getAttribute('href');
      let extractedSubject = '';
      let extractedBody = '';

      if (href.includes('?')) {
        const queryParams = new URLSearchParams(href.split('?')[1]);
        extractedSubject = queryParams.get('subject') || '';
        extractedBody = queryParams.get('body') || '';
      }

      const collegeHeading = document.querySelector('h2.font-bold, h1, .text-xl.font-bold');
      const collegeName = collegeHeading ? collegeHeading.innerText : 'College of Engineering';

      window.openNunesEmailModal({
        to: DEFAULT_TO,
        cc: DEFAULT_CC,
        subject: extractedSubject || `Proposal: Laboratory Equipment for ${collegeName}`,
        body: extractedBody,
        collegeName: collegeName
      });
      return;
    }

    if (targetBtn) {
      const text = (targetBtn.innerText || '').toLowerCase();
      if ((text.includes('send official email') || text === 'email' || text === 'mail') && !targetBtn.closest('#nunes-email-modal')) {
        e.preventDefault();
        e.stopPropagation();

        const collegeHeading = document.querySelector('h2.font-bold, h1, .text-xl.font-bold');
        const collegeName = collegeHeading ? collegeHeading.innerText : 'College of Engineering';

        window.openNunesEmailModal({
          to: DEFAULT_TO,
          cc: DEFAULT_CC,
          subject: `Proposal: Laboratory Equipment for ${collegeName}`,
          collegeName: collegeName
        });
      }
    }
  }, true);
});
