export function invoiceOverdueTemplate(
  name: string,
  invoiceId: string,
  dueDate: string,
  amount: number
) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice Overdue Notice</title>

  <style>
    body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table { border-collapse:collapse !important; }
    img { border:0; outline:none; text-decoration:none; max-width:100%; }

    .wrapper {
      max-width:900px;
      width:95%;
      margin:auto;
      background:#fff;
      border-radius:20px;
      overflow:hidden;
      box-shadow:0 6px 24px rgba(0,0,0,0.1);
    }

    .logo-img {
      display:block;
      margin:0 auto;
      max-height:90px;
      max-width:180px;
    }

    @media only screen and (max-width:480px) {
      .header-padding { padding:30px 15px 50px !important; }
      .body-padding   { padding:30px 20px !important; }
      h1 { font-size:22px !important; }
      h2 { font-size:18px !important; }
      p  { font-size:15px !important; }
    }
  </style>
</head>

<body style="margin:0;padding:0;background:#f3f6fb;font-family:'Poppins',Arial,sans-serif;">

<div class="wrapper">

  <!-- HEADER -->
  <div class="header-padding"
       style="background:linear-gradient(135deg,#1e3a8a,#ff7e29);
              padding:50px 30px 70px;text-align:center;
              border-bottom-left-radius:80% 40px;
              border-bottom-right-radius:80% 40px;">
    
    <img src="https://yastudy.com/assets/images/Yastudy.png"
         alt="YAStudy Logo"
         class="logo-img" />

    <h1 style="color:#fff;font-size:26px;font-weight:600;margin:14px 0 0;">
      Invoice Overdue Notice
    </h1>

    <p style="color:#e0e7ff;font-size:15px;margin:10px 0 0;">
      Your invoice payment is past the due date
    </p>
  </div>

  <!-- BODY -->
  <div class="body-padding" style="padding:50px 60px 40px;">

    <h2 style="color:#1e3a8a;font-weight:700;font-size:22px;margin-bottom:12px;">
      Hi ${name},
    </h2>

    <p style="color:#374151;font-size:16px;line-height:1.7;margin-bottom:20px;">
      This is a reminder that your invoice <strong>#${invoiceId}</strong> is overdue.
      Please review the details below and complete the payment at the earliest.
    </p>

    <!-- DETAILS CARD -->
    <table role="presentation" width="100%"
           style="background:#fff;border-radius:18px;
                  box-shadow:0 3px 12px rgba(0,0,0,0.06);
                  padding:25px;margin-bottom:25px;">
      <tr>
        <td style="padding:10px;font-weight:600;color:#1e3a8a;">Invoice ID</td>
        <td style="padding:10px;color:#374151;">${invoiceId}</td>
      </tr>
      <tr>
        <td style="padding:10px;font-weight:600;color:#1e3a8a;">Due Date</td>
        <td style="padding:10px;color:#374151;">${dueDate}</td>
      </tr>
      <tr>
        <td style="padding:10px;font-weight:600;color:#1e3a8a;">Amount Due</td>
        <td style="padding:10px;color:#374151;">₹ ${amount}</td>
      </tr>
      <tr>
    </table>

    <p style="color:#374151;font-size:16px;margin-bottom:30px;">
      Please make the payment to avoid any interruption in your services.
    </p>

    <div style="text-align:center;margin:30px 0;">
      <a href="https://yastudy.com/payments"
         style="background:linear-gradient(135deg,#1e3a8a,#ff7e29);
                padding:16px 40px;border-radius:40px;
                color:#fff;text-decoration:none;font-weight:600;
                font-size:16px;box-shadow:0 8px 22px rgba(255,126,41,.4);">
        Pay Now
      </a>
    </div>

  </div>

  <!-- FOOTER -->
  <div style="background:linear-gradient(135deg,#ff7e29,#1e3a8a);
              color:#fff;text-align:center;
              padding:35px 25px;
              border-top-left-radius:60% 30px;
              border-top-right-radius:60% 30px;">
    
    <p style="font-size:13px;margin:0;line-height:1.8;">
      This is an automated message from <strong>YAStudy</strong>.<br>
      Please do not reply directly to this email.<br><br>
      © ${new Date().getFullYear()} YAStudy. All rights reserved.
    </p>
  </div>

</div>

</body>
</html>
  `;
}
