import { Router } from "express";
import {
  getAllAnggota,
  getDetailAnggota,
} from "../controllers/anggotaControllers";
import authenticateToken from "../middleware/authMiddleware";

const router = Router();

router.get("/", authenticateToken, getAllAnggota);
router.get("/:id", authenticateToken, getDetailAnggota);

export default router;
