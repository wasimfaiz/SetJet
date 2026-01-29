export function emailVerificationTemplate(name: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email Verification</title>

  <style>
    body,table,td,a,img { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table { border-collapse:collapse !important; }
    img { border:0; max-width:100%; display:block; }

    .wrapper {
      max-width:850px;
      width:95%;
      margin:auto;
      background:#ffffff;
      border-radius:20px;
      overflow:hidden;
      box-shadow:0 6px 20px rgba(0,0,0,0.08);
      font-family:'Poppins',Arial,sans-serif;
    }

    @media only screen and (max-width:480px) {
      .body-padding { padding:20px !important; }
    }
  </style>
</head>

<body style="margin:0;padding:25px;background:#f3f6fb;">
<div class="wrapper">

  <!-- HEADER -->
  <div style="background:linear-gradient(135deg,#1e3a8a,#ff7e29);padding:50px 30px 70px;text-align:center;border-bottom-left-radius:80% 40px;border-bottom-right-radius:80% 40px;">
    <img src="https://admin.yastudy.com/public/logo.png" alt="YAStudy Logo" style="max-width:150px;margin:auto;" />
    <h2 style="color:#fff;font-size:26px;font-weight:600;margin-top:15px;">Confirm Your Email</h2>
    <p style="color:#e5edff;font-size:15px;margin-top:5px;">Activate your YAStudy account</p>
  </div>

  <!-- BODY -->
  <div class="body-padding" style="padding:40px 50px;">

    <table width="100%">
      <tr>
        <td style="padding:4px 0 16px;font-size:14px;color:#111827;">
          Hi ${name},<br><br>
          Please confirm your email address to activate your YaStudy account.
        </td>
      </tr>

      <tr>
        <td style="padding:0 0 16px;font-size:13px;color:#4b5563;">
          This helps us keep your account secure and ensures we can reach you with important updates.
        </td>
      </tr>

      <tr>
        <td style="padding:0 0 24px;font-size:12px;color:#6b7280;">
          If you didn’t create this account, you can ignore this message.
        </td>
      </tr>
    </table>

  </div>

  <!-- FOOTER -->
  <div style="background:linear-gradient(135deg,#ff7e29,#1e3a8a);padding:25px;text-align:center;">
    <p style="color:#fff;font-size:13px;line-height:1.6;margin:0;">
      © ${new Date().getFullYear()} YAStudy. All rights reserved.<br />
      This is an automated message — please do not reply.
    </p>
  </div>
</div>
</body>
</html>
`;
}
