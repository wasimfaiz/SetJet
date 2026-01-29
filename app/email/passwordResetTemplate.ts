export function passwordResetTemplate(
  name: string,
  reset_link: string,
  expiry_minutes: number
) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password Reset</title>

  <style>
    body,table,td,a,img { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table { border-collapse:collapse !important; }
    img { border:0; max-width:100%; display:block; }
    .wrapper { max-width:850px;width:95%;margin:auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 6px 20px rgba(0,0,0,0.08);font-family:'Poppins',Arial,sans-serif; }
    @media only screen and (max-width:480px) { .body-padding { padding:20px !important; } }
  </style>
</head>

<body style="margin:0;padding:25px;background:#f3f6fb;">
<div class="wrapper">
  <div style="background:linear-gradient(135deg,#1e3a8a,#ff7e29);padding:50px 30px 70px;text-align:center;border-bottom-left-radius:80% 40px;border-bottom-right-radius:80% 40px;">
    <img src="https://admin.yastudy.com/public/logo.png" style="max-width:150px;margin:auto;" />
    <h2 style="color:#fff;font-size:26px;font-weight:600;margin-top:15px;">Reset Your Password</h2>
    <p style="color:#e5edff;font-size:15px;margin-top:5px;">Secure password reset request</p>
  </div>

  <div class="body-padding" style="padding:40px 50px;">
    <table width="100%">
      <tr>
        <td style="padding:4px 0 16px;font-size:14px;color:#111827;">
          Hi ${name},<br><br>
          We received a request to reset the password for your YaStudy account.
        </td>
      </tr>

      <tr>
        <td style="padding:0 0 16px;font-size:13px;color:#4b5563;">
          If this was you, click the button below to set a new password.  
          This link will expire in <strong>${expiry_minutes} minutes</strong>.
        </td>
      </tr>

      <tr>
        <td style="padding:0 0 20px;">
          <a href="${reset_link}"
            style="display:inline-block;padding:10px 20px;background:#F97316;color:#FFFFFF;
                   text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">
            Reset Password
          </a>
        </td>
      </tr>

      <tr>
        <td style="padding:0 0 24px;font-size:12px;color:#6b7280;">
          If you did not request a password reset, you can safely ignore this email.
        </td>
      </tr>
    </table>
  </div>

  <div style="background:linear-gradient(135deg,#ff7e29,#1e3a8a);padding:25px;text-align:center;">
    <p style="color:#fff;font-size:13px;margin:0;line-height:1.6;">
      © ${new Date().getFullYear()} YAStudy. All rights reserved.<br />
      This is an automated message — please do not reply.
    </p>
  </div>
</div>
</body>
</html>`;
}
