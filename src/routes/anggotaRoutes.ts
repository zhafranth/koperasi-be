import { Router } from "express";
import {
  getAllAnggota,
  getDetailAnggota,
  updateAnggota,
} from "../controllers/anggotaControllers";

const router = Router();

router.get("/", getAllAnggota);
router.get("/:id", getDetailAnggota);
router.put("/:id", updateAnggota);

export default router;
