import { Router } from "express";
import {
  getAllPenarikan,
  getPenarikanById,
  getSaldoPenarikan,
  createPenarikan,
  deletePenarikan,
} from "../controllers/penarikanControllers";
import authenticateToken from "../middleware/authMiddleware";

const router = Router();

router.get("/", getAllPenarikan);
router.get("/saldo", getSaldoPenarikan);
router.get("/:id", getPenarikanById);
router.post("/", authenticateToken, createPenarikan);
router.delete("/:id", authenticateToken, deletePenarikan);

export default router;
