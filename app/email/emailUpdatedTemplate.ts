export function emailUpdatedTemplate(
  name: string,
  Email: string,
 
) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email Updated</title>

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
  <div
    style="
      background:linear-gradient(135deg,#1e3a8a,#ff7e29);
      padding:50px 30px 70px;
      text-align:center;
      border-bottom-left-radius:80% 40px;
      border-bottom-right-radius:80% 40px;
    "
  >
    <img
      src="https://admin.yastudy.com/public/logo.png"
      alt="YAStudy Logo"
      style="max-width:150px;margin:auto;"
    />

    <h2 style="color:#fff;font-size:26px;font-weight:600;margin-top:15px;">
      Email Updated Successfully
    </h2>

    <p style="color:#e5edff;font-size:15px;margin-top:5px;">
      Your account email has been changed securely.
    </p>
  </div>

  <!-- BODY -->
  <div class="body-padding" style="padding:40px 50px;">
    <p style="font-size:16px;color:#374151;">
      Hi <strong>${name}</strong>,
    </p>

    <p style="font-size:15px;color:#374151;line-height:1.7;margin-top:5px;">
      Your email address linked with your YAStudy account has been successfully updated.
      If this change was not made by you, please contact support urgently.
    </p>

    <!-- DETAILS CARD -->
    <div
      style="
        background:#fff;
        border-radius:16px;
        padding:25px;
        margin-top:25px;
        border:1px solid #e5e7eb;
        box-shadow:0 3px 10px rgba(0,0,0,0.05);
      "
    >
      <h3 style="color:#1e3a8a;font-size:18px;margin-bottom:20px;">
        Updated Email Details
      </h3>

      <table style="width:100%;font-size:15px;">
        <tr>
          <td style="padding:10px 0;color:#6b7280;">Email</td>
          <td style="padding:10px 0;font-weight:600;color:#1e3a8a;">${Email}</td>
        </tr>
      </table>
    </div>

    <p style="margin-top:30px;font-size:14px;color:#6b7280;line-height:1.7;">
      If you didn’t request this update, please reach out to the YAStudy Support Team immediately.
    </p>
  </div>

  <!-- FOOTER -->
  <div
    style="
      background:linear-gradient(135deg,#ff7e29,#1e3a8a);
      padding:25px;
      text-align:center;
    "
  >
    <p
      style="
        color:#fff;
        font-size:13px;
        line-height:1.6;
        margin:0;
      "
    >
      © ${new Date().getFullYear()} YAStudy. All rights reserved.<br />
      This is an automated message — please do not reply.
    </p>
  </div>

</div>

</body>
</html>
  `;
}
