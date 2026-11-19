html_path = r"C:\Users\NUNES\.gemini\antigravity\scratch\highered-directory-sales-agent\public\index.html"

with open(html_path, "r", encoding="utf-8") as f:
    content = f.read()

modal_html = """
<!-- AI AUTOMATED THANK YOU & CONFIRMATION MODAL -->
<div class="modal-overlay" id="thankYouModal" style="display:none;z-index:2100;">
  <div class="modal-card" style="max-width:620px;border-top:5px solid #22c55e;">
    <div class="modal-header" style="background:#f0fdf4;">
      <div class="modal-title" style="color:#15803d;display:flex;align-items:center;gap:8px;">
        <span>🎉</span> <span>Thank You for Choosing Nunes Instrumentation!</span>
      </div>
      <button class="modal-close" onclick="closeThankYouModal()">✕</button>
    </div>
    <div class="modal-body" style="padding:20px;">
      <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:14px;margin-bottom:16px;">
        <h4 style="margin:0 0 6px;color:#065f46;font-size:13.5px;" id="thankYouHeader">Automated Confirmation & AI Reply Dispatched</h4>
        <p style="margin:0;font-size:12px;color:#047857;line-height:1.45;" id="thankYouSubheader">
          Your quotation request has been processed by our AI sales system and dispatched to your email with official DGS&D / GeM pricing and technical details.
        </p>
      </div>

      <!-- WhatsApp Preview & Dispatch Button -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-bottom:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <strong style="font-size:12px;color:#0f172a;display:flex;align-items:center;gap:6px;">
            <span>💬</span> <span>WhatsApp Instant Response Message:</span>
          </strong>
          <span style="font-size:10.5px;background:#dcfce7;color:#15803d;font-weight:700;padding:2px 8px;border-radius:100px;">Ready to Send</span>
        </div>
        <div id="thankYouWaPreview" style="background:white;border:1px solid #cbd5e1;border-radius:6px;padding:10px;font-size:11.5px;color:#334155;line-height:1.4;white-space:pre-wrap;margin-bottom:12px;font-family:sans-serif;"></div>
        <a id="thankYouWaBtn" href="#" target="_blank" class="card-btn" style="background:#22c55e;color:white;font-weight:800;display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:8px;text-decoration:none;">
          <span>📲</span> <span>Send Confirmation on WhatsApp</span>
        </a>
      </div>

      <!-- Email Confirmation Details -->
      <div style="border:1px dashed #cbd5e1;border-radius:8px;padding:12px;font-size:11.5px;color:#475569;margin-bottom:16px;">
        <div><strong>✉️ Email Status:</strong> <span id="thankYouEmailStatus" style="color:#15803d;font-weight:700;">Delivered via SMTP to customer inbox</span></div>
        <div style="margin-top:4px;"><strong>📦 Requested Equipment:</strong> <span id="thankYouModelName" style="color:#0f172a;font-weight:700;"></span></div>
        <div style="margin-top:4px;"><strong>📞 Nunes Coimbatore Sales Desk:</strong> <a href="tel:+919443217030" style="color:#2563eb;font-weight:700;">+91 94432 17030</a> (24x7 Customer Support)</div>
      </div>

      <div style="text-align:right;">
        <button class="card-btn" onclick="closeThankYouModal()" style="padding:6px 16px;">Done</button>
      </div>
    </div>
  </div>
</div>
"""

# Insert modal HTML after </form> </div> </div> </div> for quoteModal
quote_modal_end = '<!-- FLOATING MULTI-SELECT BAR -->'
if quote_modal_end in content:
    content = content.replace(quote_modal_end, modal_html + "\n" + quote_modal_end)
    print("Added thankYouModal HTML successfully!")
else:
    print("WARNING: quote_modal_end not found")

# Replace handleQuoteSubmit JS function
old_handle_quote = """  function handleQuoteSubmit(e) {
    e.preventDefault();
    const target = document.getElementById('quoteTargetName').value;
    const model = document.getElementById('quoteModelSelect').value;
    const name = document.getElementById('quoteSenderName').value;
    const phone = document.getElementById('quoteSenderPhone').value;
    const email = document.getElementById('quoteSenderEmail').value;

    alert(`Thank you ${name}! Your quotation request for [${model}] for [${target}] has been recorded. Our Coimbatore team will contact you at ${phone} / ${email} with official DGS&D / GeM pricing.`);
    closeQuoteModal();
  }"""

new_handle_quote = """  async function handleQuoteSubmit(e) {
    e.preventDefault();
    const target = document.getElementById('quoteTargetName').value;
    const model = document.getElementById('quoteModelSelect').value;
    const name = document.getElementById('quoteSenderName').value;
    const phone = document.getElementById('quoteSenderPhone').value;
    const email = document.getElementById('quoteSenderEmail').value;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>⏳</span> <span>AI Generating & Dispatching...</span>';
    submitBtn.disabled = true;

    try {
      const res = await fetch('/api/customer/inquiry-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email,
          target,
          model,
          sector: currentTab === 'transport' ? 'Commercial Freight & Fleet' :
                  currentTab === 'schools' ? 'School Student Bus Fleet' :
                  currentTab === 'colleges' ? 'Higher Education Campus' : 'Police Law Enforcement'
        })
      });
      const data = await res.json();
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
      closeQuoteModal();

      // Show Rich Confirmation & AI Thank-You Modal
      showAiThankYouModal(data, target, model);
    } catch (err) {
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
      alert(`Thank you ${name}! Your quotation request for [${model}] for [${target}] has been registered.`);
      closeQuoteModal();
    }
  }

  function showAiThankYouModal(data, target, model) {
    document.getElementById('thankYouHeader').textContent = `Thank you ${data.customerName || ''}! Quote & AI Reply Ready`;
    document.getElementById('thankYouSubheader').textContent = `Official quotation & product specifications for [${target || model}] have been prepared and delivered to ${data.emailSent ? 'your email' : 'our dispatch desk'}.`;
    document.getElementById('thankYouWaPreview').textContent = data.whatsappMessage || '';
    document.getElementById('thankYouWaBtn').href = data.whatsappUrl || '#';
    document.getElementById('thankYouEmailStatus').textContent = data.emailSent ? 'Delivered successfully via SMTP' : 'Queued for dispatch';
    document.getElementById('thankYouModelName').textContent = data.recommendedModel || model;
    document.getElementById('thankYouModal').style.display = 'flex';
  }

  function closeThankYouModal() {
    document.getElementById('thankYouModal').style.display = 'none';
  }"""

if old_handle_quote in content:
    content = content.replace(old_handle_quote, new_handle_quote)
    print("Replaced handleQuoteSubmit with AI responder successfully!")
else:
    print("WARNING: old_handle_quote not found")

with open(html_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated public/index.html successfully!")
