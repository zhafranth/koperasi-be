import express from "express";
import cors from "cors";
import anggotaRouter from "./routes/anggotaRoutes";
import pengurusRouter from "./routes/pengurusRoutes";
import authRouter from "./routes/authRoutes";
import simpananRouter from "./routes/simpananRoutes";
import jenisSimpananRouter from "./routes/jenisSimpananRoutes";
import transaksiRouter from "./routes/transaksiRoutes";
import pinjamanRouter from "./routes/pinjamanRoutes";
import cicilanRouter from "./routes/cicilanRoutes";

import dotenv from "dotenv";
import authenticateToken from "./middleware/authMiddleware";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/auth", authRouter);
app.use("/anggota", anggotaRouter);
app.use("/pengurus", pengurusRouter);
app.use("/transaksi", transaksiRouter);
app.use("/pinjaman", pinjamanRouter);
app.use("/cicilan", cicilanRouter);
app.use("/simpanan", authenticateToken, simpananRouter); // Middleware untuk autentikasi toke
app.use("/jenis-simpanan", authenticateToken, jenisSimpananRouter);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

export default app;
