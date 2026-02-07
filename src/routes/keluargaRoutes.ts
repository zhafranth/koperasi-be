import { Router } from "express";
import {
  getAllKeluarga,
  createKeluarga,
  updateKeluarga,
  deleteKeluarga,
} from "../controllers/keluargaControllers";

const router = Router();

router.get("/", getAllKeluarga);
router.post("/", createKeluarga);
router.put("/:id", updateKeluarga);
router.delete("/:id", deleteKeluarga);

export default router;
