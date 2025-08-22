import { Router } from "express";
import prisma from "../config/db";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.post("/create", authMiddleware, async (req, res) => {
  try {
    console.log("user", req.userId);
    const invoice = await prisma.invoice.create({
      data: {
        userId: req.userId!,
        totalAmount: 0,
        gst: 0,
      },
    });
    res.status(201).json({
      invoiceId: invoice.id,
    });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ error: "Product creation failed" });
  }
});

router.post("/add-product", authMiddleware, async (req, res) => {
  const { name, quantity, rate, invoiceId } = req.body;

  try {
    const existingInvoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
      },
    });

    if (!existingInvoice) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    const product = await prisma.product.create({
      data: {
        name,
        quantity,
        rate,
        invoiceId,
        price: quantity * rate,
        userId: req.userId!,
      },
    });

    await prisma.invoice.update({
      where: {
        id: invoiceId,
      },
      data: {
        totalAmount: {
          increment: product.price,
        },
        gst: {
          increment: product.price * 18,
        },
      },
    });

    res.status(201).json({
      message: "successfully added product to invoice",
    });
  } catch (error) {
    res.status(500).json({ error: "Adding product to invoice failed" });
  }
});

router.post("/remove-product", authMiddleware, async (req, res) => {
  const { productId, invoiceId } = req.body;

  try {
    const existingInvoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
      },
    });

    if (!existingInvoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    await prisma.product.delete({
      where: {
        id: productId,
      },
    });

    await prisma.invoice.update({
      where: {
        id: invoiceId,
      },
      data: {
        totalAmount: {
          decrement: product.price,
        },
        gst: {
          decrement: product.price * 18,
        },
      },
    });

    res.status(200).json({
      message: "Product removed successfully",
    });
  } catch (error) {
    res.status(500).json({ error: "Removing product from invoice failed" });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: {
        id,
        userId: req.userId,
      },
      include: {
        products: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ error: "Fetching invoice failed" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: {
        id,
        userId: req.userId,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    await prisma.invoice.delete({
      where: {
        id,
      },
    });

    res.status(200).json({
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ error: "Deleting invoice failed" });
  }
});

export default router;
