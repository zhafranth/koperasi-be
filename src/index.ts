import express from "express";
import cors from "cors";
import anggotaRouter from "./routes/anggotaRoutes";
import pengurusRouter from "./routes/pengurusRoutes";
import authRouter from "./routes/authRoutes";
import simpananRouter from "./routes/simpananRoutes";
import transaksiRouter from "./routes/transaksiRoutes";
import pinjamanRouter from "./routes/pinjamanRoutes";
import cicilanRouter from "./routes/cicilanRoutes";
import infaqRouter from "./routes/infaqRoutes";
import keluargaRouter from "./routes/keluargaRoutes";
import eventRouter from "./routes/eventRoutes";
import simpananSukarelaRouter from "./routes/simpananSukarelaRoutes";
import tabunganLiburanRouter from "./routes/tabunganLiburanRoutes";
import penarikanRouter from "./routes/penarikanRoutes";

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
app.use("/simpanan", authenticateToken, simpananRouter);
app.use("/infaq", authenticateToken, infaqRouter);
app.use("/keluarga", authenticateToken, keluargaRouter);
app.use("/event", eventRouter);
app.use("/simpanan-sukarela", simpananSukarelaRouter);
app.use("/tabungan-liburan", tabunganLiburanRouter);
app.use("/penarikan", penarikanRouter);
app.use("/coba", (req, res) => {
  res.send("Hello B!tch");
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

export default app;
