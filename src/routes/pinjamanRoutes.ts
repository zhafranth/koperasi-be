import { Router } from "express";
import {
  getAllPinjaman,
  createPinjaman,
  getDetailPinjaman,
  getLimitPinjaman,
} from "../controllers/pinjamanControllers";
import authenticateToken from "../middleware/authMiddleware";

const router = Router();

router.get("/", authenticateToken, getAllPinjaman);
router.get("/limit", authenticateToken, getLimitPinjaman);
router.get("/:id", authenticateToken, getDetailPinjaman);
router.post("/", authenticateToken, createPinjaman);

export default router;
