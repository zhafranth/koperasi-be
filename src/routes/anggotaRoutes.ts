import { Router } from "express";
import {
  getAllAnggota,
  getDetailAnggota,
} from "../controllers/anggotaControllers";

const router = Router();

router.get("/", getAllAnggota);
router.get("/:id", getDetailAnggota);

export default router;
