import { Router } from "express";
import {
  getAllTabunganLiburan,
  getTabunganLiburanById,
  createTabunganLiburan,
  updateTabunganLiburan,
  deleteTabunganLiburan,
} from "../controllers/tabunganLiburanControllers";
import authenticateToken from "../middleware/authMiddleware";

const router = Router();

router.get("/", getAllTabunganLiburan);
router.get("/:id", getTabunganLiburanById);
router.post("/", authenticateToken, createTabunganLiburan);
router.put("/:id", authenticateToken, updateTabunganLiburan);
router.delete("/:id", authenticateToken, deleteTabunganLiburan);

export default router;
