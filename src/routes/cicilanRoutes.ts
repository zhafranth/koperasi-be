import { Router } from "express";
import {
  getAllCicilan,
  createCicilan,
} from "../controllers/cicilanControllers";
import authenticateToken from "../middleware/authMiddleware";

const router = Router();
router.get("/", authenticateToken, getAllCicilan);
router.post("/", authenticateToken, createCicilan);
export default router;
