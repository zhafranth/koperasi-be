import { Router } from "express";
import {
  getAllTransaksi,
  getJumlahTransaksi,
} from "../controllers/transaksiControllers";
import authenticateToken from "../middleware/authMiddleware";

const router = Router();
router.get("/", authenticateToken, getAllTransaksi);
router.get("/total", authenticateToken, getJumlahTransaksi);

export default router;
