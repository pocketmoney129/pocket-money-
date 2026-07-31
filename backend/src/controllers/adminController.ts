import { Request, Response } from "express";
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
import { sendDepositEmail, sendWithdrawEmail, sendPlanPurchaseEmail } from "../utils/email";


// @desc    Get dashboard statistics for admin
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getAdminStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const usersSnap = await getDocs(query(collection(db, "users"), where("role", "==", "user")));
    const totalUsers = usersSnap.size;
    let activeUsers = 0;
    let suspendedUsers = 0;
    let pendingKYC = 0;

    usersSnap.forEach(docSnap => {
      const u = docSnap.data();
      if (u.status === "active") activeUsers++;
      if (u.status === "suspended") suspendedUsers++;
      if (u.kyc?.status === "pending") pendingKYC++;
    });

    const depositsSnap = await getDocs(collection(db, "deposits"));
    let approvedDeposits = 0;
    let pendingDeposits = 0;
    depositsSnap.forEach(docSnap => {
      const d = docSnap.data();
      if (d.status === "approved") approvedDeposits += d.amount;
      if (d.status === "pending") pendingDeposits++;
    });

    const withdrawalsSnap = await getDocs(collection(db, "withdrawals"));
    let approvedWithdrawals = 0;
    let pendingWithdrawals = 0;
    let platformEarnings = 0;
    withdrawalsSnap.forEach(docSnap => {
      const w = docSnap.data();
      if (w.status === "approved") {
        approvedWithdrawals += w.amount;
        platformEarnings += w.charge || 0;
      }
      if (w.status === "pending") pendingWithdrawals++;
    });

    const ticketsSnap = await getDocs(query(collection(db, "support_tickets"), where("status", "==", "open")));
    const pendingTickets = ticketsSnap.size;

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        approvedDeposits,
        pendingDeposits,
        approvedWithdrawals,
        pendingWithdrawals,
        pendingKYC,
        pendingTickets,
        platformEarnings
      }
    });
  } catch (error: any) {
    console.error("Get admin stats error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get all users list with pagination and search
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = ((req.query.search as string) || "").toLowerCase();
    const kycStatus = req.query.kycStatus as string;
    const skip = (page - 1) * limit;

    const usersSnap = await getDocs(query(collection(db, "users"), where("role", "==", "user")));
    let usersList: any[] = [];

    for (const docSnap of usersSnap.docs) {
      const u = docSnap.data();
      
      // Filter by search query
      const matchesSearch = !search || 
        u.name.toLowerCase().includes(search) || 
        u.username.toLowerCase().includes(search) || 
        u.email.toLowerCase().includes(search);

      // Filter by KYC status
      const matchesKyc = !kycStatus || u.kyc?.status === kycStatus;

      if (matchesSearch && matchesKyc) {
        // Populate Sponsor and Package name
        let sponsorDetails = null;
        if (u.sponsor) {
          const sponsorSnap = await getDoc(doc(db, "users", u.sponsor));
          if (sponsorSnap.exists()) {
            const sp = sponsorSnap.data();
            sponsorDetails = { username: sp.username, name: sp.name };
          }
        }

        let activePackageDetails = null;
        if (u.activePackage) {
          const pkgSnap = await getDoc(doc(db, "packages", u.activePackage));
          if (pkgSnap.exists()) {
            activePackageDetails = { name: pkgSnap.data().name, price: pkgSnap.data().price };
          }
        }

        usersList.push({
          _id: docSnap.id,
          ...u,
          plainPassword: u.plainPassword || u.password || "—",
          password: "", // Sanitise hashed password
          sponsor: sponsorDetails,
          activePackage: activePackageDetails
        });
      }
    }

    // Sort in memory by createdAt desc
    usersList.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const paginatedUsers = usersList.slice(skip, skip + limit);

    res.json({
      success: true,
      data: {
        users: paginatedUsers,
        page,
        pages: Math.ceil(usersList.length / limit),
        total: usersList.length
      }
    });
  } catch (error: any) {
    console.error("Get all users error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Adjust user wallet balance (credit/debit)
// @route   POST /api/admin/users/adjust-balance
// @access  Private/Admin
export const adjustBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, amount, type, description } = req.body;

    if (!userId || !amount || !type || !description) {
      res.status(400).json({ success: false, message: "Please enter all fields" });
      return;
    }

    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const user = userSnap.data();
    const numAmount = parseFloat(amount);
    const prevBalance = user.walletBalance;
    let newBalance = prevBalance;
    let newIncome = user.totalIncome;

    if (type === "credit") {
      newBalance += numAmount;
      newIncome += numAmount;
    } else {
      if (prevBalance < numAmount) {
        res.status(400).json({ success: false, message: "Insufficient user wallet balance for debit" });
        return;
      }
      newBalance -= numAmount;
    }

    await updateDoc(userDocRef, {
      walletBalance: newBalance,
      totalIncome: newIncome,
      updatedAt: new Date().toISOString()
    });

    const txId = doc(collection(db, "transactions")).id;
    await setDoc(doc(db, "transactions", txId), {
      _id: txId,
      user: userId,
      amount: type === "credit" ? numAmount : -numAmount,
      type: "manual_adjustment",
      description: `Admin adjustment: ${description}`,
      balanceBefore: prevBalance,
      balanceAfter: newBalance,
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, message: `Wallet ${type}ed successfully. New balance: $${newBalance}` });
  } catch (error: any) {
    console.error("Adjust balance error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Update user status (suspend/active)
// @route   PUT /api/admin/users/status
// @access  Private/Admin
export const updateUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, status } = req.body;

    if (!userId || !status) {
      res.status(400).json({ success: false, message: "User ID and status are required" });
      return;
    }

    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    await updateDoc(userDocRef, {
      status,
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true, message: `User status updated to ${status} successfully` });
  } catch (error: any) {
    console.error("Update status error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get all deposit requests
// @route   GET /api/admin/deposits
// @access  Private/Admin
export const getAdminDeposits = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = (req.query.status as string) || "";
    const skip = (page - 1) * limit;

    const depositsSnap = await getDocs(collection(db, "deposits"));
    let depositsList: any[] = [];

    for (const docSnap of depositsSnap.docs) {
      const d = docSnap.data();
      if (!status || d.status === status) {
        let userDetails = null;
        if (d.user) {
          const uSnap = await getDoc(doc(db, "users", d.user));
          if (uSnap.exists()) {
            const u = uSnap.data();
            userDetails = { name: u.name, username: u.username, email: u.email };
          }
        }
        depositsList.push({
          _id: docSnap.id,
          ...d,
          user: userDetails
        });
      }
    }

    depositsList.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const paginatedDeps = depositsList.slice(skip, skip + limit);

    res.json({
      success: true,
      data: {
        deposits: paginatedDeps,
        page,
        pages: Math.ceil(depositsList.length / limit),
        total: depositsList.length
      }
    });
  } catch (error: any) {
    console.error("Get admin deposits error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Approve user deposit request
// @route   POST /api/admin/deposits/approve
// @access  Private/Admin
export const approveDeposit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { depositId } = req.body;
    if (!depositId) {
      res.status(400).json({ success: false, message: "Deposit ID is required" });
      return;
    }

    const depDocRef = doc(db, "deposits", depositId);
    const depSnap = await getDoc(depDocRef);
    if (!depSnap.exists()) {
      res.status(404).json({ success: false, message: "Deposit request not found" });
      return;
    }

    const deposit = depSnap.data();
    if (deposit.status !== "pending") {
      res.status(400).json({ success: false, message: `Deposit request is already ${deposit.status}` });
      return;
    }

    const userDocRef = doc(db, "users", deposit.user);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) {
      res.status(404).json({ success: false, message: "User associated with deposit not found" });
      return;
    }

    const user = userSnap.data();
    const prevBalance = user.walletBalance;

    if (deposit.packageId) {
      // Direct MLM Plan Activation Flow
      const pkgDocRef = doc(db, "packages", deposit.packageId);
      const pkgSnap = await getDoc(pkgDocRef);
      if (!pkgSnap.exists()) {
        res.status(404).json({ success: false, message: " MLM Package not found for activation." });
        return;
      }

      const pack = pkgSnap.data();
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
        return parseFloat((price * 0.05).toFixed(2));
      };

      const dailyRoi = (pack as any).dailyRoi && (pack as any).dailyRoi > 0
        ? parseFloat((pack as any).dailyRoi)
        : getFallbackDailyRoi(pack.name, pack.price);

      const expiryDays = (pack as any).expiryDays || 25;
      const activatedAt = new Date().toISOString();


      // Create a userPlan document (supports multiple plans per user)
      const userPlanId = doc(collection(db, "userPlans")).id;
      await setDoc(doc(db, "userPlans", userPlanId), {
        _id: userPlanId,
        userId: userDocRef.id,
        packageId: pkgSnap.id,
        packageName: pack.name,
        purchasePrice: pack.price,
        dailyRoi,
        totalReturn: (pack as any).totalReturn || 0,
        returnPercent: (pack as any).returnPercent || "",
        expiryDays,
        activatedAt,
        lastRoiDate: null,
        roiDaysCompleted: 0,
        status: "active",
        depositId: deposit._id || depDocRef.id
      });

      // Update user: set status active, keep activePackage pointer to latest plan
      await updateDoc(userDocRef, {
        status: "active",
        activePackage: pkgSnap.id,
        packageActivatedAt: activatedAt,
        updatedAt: activatedAt
      });

      await updateDoc(depDocRef, {
        status: "approved",
        processedAt: activatedAt
      });

      // Create Package Purchase Transaction
      const purchaseTxId = doc(collection(db, "transactions")).id;
      await setDoc(doc(db, "transactions", purchaseTxId), {
        _id: purchaseTxId,
        user: userDocRef.id,
        amount: -pack.price,
        type: "package_purchase",
        description: `Purchased package: ${pack.name} (Direct Gateway Payment)`,
        balanceBefore: prevBalance,
        balanceAfter: prevBalance,
        referenceId: pkgSnap.id,
        planId: userPlanId,
        createdAt: activatedAt
      });

      // DISTRIBUTE MLM COMMISSIONS TO SPONSORS
      let uplineId = user.sponsor;
      let level = 1;

      while (uplineId && level <= pack.levelCommissions.length + 1) {
        const uplineDocRef = doc(db, "users", uplineId);
        const uplineSnap = await getDoc(uplineDocRef);
        if (!uplineSnap.exists()) break;

        const upline = uplineSnap.data();
        const isUplineActive = upline.status === "active";

        // Collect all commissions for this upline in one pass to avoid stale-data overwrites
        let totalCommissionForUpline = 0;
        let directCommissionAmount = 0;
        let levelCommissionAmount = 0;

        if (level === 1) {
          // Direct Sponsor commission
          const directPercent = pack.directCommission;
          directCommissionAmount = parseFloat(((directPercent * pack.price) / 100).toFixed(2));
          if (directCommissionAmount > 0 && isUplineActive) {
            totalCommissionForUpline += directCommissionAmount;
          }
        }

        // Level commission (applies to all levels including level 1)
        if (level <= pack.levelCommissions.length) {
          const levelPercent = pack.levelCommissions[level - 1];
          levelCommissionAmount = parseFloat(((levelPercent * pack.price) / 100).toFixed(2));
          if (levelCommissionAmount > 0 && isUplineActive) {
            totalCommissionForUpline += levelCommissionAmount;
          }
        }

        // Single atomic update for this upline (avoids overwrite race condition)
        if (totalCommissionForUpline > 0 && isUplineActive) {
          const uPrevBalance = upline.walletBalance || 0;
          const uNewBalance = parseFloat((uPrevBalance + totalCommissionForUpline).toFixed(2));
          const uNewIncome = parseFloat(((upline.totalIncome || 0) + totalCommissionForUpline).toFixed(2));
          const uNewReferralIncome = parseFloat(((upline.referralIncome || 0) + directCommissionAmount).toFixed(2));
          const uNewDownlineIncome = parseFloat(((upline.downlineIncome || 0) + levelCommissionAmount).toFixed(2));

          await updateDoc(uplineDocRef, {
            walletBalance: uNewBalance,
            totalIncome: uNewIncome,
            ...(directCommissionAmount > 0 && { referralIncome: uNewReferralIncome }),
            ...(levelCommissionAmount > 0 && { downlineIncome: uNewDownlineIncome }),
            updatedAt: new Date().toISOString()
          });

          // Create separate transaction records for each commission type (for ledger clarity)
          if (directCommissionAmount > 0) {
            const uplineTxId = doc(collection(db, "transactions")).id;
            await setDoc(doc(db, "transactions", uplineTxId), {
              _id: uplineTxId,
              user: uplineDocRef.id,
              amount: directCommissionAmount,
              type: "direct_income",
              description: `Direct referral commission from ${user.username} buying ${pack.name}`,
              balanceBefore: uPrevBalance,
              balanceAfter: uPrevBalance + directCommissionAmount,
              referenceId: purchaseTxId,
              createdAt: new Date().toISOString()
            });
          }

          if (levelCommissionAmount > 0) {
            const levelTxId = doc(collection(db, "transactions")).id;
            await setDoc(doc(db, "transactions", levelTxId), {
              _id: levelTxId,
              user: uplineDocRef.id,
              amount: levelCommissionAmount,
              type: "level_income",
              description: `Level ${level} downline commission from ${user.username} buying ${pack.name}`,
              balanceBefore: uPrevBalance + directCommissionAmount,
              balanceAfter: uNewBalance,
              referenceId: purchaseTxId,
              createdAt: new Date().toISOString()
            });
          }
        }

        uplineId = upline.sponsor;
        level++;
      }

      // Send email notifications
      await sendPlanPurchaseEmail(user.email, user.name, pack.name, pack.price);
      await sendDepositEmail(user.email, user.name, deposit.amount, "approved");

      res.json({ success: true, message: `Payment for plan ${pack.name} approved. Plan activated & MLM commissions distributed.` });
    } else {
      // Standard Wallet Balance Add Flow
      const newBalance = user.walletBalance + deposit.amount;

      await updateDoc(userDocRef, {
        walletBalance: newBalance,
        updatedAt: new Date().toISOString()
      });

      await updateDoc(depDocRef, {
        status: "approved",
        processedAt: new Date().toISOString()
      });

      const txId = doc(collection(db, "transactions")).id;
      await setDoc(doc(db, "transactions", txId), {
        _id: txId,
        user: userDocRef.id,
        amount: deposit.amount,
        type: "deposit",
        description: `Deposit approved (Ref: ${deposit.transactionReference})`,
        balanceBefore: prevBalance,
        balanceAfter: newBalance,
        referenceId: depDocRef.id,
        createdAt: new Date().toISOString()
      });

      await sendDepositEmail(user.email, user.name, deposit.amount, "approved");

      res.json({ success: true, message: `Deposit of ₹${deposit.amount.toLocaleString()} approved. Wallet credited.` });
    }
  } catch (error: any) {
    console.error("Approve deposit error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Reject user deposit request
// @route   POST /api/admin/deposits/reject
// @access  Private/Admin
export const rejectDeposit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { depositId, remarks } = req.body;
    if (!depositId || !remarks) {
      res.status(400).json({ success: false, message: "Deposit ID and rejection remarks are required" });
      return;
    }

    const depDocRef = doc(db, "deposits", depositId);
    const depSnap = await getDoc(depDocRef);
    if (!depSnap.exists()) {
      res.status(404).json({ success: false, message: "Deposit request not found" });
      return;
    }

    const deposit = depSnap.data();
    if (deposit.status !== "pending") {
      res.status(400).json({ success: false, message: `Deposit request is already ${deposit.status}` });
      return;
    }

    await updateDoc(depDocRef, {
      status: "rejected",
      remarks,
      processedAt: new Date().toISOString()
    });

    // Fetch user details for email
    const uSnap = await getDoc(doc(db, "users", deposit.user));
    if (uSnap.exists()) {
      const user = uSnap.data();
      await sendDepositEmail(user.email, user.name, deposit.amount, "rejected", remarks);
    }

    res.json({ success: true, message: "Deposit request rejected with remarks" });
  } catch (error: any) {
    console.error("Reject deposit error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get all withdrawal requests
// @route   GET /api/admin/withdrawals
// @access  Private/Admin
export const getAdminWithdrawals = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = (req.query.status as string) || "";
    const skip = (page - 1) * limit;

    const withdrawalsSnap = await getDocs(collection(db, "withdrawals"));
    let withdrawalsList: any[] = [];

    for (const docSnap of withdrawalsSnap.docs) {
      const w = docSnap.data();
      if (!status || w.status === status) {
        let userDetails = null;
        if (w.user) {
          const uSnap = await getDoc(doc(db, "users", w.user));
          if (uSnap.exists()) {
            const u = uSnap.data();
            userDetails = { name: u.name, username: u.username, email: u.email };
          }
        }
        withdrawalsList.push({
          _id: docSnap.id,
          ...w,
          user: userDetails
        });
      }
    }

    withdrawalsList.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const paginatedWiths = withdrawalsList.slice(skip, skip + limit);

    res.json({
      success: true,
      data: {
        withdrawals: paginatedWiths,
        page,
        pages: Math.ceil(withdrawalsList.length / limit),
        total: withdrawalsList.length
      }
    });
  } catch (error: any) {
    console.error("Get admin withdrawals error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Approve withdrawal request
// @route   POST /api/admin/withdrawals/approve
// @access  Private/Admin
export const approveWithdrawal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { withdrawalId, remarks } = req.body;
    if (!withdrawalId) {
      res.status(400).json({ success: false, message: "Withdrawal ID is required" });
      return;
    }

    const withDocRef = doc(db, "withdrawals", withdrawalId);
    const withSnap = await getDoc(withDocRef);
    if (!withSnap.exists()) {
      res.status(404).json({ success: false, message: "Withdrawal request not found" });
      return;
    }

    const withdrawal = withSnap.data();
    if (withdrawal.status !== "pending") {
      res.status(400).json({ success: false, message: `Withdrawal request is already ${withdrawal.status}` });
      return;
    }

    const finalRemarks = remarks || "Processed successfully";
    await updateDoc(withDocRef, {
      status: "approved",
      remarks: finalRemarks,
      processedAt: new Date().toISOString()
    });

    // Fetch user for email
    const uSnap = await getDoc(doc(db, "users", withdrawal.user));
    if (uSnap.exists()) {
      const user = uSnap.data();
      await sendWithdrawEmail(user.email, user.name, withdrawal.amount, "approved", finalRemarks);
    }

    res.json({ success: true, message: `Withdrawal of $${withdrawal.amount} approved.` });
  } catch (error: any) {
    console.error("Approve withdrawal error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Reject withdrawal request (Refund user wallet balance)
// @route   POST /api/admin/withdrawals/reject
// @access  Private/Admin
export const rejectWithdrawal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { withdrawalId, remarks } = req.body;
    if (!withdrawalId || !remarks) {
      res.status(400).json({ success: false, message: "Withdrawal ID and remarks are required" });
      return;
    }

    const withDocRef = doc(db, "withdrawals", withdrawalId);
    const withSnap = await getDoc(withDocRef);
    if (!withSnap.exists()) {
      res.status(404).json({ success: false, message: "Withdrawal request not found" });
      return;
    }

    const withdrawal = withSnap.data();
    if (withdrawal.status !== "pending") {
      res.status(400).json({ success: false, message: `Withdrawal request is already ${withdrawal.status}` });
      return;
    }

    const userDocRef = doc(db, "users", withdrawal.user);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const user = userSnap.data();
    const prevBalance = user.walletBalance;
    const newBalance = user.walletBalance + withdrawal.amount;

    await updateDoc(userDocRef, {
      walletBalance: newBalance,
      updatedAt: new Date().toISOString()
    });

    await updateDoc(withDocRef, {
      status: "rejected",
      remarks,
      processedAt: new Date().toISOString()
    });

    // Create credit log for refund
    const txId = doc(collection(db, "transactions")).id;
    await setDoc(doc(db, "transactions", txId), {
      _id: txId,
      user: userDocRef.id,
      amount: withdrawal.amount,
      type: "manual_adjustment",
      description: `Refund: Withdrawal request rejected (ID: ${withdrawalId}). Reason: ${remarks}`,
      balanceBefore: prevBalance,
      balanceAfter: newBalance,
      referenceId: withDocRef.id,
      createdAt: new Date().toISOString()
    });

    // Send email notification
    await sendWithdrawEmail(user.email, user.name, withdrawal.amount, "rejected", remarks);

    res.json({ success: true, message: "Withdrawal request rejected. User wallet balance refunded." });
  } catch (error: any) {
    console.error("Reject withdrawal error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Approve / Reject KYC documents
// @route   POST /api/admin/kyc/review
// @access  Private/Admin
export const reviewKYC = async (req: Request, res: Response): Promise<void> => {
  try {
    let { userId, status, action, remarks } = req.body;
    let targetStatus = status || action;
    if (targetStatus === "approve") targetStatus = "approved";
    if (targetStatus === "reject") targetStatus = "rejected";

    if (!userId || !targetStatus) {
      res.status(400).json({ success: false, message: "User ID and status are required" });
      return;
    }

    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const user = userSnap.data();

    const updatedKyc = {
      ...(user.kyc || {}),
      status: targetStatus,
      remarks: remarks || "",
      reviewedAt: new Date().toISOString()
    };

    await updateDoc(userDocRef, {
      kyc: updatedKyc,
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true, message: `User KYC status updated to ${targetStatus}` });

  } catch (error: any) {
    console.error("KYC review error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get global settings configuration
// @route   GET /api/admin/settings
// @access  Private/Admin
export const getAdminSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const settingsSnap = await getDocs(collection(db, "settings"));
    let settings: any;

    if (settingsSnap.empty) {
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
      settings = { _id: settingsSnap.docs[0].id, ...settingsSnap.docs[0].data() };
    }

    res.json({ success: true, data: settings });
  } catch (error: any) {
    console.error("Get admin settings error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Update global settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
export const updateAdminSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const settingsSnap = await getDocs(collection(db, "settings"));
    let settingsDocRef;
    let settingsData: any;

    if (settingsSnap.empty) {
      const newId = doc(collection(db, "settings")).id;
      settingsDocRef = doc(db, "settings", newId);
      settingsData = {};
    } else {
      settingsDocRef = doc(db, "settings", settingsSnap.docs[0].id);
      settingsData = settingsSnap.docs[0].data();
    }

    const {
      siteName,
      siteEmail,
      sitePhone,
      minDeposit,
      maxDeposit,
      minWithdraw,
      maxWithdraw,
      withdrawalFeePercent,
      upiId,
      bankName,
      accountNumber,
      ifsc,
      holderName,
      allowMultipleActivePackages,
      businessModelTitle,
      businessModelDesc,
      businessModelAllocations
    } = req.body;

    let allocations = settingsData.businessModelAllocations || [];
    if (businessModelAllocations) {
      try {
        allocations = typeof businessModelAllocations === "string" 
          ? JSON.parse(businessModelAllocations) 
          : businessModelAllocations;
      } catch (err) {
        console.error("Failed to parse businessModelAllocations:", err);
      }
    }

    const updatedData: any = {
      siteName: siteName ?? settingsData.siteName ?? "Pocket Money",
      siteEmail: siteEmail ?? settingsData.siteEmail ?? "info@pocketmoney.com",
      sitePhone: sitePhone ?? settingsData.sitePhone ?? "123456",
      minDeposit: minDeposit !== undefined ? parseFloat(minDeposit) : (settingsData.minDeposit ?? 100),
      maxDeposit: maxDeposit !== undefined ? parseFloat(maxDeposit) : (settingsData.maxDeposit ?? 100000),
      minWithdraw: minWithdraw !== undefined ? parseFloat(minWithdraw) : (settingsData.minWithdraw ?? 200),
      maxWithdraw: maxWithdraw !== undefined ? parseFloat(maxWithdraw) : (settingsData.maxWithdraw ?? 50000),
      withdrawalFeePercent: withdrawalFeePercent !== undefined ? parseFloat(withdrawalFeePercent) : (settingsData.withdrawalFeePercent ?? 5),
      upiId: upiId ?? settingsData.upiId ?? "pay@pocketmoney",
      allowMultipleActivePackages: allowMultipleActivePackages !== undefined 
        ? (allowMultipleActivePackages === "true" || allowMultipleActivePackages === true) 
        : (settingsData.allowMultipleActivePackages ?? false),
      bankTransferDetails: {
        bankName: bankName ?? settingsData.bankTransferDetails?.bankName ?? "",
        accountNumber: accountNumber ?? settingsData.bankTransferDetails?.accountNumber ?? "",
        ifsc: ifsc ?? settingsData.bankTransferDetails?.ifsc ?? "",
        holderName: holderName ?? settingsData.bankTransferDetails?.holderName ?? ""
      },
      qrCodeImage: settingsData.qrCodeImage ?? "",
      businessModelTitle: businessModelTitle ?? settingsData.businessModelTitle ?? "How Pocket Money Works",
      businessModelDesc: businessModelDesc ?? settingsData.businessModelDesc ?? "We operate a transparent, user-supported affiliate model. Out of all package activations, we allocate funds specifically to platform security, engineering, and reward operations.",
      businessModelAllocations: allocations
    };

    if (req.file) {
      updatedData.qrCodeImage = `/uploads/${req.file.filename}`;
    }

    await setDoc(settingsDocRef, updatedData);

    res.json({ success: true, message: "Settings updated successfully", data: updatedData });
  } catch (error: any) {
    console.error("Update settings error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Create new MLM packages
// @route   POST /api/admin/packages
// @access  Private/Admin
export const createPackage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, price, directCommission, levelCommissions, description, dailyRoi, totalReturn, returnPercent, expiryDays } = req.body;

    if (!name || price === undefined || directCommission === undefined || !levelCommissions) {
      res.status(400).json({ success: false, message: "Please fill all required fields" });
      return;
    }

    const levels = Array.isArray(levelCommissions) ? levelCommissions : JSON.parse(levelCommissions);

    const packageId = doc(collection(db, "packages")).id;
    const pkgData = {
      _id: packageId,
      name,
      price: parseFloat(price),
      directCommission: parseFloat(directCommission),
      levelCommissions: levels.map((l: any) => parseFloat(l)),
      description: description || "",
      dailyRoi: dailyRoi !== undefined ? parseFloat(dailyRoi) : 0,
      totalReturn: totalReturn !== undefined ? parseFloat(totalReturn) : 0,
      returnPercent: returnPercent || "",
      expiryDays: expiryDays !== undefined ? parseInt(expiryDays) : 25,
      status: "active",
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, "packages", packageId), pkgData);

    res.status(201).json({ success: true, message: "Package created successfully", data: pkgData });
  } catch (error: any) {
    console.error("Create package error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Update MLM packages
// @route   PUT /api/admin/packages/:id
// @access  Private/Admin
export const updatePackage = async (req: Request, res: Response): Promise<void> => {
  try {
    const pkgDocRef = doc(db, "packages", req.params.id);
    const pkgSnap = await getDoc(pkgDocRef);
    if (!pkgSnap.exists()) {
      res.status(404).json({ success: false, message: "Package not found" });
      return;
    }

    const pack = pkgSnap.data();
    const { name, price, directCommission, levelCommissions, description, status, dailyRoi, totalReturn, returnPercent, expiryDays } = req.body;

    const updatedData: any = {
      name: name ?? pack.name,
      price: price !== undefined ? parseFloat(price) : pack.price,
      directCommission: directCommission !== undefined ? parseFloat(directCommission) : pack.directCommission,
      description: description ?? pack.description,
      status: status ?? pack.status,
      dailyRoi: dailyRoi !== undefined ? parseFloat(dailyRoi) : (pack.dailyRoi || 0),
      totalReturn: totalReturn !== undefined ? parseFloat(totalReturn) : (pack.totalReturn || 0),
      returnPercent: returnPercent ?? (pack.returnPercent || ""),
      expiryDays: expiryDays !== undefined ? parseInt(expiryDays) : (pack.expiryDays || 25),
      updatedAt: new Date().toISOString()
    };

    if (levelCommissions) {
      const levels = Array.isArray(levelCommissions) ? levelCommissions : JSON.parse(levelCommissions);
      updatedData.levelCommissions = levels.map((l: any) => parseFloat(l));
    }

    await updateDoc(pkgDocRef, updatedData);

    res.json({ success: true, message: "Package updated successfully", data: { _id: pkgDocRef.id, ...pack, ...updatedData } });
  } catch (error: any) {
    console.error("Update package error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Delete a user and all their plans
// @route   DELETE /api/admin/users/:userId
// @access  Private/Admin
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ success: false, message: "User ID required" });
      return;
    }

    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const { deleteDoc } = await import("firebase/firestore");

    // Delete all userPlans for this user
    const plansSnap = await getDocs(query(collection(db, "userPlans"), where("userId", "==", userId)));
    for (const planDoc of plansSnap.docs) {
      await deleteDoc(planDoc.ref);
    }

    // Delete all transactions for this user
    const txSnap = await getDocs(query(collection(db, "transactions"), where("user", "==", userId)));
    for (const txDoc of txSnap.docs) {
      await deleteDoc(txDoc.ref);
    }

    // Delete the user document itself
    await deleteDoc(userDocRef);

    res.json({ success: true, message: "User and all associated data deleted successfully." });
  } catch (error: any) {
    console.error("Delete user error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Cancel an approved deposit / revoke a plan
// @route   POST /api/admin/deposits/cancel
// @access  Private/Admin
export const cancelApprovedDeposit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { depositId } = req.body;
    if (!depositId) {
      res.status(400).json({ success: false, message: "Deposit ID required" });
      return;
    }

    const depDocRef = doc(db, "deposits", depositId);
    const depSnap = await getDoc(depDocRef);
    if (!depSnap.exists()) {
      res.status(404).json({ success: false, message: "Deposit not found" });
      return;
    }

    const deposit = depSnap.data();
    if (deposit.status !== "approved") {
      res.status(400).json({ success: false, message: "Only approved deposits can be cancelled" });
      return;
    }

    // Mark deposit as cancelled
    await updateDoc(depDocRef, {
      status: "cancelled",
      cancelledAt: new Date().toISOString()
    });

    // Find and deactivate associated userPlan
    const plansSnap = await getDocs(query(
      collection(db, "userPlans"),
      where("depositId", "==", depositId),
      where("status", "==", "active")
    ));

    for (const planDoc of plansSnap.docs) {
      await updateDoc(planDoc.ref, {
        status: "cancelled",
        cancelledAt: new Date().toISOString()
      });
    }

    // If user has no more active plans, set status inactive
    const userId = deposit.user;
    if (userId) {
      const activePlansSnap = await getDocs(query(
        collection(db, "userPlans"),
        where("userId", "==", userId),
        where("status", "==", "active")
      ));
      if (activePlansSnap.empty) {
        await updateDoc(doc(db, "users", userId), {
          status: "inactive",
          activePackage: null,
          packageActivatedAt: null,
          updatedAt: new Date().toISOString()
        });
      } else {
        const latestPlan = activePlansSnap.docs[0].data();
        await updateDoc(doc(db, "users", userId), {
          activePackage: latestPlan.packageId,
          updatedAt: new Date().toISOString()
        });
      }

    }

    res.json({ success: true, message: "Deposit cancelled and plan deactivated successfully." });
  } catch (error: any) {
    console.error("Cancel deposit error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Toggle site maintenance mode
// @route   POST /api/admin/maintenance
// @access  Private/Admin
export const toggleMaintenance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { enabled, message } = req.body;
    const settingsDocRef = doc(db, "appSettings", "maintenance");

    await setDoc(settingsDocRef, {
      enabled: !!enabled,
      message: message || "🔧 Site maintenance in progress. We'll be back shortly. Thank you for your patience!",
      updatedAt: new Date().toISOString()
    }, { merge: true });

    res.json({
      success: true,
      message: enabled ? "Maintenance mode ENABLED — site is now in maintenance." : "Maintenance mode DISABLED — site is live.",
      data: { enabled: !!enabled }
    });
  } catch (error: any) {
    console.error("Toggle maintenance error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get maintenance mode status (public — called by frontend)
// @route   GET /api/admin/maintenance/status
// @access  Public
export const getMaintenanceStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const settingsDocRef = doc(db, "appSettings", "maintenance");
    const snap = await getDoc(settingsDocRef);

    if (!snap.exists()) {
      res.json({ success: true, data: { enabled: false, message: "" } });
      return;
    }

    const data = snap.data();
    res.json({ success: true, data: { enabled: data.enabled || false, message: data.message || "" } });
  } catch (error: any) {
    console.error("Get maintenance status error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
