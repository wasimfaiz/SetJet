// app/api/salary/generate-pdf/route.ts
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";
import { toWords } from "number-to-words";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const salary = JSON.parse(body.content);

    const parseNumber = (v: any) => (isNaN(Number(v)) ? 0 : Number(v));

    const {
      employeeId,
      employeeName,
      department,
      designation,
      location,
      salaryDate, // this is the PAYMENT DATE
      dob,
      doj,
      gender,
      bankAccountNumber,
      pan,
      lop,
    } = salary;

    const basicSalary = parseNumber(salary.basicSalary);
    const hra = parseNumber(salary.hra);
    const telephoneReimbursement = parseNumber(salary.telephoneReimbursement);
    const bonus = parseNumber(salary.bonus);
    const lta = parseNumber(salary.lta);
    const specialAllowancePetrolAllowance = parseNumber(
      salary.specialAllowancePetrolAllowance
    );
    const incentive = parseNumber(salary.incentive);

    const incomeTax = parseNumber(salary.incomeTax);
    const providentFund = parseNumber(salary.providentFund);
    const professionalTax = parseNumber(salary.professionalTax);

    const totalEarnings =
      basicSalary +
      hra +
      telephoneReimbursement +
      bonus +
      lta +
      specialAllowancePetrolAllowance +
      incentive;

    const totalDeductions =
      incomeTax + providentFund + professionalTax + parseNumber(lop);

    const netPayment = totalEarnings - totalDeductions;

    // === Determine the actual salary month (not payment month) ===
    const paymentDate = new Date(salaryDate);
    const paymentDay = paymentDate.getDate();

    let salaryMonthDate = paymentDate;
    if (paymentDay <= 30) {
      // Paid early → salary for previous month (e.g., Jan 6 → Dec 2025)
      salaryMonthDate = new Date(
        paymentDate.getFullYear(),
        paymentDate.getMonth() - 1
      );
    }

    const salaryMonth = salaryMonthDate.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    // === Net Salary in Words (Indian style) ===
    const convertToWords = (num: number) => {
      if (num === 0) return "Zero";

      const crore = Math.floor(num / 10000000); // 1 Crore = 10,000,000
      const lakhs = Math.floor((num % 10000000) / 100000);
      const thousands = Math.floor((num % 100000) / 1000);
      const hundreds = Math.floor((num % 1000) / 100);
      const remainder = num % 100;

      let words = "";
      if (crore > 0) words += toWords(crore) + " Crore ";
      if (lakhs > 0) words += toWords(lakhs) + " Lakh ";
      if (thousands > 0) words += toWords(thousands) + " Thousand ";
      if (hundreds > 0) words += toWords(hundreds) + " Hundred ";
      if (remainder > 0) words += toWords(remainder);

      return words.trim().replace(/\b\w/g, (char) => char.toUpperCase()) + " Only";
    };

    const netSalaryInWords = convertToWords(netPayment);

    // === PDF SETUP ===
    const pdfDoc = await PDFDocument.create();
    const times = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page = pdfDoc.addPage([800, 1000]);
    const { width, height } = page.getSize();

    // === HEADER ===
    const logoPath = path.resolve("public", "logo.png");
    const logoBytes = fs.readFileSync(logoPath);
    const logoImage = await pdfDoc.embedPng(logoBytes);

    page.drawImage(logoImage, {
      x: 50,
      y: height - 100,
      width: 80,
      height: 60,
    });

    page.drawText("Europass Immigration Private Limited", {
      x: 150,
      y: height - 70,
      size: 18,
      font: bold,
      color: rgb(0.8, 0.3, 0.1),
    });
    page.drawText(
      "Office No. 606, 6th Floor, Verma Centre, Boring Road, Patna, Bihar - 800001",
      {
        x: 150,
        y: height - 88,
        size: 10,
        font: times,
        color: rgb(0.2, 0.2, 0.2),
      }
    );

    page.drawText("Payslip For the Month", {
      x: width - 220,
      y: height - 70,
      size: 12,
      font: times,
      color: rgb(0.3, 0.3, 0.3),
    });
    page.drawText(salaryMonth, {
      x: width - 220,
      y: height - 88,
      size: 12,
      font: bold,
      color: rgb(0, 0, 0),
    });

    // Separator line
    page.drawLine({
      start: { x: 40, y: height - 110 },
      end: { x: width - 40, y: height - 110 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    // === EMPLOYEE SUMMARY ===
    let startY = height - 150;
    page.drawText("EMPLOYEE SUMMARY", {
      x: 300,
      y: startY,
      size: 11,
      font: bold,
      color: rgb(0.1, 0.1, 0.1),
    });

    startY -= 35;
    const summary = [
      ["Employee Name", employeeName],
      ["Employee ID", employeeId],
      ["Designation", designation],
      ["Department", department],
      ["Location", location],
      ["Date of Birth", dob || "-"],
      ["Date of Joining", doj || "-"],
      ["Gender", gender || "-"],
      ["Bank A/c No.", bankAccountNumber || "-"],
      ["PAN No.", pan || "-"],
    ];

    let rowY = startY;
    summary.forEach((row, i) => {
      const colX = i % 2 === 0 ? 50 : width / 2 - 100;
      if (i % 2 === 0 && i > 0) rowY -= 20;

      page.drawText(`${row[0]} :`, {
        x: colX,
        y: rowY,
        size: 10,
        font: bold,
      });
      page.drawText(row[1]?.toString() || "-", {
        x: colX + 120,
        y: rowY,
        size: 10,
        font: times,
      });
    });

    // Net Pay Box
    const boxX = width - 280;
    const boxY = height - 260;
    page.drawRectangle({
      x: boxX,
      y: boxY,
      width: 230,
      height: 100,
      color: rgb(0.9, 1, 0.9),
      borderColor: rgb(0.6, 0.9, 0.6),
      borderWidth: 1,
    });
    page.drawText(`Rs. ${netPayment.toFixed(2)}`, {
      x: boxX + 30,
      y: boxY + 60,
      size: 16,
      font: bold,
      color: rgb(0.1, 0.5, 0.1),
    });
    page.drawText("Total Net Pay", {
      x: boxX + 30,
      y: boxY + 40,
      size: 10,
      font: times,
    });
    page.drawLine({
      start: { x: boxX + 20, y: boxY + 35 },
      end: { x: boxX + 210, y: boxY + 35 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });
    page.drawText(`LOP Days : ${parseNumber(lop).toFixed(2)}`, {
      x: boxX + 140,
      y: boxY + 20,
      size: 9,
      font: times,
    });

    // === TABLES ===
    const tableY = height - 360;
    const colWidth = 300;
    const rowHeight = 22;

    const earnings = [
      ["Basic", basicSalary],
      ["House Rent Allowance", hra],
      ["Telephone", telephoneReimbursement],
      ["Bonus", bonus],
      ["LTA", lta],
      ["Special Allowance", specialAllowancePetrolAllowance],
      ["Incentive", incentive],
      ["Gross Earnings", totalEarnings],
    ];

    const deductions = [
      ["Income Tax", incomeTax],
      ["Provident Fund", providentFund],
      ["Professional Tax", professionalTax],
      ["Loss of Pay", parseNumber(lop)],
      ["Total Deductions", totalDeductions],
    ];

    const drawTable = (data: any[], x: number, y: number, header: string) => {
      page.drawRectangle({
        x,
        y,
        width: colWidth,
        height: rowHeight,
        color: rgb(0.95, 0.95, 0.95),
      });
      page.drawText(header, {
        x: x + 5,
        y: y + 6,
        size: 10,
        font: bold,
        color: rgb(0, 0, 0),
      });

      let curY = y - rowHeight;
      data.forEach((row) => {
        page.drawRectangle({
          x,
          y: curY,
          width: colWidth,
          height: rowHeight,
          borderColor: rgb(0.8, 0.8, 0.8),
          borderWidth: 0.5,
        });
        page.drawText(row[0], { x: x + 5, y: curY + 6, size: 9, font: times });
        page.drawText("Rs." + parseNumber(row[1]).toFixed(2), {
          x: x + colWidth - 100,
          y: curY + 6,
          size: 9,
          font: times,
        });
        curY -= rowHeight;
      });
    };

    drawTable(earnings, 50, tableY, "EARNINGS");
    drawTable(deductions, width - colWidth - 50, tableY, "DEDUCTIONS");

    // === NET PAYABLE ===
    const netY = tableY - 220;
    page.drawRectangle({
      x: 50,
      y: netY,
      width: width - 100,
      height: 40,
      color: rgb(0.9, 1, 0.9),
      borderColor: rgb(0.6, 0.9, 0.6),
      borderWidth: 1,
    });
    page.drawText("TOTAL NET PAYABLE", {
      x: 60,
      y: netY + 12,
      size: 10,
      font: bold,
    });
    page.drawText(`Rs.${netPayment.toFixed(2)}`, {
      x: width - 180,
      y: netY + 12,
      size: 12,
      font: bold,
      color: rgb(0, 0.5, 0.2),
    });

    // === IN WORDS ===
    page.drawText(`Amount In Words : Indian Rupee ${netSalaryInWords}`, {
      x: 50,
      y: netY - 20,
      size: 9,
      font: times,
      color: rgb(0.2, 0.2, 0.2),
    });

    // === FOOTER ===
    const footer = "This is a system-generated salary slip and does not require a signature.";
    page.drawText(footer, {
      x: (width - times.widthOfTextAtSize(footer, 8)) / 2,
      y: 40,
      size: 8,
      font: times,
      color: rgb(0.5, 0.5, 0.5),
    });

    // === SAVE & RETURN ===
    const pdfBytes = await pdfDoc.save();
    const arrayBuffer = new Uint8Array(pdfBytes).buffer;

    return new Response(arrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Salary_Slip_${employeeName.replace(/\s+/g, "_")}_${salaryMonth}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("Error generating PDF:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
    });
  }
}