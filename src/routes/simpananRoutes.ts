import { Router } from "express";
import { getAll, createSimpanan } from "../controllers/simpananControllers";

const router = Router();

router.get("/", getAll);
router.post("/", createSimpanan);

export default router;
