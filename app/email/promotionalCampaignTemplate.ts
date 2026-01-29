export function promotionalCampaignTemplate(firstName: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>YAStudy Mega Sale</title>
</head>
<body style="margin:0;padding:0;background:#f3f6fb;font-family:Poppins,Arial">

  <div style="max-width:900px;margin:auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.08);">

    <div style="background:linear-gradient(135deg,#ff7e29,#1e3a8a);padding:55px 30px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:28px;">🔥 Mega Sale Is Live!</h1>
      <p style="color:#ffe8d1;font-size:14px;margin-top:6px;">Exclusive 48-hour discount on all YAStudy courses</p>
    </div>

    <div style="padding:40px 60px;">
      <h2 style="color:#1e3a8a;">Hi ${firstName},</h2>

      <p style="color:#374151;font-size:15px;line-height:1.7;">
        Our biggest sale of the year has arrived! Enroll now and unlock massive savings on IELTS and German courses. This limited-time offer is perfect for students planning their study abroad journey.
      </p>

      <div style="background:#fff7ed;padding:18px;border-radius:12px;border-left:5px solid #F97316;margin-top:20px;">
        <strong style="color:#7c2d12;">🎁 Offer Highlights:</strong>
        <ul style="padding-left:20px;color:#7c2d12;font-size:14px;line-height:1.6;margin-top:10px;">
          <li>IELTS Mastery Program – Flat 20% OFF</li>
          <li>German A1 + A2 Combo – Save ₹2,000</li>
          <li>Free study materials worth ₹1,000</li>
        </ul>
      </div>

      <div style="text-align:center;margin:34px 0;">
        <a href="https://yastudy.com/offers" style="background:#F97316;color:white;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Grab the Offer Now
        </a>
      </div>
    </div>

    <div style="background:linear-gradient(135deg,#1e3a8a,#ff7e29);padding:20px;text-align:center;color:#fff;">
      <p style="margin:0;font-size:13px;">© ${new Date().getFullYear()} YAStudy. All rights reserved.</p>
    </div>

  </div>

</body>
</html>
`;
}
