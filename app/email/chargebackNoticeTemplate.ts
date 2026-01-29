export function chargebackNoticeTemplate(
  name: string,
  amount: number,
  transactionId: string,
  reason: string
) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Chargeback Notice</title>

<style>
  body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  table { border-collapse:collapse !important; }
  img { border:0; outline:none; text-decoration:none; max-width:100%; }
  .wrapper {
    max-width:900px;width:95%;margin:auto;background:#fff;border-radius:20px;
    overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,0.1);
  }
</style>
</head>

<body style="margin:0;padding:0;background:#f3f6fb;font-family:'Poppins',Arial,sans-serif;">

<div class="wrapper">

  <div style="background:linear-gradient(135deg,#1e3a8a,#ff7e29);
              padding:50px 30px 70px;text-align:center;
              border-bottom-left-radius:80% 40px;border-bottom-right-radius:80% 40px;">
    <img src="https://yastudy.com/assets/images/Yastudy.png" class="logo-img"/>
    <h1 style="color:#fff;font-size:26px;">Chargeback Notice</h1>
    <p style="color:#e0e7ff;font-size:15px;">A dispute has been raised for one of your transactions</p>
  </div>

  <div style="padding:50px 60px 40px;">
    <h2 style="color:#1e3a8a;">Hi ${name},</h2>

    <p style="color:#374151;font-size:16px;line-height:1.7;">
      We were notified that a chargeback was filed for a recent payment. Below are the details:
    </p>

    <table width="100%" style="background:#fff;border-radius:18px;
                              box-shadow:0 3px 12px rgba(0,0,0,0.06);
                              padding:25px;margin:25px 0;">
      <tr><td style="padding:10px;font-weight:600;color:#1e3a8a;">Transaction ID</td>
          <td style="padding:10px;color:#374151;">${transactionId}</td></tr>

      <tr><td style="padding:10px;font-weight:600;color:#1e3a8a;">Amount</td>
          <td style="padding:10px;color:#374151;">₹ ${amount}</td></tr>

      <tr><td style="padding:10px;font-weight:600;color:#1e3a8a;">Reason</td>
          <td style="padding:10px;color:#374151;">${reason}</td></tr>
    </table>

    <p style="color:#374151;">
      If this payment is legitimate, please respond to the dispute with supporting documents.
    </p>

    <div style="text-align:center;margin-top:25px;">
      <a href="https://yastudy.com/support"
         style="background:linear-gradient(135deg,#1e3a8a,#ff7e29);
         padding:16px 40px;border-radius:40px;color:#fff;text-decoration:none;font-weight:600;">
        View Dispute Details
      </a>
    </div>
  </div>

  <div style="background:linear-gradient(135deg,#ff7e29,#1e3a8a);
              padding:35px;text-align:center;color:#fff;">
    © ${new Date().getFullYear()} YAStudy. All rights reserved.
  </div>

</div>
</body>
</html>`;
}
