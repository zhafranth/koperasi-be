import { Router } from "express";
import {
  getPemasukan,
  getPengeluaran,
} from "../controllers/danaKoperasiControllers";

const router = Router();

router.get("/pemasukan", getPemasukan);
router.get("/pengeluaran", getPengeluaran);

export default router;
