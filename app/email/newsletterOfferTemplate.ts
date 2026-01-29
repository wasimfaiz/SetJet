export function newsletterOfferTemplate(firstName: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>YAStudy Monthly Newsletter</title>
  <style>
    body,table,td,a,img{ -webkit-text-size-adjust:100%; -ms-text-size-adjust:100% }
    table{ border-collapse:collapse!important }
    .wrapper{ max-width:900px;width:95%;margin:auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,0.08); font-family:'Poppins',Arial,sans-serif;}
    .logo-img{ display:block;margin:0 auto;max-height:90px;max-width:180px;}
  </style>
</head>
<body style="margin:0;padding:0;background:#f3f6fb;">
  <div class="wrapper">

    <!-- HEADER -->
    <div style="background:linear-gradient(135deg,#1e3a8a,#ff7e29);padding:50px 30px 60px;text-align:center;">
      <img src="https://yastudy.com/assets/images/Yastudy.png" class="logo-img" />
      <h1 style="color:#fff;font-size:26px;margin:16px 0;">YAStudy Monthly Newsletter</h1>
      <p style="color:#e5edff;font-size:14px;margin:0;">New Courses • Latest Offers • Study Abroad Tips</p>
    </div>

    <!-- BODY -->
    <div style="padding:40px 60px;">
      <h2 style="color:#1e3a8a;margin-top:0;">Hi ${firstName},</h2>

      <p style="color:#374151;font-size:15px;line-height:1.7;">
        Welcome to the latest edition of our YAStudy newsletter! Here’s what’s new in the world of IELTS, German language learning, and international education.
      </p>

      <h3 style="color:#1e3a8a;margin-top:28px;">🔥 Trending: IELTS Fast-Track Batch Starting Soon</h3>
      <p style="color:#374151;font-size:14px;line-height:1.6;">  
        A special 4-week fast-track batch for working professionals — limited seats available!  
      </p>

      <h3 style="color:#1e3a8a;margin-top:26px;">🎯 German A1 + A2 Combo Offer</h3>
      <p style="color:#374151;font-size:14px;line-height:1.6;">
        Enroll in the A1 & A2 combined program and get **free study materials worth ₹1,000**.
      </p>

      <h3 style="color:#1e3a8a;margin-top:26px;">💡 Study Abroad Tip of the Month</h3>
      <p style="color:#374151;font-size:14px;line-height:1.6;">
        Start your language preparation at least 3–6 months before your intended departure. Early preparation = better scores.
      </p>

      <div style="text-align:center;margin:30px 0;">
        <a href="https://yastudy.com/courses" style="background:#F97316;color:white;padding:14px 30px;border-radius:8px;text-decoration:none;font-weight:bold;">Explore All Courses</a>
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
