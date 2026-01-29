export function feedbackRequestTemplate(
  name: string,
  courseName: string,
  feedbackLink: string
) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>We Value Your Feedback</title>

<style>
  body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  table { border-collapse:collapse !important; }
  img { border:0; outline:none; max-width:100%; }
  .wrapper{max-width:900px;width:95%;margin:auto;background:#fff;border-radius:20px;
           overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,0.1);}
  .logo-img{display:block;margin:auto;max-width:180px;}
</style>
</head>

<body style="margin:0;padding:0;background:#f3f6fb;font-family:'Poppins',Arial,sans-serif;">
<div class="wrapper">

  <div style="background:linear-gradient(135deg,#1e3a8a,#ff7e29);padding:50px 30px 70px;
              text-align:center;border-bottom-left-radius:80% 40px;border-bottom-right-radius:80% 40px;">
    <img src="https://yastudy.com/assets/images/Yastudy.png" class="logo-img"/>
    <h1 style="color:#fff;font-size:26px;">Tell Us About Your Experience</h1>
    <p style="color:#e0e7ff;">Your opinion helps us improve</p>
  </div>

  <div style="padding:50px 60px 40px;">
    <h2 style="color:#1e3a8a;">Hi ${name},</h2>

    <p style="color:#374151;font-size:16px;line-height:1.7;">
      You recently completed <strong>${courseName}</strong>.  
      We’d love to hear your feedback!  
      It takes less than 30 seconds and helps us make YAStudy better.
    </p>

    <div style="text-align:center;margin:40px 0;">
      <a href="${feedbackLink}"
         style="background:linear-gradient(135deg,#1e3a8a,#ff7e29);padding:16px 40px;
                border-radius:40px;color:#fff;text-decoration:none;font-weight:600;font-size:16px;">
        Give Feedback
      </a>
    </div>
  </div>

  <div style="background:linear-gradient(135deg,#ff7e29,#1e3a8a);color:#fff;text-align:center;
              padding:35px;border-top-left-radius:60% 30px;border-top-right-radius:60% 30px;">
    © ${new Date().getFullYear()} YAStudy. All rights reserved.
  </div>

</div>
</body>
</html>`;
}
