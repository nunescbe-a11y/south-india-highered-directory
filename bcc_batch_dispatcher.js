const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

function parseCSVLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

function loadColleges() {
  const csvPath = path.join(__dirname, 'public', 'Coimbatore_Higher_Education_Colleges_Verified_Directory.csv');
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  const headers = parseCSVLine(lines[0]);
  const emailIdx = headers.indexOf('Official Email ID');
  const nameIdx = headers.indexOf('Institution Name');

  const colleges = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    const name = row[nameIdx];
    const email = row[emailIdx];
    if (email && email.includes('@')) {
      colleges.push({ name, email });
    }
  }
  return colleges;
}

async function prepareBatches(batchSize = 75) {
  const colleges = loadColleges();
  const batches = [];
  for (let i = 0; i < colleges.length; i += batchSize) {
    batches.push(colleges.slice(i, i + batchSize));
  }
  return batches;
}

async function dispatchBatch(batchIndex = 0, isDryRun = true) {
  const batches = await prepareBatches(75);
  if (batchIndex >= batches.length) {
    console.log(`Batch index ${batchIndex} out of range (Total: ${batches.length})`);
    return;
  }

  const batch = batches[batchIndex];
  const bccEmails = batch.map(c => c.email);
  console.log(`Batch ${batchIndex + 1}/${batches.length}: ${bccEmails.length} recipients`);
  console.log('Sample recipients:', bccEmails.slice(0, 3));

  if (isDryRun) {
    console.log('[DRY RUN] Dispatch simulated without sending.');
    return { success: true, dryRun: true, count: bccEmails.length };
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

  const templatePath = path.join(__dirname, 'public', 'nunes_campus_email_template.html');
  const htmlContent = fs.readFileSync(templatePath, 'utf8');
  const pdfPath = 'C:\\Users\\NUNES\\Desktop\\Breath_Analyser_Catalogue_14_Individual_Product_QR_Final_EmailReady.pdf';

  const mailOptions = {
    from: '"Nunes Instrumentation" <nunesalcotest@gmail.com>',
    to: 'nunesalcotest@gmail.com',
    cc: 'nunescbe@gmail.com',
    bcc: bccEmails,
    replyTo: 'nunesalcotest@gmail.com, nunescbe@gmail.com',
    subject: 'Campus Breath Analyser Range | Nunes Instrumentation, Coimbatore',
    html: htmlContent,
    attachments: [
      {
        filename: 'Breath_Analyser_Catalogue_14_Individual_Product_QR_Final.pdf',
        path: pdfPath
      }
    ]
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[Batch ${batchIndex + 1} Sent] Message ID: ${info.messageId}`);
  return { success: true, messageId: info.messageId, recipientCount: bccEmails.length };
}

if (require.main === module) {
  (async () => {
    const batches = await prepareBatches(75);
    console.log(`Total colleges: ${batches.flat().length} partitioned into ${batches.length} batches.`);
    for (let b = 0; b < batches.length; b++) {
      console.log(`  Batch ${b + 1}: ${batches[b].length} colleges (BCC)`);
    }
  })();
}

module.exports = { loadColleges, prepareBatches, dispatchBatch };
