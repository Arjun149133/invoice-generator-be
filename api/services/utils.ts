import prisma from "../config/db";
import PuppeteerHTMLPDF from "puppeteer-html-pdf";
import hbs from "handlebars";
import path from "path";
import fs from "fs";

export const generatePdf = async (invoiceId: string) => {
  const htmlPDF = new PuppeteerHTMLPDF();
  htmlPDF.setOptions({ format: "A4" });

  hbs.registerHelper("multiply", (a, b) => a * b);
  const invoiceData = await getInvoiceData(invoiceId);

  if (!invoiceData) {
    return;
  }

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
    totalAmount: invoiceData.totalAmount || 22000, // e.g., 22000 cents
    gst: invoiceData.gst, // e.g., 18% of 22000 in cents
    gstRounded: Math.round(invoiceData.gst / 100), // e.g., 3960 cents
    totalPayable: invoiceData.totalAmount + Math.round(invoiceData.gst / 100),
  };

  try {
    const cssPath = path.join(__dirname, "../../pdf-format/css/main.css");
    const cssRaw = await fs.promises.readFile(cssPath, "utf8");
    const cssContent = cssRaw.replace(/^\uFEFF/, ""); // Removes BOM if exists

    const html = await htmlPDF.readFile(
      path.join(__dirname, "../../pdf-format/index.html"),
      "utf8"
    );
    const template = hbs.compile(html);
    const content = template({ ...pdfData, styles: cssContent });

    // console.log("Generated HTML content for PDF:", content);
    const pdfBuffer = await htmlPDF.create(content);

    return pdfBuffer;
  } catch (error) {
    console.error("PuppeteerHTMLPDF error", error);

    throw error;
  }
};

const getInvoiceData = async (invoiceId: string) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
      },
      include: {
        products: true,
        user: true,
      },
    });
    return invoice;
  } catch (error) {
    console.error("Error fetching invoice data:", error);
    throw error;
  }
};
