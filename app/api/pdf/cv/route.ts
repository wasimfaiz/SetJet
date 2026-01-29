import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const token = req.nextUrl.searchParams.get("token");
  if (!id || !token)
    return NextResponse.json({ error: "Missing id or token" }, { status: 400 });

  const cvUrl = `http://localhost:3000/cv-preview?id=${id}&hideSidebar=0`; // sidebar visible first page
  let browser;

  try {
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true,
      defaultViewport: null,
    });

    const page = await browser.newPage();

    await page.evaluateOnNewDocument((t: string) => {
      localStorage.setItem("token", t);
    }, token);

    await page.goto(cvUrl, { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector("#CV", { visible: true, timeout: 15000 });

    // Wait images/fonts
    await page.evaluate(async () => {
      const imgs = Array.from(document.images || []);
      await Promise.all(
        imgs.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((res) => {
                img.onload = res;
                img.onerror = res;
              })
        )
      );
      if ((document as any).fonts) await (document as any).fonts.ready;
    });

    // PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" },
    });

    await browser.close();

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=CV_${id}.pdf`,
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    if (browser) await browser.close();
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
