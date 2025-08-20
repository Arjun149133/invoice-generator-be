import prisma from "../config/db";
import puppeteer from "puppeteer";

const generatePdf = async (invoiceId: string) => {
  const invoice = await prisma.invoice.findUnique({
    where: {
      id: invoiceId,
    },
    include: {
      products: true,
      user: true,
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
  });
  const page = await browser.newPage();

  const html = `
    <html>
      <head><style>body{font-family:sans-serif;}</style></head>
      <body>
        <h1>Invoice</h1>
        <p>Customer: ${invoice.user.username}</p>
        <ul>
          ${invoice.products
            .map((p: any) => `<li>${p.name} - $${p.price}</li>`)
            .join("")}
        </ul>
        <h2>TotalCharges: $${invoice.totalAmount}</h2>
        <h2>GST: $${Math.round(invoice.gst / 100)}</h2>

        <h3>TotalPayable: $${
          invoice.totalAmount + Math.round(invoice.gst / 100)
        }</h3>
      </body>
    </html>
  `;

  await page.setContent(html);
  const pdfBuffer = await page.pdf({ format: "A4" });

  await browser.close();
  return pdfBuffer;
};

export { generatePdf };
