import { Router } from "express";
import {
  getAllPinjaman,
  createPinjaman,
  getDetailPinjaman,
  getLimitPinjaman,
  getAggregatedPinjaman,
  getAggregatedPinjamanByAnggota,
} from "../controllers/pinjamanControllers";
import authenticateToken from "../middleware/authMiddleware";

const router = Router();

// Order matters: literal segments must come before /:id to avoid capture.
router.get("/", authenticateToken, getAllPinjaman);
router.get("/aggregated", authenticateToken, getAggregatedPinjaman);
router.get("/limit", authenticateToken, getLimitPinjaman);
router.get(
  "/anggota/:id_anggota",
  authenticateToken,
  getAggregatedPinjamanByAnggota,
);
router.get("/:id", authenticateToken, getDetailPinjaman);
router.post("/", authenticateToken, createPinjaman);

export default router;
