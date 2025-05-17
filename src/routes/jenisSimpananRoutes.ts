import { Router } from "express";
import {
  getAllJenisSimpanan,
  createJenisSimpanan,
} from "../controllers/jenisSimpananControllers";

const router = Router();

router.get("/", getAllJenisSimpanan);
router.post("/", createJenisSimpanan);

export default router;
