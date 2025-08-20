import express from "express";
import authRouter from "./routes/userRoutes";
import invoiceRouter from "./routes/invoiceRoutes";
import pdfRouter from "./routes/pdfRoute";
const app = express();
const port = 3000;

app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/invoice", invoiceRouter);
app.use("/api/generate-pdf", pdfRouter);

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
