export function referralInvitationTemplate(
  firstName: string,
 /*  referralProgramName: string, // e.g. "YAStudy Friends & Rewards"
  inviteText: string,
  referralLink: string,
  rewardDetails?: string */ // e.g. "Earn ₹500 for each successful referral"
) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>YAStudy Friends & Rewards</title>
  <style>
    body,table,td,a,img{ -webkit-text-size-adjust:100%; -ms-text-size-adjust:100% }
    table{ border-collapse:collapse!important }
    .wrapper{ max-width:900px;width:95%;margin:auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,0.08); font-family:'Poppins',Arial,sans-serif;}
    .logo-img{ display:block;margin:0 auto;max-height:90px;max-width:180px; }
    @media only screen and (max-width:480px){ .body-padding{ padding:28px 18px!important } }
  </style>
</head>
<body style="margin:0;padding:0;background:#f3f6fb;">
  <div class="wrapper">

    <!-- HEADER -->
    <div style="background:linear-gradient(135deg,#1e3a8a,#ff7e29);padding:50px 30px 70px;text-align:center;border-bottom-left-radius:80% 40px;border-bottom-right-radius:80% 40px;">
      <img src="https://yastudy.com/assets/images/Yastudy.png" alt="YAStudy Logo" class="logo-img" />
      <h1 style="color:#fff;font-size:26px;margin:12px 0;">YAStudy Friends & Rewards</h1>
      <p style="color:#e5edff;margin:0;font-size:14px;">Share the opportunity. Earn exciting rewards!</p>
    </div>

    <!-- BODY -->
    <div class="body-padding" style="padding:44px 60px;">
      <h2 style="color:#1e3a8a;margin:0 0 12px;">Hi ${firstName},</h2>

      <p style="color:#374151;font-size:15px;line-height:1.7;margin-bottom:16px;">
        We’re excited to introduce our <strong>YAStudy Friends & Rewards Program</strong> — a simple way for you to help your friends study abroad while earning exciting rewards for yourself!
      </p>

      <p style="color:#374151;font-size:15px;line-height:1.7;margin-bottom:16px;">
        Just share your referral link with classmates, friends, or coworkers who are planning for IELTS, German, or overseas admissions — and get rewarded when they enroll.
      </p>

      <!-- REWARD DETAILS -->
      <p style="color:#1e3a8a;font-weight:700;margin-bottom:16px;">
        🎁 Earn ₹500 for every successful referral who joins a YAStudy course.
      </p>

      <!-- CTA -->
      <div style="text-align:center;margin:20px 0;">
        <a href="https://yastudy.com/referral" style="display:inline-block;padding:12px 28px;background:#F97316;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;">
          Invite Friends Now
        </a>
      </div>

      <p style="color:#6b7280;font-size:13px;margin-top:8px;">Rewards are credited after your referral completes enrollment in any paid course.</p>
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
