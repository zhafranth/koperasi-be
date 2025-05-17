import { Router } from "express";
import {
  getAllPinjaman,
  createPinjaman,
} from "../controllers/pinjamanControllers";
import authenticateToken from "../middleware/authMiddleware";

const router = Router();

router.get("/", authenticateToken, getAllPinjaman);
router.post("/", authenticateToken, createPinjaman);

export default router;
