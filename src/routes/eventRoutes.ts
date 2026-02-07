import { Router } from "express";
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/eventControllers";
import authenticateToken from "../middleware/authMiddleware";

const router = Router();

router.get("/", getAllEvents);
router.get("/:id", getEventById);
router.post("/", authenticateToken, createEvent);
router.put("/:id", authenticateToken, updateEvent);
router.delete("/:id", authenticateToken, deleteEvent);

export default router;
