import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import {
  createTicket,
  getUserTickets,
  getTicketDetails,
  replyToTicket
} from "../controllers/ticketController";

const router = Router();

router.use(protect); // Apply JWT protection

router.post("/", createTicket);
router.get("/", getUserTickets);
router.get("/:id", getTicketDetails);
router.post("/:id/reply", replyToTicket);

export default router;
