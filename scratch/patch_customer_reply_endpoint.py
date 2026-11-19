server_path = r"C:\Users\NUNES\.gemini\antigravity\scratch\highered-directory-sales-agent\server.js"

with open(server_path, "r", encoding="utf-8") as f:
    content = f.read()

endpoint_code = """
// -------------------------------------------------------------
// POST /api/customer/inquiry-reply
// Automated AI Customer Engagement & "Thank You for Choosing Us" Responder
// (OpenAI + Intelligent Rule Engine + SMTP Delivery + Firestore Cloud Sync)
// -------------------------------------------------------------
app.post('/api/customer/inquiry-reply', async (req, res) => {
  const {
    name,
    phone,
    email,
    target,
    sector,
    model,
    message
  } = req.body;

  const customerName = (name || 'Valued Customer').trim();
  const customerTarget = (target || 'Your Organization / Fleet').trim();
  const customerPhone = (phone || '').trim();
  const customerEmail = (email || '').trim();
  const chosenModel = model || 'Model 03: Alco-Blow / Rapid Baton (Non-Contact Rapid Screening)';
  const customerSector = sector || 'Transport & Fleet';
  const customNote = (message || '').trim();

  let aiResult = null;

  // 1. Try calling OpenAI if key configured
  if (OPENAI_API_KEY) {
    const sysPrompt = `You are an AI Customer Engagement & Sales Specialist for Nunes Instrumentation (Coimbatore, Tamil Nadu), India's premier manufacturer and distributor of fuel-cell Breath Alcohol Analysers. Return pure JSON.`;
    const userPrompt = `A customer submitted an inquiry:
- Customer Name: ${customerName}
- Target Organization / Campus / Fleet: ${customerTarget} (${customerSector})
- Phone / WhatsApp: ${customerPhone}
- Email: ${customerEmail}
- Product Inquired: ${chosenModel}
- Customer Note: ${customNote || 'Requesting quotation, technical brochure, and demo schedule'}

Generate a JSON object with:
"thankYouSubject": Professional email subject (e.g. 'Thank You for Choosing Nunes Instrumentation — Quotation & Demo Confirmation for ${customerTarget}')
"thankYouEmailBody": A warm, respectful, complete Indian business thank-you email thanking them for choosing Nunes Instrumentation, acknowledging their inquiry for ${chosenModel}, detailing technical advantages (fuel cell accuracy, calibration certificates, DGS&D/GeM compliance), offering an institutional/fleet 15% discount, scheduling a physical on-site demo, and providing Nunes Coimbatore contact details (+91 94432 17030, nunesalcotest@gmail.com).
"whatsappMessage": A polite, high-impact WhatsApp thank-you message formatted with emojis and bullets ready to send to the customer.
"recommendedModel": Recommended model string
"nextSteps": 1-line note on next commercial step`;

    aiResult = await callOpenAI(userPrompt, sysPrompt);
  }

  // 2. Fallback Expert Response Engine (if OpenAI quota exhausted or offline)
  if (!aiResult || !aiResult.thankYouEmailBody) {
    const isTransport = customerSector.toLowerCase().includes('transport') || customerSector.toLowerCase().includes('fleet') || customerSector.toLowerCase().includes('lorry');
    const isSchool = customerSector.toLowerCase().includes('school');
    const isCollege = customerSector.toLowerCase().includes('college') || customerSector.toLowerCase().includes('highered');

    let sectorHighlight = 'commercial transport and fleet driver safety';
    let complianceNote = 'Section 185 Motor Vehicles Act & commercial fleet safety compliance';
    if (isSchool) {
      sectorHighlight = 'school bus driver pre-trip sobriety screening';
      complianceNote = 'Supreme Court school bus safety guidelines & driver alcohol protocols';
    } else if (isCollege) {
      sectorHighlight = 'campus and student hostel alcohol-free policy enforcement';
      complianceNote = 'AICTE / UGC campus safety guidelines & hostel perimeter control';
    }

    const emailSubject = `Thank You for Choosing Nunes Instrumentation — Quotation & Demo Details for ${customerTarget}`;
    const emailBody = `Dear ${customerName},

Thank you very much for choosing Nunes Instrumentation and reaching out regarding our professional Breath Alcohol Analyser solutions for ${customerTarget}.

We have successfully received your inquiry for:
• Selected Equipment: ${chosenModel}
• Organization / Fleet: ${customerTarget}
• Application: ${sectorHighlight} (${complianceNote})

Key Advantages of Nunes Breath Analysers:
1. Electrochemical Fuel-Cell Sensor: ±0.005% BAC precision with zero false positives from cough syrup, mouthwash, or tobacco.
2. Official Certification: Supplied with NIST-traceable calibration certificate and 1-Year on-site replacement warranty.
3. Government & Commercial Compliance: Approved for legal evidentiary use under Section 185 Motor Vehicles Act and GeM/DGS&D procurement.
4. Commercial Fleet / Campus Discount: We are pleased to extend an introductory 15% institutional discount along with complimentary technical calibration.

Next Steps:
Our senior technical specialist from our Coimbatore headquarters will contact you directly to share the GST proforma invoice and schedule a free physical demonstration at your facility.

For any immediate queries or custom technical requirements, please feel free to reach us directly:
• Phone / WhatsApp: +91 94432 17030
• Official Email: nunesalcotest@gmail.com / nunescbe@gmail.com
• Head Office: Coimbatore, Tamil Nadu, India

Warm regards,
Nunes Instrumentation Sales & Technical Support Team
Coimbatore, Tamil Nadu`;

    const waMsg = `Hello ${customerName}, thank you for choosing Nunes Instrumentation! 🙏

We received your inquiry for *${chosenModel}* for *${customerTarget}*.

✅ *Quick Highlights:*
• Fuel-Cell Precision (±0.005% BAC)
• 1-Year Replacement Warranty & Calibration Certificate
• 15% Fleet/Institutional Discount Applied

Our technical team will call you shortly to coordinate your quote & demonstration.
📞 *Nunes Coimbatore*: +91 94432 17030
✉️ *Email*: nunesalcotest@gmail.com`;

    aiResult = {
      thankYouSubject: emailSubject,
      thankYouEmailBody: emailBody,
      whatsappMessage: waMsg,
      recommendedModel: chosenModel,
      nextSteps: 'Schedule physical demonstration and dispatch formal GST proforma invoice'
    };
  }

  // 3. Send automated Thank-You email via SMTP if customer provided email
  let emailSent = false;
  let emailError = null;
  if (customerEmail && customerEmail.includes('@') && emailTransporter) {
    try {
      await emailTransporter.sendMail({
        from: '"Nunes Instrumentation" <nunesalcotest@gmail.com>',
        to: customerEmail,
        cc: 'nunesalcotest@gmail.com, nunescbe@gmail.com',
        subject: aiResult.thankYouSubject,
        text: aiResult.thankYouEmailBody
      });
      emailSent = true;
      console.log(`[Auto-Reply] Thank-you email sent successfully to ${customerEmail}`);
    } catch (err) {
      emailError = err.message;
      console.warn(`[Auto-Reply] Email send failed: ${err.message}`);
    }
  }

  // 4. Save to Google Cloud Firestore (persistent cloud log)
  let firestoreSaved = false;
  try {
    if (firestore) {
      await firestore.collection('customer_inquiries').add({
        customerName,
        customerPhone,
        customerEmail,
        customerTarget,
        customerSector,
        chosenModel,
        customNote,
        aiReply: aiResult,
        emailSent,
        createdAt: new Date().toISOString(),
        status: 'AUTO_REPLIED'
      });
      firestoreSaved = true;
      console.log(`[Firestore] Inquiry logged to cloud for ${customerName}`);
    }
  } catch (err) {
    console.warn(`[Firestore] Inquiry save warning: ${err.message}`);
  }

  // 5. Generate direct WhatsApp reply link
  let cleanPhone = customerPhone.replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
  const whatsappUrl = cleanPhone.length >= 10 ?
    `https://wa.me/${cleanPhone}?text=${encodeURIComponent(aiResult.whatsappMessage)}` :
    `https://wa.me/919443217030?text=${encodeURIComponent(aiResult.whatsappMessage)}`;

  return res.json({
    success: true,
    customerName,
    thankYouSubject: aiResult.thankYouSubject,
    thankYouEmailBody: aiResult.thankYouEmailBody,
    whatsappMessage: aiResult.whatsappMessage,
    whatsappUrl,
    emailSent,
    firestoreSaved,
    recommendedModel: aiResult.recommendedModel
  });
});
"""

target_str = "app.post('/api/agent/sales-reply', async (req, res) => {"
if target_str in content:
    idx = content.find(target_str)
    # Find matching closing for sales-reply (around line 338)
    closing_idx = content.find("});", idx) + 3
    content = content[:closing_idx] + "\n" + endpoint_code + content[closing_idx:]
    with open(server_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Added POST /api/customer/inquiry-reply to server.js successfully!")
else:
    print("ERROR: target_str not found in server.js")
