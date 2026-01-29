export function paymentReceiptTemplate({
  name,
  serviceName,
  amount,
  transactionId,
  paidAt,
  receiptUrl,
  applicationId,
}: {
  name: string;
  serviceName: string;
  amount: number;
  transactionId: string | null;
  paidAt: string | null;
  receiptUrl: string | null;
  applicationId: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Receipt</title>

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
  <div class="header-padding"
       style="background:linear-gradient(135deg,#1e3a8a,#ff7e29);
              padding:50px 30px 70px;text-align:center;
              border-bottom-left-radius:80% 40px;
              border-bottom-right-radius:80% 40px;">
    
    <img src="https://yastudy.com/assets/images/Yastudy.png"
         alt="YAStudy Logo"
         class="logo-img" />

    <h2 style="color:#fff;font-size:26px;font-weight:600;margin-top:15px;">
      Payment Receipt
    </h2>
    <p style="color:#e5edff;font-size:15px;margin-top:5px;">
      Thank you for your payment — your transaction has been successfully processed.
    </p>
  </div>

  <!-- BODY -->
  <div class="body-padding" style="padding:40px 50px;">
    <p style="font-size:16px;color:#374151;">
      Hi <strong>${name}</strong>,
    </p>

    <p style="font-size:15px;color:#374151;line-height:1.7;margin-top:5px;">
      We have received your payment for <strong>${serviceName}</strong>.  
      Below is your payment receipt for your records.
    </p>

    <!-- DETAILS CARD -->
    <div style="background:#fff;border-radius:16px;padding:25px;margin-top:25px;
                border:1px solid #e5e7eb;box-shadow:0 3px 10px rgba(0,0,0,0.05);">

      <h3 style="color:#1e3a8a;font-size:18px;margin-bottom:20px;">Payment Summary</h3>

      <table style="width:100%;font-size:15px;">
        <tr>
          <td style="padding:10px 0;color:#6b7280;">Service Name</td>
          <td style="padding:10px 0;font-weight:600;color:#1e3a8a;">${serviceName}</td>
        </tr>

        <tr>
          <td style="padding:10px 0;color:#6b7280;">Amount</td>
          <td style="padding:10px 0;font-weight:600;color:#1e3a8a;">₹ ${amount}</td>
        </tr>

        <tr>
          <td style="padding:10px 0;color:#6b7280;">Transaction ID</td>
          <td style="padding:10px 0;font-weight:600;color:#1e3a8a;">${transactionId}</td>
        </tr>

        <tr>
          <td style="padding:10px 0;color:#6b7280;">Paid On</td>
          <td style="padding:10px 0;font-weight:600;color:#1e3a8a;">
            ${paidAt || "N/A"}
          </td>
        </tr>
      </table>
    </div>

    <!-- BUTTON -->
    <div style="text-align:center;margin-top:30px;">
      <a href="${receiptUrl || "#"}"
         style="background:linear-gradient(135deg,#1e3a8a,#ff7e29);
                padding:14px 40px;color:#ffffff;font-weight:600;font-size:16px;
                border-radius:40px;text-decoration:none;display:inline-block;">
        Download Receipt
      </a>
    </div>

    <p style="margin-top:30px;font-size:14px;color:#6b7280;line-height:1.7;">
      If you have any questions or require additional support, feel free to contact our team.
    </p>
  </div>

  <!-- FOOTER -->
  <div style="background:linear-gradient(135deg,#ff7e29,#1e3a8a);padding:25px;text-align:center;">
    <p style="color:#fff;font-size:13px;line-height:1.6;margin:0;">
      © ${new Date().getFullYear()} YASTUDY. All rights reserved.<br />
      This is an automated message — please do not reply.
    </p>
  </div>

</div>

</body>
</html>
  `;
}
