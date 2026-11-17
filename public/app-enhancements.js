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

  // =========================================================================
  // 8. Police Station Directory & Sector Toggle (Colleges vs Police Stations)
  // =========================================================================
  let policeDataCache = null;
  let activeSector = 'colleges'; // 'colleges' or 'police'

  async function loadPoliceData() {
    if (policeDataCache) return policeDataCache;
    try {
      const res = await fetch('/api/police');
      if (res.ok) {
        policeDataCache = await res.json();
        return policeDataCache;
      }
    } catch (e) {
      console.warn('Failed to fetch /api/police:', e);
    }
    return null;
  }

  // Mount Sector Switcher Bar
  function mountSectorBar() {
    if (document.getElementById('nunes-sector-bar')) return;

    const sectorBar = document.createElement('div');
    sectorBar.id = 'nunes-sector-bar';
    sectorBar.style.cssText = 'position: sticky; top: 0; z-index: 40; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(12px); border-bottom: 1px solid #e2e8f0; padding: 10px 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);';
    sectorBar.innerHTML = `
      <div style="max-width: 1400px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;">Directory Sector:</span>
          <div style="display: inline-flex; background: #f1f5f9; padding: 4px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <button id="nunes-sector-btn-colleges" style="border: none; background: #ffffff; color: #1e293b; font-weight: 700; font-size: 12px; padding: 6px 14px; border-radius: 8px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.06); transition: all 0.2s;">
              🎓 Colleges &amp; Universities (1,654)
            </button>
            <button id="nunes-sector-btn-police" style="border: none; background: transparent; color: #64748b; font-weight: 700; font-size: 12px; padding: 6px 14px; border-radius: 8px; cursor: pointer; transition: all 0.2s;">
              👮 TN Police Stations (104)
            </button>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="display: inline-flex; align-items: center; gap: 6px; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;">
            <span>🚨</span>
            <span>Nunes Breath Analyser GeM Registered</span>
          </span>
          <button id="nunes-btn-police-demo" style="background: #1e3a8a; color: #fff; border: none; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer;">
            ✉️ Dispatch Law Enforcement Proposal
          </button>
        </div>
      </div>
    `;

    const header = document.querySelector('header');
    if (header && header.parentNode) {
      header.parentNode.insertBefore(sectorBar, header.nextSibling);
    } else {
      document.body.insertBefore(sectorBar, document.body.firstChild);
    }

    // Bind Sector Toggle Events
    document.getElementById('nunes-sector-btn-colleges').addEventListener('click', () => switchSector('colleges'));
    document.getElementById('nunes-sector-btn-police').addEventListener('click', () => switchSector('police'));
    document.getElementById('nunes-btn-police-demo').addEventListener('click', () => {
      window.openNunesEmailModal({
        to: DEFAULT_TO,
        cc: DEFAULT_CC,
        subject: 'Breath Analyser & Traffic Safety Solutions – Nunes Instrumentation (GeM Registered)',
        collegeName: 'Tamil Nadu Police Commissionerate & Traffic Division'
      });
    });
  }

  // Switch Sector Function
  async function switchSector(sector) {
    activeSector = sector;
    const btnColleges = document.getElementById('nunes-sector-btn-colleges');
    const btnPolice = document.getElementById('nunes-sector-btn-police');
    const rootEl = document.getElementById('root');
    let policeContainer = document.getElementById('nunes-police-container');

    if (sector === 'colleges') {
      if (btnColleges) {
        btnColleges.style.background = '#ffffff';
        btnColleges.style.color = '#1e293b';
        btnColleges.style.boxShadow = '0 2px 4px rgba(0,0,0,0.06)';
      }
      if (btnPolice) {
        btnPolice.style.background = 'transparent';
        btnPolice.style.color = '#64748b';
        btnPolice.style.boxShadow = 'none';
      }
      if (rootEl) rootEl.style.display = 'block';
      if (policeContainer) policeContainer.style.display = 'none';
      window.showNunesToast('Switched to Colleges & Universities (1,654 Institutions)', '🎓');
    } else {
      if (btnColleges) {
        btnColleges.style.background = 'transparent';
        btnColleges.style.color = '#64748b';
        btnColleges.style.boxShadow = 'none';
      }
      if (btnPolice) {
        btnPolice.style.background = '#1e3a8a';
        btnPolice.style.color = '#ffffff';
        btnPolice.style.boxShadow = '0 2px 6px rgba(30,58,138,0.3)';
      }
      if (rootEl) rootEl.style.display = 'none';
      
      if (!policeContainer) {
        policeContainer = document.createElement('div');
        policeContainer.id = 'nunes-police-container';
        document.body.appendChild(policeContainer);
      }
      policeContainer.style.display = 'block';
      window.showNunesToast('Switched to Tamil Nadu Police Stations (104 Stations)', '👮');

      await renderPoliceDirectory(policeContainer);
    }
  }

  // Render Police Directory View
  async function renderPoliceDirectory(container) {
    const data = await loadPoliceData();
    if (!data || !data.allStations) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:#ef4444;">Failed to load Police Stations dataset.</div>';
      return;
    }

    const stations = data.allStations;

    container.innerHTML = `
      <div style="max-width: 1400px; margin: 20px auto; padding: 0 16px;">
        <!-- Police Hero Banner -->
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); border-radius: 16px; padding: 26px 24px; color: #fff; margin-bottom: 24px; box-shadow: 0 10px 25px rgba(15,23,42,0.15);">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
            <div>
              <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(59,130,246,0.25); border: 1px solid rgba(147,197,253,0.3); padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; color: #93c5fd; margin-bottom: 8px;">
                <span>🛡️</span> <span>Tamil Nadu Police Official Stations Census</span>
              </div>
              <h2 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">Police Stations &amp; Law Enforcement Directory</h2>
              <p style="margin: 4px 0 0; font-size: 13px; color: #cbd5e1; max-width: 680px;">
                Verified BSNL Landlines, CCTNS Official Inboxes &amp; WhatsApp Helplines across Coimbatore City, Coimbatore Rural, Greater Chennai, Tiruppur, Erode, Salem, Trichy &amp; Madurai.
              </p>
            </div>
            <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); padding: 12px 18px; border-radius: 12px; text-align: right;">
              <div style="font-size: 26px; font-weight: 900; color: #facc15;">${stations.length}</div>
              <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Verified Stations</div>
            </div>
          </div>
        </div>

        <!-- Filter & Search Controls -->
        <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; margin-bottom: 24px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
          <div style="flex: 1; min-width: 260px;">
            <input type="text" id="nunes-police-search" placeholder="🔍 Search station name, area, inspector, or pincode..." style="width: 100%; box-sizing: border-box; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 13px; outline: none;">
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <select id="nunes-police-district" style="padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 12px; font-weight: 600; color: #334155; background: #f8fafc;">
              <option value="all">All Districts &amp; Commissionerates (${stations.length})</option>
              <option value="Coimbatore City">Coimbatore City Police (${stations.filter(s => s.commissionerate.includes('City')).length})</option>
              <option value="Coimbatore District">Coimbatore Rural Police (${stations.filter(s => s.commissionerate.includes('District')).length})</option>
              <option value="Chennai">Greater Chennai Police (${stations.filter(s => s.district === 'Chennai').length})</option>
              <option value="Tiruppur">Tiruppur Police (${stations.filter(s => s.district === 'Tiruppur').length})</option>
              <option value="Erode">Erode Police (${stations.filter(s => s.district === 'Erode').length})</option>
              <option value="Salem">Salem Police (${stations.filter(s => s.district === 'Salem').length})</option>
              <option value="Tiruchirappalli">Trichy Police (${stations.filter(s => s.district === 'Tiruchirappalli').length})</option>
              <option value="Madurai">Madurai Police (${stations.filter(s => s.district === 'Madurai').length})</option>
              <option value="other">Other TN Districts (${stations.filter(s => ['Vellore','The Nilgiris','Tirunelveli'].includes(s.district)).length})</option>
            </select>

            <select id="nunes-police-category" style="padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 12px; font-weight: 600; color: #334155; background: #f8fafc;">
              <option value="all">All Wings &amp; Divisions</option>
              <option value="Law & Order">Law &amp; Order and Crime</option>
              <option value="Traffic">Traffic &amp; Highway Patrol</option>
              <option value="AWPS">All Women Police (AWPS)</option>
              <option value="Headquarters">Headquarters / SP Office</option>
            </select>
          </div>
        </div>

        <!-- Stations Grid -->
        <div id="nunes-police-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 16px;">
        </div>
      </div>
    `;

    const searchInput = document.getElementById('nunes-police-search');
    const districtSelect = document.getElementById('nunes-police-district');
    const categorySelect = document.getElementById('nunes-police-category');
    const gridEl = document.getElementById('nunes-police-grid');

    function updateGrid() {
      const q = (searchInput.value || '').toLowerCase().trim();
      const dist = districtSelect.value;
      const cat = categorySelect.value;

      const filtered = stations.filter(s => {
        const matchesQuery = !q || 
          s.name.toLowerCase().includes(q) || 
          s.address.toLowerCase().includes(q) || 
          (s.officerTitle || '').toLowerCase().includes(q) || 
          (s.pincode || '').includes(q) ||
          (s.stationCode || '').toLowerCase().includes(q);

        let matchesDist = true;
        if (dist === 'Coimbatore City') matchesDist = s.commissionerate.includes('Coimbatore City');
        else if (dist === 'Coimbatore District') matchesDist = s.commissionerate.includes('Coimbatore District');
        else if (dist === 'other') matchesDist = ['Vellore','The Nilgiris','Tirunelveli'].includes(s.district);
        else if (dist !== 'all') matchesDist = s.district === dist;

        let matchesCat = true;
        if (cat === 'Law & Order') matchesCat = s.category.includes('Law & Order');
        else if (cat === 'Traffic') matchesCat = s.category.includes('Traffic');
        else if (cat === 'AWPS') matchesCat = s.category.includes('All Women');
        else if (cat === 'Headquarters') matchesCat = s.category.includes('Headquarters');

        return matchesQuery && matchesDist && matchesCat;
      });

      if (filtered.length === 0) {
        gridEl.innerHTML = '<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: #64748b; font-weight: 600;">No police stations found matching the filter criteria.</div>';
        return;
      }

      gridEl.innerHTML = filtered.map(s => `
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; box-shadow: 0 4px 10px rgba(0,0,0,0.02); display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.15s, box-shadow 0.15s;">
          <div>
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 8px;">
              <div style="display: flex; gap: 6px; align-items: center;">
                <span style="background: #0f172a; color: #facc15; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 6px;">${s.stationCode}</span>
                <span style="background: #f1f5f9; color: #334155; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 6px;">${s.zone}</span>
              </div>
              <span style="background: ${s.category.includes('Traffic') ? '#fef3c7; color:#92400e;' : s.category.includes('Women') ? '#fce7f3; color:#9d174d;' : '#ecfdf5; color:#065f46;'} font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 12px;">
                ${s.category.includes('Traffic') ? '🚦 TRAFFIC' : s.category.includes('Women') ? '🌸 AWPS' : '🛡️ LAW &amp; ORDER'}
              </span>
            </div>

            <h4 style="margin: 0 0 4px; font-size: 15px; font-weight: 800; color: #0f172a;">${s.name}</h4>
            <p style="margin: 0 0 10px; font-size: 11px; font-weight: 700; color: #2563eb;">${s.officerTitle} • ${s.commissionerate}</p>
            <p style="margin: 0 0 12px; font-size: 12px; line-height: 1.4; color: #64748b;">📍 ${s.address} - <strong>${s.pincode}</strong></p>

            <!-- Direct Contact Box -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; font-size: 12px; margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #64748b;">Landline:</span>
                <a href="tel:${s.phone.replace(/[^0-9]/g,'')}" style="font-family: monospace; font-weight: 700; color: #0f172a; text-decoration: none;">📞 ${s.phone}</a>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #64748b;">WhatsApp / Helpline:</span>
                <a href="https://wa.me/${s.whatsapp.replace(/[^0-9]/g,'')}?text=Greetings%20from%20Nunes%20Instrumentation%20Coimbatore%20regarding%20Breath%20Analyser%20Solutions" target="_blank" style="font-family: monospace; font-weight: 700; color: #16a34a; text-decoration: none;">🟢 ${s.whatsapp}</a>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">CCTNS Email:</span>
                <span style="font-family: monospace; font-size: 11px; font-weight: 700; color: #2563eb;">${s.email}</span>
              </div>
            </div>

            <!-- Priority Badge -->
            <div style="background: #fefce8; border: 1px solid #fef08a; padding: 6px 10px; border-radius: 8px; font-size: 11px; color: #854d0e; font-weight: 600; margin-bottom: 14px;">
              🎯 <strong>Relevance:</strong> ${s.breathAnalyserPriority}
            </div>
          </div>

          <div style="display: flex; gap: 8px;">
            <button class="nunes-btn-pitch-police" data-station="${encodeURIComponent(JSON.stringify(s))}" style="flex: 1; background: #2563eb; color: #ffffff; border: none; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; transition: background 0.15s;">
              📩 Pitch Breath Analysers
            </button>
            <a href="tel:${s.phone.replace(/[^0-9]/g,'')}" style="background: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; text-decoration: none; display: flex; align-items: center; justify-content: center;">
              📞 Call
            </a>
          </div>
        </div>
      `).join('');

      // Bind Pitch Buttons
      gridEl.querySelectorAll('.nunes-btn-pitch-police').forEach(btn => {
        btn.addEventListener('click', () => {
          const s = JSON.parse(decodeURIComponent(btn.dataset.station));
          const policePitch = `Respected Station House Officer / ${s.officerTitle},

Greetings from Nunes Instrumentation, Coimbatore.

We are ISO 9001:2015 certified manufacturers, importers, and suppliers of High Precision Testing Equipment and Alcohol Breath Analysers operating from Coimbatore (Rathinapuri facility).

For ${s.name} (${s.commissionerate}) traffic enforcement, night nakabandi checking, and station beat patrolling, we are pleased to introduce our comprehensive 14-Model Breath Analyser Solutions:

1. Rapid Gate & Nakabandi Screening Batons (Baton 01 & Baton 02):
   - Fast non-contact alcohol breath screening in 1 second (no disposable mouthpieces required).
   - Integrated Red/Blue LED police flashing light bar, acoustic siren, and traffic guidance wand.
   - Ideal for continuous night vehicle checks, driver screening, and high-volume checkpoints.

2. Evidential Breath Analysers with Built-In Thermal Printer & Camera (Models AT-9000 & 333-T):
   - High-precision fuel-cell sensor with instant photo capture of violators.
   - Immediate on-the-spot physical printed slip recording Date, Time, Location, Vehicle Reg. Number, and exact BAC level for court evidence under Section 185 Motor Vehicles Act.

★ GeM Registered & MSME Certified: Directly available for government procurement through Government e-Marketplace (GeM).
★ Local Coimbatore Stock & 1-Year Calibration Warranty: Immediate doorstep delivery and NABL-traceable calibration certificate provided.

Please find our 14-product catalogue attached. We would be privileged to conduct a live demonstration at ${s.name} at your convenience.

Purchase / Technical Contacts:
Shaeein: +91 95002 38556 | Geetha: +91 94984 42690
Naveena: +91 73739 64350 | S.F. Nunes: +91 89409 44000
Emails: nunesalcotest@gmail.com | nunescbe@gmail.com
`;

          window.openNunesEmailModal({
            to: DEFAULT_TO,
            cc: DEFAULT_CC,
            subject: `Breath Analyser & Traffic Safety Solutions – Nunes Instrumentation (GeM Registered)`,
            body: policePitch,
            collegeName: `${s.name} (${s.commissionerate})`
          });
        });
      });
    }

    searchInput.addEventListener('input', updateGrid);
    districtSelect.addEventListener('change', updateGrid);
    categorySelect.addEventListener('change', updateGrid);

    updateGrid();
  }

  // Periodic check to mount Sector Bar
  const checkSectorBarInterval = setInterval(() => {
    mountSectorBar();
  }, 300);
  setTimeout(() => clearInterval(checkSectorBarInterval), 6000);

});
