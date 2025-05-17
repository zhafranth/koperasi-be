import { Router } from "express";
import { createPengurus } from "../controllers/pengurusControllers";

const router = Router();

router.post("/", createPengurus);

export default router;
