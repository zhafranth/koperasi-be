import { Router } from "express";
import {
  getAllCicilan,
  createCicilan,
  getCicilanByPinjamanId,
} from "../controllers/cicilanControllers";
import authenticateToken from "../middleware/authMiddleware";

const router = Router();
router.get("/", authenticateToken, getAllCicilan);
router.post("/", authenticateToken, createCicilan);
router.get("/pinjaman/:id_pinjaman", authenticateToken, getCicilanByPinjamanId);
export default router;
