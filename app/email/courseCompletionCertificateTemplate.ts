export function courseCompletionCertificateTemplate(
  name: string,
  courseName: string,
  completionDate: string,
  certificateLink: string
) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Course Completion Certificate</title>

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

    .logo-img { display:block;margin:0 auto;max-height:90px;max-width:180px; }

    @media only screen and (max-width:480px){
      .header-padding{padding:30px 15px 50px!important;}
      .body-padding{padding:30px 20px!important;}
      h1{font-size:22px!important;} h2{font-size:18px!important;} p{font-size:15px!important;}
    }
  </style>
</head>

<body style="margin:0;padding:0;background:#f3f6fb;font-family:'Poppins',Arial,sans-serif;">

<div class="wrapper">

  <!-- HEADER -->
  <div class="header-padding"
       style="background:linear-gradient(135deg,#1e3a8a,#ff7e29);
              padding:50px 30px 70px;text-align:center;
              border-bottom-left-radius:80% 40px;border-bottom-right-radius:80% 40px;">

    <img src="https://yastudy.com/assets/images/Yastudy.png"
         alt="YAStudy Logo"
         class="logo-img"/>

    <h1 style="color:#fff;font-size:26px;font-weight:600;">
      Congratulations on Completing Your Course!
    </h1>

    <p style="color:#e0e7ff;font-size:15px;">Your certificate is now available</p>
  </div>

  <!-- BODY -->
  <div class="body-padding" style="padding:50px 60px 40px;">
    
    <h2 style="color:#1e3a8a;font-weight:700;font-size:22px;">Hi ${name},</h2>

    <p style="color:#374151;font-size:16px;line-height:1.7;">
      Great job! You have successfully completed the course:
      <br><strong>${courseName}</strong>  
      <br><br>Your learning journey matters, and this achievement deserves recognition.
    </p>

    <!-- DETAILS CARD -->
    <table width="100%" style="background:#fff;border-radius:18px;
                              box-shadow:0 3px 12px rgba(0,0,0,0.06);
                              padding:25px;margin:25px 0;">
      <tr>
        <td style="padding:10px;font-weight:600;color:#1e3a8a;">Course Name</td>
        <td style="padding:10px;color:#374151;">${courseName}</td>
      </tr>

      <tr>
        <td style="padding:10px;font-weight:600;color:#1e3a8a;">Completion Date</td>
        <td style="padding:10px;color:#374151;">${completionDate}</td>
      </tr>
    </table>

    <div style="text-align:center;margin:40px 0;">
      <a href="${certificateLink}"
         style="background:linear-gradient(135deg,#1e3a8a,#ff7e29);
                padding:16px 40px;border-radius:40px;color:#fff;
                text-decoration:none;font-weight:600;font-size:16px;">
        Download Certificate
      </a>
    </div>

  </div>

  <!-- FOOTER -->
  <div style="background:linear-gradient(135deg,#ff7e29,#1e3a8a);
              color:#fff;text-align:center;
              padding:35px;border-top-left-radius:60% 30px;
              border-top-right-radius:60% 30px;">
    <p style="margin:0;font-size:13px;line-height:1.7;">
      © ${new Date().getFullYear()} YAStudy. All rights reserved.
    </p>
  </div>

</div>

</body>
</html>
`;
}
