export function studyRecommendationsTemplate(
  name: string,
  recommendations: string[],
  dashboardLink: string
) {
  const listItems = recommendations.map(r => `<li style="margin:8px 0;color:#374151;">${r}</li>`).join("");

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Your Personalized Study Recommendations</title>
</head>

<body style="margin:0;padding:0;background:#f3f6fb;font-family:'Poppins',Arial,sans-serif;">
<div class="wrapper" style="max-width:900px;margin:auto;background:#fff;border-radius:20px;
                            overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,0.1);">

  <div style="background:linear-gradient(135deg,#1e3a8a,#ff7e29);padding:50px 30px 70px;
              text-align:center;border-bottom-left-radius:80% 40px;border-bottom-right-radius:80% 40px;">
    <img src="https://yastudy.com/assets/images/Yastudy.png" class="logo-img"/>
    <h1 style="color:#fff;font-size:26px;">Your Study Recommendations</h1>
    <p style="color:#e0e7ff;">Tailored just for your learning goals</p>
  </div>

  <div style="padding:50px 60px 40px;">
    <h2 style="color:#1e3a8a;">Hi ${name},</h2>

    <p style="color:#374151;font-size:16px;line-height:1.7;">
      Based on your progress and interests, here are some personalized study recommendations:
    </p>

    <ul style="margin:20px 0 30px;padding-left:20px;font-size:16px;">
      ${listItems}
    </ul>

    <div style="text-align:center;margin:40px 0;">
      <a href="${dashboardLink}"
         style="background:linear-gradient(135deg,#1e3a8a,#ff7e29);padding:16px 40px;border-radius:40px;
                color:#fff;text-decoration:none;font-weight:600;font-size:16px;">
        Go to Dashboard
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
