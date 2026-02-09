import { Router } from "express";
import {
  getAllSimpananSukarela,
  getSimpananSukarelaById,
  createSimpananSukarela,
  updateSimpananSukarela,
  deleteSimpananSukarela,
} from "../controllers/simpananSukarelaControllers";
import authenticateToken from "../middleware/authMiddleware";

const router = Router();

router.get("/", getAllSimpananSukarela);
router.get("/:id", getSimpananSukarelaById);
router.post("/", authenticateToken, createSimpananSukarela);
router.put("/:id", authenticateToken, updateSimpananSukarela);
router.delete("/:id", authenticateToken, deleteSimpananSukarela);

export default router;
