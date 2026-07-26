import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { db } from "../config/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  deleteDoc,
  runTransaction
} from "firebase/firestore";
import { generateToken } from "../utils/generateToken";
import { sendOtpEmail, sendWelcomeEmail, sendForgetPasswordEmail, sendContactEmail } from "../utils/email";

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate next PM-format referral code atomically via Firestore counter
const generatePMReferralCode = async (): Promise<string> => {
  const counterRef = doc(db, "counters", "referralCode");
  let newSeq = 5001;
  await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);
    const currentSeq = counterSnap.exists() ? (counterSnap.data().seq || 5000) : 5000;
    newSeq = currentSeq + 1;
    transaction.set(counterRef, { seq: newSeq });
  });
  return `PM${newSeq}`;
};

// @desc    Lookup sponsor name by referral code
// @route   GET /api/auth/lookup-sponsor?code=PM5001
// @access  Public
export const lookupSponsor = async (req: Request, res: Response): Promise<void> => {
  try {
    const code = (req.query.code as string)?.trim();
    if (!code) {
      res.status(400).json({ success: false, message: "Referral code is required" });
      return;
    }
    const usersRef = collection(db, "users");
    // Try uppercase (PM format) first, then lowercase (legacy "admin")
    let snap = await getDocs(query(usersRef, where("referralCode", "==", code.toUpperCase())));
    if (snap.empty) {
      snap = await getDocs(query(usersRef, where("referralCode", "==", code.toLowerCase())));
    }
    if (snap.empty) {
      res.status(404).json({ success: false, message: "Invalid referral code" });
      return;
    }
    const sponsor = snap.docs[0].data();
    res.json({ success: true, data: { name: sponsor.name, username: sponsor.username } });
  } catch (error: any) {
    console.error("Lookup sponsor error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


// @desc    Register a new user (with Email OTP generation)
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, username, password, phone, referralCode } = req.body;

    if (!name || !email || !username || !password || !phone) {
      res.status(400).json({ success: false, message: "Please enter all required fields" });
      return;
    }

    // Referral code is REQUIRED
    if (!referralCode || !referralCode.trim()) {
      res.status(400).json({ success: false, message: "Sponsor referral code is required to register" });
      return;
    }

    const usersRef = collection(db, "users");
    let existingUserDocId = null;

    // Check duplicate email
    const qEmail = query(usersRef, where("email", "==", email.toLowerCase()));
    const emailSnap = await getDocs(qEmail);
    if (!emailSnap.empty) {
      const existingUser = emailSnap.docs[0].data();
      if (existingUser.emailVerified === true) {
        res.status(400).json({ success: false, message: "Email is already registered" });
        return;
      }
      existingUserDocId = emailSnap.docs[0].id;
    }

    // Check duplicate username
    const qUsername = query(usersRef, where("username", "==", username.toLowerCase()));
    const usernameSnap = await getDocs(qUsername);
    if (!usernameSnap.empty) {
      const existingUserByUsername = usernameSnap.docs[0].data();
      if (existingUserByUsername.emailVerified === true || existingUserByUsername.email !== email.toLowerCase()) {
        res.status(400).json({ success: false, message: "Username is already taken" });
        return;
      }
    }

    // Validate sponsor referral code (try uppercase PM format first, then lowercase for legacy like "admin")
    let sponsorId = null;
    const codeUpper = referralCode.trim().toUpperCase();
    const codeLower = referralCode.trim().toLowerCase();
    let sponsorSnap = await getDocs(query(usersRef, where("referralCode", "==", codeUpper)));
    if (sponsorSnap.empty) {
      sponsorSnap = await getDocs(query(usersRef, where("referralCode", "==", codeLower)));
    }
    if (sponsorSnap.empty) {
      res.status(400).json({ success: false, message: "Invalid sponsor referral code. Please enter a valid code." });
      return;
    }
    sponsorId = sponsorSnap.docs[0].id;

    // Generate unique PM-format referral code for this new user
    const newUserReferralCode = await generatePMReferralCode();

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save temporary unverified user to Firestore
    const userId = existingUserDocId || doc(collection(db, "users")).id;
    const userData = {
      _id: userId,
      name,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password: hashedPassword,
      phone,
      role: "user",
      status: "inactive",
      sponsor: sponsorId,
      referralCode: newUserReferralCode,
      walletBalance: 0,
      totalIncome: 0,
      emailVerified: false,
      kyc: {
        status: "none"
      },
      bankDetails: {},
      activePackage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(db, "users", userId), userData);

    // Generate & Save OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    await setDoc(doc(db, "otps", email.toLowerCase()), {
      email: email.toLowerCase(),
      otp,
      expiresAt
    });

    // Send Verification Email (non-blocking for fast registration responses)
    sendOtpEmail(email.toLowerCase(), otp).catch((err) => {
      console.error("Async registration OTP email sending error:", err);
    });

    res.status(201).json({
      success: true,
      message: "Registration initial setup successful. An OTP has been sent to your email.",
      email: email.toLowerCase()
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Verify Registration OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ success: false, message: "Email and OTP are required" });
      return;
    }

    const otpDocRef = doc(db, "otps", email.toLowerCase());
    const otpSnap = await getDoc(otpDocRef);

    if (!otpSnap.exists()) {
      res.status(400).json({ success: false, message: "Invalid or expired OTP" });
      return;
    }

    const otpData = otpSnap.data();

    if (otpData.otp !== otp || Date.now() > otpData.expiresAt) {
      res.status(400).json({ success: false, message: "Invalid or expired OTP" });
      return;
    }

    // OTP is valid, activate emailVerified status on user
    const usersRef = collection(db, "users");
    const qUser = query(usersRef, where("email", "==", email.toLowerCase()));
    const userSnap = await getDocs(qUser);

    if (userSnap.empty) {
      res.status(400).json({ success: false, message: "User account matching this email not found" });
      return;
    }

    const userDoc = userSnap.docs[0];
    const user = userDoc.data();

    await updateDoc(doc(db, "users", userDoc.id), {
      emailVerified: true,
      updatedAt: new Date().toISOString()
    });

    // Delete OTP record
    await deleteDoc(otpDocRef);

    // Send Welcome Email (non-blocking)
    sendWelcomeEmail(user.email, user.name).catch((err) => {
      console.error("Async welcome email sending error:", err);
    });

    res.json({
      success: true,
      message: "Email verification successful! Welcome aboard.",
      data: {
        _id: userDoc.id,
        name: user.name,
        email: user.email,
        username: user.username,
        phone: user.phone,
        role: user.role,
        status: user.status,
        sponsor: user.sponsor,
        referralCode: user.referralCode,
        walletBalance: user.walletBalance,
        token: generateToken(userDoc.id)
      }
    });
  } catch (error: any) {
    console.error("OTP verification error:", error);
    res.status(500).json({ success: false, message: "Server error during verification" });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      res.status(400).json({ success: false, message: "Please fill all fields" });
      return;
    }

    const usersRef = collection(db, "users");
    let userSnap = await getDocs(query(usersRef, where("email", "==", usernameOrEmail.toLowerCase())));

    if (userSnap.empty) {
      userSnap = await getDocs(query(usersRef, where("username", "==", usernameOrEmail.toLowerCase())));
    }

    if (userSnap.empty) {
      res.status(400).json({ success: false, message: "Invalid credentials" });
      return;
    }

    const userDoc = userSnap.docs[0];
    const user = userDoc.data();

    // Check email verification (bypass for admin)
    if (user.role !== "admin" && user.emailVerified === false) {
      // Regenerate OTP
      const otp = generateOTP();
      const expiresAt = Date.now() + 10 * 60 * 1000;
      await setDoc(doc(db, "otps", user.email), {
        email: user.email,
        otp,
        expiresAt
      });
      sendOtpEmail(user.email, otp).catch((err) => {
        console.error("Async login verification OTP email sending error:", err);
      });

      res.status(403).json({ 
        success: false, 
        message: "Email not verified. A new verification OTP code has been sent to your email.",
        email: user.email,
        requiresVerification: true 
      });
      return;
    }

    if (user.status === "suspended") {
      res.status(403).json({ success: false, message: "Your account is suspended. Please contact support." });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ success: false, message: "Invalid credentials" });
      return;
    }

    // Populate activePackage if user has one
    let activePackageData = null;
    if (user.activePackage && typeof user.activePackage === "string") {
      const pkgSnap = await getDoc(doc(db, "packages", user.activePackage));
      if (pkgSnap.exists()) {
        const pkg = pkgSnap.data();
        activePackageData = {
          _id: pkgSnap.id,
          name: pkg.name,
          price: pkg.price,
          directCommission: pkg.directCommission,
          levelCommissions: pkg.levelCommissions,
          dailyRoi: pkg.dailyRoi,
          expiryDays: pkg.expiryDays
        };
      }
    }

    res.json({
      success: true,
      data: {
        ...user,
        _id: userDoc.id,
        activePackage: activePackageData,
        token: generateToken(userDoc.id)
      }
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Forgot Password (with OTP verification code)
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const usersRef = collection(db, "users");
    const qEmail = query(usersRef, where("email", "==", email.toLowerCase()));
    const userSnap = await getDocs(qEmail);

    if (userSnap.empty) {
      res.status(404).json({ success: false, message: "User with this email does not exist" });
      return;
    }

    const resetCode = generateOTP();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

    await setDoc(doc(db, "otps", `reset:${email.toLowerCase()}`), {
      email: email.toLowerCase(),
      otp: resetCode,
      expiresAt
    });

    // Send code (non-blocking)
    sendForgetPasswordEmail(email.toLowerCase(), resetCode).catch((err) => {
      console.error("Async forgot password recovery email sending error:", err);
    });

    res.json({
      success: true,
      message: "Password recovery code has been sent to your registered email address.",
      devResetCode: resetCode // returned for easy testing
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code, password } = req.body;

    if (!email || !code || !password) {
      res.status(400).json({ success: false, message: "Email, recovery code, and new password are required" });
      return;
    }

    const resetDocRef = doc(db, "otps", `reset:${email.toLowerCase()}`);
    const resetSnap = await getDoc(resetDocRef);

    if (!resetSnap.exists()) {
      res.status(400).json({ success: false, message: "Invalid or expired recovery code" });
      return;
    }

    const resetData = resetSnap.data();
    if (resetData.otp !== code || Date.now() > resetData.expiresAt) {
      res.status(400).json({ success: false, message: "Invalid or expired recovery code" });
      return;
    }

    const usersRef = collection(db, "users");
    const qUser = query(usersRef, where("email", "==", email.toLowerCase()));
    const userSnap = await getDocs(qUser);

    if (userSnap.empty) {
      res.status(404).json({ success: false, message: "User account matching this email not found" });
      return;
    }

    const userDoc = userSnap.docs[0];

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await updateDoc(doc(db, "users", userDoc.id), {
      password: hashedPassword,
      updatedAt: new Date().toISOString()
    });

    // Clear reset OTP
    await deleteDoc(resetDocRef);

    res.json({ success: true, message: "Your password has been successfully reset! You can now log in." });
  } catch (error: any) {
    console.error("Reset password error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Submit contact form
// @route   POST /api/auth/contact
// @access  Public
export const contactUs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      res.status(400).json({ success: false, message: "Please fill all fields" });
      return;
    }
    sendContactEmail({ name, email, subject, message }).catch((err) => {
      console.error("Async contact message email sending error:", err);
    });
    res.json({ success: true, message: "Message sent successfully! We will contact you soon." });
  } catch (error: any) {
    console.error("Contact form error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get business model configuration publicly
// @route   GET /api/auth/business-model
// @access  Public
export const getBusinessModelSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const settingsSnap = await getDocs(collection(db, "settings"));
    let settings: any = {};
    if (!settingsSnap.empty) {
      settings = settingsSnap.docs[0].data();
    }

    // Default Fallbacks if fields don't exist
    const data = {
      businessModelTitle: settings.businessModelTitle || "How Pocket Money Generates Returns",
      businessModelDesc: settings.businessModelDesc || "Pocket Money aims to generate sustainable business revenue through a diversified portfolio of active digital trade, affiliate operations, and liquidity channels, distributing rewards strictly according to the platform's reward plans.",
      businessModelAllocations: settings.businessModelAllocations || [
        {
          title: "Liquidity Provision Pools",
          percent: 30,
          desc: "Supplying liquidity to secure trading pairs and decentralized exchange pools to yield transaction fees.",
          icon: "lucide:server"
        },
        {
          title: "Affiliate Advertising",
          percent: 25,
          desc: "Funding bulk advertising campaigns and e-commerce channel promotions to generate direct commission rewards.",
          icon: "lucide:megaphone"
        },
        {
          title: "Micro-Lending Channels",
          percent: 20,
          desc: "Allocating micro-capital pools to verified peer networks for structured interest yields.",
          icon: "lucide:shield-check"
        },
        {
          title: "Venture Incubation",
          percent: 15,
          desc: "Investing in high-growth digital startups and early-stage utility applications.",
          icon: "lucide:code"
        },
        {
          title: "Milestone Incentive Pool",
          percent: 10,
          desc: "Reserving capital rewards and leader bonus payouts for active network expansion milestones.",
          icon: "lucide:gift"
        }
      ]
    };

    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Get business model settings error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
