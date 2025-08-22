import prisma from "../config/db";
import chromium from "chrome-aws-lambda";
import puppeteer from "puppeteer-core";
import hbs from "handlebars";
import path from "path";
import fs from "fs";

export const generatePdf = async (invoiceId: string) => {
  hbs.registerHelper("multiply", (a, b) => a * b);
  const invoiceData = await getInvoiceData(invoiceId);

  if (!invoiceData) return;

  const pdfData = {
    date: "21/08/25",
    user: {
      username: invoiceData?.user?.username || "John Doe",
      email: invoiceData?.user?.email || "john@example.com",
    },
    products: invoiceData.products.map((product) => ({
      name: product.name,
      qty: product.quantity,
      rate: product.rate,
      price: product.quantity * product.rate,
    })),
    totalAmount: invoiceData.totalAmount || 22000,
    gst: invoiceData.gst,
    gstRounded: Math.round(invoiceData.gst / 100),
    totalPayable: invoiceData.totalAmount + Math.round(invoiceData.gst / 100),
  };

  try {
    // Load CSS
    const cssPath = path.join(process.cwd(), "pdf-format/css/main.css");
    const cssRaw = await fs.promises.readFile(cssPath, "utf8");
    const cssContent = cssRaw.replace(/^\uFEFF/, "");

    // Load HTML template
    const htmlPath = path.join(process.cwd(), "pdf-format/index.html");
    const html = await fs.promises.readFile(htmlPath, "utf8");
    const template = hbs.compile(html);
    const content = template({ ...pdfData, styles: cssContent });

    // Launch Puppeteer with chrome-aws-lambda config
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: process.env.AWS_EXECUTION_ENV // running on Vercel / AWS
        ? await chromium.executablePath
        : process.env.CHROME_PATH || "/usr/bin/google-chrome",
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(content, { waitUntil: "networkidle0" });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    return pdfBuffer;
  } catch (error) {
    console.error("Puppeteer error", error);
    throw error;
  }
};

const getInvoiceData = async (invoiceId: string) => {
  try {
    return await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { products: true, user: true },
    });
  } catch (error) {
    console.error("Error fetching invoice data:", error);
    throw error;
  }
};
