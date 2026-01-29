export function courseLaunchTemplate(
  firstName: string,
  /* launchTitle: string, // e.g. "New Course Launch: Advanced ML"
  courseSummary: string,
  launchDate: string,
  enrollLink: string,
  earlyBirdText?: string */
) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>New Course Launch – IELTS & German A1/A2</title>
  <style>
    body,table,td,a,img{ -webkit-text-size-adjust:100%; -ms-text-size-adjust:100% }
    table{ border-collapse:collapse!important }
    .wrapper{ max-width:900px;width:95%;margin:auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,0.08); font-family:'Poppins',Arial,sans-serif;}
    .logo-img{ display:block;margin:0 auto;max-height:90px;max-width:180px;}
    @media only screen and (max-width:480px){ .body-padding{ padding:28px 18px!important } }
  </style>
</head>
<body style="margin:0;padding:0;background:#f3f6fb;">
  <div class="wrapper">

    <!-- HEADER -->
    <div style="background:linear-gradient(135deg,#1e3a8a,#ff7e29);padding:50px 30px 70px;text-align:center;border-bottom-left-radius:80% 40px;border-bottom-right-radius:80% 40px;">
      <img src="https://yastudy.com/assets/images/Yastudy.png" alt="YAStudy Logo" class="logo-img" />
      <h1 style="color:#fff;font-size:26px;margin:12px 0;">New IELTS & German (A1/A2) Courses Launching!</h1>
      <p style="color:#e5edff;margin:0;font-size:14px;">New Batches Starting from 10th December 2025</p>
    </div>

    <!-- BODY -->
    <div class="body-padding" style="padding:44px 60px;">
      <h2 style="color:#1e3a8a;margin:0 0 12px;">Hi ${firstName},</h2>

      <p style="color:#374151;font-size:15px;line-height:1.7;margin-bottom:16px;">
        We’re excited to announce the launch of our **new IELTS and German A1/A2 language learning batches**, designed to help you achieve your overseas education goals with confidence.
      </p>

      <!-- COURSE DETAILS -->
      <div style="background:#f8fafc;border-radius:12px;padding:18px;margin-top:18px;">
        <h3 style="margin:0;color:#1e3a8a;font-size:18px;">📘 IELTS Mastery Program</h3>
        <ul style="color:#374151;font-size:14px;line-height:1.6;margin:10px 0 0;padding-left:20px;">
          <li>Complete Speaking, Writing, Reading & Listening coverage</li>
          <li>Live doubt sessions + Mock tests</li>
          <li>Personalized band improvement strategy</li>
        </ul>
        <p style="margin:10px 0 0;color:#111827;font-weight:600;font-size:15px;">Course Fee: ₹5,000</p>
      </div>

      <div style="background:#fff7ed;border-radius:12px;padding:18px;margin-top:20px;">
        <h3 style="margin:0;color:#c2410c;font-size:18px;">🇩🇪 German Language Course (A1 + A2)</h3>
        <ul style="color:#7c2d12;font-size:14px;line-height:1.6;margin:10px 0 0;padding-left:20px;">
          <li>Beginner & Intermediate German proficiency</li>
          <li>Grammar, Vocabulary & Conversation training</li>
          <li>Exam preparation for Goethe / Telc</li>
        </ul>
        <p style="margin:10px 0 0;color:#7c2d12;font-weight:600;font-size:15px;">Course Fee: ₹12,000</p>
      </div>

      <!-- EXTRA INFO -->
      <p style="background:#fffbf7;border-left:4px solid #F97316;padding:12px;border-radius:8px;color:#7c2d12;margin:20px 0;">
        🎉 **Special Bonus:** Free study materials + mentorship sessions for the first 50 students!
      </p>

      <!-- CTA -->
      <div style="text-align:center;margin:20px 0;">
        <a href="https://yastudy.com/enroll" style="display:inline-block;padding:14px 32px;background:#F97316;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;">
          Enroll Now – Limited Seats
        </a>
      </div>

      <p style="color:#6b7280;font-size:13px;margin-top:8px;">Secure your seat before the batch fills up.</p>
    </div>

    <!-- FOOTER -->
    <div style="background:linear-gradient(135deg,#ff7e29,#1e3a8a);padding:26px;text-align:center;color:#fff;">
      <p style="margin:0;font-size:13px;">© ${new Date().getFullYear()} YAStudy. All rights reserved.</p>
    </div>

  </div>
</body>
</html>
  `;
}
