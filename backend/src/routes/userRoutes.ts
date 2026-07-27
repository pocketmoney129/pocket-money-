import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";
import {
  getProfile,
  submitKYC,
  updateBankDetails,
  getTeamByLevel,
  getGenealogyTree,
  getPackages,
  purchasePackage,
  getPaymentSettings,
  getUserPlans,
  getRankProgress,
  claimRankBonus
} from "../controllers/userController";

const router = Router();

// Public route for landing page & users
router.get("/packages", getPackages);

router.use(protect); // Apply JWT protection to subsequent user routes


router.get("/profile", getProfile);
router.get("/payment-settings", getPaymentSettings);
router.post(
  "/kyc",
  upload.fields([
    { name: "documentFront", maxCount: 1 },
    { name: "documentBack", maxCount: 1 }
  ]),
  submitKYC
);
router.put("/bank-details", updateBankDetails);
router.get("/team", getTeamByLevel);
router.get("/genealogy", getGenealogyTree);
router.post("/purchase-package", purchasePackage);

router.get("/my-plans", getUserPlans);
router.get("/rank-progress", getRankProgress);
router.post("/claim-rank-bonus", claimRankBonus);

export default router;

