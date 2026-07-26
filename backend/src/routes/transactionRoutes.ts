import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";
import {
  getTransactionHistory,
  submitDeposit,
  getDeposits,
  submitWithdrawal,
  getWithdrawals,
  getWalletSummary
} from "../controllers/transactionController";

const router = Router();

router.use(protect); // Apply JWT protection to all transaction routes

router.get("/", getTransactionHistory);
router.post("/deposit", upload.single("screenshot"), submitDeposit);
router.get("/deposits", getDeposits);
router.post("/withdraw", submitWithdrawal);
router.get("/withdrawals", getWithdrawals);
router.get("/summary", getWalletSummary);

export default router;
