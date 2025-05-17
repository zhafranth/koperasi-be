import { Router } from "express";
import { getAllTransaksi } from "../controllers/transaksiControllers";
import authenticateToken from "../middleware/authMiddleware";

const router = Router();
router.get("/", authenticateToken, getAllTransaksi);

export default router;
