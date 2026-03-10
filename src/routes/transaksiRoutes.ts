import { Router } from "express";
import {
  getAllTransaksi,
  getTransaksiById,
  deleteTransaksi,
  updateTransaksi,
  getJumlahTransaksi,
} from "../controllers/transaksiControllers";
import authenticateToken from "../middleware/authMiddleware";

const router = Router();
router.get("/", authenticateToken, getAllTransaksi);
router.get("/total", getJumlahTransaksi);
router.get("/:id", authenticateToken, getTransaksiById);
router.put("/:id", authenticateToken, updateTransaksi);
router.delete("/:id", authenticateToken, deleteTransaksi);

export default router;
