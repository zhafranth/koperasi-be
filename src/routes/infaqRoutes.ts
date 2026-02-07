import { Router } from "express";
import { getAllInfaq, createInfaq } from "../controllers/infaqControllers";

const router = Router();

router.get("/", getAllInfaq);
router.post("/", createInfaq);

export default router;
