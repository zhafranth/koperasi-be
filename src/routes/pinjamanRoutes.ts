import { Router } from "express";
import {
  getAllPinjaman,
  createPinjaman,
  getDetailPinjaman,
} from "../controllers/pinjamanControllers";
import authenticateToken from "../middleware/authMiddleware";

const router = Router();

router.get("/", authenticateToken, getAllPinjaman);
router.get("/:id", authenticateToken, getDetailPinjaman);
router.post("/", authenticateToken, createPinjaman);

export default router;
