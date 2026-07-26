import { Response } from "express";
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
import { sendPlanPurchaseEmail } from "../utils/email";

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userDocRef = doc(db, "users", req.user?._id);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const user = userSnap.data();

    // Populate activePackage details based on active userPlans
    let activePackageData = null;
    const activePlansSnap = await getDocs(query(
      collection(db, "userPlans"),
      where("userId", "==", userSnap.id),
      where("status", "==", "active")
    ));

    if (!activePlansSnap.empty) {
      const activePlan = activePlansSnap.docs[0].data();
      const pkgSnap = await getDoc(doc(db, "packages", activePlan.packageId));
      if (pkgSnap.exists()) {
        const pkg = pkgSnap.data();
        activePackageData = {
          _id: pkgSnap.id,
          name: pkg.name,
          price: pkg.price,
          directCommission: pkg.directCommission,
          levelCommissions: pkg.levelCommissions
        };
      }
    } else if (user.activePackage) {
      // Self-heal user document if stale activePackage pointer exists without active userPlans
      await updateDoc(userDocRef, {
        activePackage: null,
        packageActivatedAt: null,
        status: user.status === "active" ? "inactive" : user.status
      });
      user.activePackage = null;
    }


    res.json({ 
      success: true, 
      data: {
        ...user,
        _id: userSnap.id,
        activePackage: activePackageData
      } 
    });
  } catch (error: any) {
    console.error("Get profile error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Submit KYC documents
// @route   POST /api/user/kyc
// @access  Private
export const submitKYC = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { documentType, documentNumber } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!documentType || !documentNumber) {
      res.status(400).json({ success: false, message: "Document type and number are required" });
      return;
    }

    if (!files || !files["documentFront"] || !files["documentFront"][0]) {
      res.status(400).json({ success: false, message: "Front document image is required" });
      return;
    }

    const documentFront = `/uploads/${files["documentFront"][0].filename}`;
    let documentBack = "";

    if (files["documentBack"] && files["documentBack"][0]) {
      documentBack = `/uploads/${files["documentBack"][0].filename}`;
    }

    const userDocRef = doc(db, "users", req.user?._id);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const kycData = {
      status: "pending",
      documentType,
      documentNumber,
      documentFront,
      documentBack,
      submittedAt: new Date().toISOString(),
      remarks: ""
    };

    await updateDoc(userDocRef, {
      kyc: kycData,
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true, message: "KYC documents submitted successfully. Waiting for admin approval.", data: kycData });
  } catch (error: any) {
    console.error("KYC submit error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Update bank details
// @route   PUT /api/user/bank-details
// @access  Private
export const updateBankDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { holderName, accountNumber, bankName, ifsc, upiId } = req.body;

    const userDocRef = doc(db, "users", req.user?._id);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const bankData = {
      holderName: holderName || "",
      accountNumber: accountNumber || "",
      bankName: bankName || "",
      ifsc: ifsc || "",
      upiId: upiId || ""
    };

    await updateDoc(userDocRef, {
      bankDetails: bankData,
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true, message: "Bank details updated successfully", data: bankData });
  } catch (error: any) {
    console.error("Bank details update error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get user downline (referral team) by level
// @route   GET /api/user/team
// @access  Private
export const getTeamByLevel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const requestedLevel = parseInt(req.query.level as string) || 1;

    if (requestedLevel < 1 || requestedLevel > 10) {
      res.status(400).json({ success: false, message: "Level query must be between 1 and 10" });
      return;
    }

    const usersRef = collection(db, "users");
    let currentLevelUserIds = [userId];

    // Traverse down level by level
    for (let l = 1; l <= requestedLevel; l++) {
      if (currentLevelUserIds.length === 0) break;
      const nextLevelIds: string[] = [];

      // Chunk query in sizes of 30 due to Firestore 'in' limitation
      for (let i = 0; i < currentLevelUserIds.length; i += 30) {
        const chunk = currentLevelUserIds.slice(i, i + 30);
        const q = query(usersRef, where("sponsor", "in", chunk));
        const snap = await getDocs(q);
        snap.forEach(docSnap => nextLevelIds.push(docSnap.id));
      }

      currentLevelUserIds = nextLevelIds;
    }

    // Load full details of users at the target level
    const teamMembers: any[] = [];
    if (currentLevelUserIds.length > 0) {
      for (let i = 0; i < currentLevelUserIds.length; i += 30) {
        const chunk = currentLevelUserIds.slice(i, i + 30);
        const q = query(usersRef, where("_id", "in", chunk));
        const snap = await getDocs(q);
        for (const docSnap of snap.docs) {
          const u = docSnap.data();
          
          let pkgName = "No Package";
          if (u.activePackage) {
            const pkgSnap = await getDoc(doc(db, "packages", u.activePackage));
            if (pkgSnap.exists()) {
              pkgName = pkgSnap.data().name;
            }
          }

          teamMembers.push({
            _id: docSnap.id,
            name: u.name,
            username: u.username,
            email: u.email,
            phone: u.phone,
            status: u.status,
            createdAt: u.createdAt,
            walletBalance: u.walletBalance,
            totalIncome: u.totalIncome,
            activePackage: { name: pkgName }
          });
        }
      }
    }

    // Stats calculations
    // 1. Direct Members (Level 1 size)
    const directSnap = await getDocs(query(usersRef, where("sponsor", "==", userId)));
    const directCount = directSnap.size;

    // 2. Total Team Sizes (All levels up to 10)
    let totalTeamCount = 0;
    let activeTeamCount = 0;
    let tempLevelIds = [userId];
    const teamSummary: { level: number; count: number }[] = [];

    for (let l = 1; l <= 10; l++) {
      if (tempLevelIds.length === 0) break;
      const nextIds: string[] = [];
      let levelCount = 0;

      for (let i = 0; i < tempLevelIds.length; i += 30) {
        const chunk = tempLevelIds.slice(i, i + 30);
        const q = query(usersRef, where("sponsor", "in", chunk));
        const snap = await getDocs(q);
        snap.forEach(docSnap => {
          const data = docSnap.data();
          nextIds.push(docSnap.id);
          levelCount++;
          if (data.status === "active") activeTeamCount++;
        });
      }

      if (levelCount === 0) break;
      totalTeamCount += levelCount;
      teamSummary.push({ level: l, count: levelCount });
      tempLevelIds = nextIds;
    }

    res.json({
      success: true,
      data: {
        members: teamMembers,
        stats: {
          directCount,
          totalTeamCount,
          activeTeamCount,
          teamSummary
        }
      }
    });
  } catch (error: any) {
    console.error("Get team downline error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Get visual genealogy tree (up to level 3)
// @route   GET /api/user/genealogy
// @access  Private
export const getGenealogyTree = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const usersRef = collection(db, "users");

    // Helper to recursively fetch child nodes
    const fetchNodes = async (id: string, currentDepth: number, maxDepth: number): Promise<any> => {
      const docSnap = await getDoc(doc(db, "users", id));
      if (!docSnap.exists()) return null;
      const user = docSnap.data();

      let pkgName = "No Package";
      if (user.activePackage) {
        const pkgSnap = await getDoc(doc(db, "packages", user.activePackage));
        if (pkgSnap.exists()) pkgName = pkgSnap.data().name;
      }

      const node: any = {
        id: docSnap.id,
        name: user.name,
        username: user.username,
        referralCode: user.referralCode || `PM${user.username}`,
        email: user.email,
        status: user.status || "inactive",
        packageName: pkgName,
        createdAt: user.createdAt || new Date().toISOString(),
        childrenCount: 0,
        children: []
      };

      if (currentDepth < maxDepth) {
        const referralsSnap = await getDocs(query(usersRef, where("sponsor", "==", id)));
        node.childrenCount = referralsSnap.size;
        for (const refDoc of referralsSnap.docs) {
          const childNode = await fetchNodes(refDoc.id, currentDepth + 1, maxDepth);
          if (childNode) {
            node.children.push(childNode);
          }
        }
      }

      return node;
    };

    const tree = await fetchNodes(userId, 1, 3);


    res.json({ success: true, data: tree });
  } catch (error: any) {
    console.error("Genealogy tree error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get list of all active packages
// @route   GET /api/user/packages
// @access  Private
export const getPackages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const q = query(collection(db, "packages"), where("status", "==", "active"));
    const snap = await getDocs(q);
    const packages = snap.docs.map(docSnap => ({ _id: docSnap.id, ...docSnap.data() }));
    res.json({ success: true, data: packages });
  } catch (error: any) {
    console.error("Get packages error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Purchase package
// @route   POST /api/user/purchase-package
// @access  Private
export const purchasePackage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { packageId } = req.body;
    if (!packageId) {
      res.status(400).json({ success: false, message: "Package ID is required" });
      return;
    }

    const pkgDocRef = doc(db, "packages", packageId);
    const pkgSnap = await getDoc(pkgDocRef);
    if (!pkgSnap.exists()) {
      res.status(404).json({ success: false, message: "Package not found" });
      return;
    }

    const pack = pkgSnap.data();
    if (pack.status === "inactive") {
      res.status(400).json({ success: false, message: "Package is currently inactive" });
      return;
    }

    const userDocRef = doc(db, "users", req.user?._id);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const user = userSnap.data();

    // Check settings
    let allowMultiple = false;
    const settingsSnap = await getDocs(collection(db, "settings"));
    if (!settingsSnap.empty) {
      allowMultiple = settingsSnap.docs[0].data().allowMultipleActivePackages;
    }

    if (user.activePackage && !allowMultiple) {
      res.status(400).json({ success: false, message: "You already have an active package" });
      return;
    }

    if (user.walletBalance < pack.price) {
      res.status(400).json({ success: false, message: `Insufficient wallet balance. Price: $${pack.price}, Balance: $${user.walletBalance}` });
      return;
    }

    // Process Purchase
    const previousBalance = user.walletBalance;
    const newBalance = user.walletBalance - pack.price;

    await updateDoc(userDocRef, {
      walletBalance: newBalance,
      status: "active",
      activePackage: pkgSnap.id,
      packageActivatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Create Package Purchase Transaction
    const txId = doc(collection(db, "transactions")).id;
    const txData = {
      _id: txId,
      user: userDocRef.id,
      amount: -pack.price,
      type: "package_purchase",
      description: `Purchased package: ${pack.name}`,
      balanceBefore: previousBalance,
      balanceAfter: newBalance,
      referenceId: pkgSnap.id,
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, "transactions", txId), txData);

    // DISTRIBUTE MLM COMMISSIONS
    let uplineId = user.sponsor;
    let level = 1;

    while (uplineId && level <= pack.levelCommissions.length + 1) {
      const uplineDocRef = doc(db, "users", uplineId);
      const uplineSnap = await getDoc(uplineDocRef);
      if (!uplineSnap.exists()) break;

      const upline = uplineSnap.data();
      const isUplineActive = upline.status === "active";

      if (level === 1) {
        // Direct Sponsor gets Direct Commission
        const directPercent = pack.directCommission;
        const commissionAmount = parseFloat(((directPercent * pack.price) / 100).toFixed(2));

        if (commissionAmount > 0 && isUplineActive) {
          const uPrevBalance = upline.walletBalance;
          const uNewBalance = upline.walletBalance + commissionAmount;
          const uNewIncome = upline.totalIncome + commissionAmount;

          await updateDoc(uplineDocRef, {
            walletBalance: uNewBalance,
            totalIncome: uNewIncome,
            updatedAt: new Date().toISOString()
          });

          const uplineTxId = doc(collection(db, "transactions")).id;
          await setDoc(doc(db, "transactions", uplineTxId), {
            _id: uplineTxId,
            user: uplineDocRef.id,
            amount: commissionAmount,
            type: "direct_income",
            description: `Direct referral commission from ${user.username} buying ${pack.name}`,
            balanceBefore: uPrevBalance,
            balanceAfter: uNewBalance,
            referenceId: txId,
            createdAt: new Date().toISOString()
          });
        }
      }

      // Also distribute level commission
      if (level <= pack.levelCommissions.length) {
        const levelPercent = pack.levelCommissions[level - 1];
        const levelCommissionAmount = parseFloat(((levelPercent * pack.price) / 100).toFixed(2));

        if (levelCommissionAmount > 0 && isUplineActive) {
          const uPrevBalance = upline.walletBalance;
          const uNewBalance = upline.walletBalance + levelCommissionAmount;
          const uNewIncome = upline.totalIncome + levelCommissionAmount;

          await updateDoc(uplineDocRef, {
            walletBalance: uNewBalance,
            totalIncome: uNewIncome,
            updatedAt: new Date().toISOString()
          });

          const levelTxId = doc(collection(db, "transactions")).id;
          await setDoc(doc(db, "transactions", levelTxId), {
            _id: levelTxId,
            user: uplineDocRef.id,
            amount: levelCommissionAmount,
            type: "level_income",
            description: `Level ${level} downline commission from ${user.username} buying ${pack.name}`,
            balanceBefore: uPrevBalance,
            balanceAfter: uNewBalance,
            referenceId: txId,
            createdAt: new Date().toISOString()
          });
        }
      }

      uplineId = upline.sponsor;
      level++;
    }

    // Trigger Nodemailer activation email
    await sendPlanPurchaseEmail(user.email, user.name, pack.name, pack.price);

    res.json({
      success: true,
      message: `Package ${pack.name} purchased successfully. Your account is now active.`,
      data: {
        walletBalance: newBalance,
        status: "active",
        activePackage: { _id: pkgSnap.id, name: pack.name }
      }
    });
  } catch (error: any) {
    console.error("Purchase package error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Get public payment settings for deposits
// @route   GET /api/user/payment-settings
// @access  Private
export const getPaymentSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const settingsSnap = await getDocs(collection(db, "settings"));
    let settings: any;

    if (settingsSnap.empty) {
      // Create default
      const defaultId = doc(collection(db, "settings")).id;
      settings = {
        upiId: "pay@pocketmoney",
        bankTransferDetails: {
          bankName: "Pocket Bank",
          accountNumber: "1234567890",
          ifsc: "PKTM0000123",
          holderName: "Pocket Money Admin"
        },
        qrCodeImage: "",
        minDeposit: 100,
        maxDeposit: 100000,
        minWithdraw: 200,
        maxWithdraw: 50000,
        withdrawalFeePercent: 5,
        allowMultipleActivePackages: false
      };
      await setDoc(doc(db, "settings", defaultId), settings);
    } else {
      settings = settingsSnap.docs[0].data();
    }

    res.json({
      success: true,
      data: {
        upiId: settings.upiId,
        bankTransferDetails: settings.bankTransferDetails,
        qrCodeImage: settings.qrCodeImage,
        minDeposit: settings.minDeposit,
        maxDeposit: settings.maxDeposit
      }
    });
  } catch (error: any) {
    console.error("Get payment settings error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get user's active/expired plan history
// @route   GET /api/user/my-plans
// @access  Private
export const getUserPlans = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const plansSnap = await getDocs(
      query(collection(db, "userPlans"), where("userId", "==", userId))
    );

    const plans = plansSnap.docs
      .map(d => ({ ...d.data(), _id: d.id }))
      .sort((a: any, b: any) => b.activatedAt.localeCompare(a.activatedAt));

    const getFallbackDailyRoi = (name: string, price: number) => {
      const n = (name || "").toLowerCase();
      if (n.includes("basic")) return 32;
      if (n.includes("medium")) return 66;
      if (n.includes("advance")) return 136;
      if (n.includes("bronze")) return 288;
      if (n.includes("silver")) return 592;
      if (n.includes("gold")) return 1140;
      if (n.includes("diamond")) return 2340;
      if (n.includes("platinum")) return 4000;
      return parseFloat(((price || 0) * 0.05).toFixed(2));
    };

    const formattedPlans = plans.map((p: any) => ({
      ...p,
      dailyRoi: p.dailyRoi && p.dailyRoi > 0 ? p.dailyRoi : getFallbackDailyRoi(p.packageName, p.purchasePrice)
    }));

    const activePlans = formattedPlans.filter((p: any) => p.status === "active");
    const expiredPlans = formattedPlans.filter((p: any) => p.status === "expired");

    const totalDailyRoi = activePlans.reduce((sum: number, p: any) => sum + (p.dailyRoi || 0), 0);

    res.json({
      success: true,
      data: {
        plans: formattedPlans,
        activePlans,
        expiredPlans,
        totalDailyRoi: parseFloat(totalDailyRoi.toFixed(2)),
        activePlanCount: activePlans.length
      }
    });

  } catch (error: any) {
    console.error("Get user plans error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const RANK_TIERS = [
  { id: "bronze", name: "Bronze Member", requiredDirects: 0, bonusAmount: 0, color: "text-amber-600", badgeBg: "bg-amber-600/10 border-amber-600/20", description: "Base starter tier upon registration" },
  { id: "silver", name: "Silver Leader", requiredDirects: 5, bonusAmount: 500, color: "text-zinc-300", badgeBg: "bg-zinc-400/10 border-zinc-400/20", description: "5 Active Direct Referrals" },
  { id: "gold", name: "Gold Executive", requiredDirects: 15, bonusAmount: 1500, color: "text-amber-400", badgeBg: "bg-amber-500/10 border-amber-500/20", description: "15 Active Direct Referrals" },
  { id: "platinum", name: "Platinum Director", requiredDirects: 30, bonusAmount: 3500, color: "text-rose-400", badgeBg: "bg-rose-500/10 border-rose-500/20", description: "30 Active Direct Referrals" },
  { id: "diamond", name: "Diamond Ambassador", requiredDirects: 50, bonusAmount: 10000, color: "text-cyan-400", badgeBg: "bg-cyan-500/10 border-cyan-500/20", description: "50 Active Direct Referrals" },
  { id: "crown", name: "Crown Legend", requiredDirects: 100, bonusAmount: 25000, color: "text-purple-400", badgeBg: "bg-purple-500/10 border-purple-500/20", description: "100 Active Direct Referrals" }
];

export const getRankProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const user = userSnap.data();

    // Query all direct referrals
    const directSnap = await getDocs(query(
      collection(db, "users"),
      where("sponsor", "==", userId)
    ));

    const totalDirects = directSnap.size;
    const activeDirects = directSnap.docs.filter(d => d.data().status === "active").length;

    const claimedBonuses: string[] = user.claimedRankBonuses || [];

    // Find current & next rank
    let currentRankIndex = 0;
    for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
      if (activeDirects >= RANK_TIERS[i].requiredDirects) {
        currentRankIndex = i;
        break;
      }
    }

    const currentRank = RANK_TIERS[currentRankIndex];
    const nextRank = RANK_TIERS[currentRankIndex + 1] || null;

    const prevReq = currentRank.requiredDirects;
    const nextReq = nextRank ? nextRank.requiredDirects : currentRank.requiredDirects;
    const directsNeeded = nextRank ? Math.max(0, nextReq - activeDirects) : 0;

    const progressPercent = nextRank
      ? Math.min(100, Math.round(((activeDirects - prevReq) / (nextReq - prevReq)) * 100))
      : 100;

    const tiers = RANK_TIERS.map(tier => {
      const isUnlocked = activeDirects >= tier.requiredDirects;
      const isClaimed = claimedBonuses.includes(tier.id);
      const canClaim = isUnlocked && !isClaimed && tier.bonusAmount > 0;
      return {
        ...tier,
        isUnlocked,
        isClaimed,
        canClaim
      };
    });

    res.json({
      success: true,
      data: {
        activeDirects,
        totalDirects,
        currentRank,
        nextRank,
        directsNeeded,
        progressPercent,
        claimedBonuses,
        tiers
      }
    });
  } catch (error: any) {
    console.error("Get rank progress error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const claimRankBonus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { rankId } = req.body;
    const userId = req.user?._id;

    if (!rankId) {
      res.status(400).json({ success: false, message: "Rank ID is required" });
      return;
    }

    const tier = RANK_TIERS.find(t => t.id === rankId);
    if (!tier || tier.bonusAmount <= 0) {
      res.status(400).json({ success: false, message: "Invalid rank bonus tier" });
      return;
    }

    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const user = userSnap.data();
    const claimedBonuses: string[] = user.claimedRankBonuses || [];

    if (claimedBonuses.includes(rankId)) {
      res.status(400).json({ success: false, message: "Bonus already claimed for this rank" });
      return;
    }

    // Verify active directs requirement
    const directSnap = await getDocs(query(
      collection(db, "users"),
      where("sponsor", "==", userId)
    ));

    const activeDirects = directSnap.docs.filter(d => d.data().status === "active").length;
    if (activeDirects < tier.requiredDirects) {
      res.status(400).json({
        success: false,
        message: `Requirement not met. You need ${tier.requiredDirects} active direct referrals. Current active: ${activeDirects}`
      });
      return;
    }

    // Credit bonus to wallet
    const prevBalance = user.walletBalance || 0;
    const newBalance = parseFloat((prevBalance + tier.bonusAmount).toFixed(2));
    const newTotalIncome = parseFloat(((user.totalIncome || 0) + tier.bonusAmount).toFixed(2));
    const updatedClaimed = [...claimedBonuses, rankId];

    await updateDoc(userDocRef, {
      walletBalance: newBalance,
      totalIncome: newTotalIncome,
      claimedRankBonuses: updatedClaimed,
      updatedAt: new Date().toISOString()
    });

    // Create rank_bonus transaction record
    const txId = doc(collection(db, "transactions")).id;
    await setDoc(doc(db, "transactions", txId), {
      _id: txId,
      user: userId,
      amount: tier.bonusAmount,
      type: "rank_bonus",
      description: `Rank Milestone Reward — ${tier.name} (+₹${tier.bonusAmount.toLocaleString()})`,
      balanceBefore: prevBalance,
      balanceAfter: newBalance,
      createdAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: `🎉 Congratulations! ${tier.name} Bonus of ₹${tier.bonusAmount.toLocaleString()} has been credited to your wallet!`,
      data: {
        walletBalance: newBalance,
        totalIncome: newTotalIncome,
        claimedRankBonuses: updatedClaimed
      }
    });

  } catch (error: any) {
    console.error("Claim rank bonus error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


