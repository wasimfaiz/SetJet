export function reengagementTemplate(firstName: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>We Miss You at YAStudy</title>
</head>
<body style="margin:0;padding:0;background:#f3f6fb;font-family:Poppins,Arial">

  <div style="max-width:900px;margin:auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.08);">

    <div style="background:linear-gradient(135deg,#1e3a8a,#ff7e29);padding:50px 30px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:26px;">We Miss You!</h1>
      <p style="color:#e5edff;font-size:14px;margin-top:8px;">Come back and continue your learning journey</p>
    </div>

    <div style="padding:40px 60px;">
      <h2 style="color:#1e3a8a;">Hi ${firstName},</h2>
      <p style="font-size:15px;color:#374151;line-height:1.7;">
        It’s been a while since you last visited YAStudy. We’ve added new batches, upgraded our course content, and introduced exciting offers designed to help you learn faster.
      </p>

      <ul style="color:#374151;font-size:14px;line-height:1.7;margin-top:20px;">
        <li>🔥 New IELTS Fast-Track Batch</li>
        <li>🇩🇪 German A2 & B1 coming soon</li>
        <li>🎁 Exclusive comeback discount for you</li>
      </ul>

      <div style="text-align:center;margin:32px 0;">
        <a href="https://yastudy.com" style="background:#F97316;color:white;padding:14px 34px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Resume Learning
        </a>
      </div>
    </div>

    <div style="background:linear-gradient(135deg,#ff7e29,#1e3a8a);padding:20px;text-align:center;color:#fff;">
      <p style="margin:0;font-size:13px;">© ${new Date().getFullYear()} YAStudy. All rights reserved.</p>
    </div>

  </div>

</body>
</html>
`;
}
