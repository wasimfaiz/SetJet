export function abandonedEnrollmentTemplate(firstName: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Finish Your Enrollment</title>
  <style>
    body,table,td,a,img{ -webkit-text-size-adjust:100%; -ms-text-size-adjust:100% }
    table{ border-collapse:collapse!important }
    .wrapper{ max-width:900px;width:95%;margin:auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,0.08); font-family:'Poppins',Arial,sans-serif;}
  </style>
</head>
<body style="margin:0;padding:0;background:#f3f6fb;">
  <div class="wrapper">

    <div style="background:linear-gradient(135deg,#1e3a8a,#ff7e29);padding:45px 30px;text-align:center;">
      <h1 style="color:#fff;font-size:26px;margin:0;">You Left Something Behind!</h1>
      <p style="color:#e5edff;font-size:14px;margin-top:6px;">Complete your enrollment and start learning today.</p>
    </div>

    <div style="padding:40px 60px;">
      <h2 style="color:#1e3a8a;margin-top:0;">Hi ${firstName},</h2>

      <p style="color:#374151;font-size:15px;line-height:1.7;">
        We noticed you were about to join one of our most popular courses but didn’t finish your enrollment. Seats are filling up fast — don’t miss out!
      </p>

      <div style="background:#fff7ed;border-left:4px solid #F97316;padding:16px;border-radius:10px;margin-top:20px;color:#7c2d12;">
        🔔 <strong>Course on hold for the next 24 hours:</strong>  
        IELTS Mastery Program / German A1 Batch
      </div>

      <div style="text-align:center;margin:32px 0;">
        <a href="https://yastudy.com/continue" style="background:#F97316;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;">
          Continue Enrollment
        </a>
      </div>

      <p style="color:#6b7280;font-size:13px;">If you need help, our team is happy to assist you.</p>
    </div>

    <div style="background:linear-gradient(135deg,#ff7e29,#1e3a8a);padding:20px;text-align:center;color:#fff;">
      <p style="margin:0;font-size:13px;">© ${new Date().getFullYear()} YAStudy. All rights reserved.</p>
    </div>

  </div>
</body>
</html>
`;
}
