import { PDFDocument, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";
import { format, isToday, isValid } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { isToday as isTodayDateFns } from "date-fns"; // Import isToday from date-fns

// Function to safely parse numbers, returning 0 if parsing fails
const safeParseNumber = (value: any): number => {
  const parsed = Number(value);
  return isNaN(parsed) ? 0 : parsed;
};

function splitAddress(address: string, maxLength: number): string[] {
  const lines: string[] = [];
  while (address.length > maxLength) {
    let splitIndex = address.lastIndexOf(" ", maxLength);
    if (splitIndex === -1) splitIndex = maxLength;
    lines.push(address.slice(0, splitIndex));
    address = address.slice(splitIndex).trim();
  }
  if (address.length > 0) lines.push(address);
  return lines;
}

// Function to wrap text for a specific width
function wrapText(
  text: string,
  maxWidth: number,
  font: any,
  fontSize: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const lineWidth = font.widthOfTextAtSize(testLine, fontSize);
    if (lineWidth > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

// Use a fixed timezone for formatting to ensure consistency across deployments
const TIMEZONE = "Asia/Kolkata"; // Indian Standard Time

const formatDate = (
  selectedDateString: string,
  createdAtString: string
): string => {
  try {
    if (!selectedDateString) {
      console.log("dateString is empty or null");
      return "N/A";
    }

    if (!createdAtString) {
      console.log("createdAtString is empty or null");
      return "N/A";
    }

    const selectedDate = new Date(selectedDateString);
    const createdAt = new Date(createdAtString);

    if (!isValid(selectedDate)) {
      console.warn("Invalid date:", selectedDateString);
      return "Invalid Date";
    }

    if (!isValid(createdAt)) {
      console.warn("Invalid createdAt date:", createdAtString);
      return "Invalid Date";
    }

    const timezone = "Asia/Kolkata";

    // Check if the selected date is today
    const isSelectedDateToday = isTodayDateFns(selectedDate);

    // Conditionally format with or without time
    const dateFormat = isSelectedDateToday
      ? "dd/MM/yyyy hh:mm a"
      : "dd/MM/yyyy";

    return formatInTimeZone(
      isSelectedDateToday ? createdAt : selectedDate,
      timezone,
      dateFormat,
      { timeZone: timezone }
    );
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
};

// Function to format the itemDate
const formatItemDate = (dateString: string | undefined): string => {
  if (!dateString) {
    return "N/A";
  }

  try {
    const date = new Date(dateString);

    if (!isValid(date)) {
      console.warn("Invalid itemDate:", dateString);
      return "Invalid Date";
    }

    return format(date, "dd/MM/yyyy");
  } catch (error) {
    console.error("Error formatting itemDate:", error);
    return "Invalid Date";
  }
};

export async function POST(req: Request) {
  try {
    const { content } = await req.json();
    const invoiceData = JSON.parse(content);

    // Determine if GST column should be included
    let includeGstColumn = false;
    if (invoiceData.items && Array.isArray(invoiceData.items)) {
      for (const item of invoiceData.items) {
        if (item.gst && safeParseNumber(item.gst) > 0) {
          includeGstColumn = true;
          break;
        }
      }
    }

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([700, 800]);
    const { width, height } = page.getSize();

    const logoPath = path.resolve("public", "logo.png");
    const logoBytes = fs.readFileSync(logoPath);
    const logoImage = await pdfDoc.embedPng(logoBytes);
    const logoDims = logoImage.scale(0.1);
    const logoDims2 = logoImage.scale(0.8);

    // Position logo and company name
    const logoX = 50;
    const logoY = height - 140;
    page.drawImage(logoImage, {
      x: logoX,
      y: logoY,
      width: logoDims.width,
      height: logoDims.height,
    });

    const headerFont = await pdfDoc.embedFont("Times-Bold");
    const headerFontSize = 20;
    const headerColor = rgb(0.1, 0.1, 0.5);
    const companyNameX = logoX + logoDims.width + 5;

    page.drawText("Europass Immigration PRIVATE LIMITED", {
      x: companyNameX,
      y: logoY + logoDims.height / 2 - 4,
      size: headerFontSize,
      color: headerColor,
      font: headerFont,
    });

    page.drawText("Invoice", {
      x: width - 120,
      y: height - 160,
      size: headerFontSize,
      color: headerColor,
      font: headerFont,
    });

    // Line separator
    page.drawLine({
      start: { x: 50, y: height - 170 },
      end: { x: width - 50, y: height - 170 },
      color: rgb(0.5, 0.5, 0.5),
      thickness: 2,
    });

    const textFont = await pdfDoc.embedFont("Times-Roman");
    const textOptions = { size: 12, color: rgb(0, 0, 0), font: textFont };
    const marginX = 50;
    const infoYStart = height - 200;

    // Format the createdAt date
    const formattedCreatedAt = invoiceData.date
      ? formatDate(invoiceData.date, invoiceData.createdAt)
      : "N/A";

    page.drawText(`Bill to : ${invoiceData.to}`, {
      x: marginX,
      y: infoYStart,
      ...textOptions,
    });
    page.drawText(`Mobile Number: ${invoiceData.mobile}`, {
      x: marginX,
      y: infoYStart - 20,
      ...textOptions,
    });
    page.drawText(`Invoice Number: ${invoiceData.invoiceNumber}`, {
      x: marginX,
      y: infoYStart - 60,
      ...textOptions,
    });

    //Conditionally render gst number
    let gstNumberYOffset = 0;
    if (
      invoiceData.gstNumber &&
      invoiceData.gstNumber.trim() !== "" &&
      includeGstColumn
    ) {
      page.drawText(`GST Number: ${invoiceData.gstNumber}`, {
        x: marginX,
        y: infoYStart - 80,
        ...textOptions,
      });
      gstNumberYOffset = 20; // Offset to push the next lines down if GST is present
    }

    // Add Invoice For
    let currentY = infoYStart - 80 - gstNumberYOffset; // Initial Y position, adjusted for GST
    page.drawText(`Invoice For: ${invoiceData.invoiceFor}`, {
      x: marginX,
      y: currentY,
      ...textOptions,
    });

    // Adjust Y position for next line
    currentY -= 20;

    page.drawText(`Country Applying For: ${invoiceData.countryApplyingFor}`, {
      x: marginX,
      y: currentY,
      ...textOptions,
    });

    // Adjust Y position for next line
    currentY -= 20; // Add a gap between the lines
    page.drawText(`Course Applying For: ${invoiceData.courseApplyingFor}`, {
      x: marginX,
      y: currentY,
      ...textOptions,
    });

    const fromX = width - 300;
    page.drawText(`From, ${invoiceData.from}`, {
      x: fromX,
      y: infoYStart,
      ...textOptions,
    });

    const addressLines = splitAddress(invoiceData.address, 30);
    let addressY = infoYStart - 20;
    for (const line of addressLines) {
      page.drawText(line, { x: fromX, y: addressY, ...textOptions });
      addressY -= 15;
    }
    // Format the date
    const formattedDate = invoiceData.date
      ? formatDate(invoiceData.date, invoiceData.createdAt)
      : "N/A";

    page.drawText(`Date: ${formattedDate}`, {
      x: marginX,
      y: infoYStart - 40,
      ...textOptions,
    });

    const watermarkX = (width - logoDims2.width) / 2;
    const watermarkY = (height - logoDims2.height) / 2;
    page.drawImage(logoImage, {
      x: watermarkX,
      y: watermarkY,
      width: logoDims2.width,
      height: logoDims2.height,
      opacity: 0.1, // Set low opacity for watermark effect
    });

    // Table headers
    const tableVerticalShift = 60;
    const tableStartY = addressY - 30 - tableVerticalShift;

    const tableHeaderFont = await pdfDoc.embedFont("Times-Bold");
    const tableHeaderFontSize = 11;
    const tableHeaderHeight = 22;
    const tableHeaderColor = rgb(0.1, 0.1, 0.5);

    page.drawRectangle({
      x: 40, // Margin from Left side
      y: tableStartY,
      width: width - 80,
      height: tableHeaderHeight,
      color: tableHeaderColor,
      opacity: 1,
    });

    const headerTextColor = rgb(1, 1, 1);

    // Define column headers and positions with the correct order
    const columnHeaders = [
      "Date",
      "Description",
      "Package Amt.",
      "Payment Mode",
    ];
    const columnWidths = [60, 120, 80, 80];

    if (includeGstColumn) {
      columnHeaders.push("GST %");
      columnWidths.push(50);
    }

    // Change  to "Balance\nAmount"
    columnHeaders.push("Total Amt.", "Paid Amt.", "Balance Amt.");

    columnWidths.push(70, 70, 90);

    const columnPositions: number[] = [];

    let currentX = 40;
    columnWidths.forEach((width) => {
      columnPositions.push(currentX);
      currentX += width;
    });

    // Draw table headers
    columnHeaders.forEach((header, i) => {
      page.drawText(header, {
        x: columnPositions[i] + 7, // Slight padding inside the column
        y: tableStartY + 5,
        size: 10,
        font: tableHeaderFont,
        color: headerTextColor,
      });
    });

    // Draw vertical lines for the table header
    columnPositions.forEach((columnX, i) => {
      page.drawLine({
        start: { x: columnX, y: tableStartY + tableHeaderHeight },
        end: { x: columnX, y: tableStartY },
        color: rgb(1, 1, 1),
        thickness: 0.5,
      });
    });

    // Table rows
    let yPosition = tableStartY;
    const rowHeight = 30; // Increased row height

    let totalBalanceAmount = 0;
    let totalPaidAmount = 0;

    for (const [index, item] of invoiceData.items.entries()) {
      // Safely parse numeric values
      const packageAmount = safeParseNumber(item.packageamount);
      const gstPercentage = safeParseNumber(item.gst);
      const paidAmount = safeParseNumber(item.paidamount);

      // Calculate gst amount
      const gstAmount = (packageAmount * gstPercentage) / 100;

      // Calculate total amount and balance amount
      const totalAmount = packageAmount + gstAmount;
      const balanceAmount = totalAmount - paidAmount;

      totalBalanceAmount += balanceAmount;
      totalPaidAmount += paidAmount;

      // Wrap text for the "Description" column
      const descriptionWidth = columnWidths[1] - 12; // Column width with padding
      const wrappedDescription = wrapText(
        item.description,
        descriptionWidth,
        textFont,
        9
      );

      // Determine the height needed for the row
      // Ensure a minimum height for rows with no description
      const descriptionLineHeight = 11;
      const requiredHeight = Math.max(
        wrappedDescription.length * descriptionLineHeight,
        rowHeight
      );

      // Draw row borders
      page.drawLine({
        start: { x: 40, y: yPosition }, // Start from 50
        end: { x: width - 40, y: yPosition }, // End at width - 50
        color: rgb(0.8, 0.8, 0.8),
        thickness: 0.5,
      });

      // Adjust vertical lines for the row height
      columnPositions.forEach((columnX) => {
        page.drawLine({
          start: { x: columnX, y: yPosition },
          end: { x: columnX, y: yPosition - requiredHeight },
          color: rgb(0.8, 0.8, 0.8),
          thickness: 0.5,
        });
      });

      // Add cell content
      const safeWrappedDescription =
        wrappedDescription.length > 0 ? wrappedDescription : ["N/A"];

      // Format GST, Paid and Balance
      const formattedGst = gstPercentage === 0 ? "N/A" : `${gstPercentage} %`;

      const columnValues = [
        formatItemDate(item.itemDate),
        safeWrappedDescription, // Wrapped description
        packageAmount.toFixed(2), // Package Amount
        item.paymentMode || "N/A",
      ];

      if (includeGstColumn) {
        columnValues.push(formattedGst); // Gst
      }
      columnValues.push(
        totalAmount.toFixed(2), // Total Amount,
        paidAmount.toFixed(2), // Paid Amount,
        balanceAmount.toFixed(2) //Balance Amount
      );

      columnValues.forEach((value, i) => {
        if (i === 1) {
          // Handling wrapped text for the "Description" column
          let textY = yPosition - 13; // Padding for text positioning
          const descriptionLines = Array.isArray(value) ? value : ["N/A"]; // Ensure value is an array
          descriptionLines.forEach((line) => {
            page.drawText(line, {
              x: columnPositions[i] + 2,
              y: textY,
              size: 10, // Increased description font size
              font: textFont,
              color: rgb(0, 0, 0),
            });
            textY -= descriptionLineHeight; // Move to the next line (line height 10)
          });
        } else {
          const text = value?.toString() || "N/A";
          page.drawText(text, {
            x: columnPositions[i] + 2,
            y: yPosition - 15,
            size: 10, // Increased general font size
            font: textFont,
            color: rgb(0, 0, 0),
          });
        }
      });

      yPosition -= requiredHeight;
    }

    page.drawLine({
      start: { x: 40, y: yPosition },
      end: { x: width - 40, y: yPosition }, // End at width - 50
      color: rgb(0.8, 0.8, 0.8),
      thickness: 0.5,
    });

    const totalsX = width - 170; // From Right Side 170,

    const totalsY = yPosition - 20;

    const currencySymbol = "Rs.";

    page.drawText("Total Paid Amount :", {
      x: totalsX - 40, // Totals From Right Side 40 to its left.
      y: totalsY,
      size: 12,
      font: textFont,
      color: rgb(0.1, 0.5, 0.8),
    });
    page.drawText(`${currencySymbol} ${totalPaidAmount.toFixed(2)}/-`, {
      x: totalsX + 70,
      y: totalsY,
      size: 12,
      font: textFont,
      color: rgb(0, 0, 0),
    });

    page.drawText("Total Balance Amount :", {
      x: totalsX - 53, // Totals From Right Side 40 to its left.
      y: totalsY - 20,
      size: 12,
      font: textFont,
      color: rgb(0.1, 0.5, 0.8),
    });
    page.drawText(`${currencySymbol} ${totalBalanceAmount.toFixed(2)}/-`, {
      x: totalsX + 70,
      y: totalsY - 20,
      size: 12,
      font: textFont,
      color: rgb(0, 0, 0),
    });

    yPosition -= 60;
    page.drawText("Payment Information:", {
      x: 50,
      y: yPosition,
      size: 12,
      font: textFont,
    });
    page.drawText(`Name: ${invoiceData.from}`, {
      x: 50,
      y: yPosition - 20,
      size: 12,
      font: textFont,
    });
    page.drawText(`Bank: ${invoiceData.bank}`, {
      x: 50,
      y: yPosition - 40,
      size: 12,
      font: textFont,
    });
    page.drawText(`A/c No: ${invoiceData.accNo}`, {
      x: 50,
      y: yPosition - 60,
      size: 12,
      font: textFont,
    });
    page.drawText(`IFSC: ${invoiceData.ifsc}`, {
      x: 50,
      y: yPosition - 80,
      size: 12,
      font: textFont,
    });
    page.drawText(`UPI: ${invoiceData.upi}`, {
      x: 50,
      y: yPosition - 100,
      size: 12,
      font: textFont,
    });

    page.drawText("Thank you for your business!", {
      x: 50,
      y: yPosition - 140,
      size: 12,
      font: textFont,
      color: rgb(0.1, 0.5, 0.8),
    });

    const footerHeight = 50;
    const footerYStart = 50;
    const footerYAdjustment = 10;

    page.drawRectangle({
      x: 0,
      y: footerHeight + footerYAdjustment,
      width: width,
      height: footerHeight + 10,
      color: rgb(1, 1, 1),
    });

    page.drawLine({
      start: { x: 50, y: footerHeight + 10 + footerYAdjustment },
      end: { x: width - 50, y: footerHeight + 10 + footerYAdjustment },
      color: rgb(0.7, 0.7, 0.7),
      thickness: 1.5,
    });

    const phoneIconPath = path.resolve("public", "telephone.png");
    const emailIconPath = path.resolve("public", "gmail.png");
    const websiteIconPath = path.resolve("public", "website.png");

    const phoneIconBytes = fs.readFileSync(phoneIconPath);
    const emailIconBytes = fs.readFileSync(emailIconPath);
    const websiteIconBytes = fs.readFileSync(websiteIconPath);

    const phoneIconImage = await pdfDoc.embedPng(phoneIconBytes);
    const emailIconImage = await pdfDoc.embedPng(emailIconBytes);
    const websiteIconImage = await pdfDoc.embedPng(websiteIconBytes);
    const iconSize = 12;
    const textYAdjustment = 20;

    const phoneIconX = width / 2 - 70;
    const phoneIconY = 20 + textYAdjustment;

    const emailIconX = width - 210;
    const emailIconY = 20 + textYAdjustment;

    const websiteIconX = 50;
    const websiteIconY = 20 + textYAdjustment;

    page.drawImage(websiteIconImage, {
      x: websiteIconX,
      y: websiteIconY,
      width: iconSize,
      height: iconSize,
    });

    const footerFont = await pdfDoc.embedFont("Times-Roman");
    const footerFontSize = 12;

    page.drawText("www.yastudy.com", {
      x: websiteIconX + iconSize + 5,
      y: websiteIconY + 2,
      font: footerFont,
      size: footerFontSize,
      color: rgb(0, 0, 0),
    });

    page.drawImage(phoneIconImage, {
      x: phoneIconX,
      y: phoneIconY,
      width: iconSize,
      height: iconSize,
    });

    page.drawText("+91 76678 96481", {
      x: phoneIconX + iconSize + 5,
      y: phoneIconY + 2,
      font: footerFont,
      size: footerFontSize,
      color: rgb(0, 0, 0),
    });

    page.drawImage(emailIconImage, {
      x: emailIconX,
      y: emailIconY,
      width: iconSize,
      height: iconSize,
    });

    page.drawText("support@yastudy.com", {
      x: emailIconX + iconSize + 5,
      y: emailIconY + 2,
      font: footerFont,
      size: footerFontSize,
      color: rgb(0, 0, 0),
    });

    // generate PDF bytes (Uint8Array)
    const pdfBytes = await pdfDoc.save();

    // convert to Node Buffer so it matches BodyInit for Response in Node runtime
    const pdfBuffer = Buffer.from(pdfBytes);

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="invoice.pdf"',
      },
    });
  } catch (error) {
    console.error(error);
    return new Response("Error generating PDF", { status: 500 });
  }
}
