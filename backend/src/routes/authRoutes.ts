import { Router } from "express";
import { 
  register, 
  verifyOtp, 
  login, 
  forgotPassword, 
  resetPassword, 
  contactUs,
  getBusinessModelSettings,
  lookupSponsor
} from "../controllers/authController";

const router = Router();

router.get("/lookup-sponsor", lookupSponsor);
router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/contact", contactUs);
router.get("/business-model", getBusinessModelSettings);

export default router;
