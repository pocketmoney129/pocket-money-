import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { db } from "../config/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc 
} from "firebase/firestore";
import { sendSupportReplyEmail } from "../utils/email";

// @desc    Create a new support ticket
// @route   POST /api/tickets
// @access  Private
export const createTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      res.status(400).json({ success: false, message: "Please provide a subject and message" });
      return;
    }

    const ticketId = doc(collection(db, "support_tickets")).id;
    const ticketData = {
      _id: ticketId,
      user: req.user?._id,
      subject,
      status: "open",
      messages: [
        {
          sender: "user",
          message,
          createdAt: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(db, "support_tickets", ticketId), ticketData);

    res.status(201).json({ success: true, message: "Support ticket created successfully", data: ticketData });
  } catch (error: any) {
    console.error("Create ticket error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get user's support tickets
// @route   GET /api/tickets
// @access  Private
export const getUserTickets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const snap = await getDocs(query(collection(db, "support_tickets"), where("user", "==", req.user?._id)));
    const tickets = snap.docs.map(docSnap => ({ _id: docSnap.id, ...docSnap.data() }));

    // Sort by updatedAt desc in memory
    tickets.sort((a: any, b: any) => b.updatedAt.localeCompare(a.updatedAt));

    res.json({ success: true, data: tickets });
  } catch (error: any) {
    console.error("Get user tickets error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get ticket details (messages)
// @route   GET /api/tickets/:id
// @access  Private
export const getTicketDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticketDocRef = doc(db, "support_tickets", req.params.id);
    const ticketSnap = await getDoc(ticketDocRef);

    if (!ticketSnap.exists()) {
      res.status(404).json({ success: false, message: "Ticket not found" });
      return;
    }

    const ticket = ticketSnap.data();

    // Populate user
    let userDetails = null;
    if (ticket.user) {
      const uSnap = await getDoc(doc(db, "users", ticket.user));
      if (uSnap.exists()) {
        const u = uSnap.data();
        userDetails = { name: u.name, username: u.username, email: u.email };
      }
    }

    // Security: Check if user owns ticket, or user is admin
    const isOwner = ticket.user === req.user?._id;
    const isAdmin = req.user?.role === "admin";

    if (!isOwner && !isAdmin) {
      res.status(403).json({ success: false, message: "Not authorized to view this ticket" });
      return;
    }

    res.json({ 
      success: true, 
      data: {
        ...ticket,
        _id: ticketSnap.id,
        user: userDetails
      } 
    });
  } catch (error: any) {
    console.error("Get ticket details error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Reply to support ticket
// @route   POST /api/tickets/:id/reply
// @access  Private
export const replyToTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { message, status } = req.body;
    if (!message) {
      res.status(400).json({ success: false, message: "Message cannot be empty" });
      return;
    }

    const ticketDocRef = doc(db, "support_tickets", req.params.id);
    const ticketSnap = await getDoc(ticketDocRef);

    if (!ticketSnap.exists()) {
      res.status(404).json({ success: false, message: "Ticket not found" });
      return;
    }

    const ticket = ticketSnap.data();

    const isOwner = ticket.user === req.user?._id;
    const isAdmin = req.user?.role === "admin";

    if (!isOwner && !isAdmin) {
      res.status(403).json({ success: false, message: "Not authorized to reply to this ticket" });
      return;
    }

    const senderRole = isAdmin ? "admin" : "user";
    const messages = [...(ticket.messages || [])];
    messages.push({
      sender: senderRole,
      message,
      createdAt: new Date().toISOString()
    });

    let newStatus = ticket.status;
    if (isAdmin) {
      newStatus = status || "in_progress";
    } else {
      newStatus = "open";
    }

    await updateDoc(ticketDocRef, {
      messages,
      status: newStatus,
      updatedAt: new Date().toISOString()
    });

    // If reply is from admin, notify user by email
    if (isAdmin) {
      const uSnap = await getDoc(doc(db, "users", ticket.user));
      if (uSnap.exists()) {
        const u = uSnap.data();
        await sendSupportReplyEmail(u.email, u.name, ticket.subject);
      }
    }

    res.json({ 
      success: true, 
      message: "Reply sent successfully", 
      data: {
        ...ticket,
        _id: ticketSnap.id,
        messages,
        status: newStatus
      } 
    });
  } catch (error: any) {
    console.error("Reply to ticket error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get all support tickets (admin view)
// @route   GET /api/admin/tickets
// @access  Private/Admin
export const getAdminTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "";
    const ticketsSnap = await getDocs(collection(db, "support_tickets"));
    let ticketsList: any[] = [];

    for (const docSnap of ticketsSnap.docs) {
      const t = docSnap.data();
      if (!status || t.status === status) {
        let userDetails = null;
        if (t.user) {
          const uSnap = await getDoc(doc(db, "users", t.user));
          if (uSnap.exists()) {
            const u = uSnap.data();
            userDetails = { name: u.name, username: u.username, email: u.email };
          }
        }
        ticketsList.push({
          _id: docSnap.id,
          ...t,
          user: userDetails
        });
      }
    }

    ticketsList.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    res.json({ success: true, data: ticketsList });
  } catch (error: any) {
    console.error("Get admin tickets error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
