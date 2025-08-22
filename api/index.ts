import express from "express";
import authRouter from "./routes/userRoutes";
import invoiceRouter from "./routes/invoiceRoutes";
import pdfRouter from "./routes/pdfRoute";
import cors from "cors";
const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());

app.get("/hello", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/auth", authRouter);
app.use("/api/invoice", invoiceRouter);
app.use("/api/generate-pdf", pdfRouter);

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
