import { Router, Request, Response } from "express";
import { protect } from "../middleware/authMiddleware";
import { adminOnly } from "../middleware/adminMiddleware";
import { upload } from "../middleware/uploadMiddleware";
import {
  getAdminStats,
  getAllUsers,
  adjustBalance,
  updateUserStatus,
  deleteUser,
  getAdminDeposits,
  approveDeposit,
  rejectDeposit,
  cancelApprovedDeposit,
  getAdminWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  reviewKYC,
  getAdminSettings,
  updateAdminSettings,
  createPackage,
  updatePackage,
  toggleMaintenance,
  getMaintenanceStatus
} from "../controllers/adminController";
import { getAdminTickets } from "../controllers/ticketController";
import { distributeRoi } from "../utils/roiCron";

const router = Router();

// ─── PUBLIC ──────────────────────────────────────────────────────────────────
// Maintenance status is public so the frontend can always check it
router.get("/maintenance/status", getMaintenanceStatus);

// ─── PROTECTED / ADMIN ONLY ───────────────────────────────────────────────────
router.use(protect);
router.use(adminOnly);

// Users
router.get("/stats", getAdminStats);
router.get("/users", getAllUsers);
router.post("/users/adjust-balance", adjustBalance);
router.put("/users/status", updateUserStatus);
router.delete("/users/:userId", deleteUser);

// Deposits
router.get("/deposits", getAdminDeposits);
router.post("/deposits/approve", approveDeposit);
router.post("/deposits/reject", rejectDeposit);
router.post("/deposits/cancel", cancelApprovedDeposit);

// Withdrawals
router.get("/withdrawals", getAdminWithdrawals);
router.post("/withdrawals/approve", approveWithdrawal);
router.post("/withdrawals/reject", rejectWithdrawal);

// KYC
router.post("/kyc/review", reviewKYC);

// Settings
router.get("/settings", getAdminSettings);
router.put("/settings", upload.single("qrCodeImage"), updateAdminSettings);

// Packages
router.post("/packages", createPackage);
router.put("/packages/:id", updatePackage);

// Support tickets
router.get("/tickets", getAdminTickets);

// Maintenance mode toggle
router.post("/maintenance", toggleMaintenance);

// Manually trigger daily ROI distribution (admin use only)
router.post("/distribute-roi", async (req: Request, res: Response) => {
  try {
    const result = await distributeRoi();
    res.json({ success: true, message: `ROI distributed. Credited: ${result.credited}, Skipped: ${result.skipped}`, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "ROI distribution failed", error: error.message });
  }
});

export default router;
