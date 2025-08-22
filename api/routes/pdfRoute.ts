import { Router } from "express";
import { generatePdf } from "../services/utils";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.post("/", authMiddleware, async (req, res) => {
  const { invoiceId } = req.body;

  try {
    console.log("invoicee:", invoiceId);
    const pdfBuffer = await generatePdf(invoiceId);

    if (!pdfBuffer) {
      res.status(500).send("Failed to generate PDF");
      return;
    }

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=invoice-${invoiceId}.pdf`,
    });

    res.status(200).send(pdfBuffer);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "PDF generation failed" });
  }
});

export default router;
