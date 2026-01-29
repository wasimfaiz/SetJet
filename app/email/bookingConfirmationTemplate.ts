export function bookingConfirmationTemplate(
  name: string,
  course_name: string,
  start_date_time: string,
  order_id: string,
  booking_link: string
) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Booking Confirmation</title>

  <style>
    body,table,td,a,img { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table { border-collapse:collapse !important; }
    img { border:0; max-width:100%; display:block; }
    .wrapper { max-width:850px;width:95%;margin:auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 6px 20px rgba(0,0,0,0.08);font-family:'Poppins',Arial,sans-serif; }
  </style>
</head>

<body style="margin:0;padding:25px;background:#f3f6fb;">

<div class="wrapper">

  <div style="background:linear-gradient(135deg,#1e3a8a,#ff7e29);padding:50px 30px 70px;text-align:center;">
    <img src="https://admin.yastudy.com/public/logo.png" style="max-width:150px;" />
    <h2 style="color:#fff;margin-top:15px;font-size:26px;font-weight:600;">Booking Confirmed</h2>
  </div>

  <div style="padding:40px 50px;">

    <table width="100%">
      <tr>
        <td style="padding:4px 0 16px;font-size:14px;color:#111827;">
          Hi ${name},<br><br>
          Your booking for <strong>${course_name}</strong> is confirmed.
        </td>
      </tr>

      <tr>
        <td style="padding:0 0 16px;font-size:13px;color:#4b5563;">
          Start Date & Time: <strong>${start_date_time}</strong><br>
          Order ID: <strong>${order_id}</strong>
        </td>
      </tr>

      <tr>
        <td style="padding:0 0 20px;">
          <a href="${booking_link}"
            style="display:inline-block;padding:10px 20px;background:#F97316;color:#fff;border-radius:6px;
                   text-decoration:none;font-size:14px;font-weight:600;">
            View Booking Details
          </a>
        </td>
      </tr>

      <tr>
        <td style="padding:0 0 24px;font-size:13px;color:#4b5563;">
          You’ll also receive reminders before your class starts.
        </td>
      </tr>
    </table>

  </div>

  <div style="background:linear-gradient(135deg,#ff7e29,#1e3a8a);padding:25px;text-align:center;">
    <p style="color:#fff;font-size:13px;margin:0;">
      © ${new Date().getFullYear()} YAStudy. All rights reserved.
    </p>
  </div>

</div>

</body>
</html>`;
}
