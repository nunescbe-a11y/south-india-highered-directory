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

function partitionBatches(colleges, batchSize = 77) {
  const batches = [];
  for (let i = 0; i < colleges.length; i += batchSize) {
    batches.push(colleges.slice(i, i + batchSize));
  }
  return batches;
}

async function main() {
  console.log('========================================================');
  console.log('🚀 NUNES CAMPUS OUTREACH — FULL BATCH DISPATCH STARTING');
  console.log('========================================================');
  console.log('Authenticated SMTP User:', process.env.SMTP_USER);

  const colleges = loadColleges();
  console.log(`Loaded ${colleges.length} verified Coimbatore colleges.`);

  const batches = partitionBatches(colleges, 77);
  console.log(`Partitioned into ${batches.length} batches.`);

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  console.log('Verifying SMTP connection...');
  await transporter.verify();
  console.log('SMTP connection verified successfully!\n');

  const templatePath = path.join(__dirname, 'public', 'nunes_campus_email_template.html');
  const htmlContent = fs.readFileSync(templatePath, 'utf8');
  const pdfPath = 'C:\\Users\\NUNES\\Desktop\\Breath_Analyser_Catalogue_14_Individual_Product_QR_Final_EmailReady.pdf';

  console.log('Template size:', (Buffer.byteLength(htmlContent, 'utf8') / 1024).toFixed(2), 'KB');
  console.log('Attachment exists:', fs.existsSync(pdfPath), 'Size:', (fs.statSync(pdfPath).size / (1024*1024)).toFixed(2), 'MB\n');

  const dispatchResults = [];

  for (let b = 0; b < batches.length; b++) {
    const currentBatch = batches[b];
    const bccList = currentBatch.map(c => c.email);

    console.log(`--------------------------------------------------------`);
    console.log(`Sending Batch ${b + 1} of ${batches.length} (${bccList.length} institutions)...`);
    console.log(`Sample institutions:`, currentBatch.slice(0, 3).map(c => `${c.name} <${c.email}>`).join(', '));

    const mailOptions = {
      from: '"Nunes Instrumentation" <nunesalcotest@gmail.com>',
      to: 'nunesalcotest@gmail.com',
      cc: 'nunescbe@gmail.com',
      bcc: bccList,
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

    const startTime = Date.now();
    try {
      const info = await transporter.sendMail(mailOptions);
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`✅ Batch ${b + 1} SENT in ${duration}s!`);
      console.log(`   Message ID: ${info.messageId}`);
      console.log(`   Accepted recipients: ${info.accepted ? info.accepted.length : bccList.length + 2}`);

      dispatchResults.push({
        batchIndex: b + 1,
        count: bccList.length,
        status: 'SENT',
        messageId: info.messageId,
        durationSeconds: duration
      });
    } catch (err) {
      console.error(`❌ Batch ${b + 1} FAILED:`, err.message);
      dispatchResults.push({
        batchIndex: b + 1,
        count: bccList.length,
        status: 'FAILED',
        error: err.message
      });
    }

    // Small delay between batches to stay comfortably within rate limits
    if (b < batches.length - 1) {
      console.log('Pausing 6 seconds before next batch...\n');
      await new Promise(r => setTimeout(r, 6000));
    }
  }

  console.log('\n========================================================');
  console.log('🎉 DISPATCH COMPLETE SUMMARY');
  console.log('========================================================');
  console.table(dispatchResults);

  const totalSent = dispatchResults
    .filter(r => r.status === 'SENT')
    .reduce((sum, r) => sum + r.count, 0);

  console.log(`Total institutions reached: ${totalSent} / ${colleges.length}`);

  // Write log report
  const logPath = path.join(__dirname, 'batch_dispatch_report.json');
  fs.writeFileSync(logPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    sender: 'nunesalcotest@gmail.com',
    cc: 'nunescbe@gmail.com',
    totalColleges: colleges.length,
    batches: dispatchResults
  }, null, 2));
  console.log(`Detailed report saved to: ${logPath}`);
}

main().catch(console.error);
