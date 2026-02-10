import { Router } from "express";
import {
  getAllKeluarga,
  createKeluarga,
  updateKeluarga,
  deleteKeluarga,
} from "../controllers/keluargaControllers";
import authenticateToken from "../middleware/authMiddleware";

const router = Router();

router.get("/", getAllKeluarga);
router.post("/", authenticateToken, createKeluarga);
router.put("/:id", authenticateToken, updateKeluarga);
router.delete("/:id", authenticateToken, deleteKeluarga);

export default router;
