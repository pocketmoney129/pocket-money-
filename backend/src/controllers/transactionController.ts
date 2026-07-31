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
import { sendDepositEmail, sendWithdrawEmail } from "../utils/email";
import { distributeRoi } from "../utils/roiCron";

// @desc    Get user's transaction history
// @route   GET /api/transactions
// @access  Private
export const getTransactionHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const txSnap = await getDocs(query(collection(db, "transactions"), where("user", "==", req.user?._id)));
    const transactions = txSnap.docs.map(docSnap => ({ _id: docSnap.id, ...docSnap.data() }));

    // Sort in memory by createdAt desc to avoid requiring composite indexes
    transactions.sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt));

    const paginatedTxs = transactions.slice(skip, skip + limit);

    res.json({
      success: true,
      data: {
        transactions: paginatedTxs,
        page,
        pages: Math.ceil(transactions.length / limit),
        total: transactions.length
      }
    });
  } catch (error: any) {
    console.error("Get transactions error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Submit deposit request
// @route   POST /api/transactions/deposit
// @access  Private
export const submitDeposit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { amount, paymentMethod, transactionReference, packageId } = req.body;

    if (!amount || !paymentMethod || !transactionReference) {
      res.status(400).json({ success: false, message: "Please fill all fields" });
      return;
    }

    const numAmount = parseFloat(amount);

    // Get system limits
    let minDep = 100;
    let maxDep = 100000;
    const settingsSnap = await getDocs(collection(db, "settings"));
    if (!settingsSnap.empty) {
      const s = settingsSnap.docs[0].data();
      minDep = s.minDeposit;
      maxDep = s.maxDeposit;
    }

    if (numAmount < minDep || numAmount > maxDep) {
      res.status(400).json({ success: false, message: `Deposit amount must be between $${minDep} and $${maxDep}` });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: "Payment proof screenshot is required" });
      return;
    }

    // Check unique UTR reference
    const depRef = collection(db, "deposits");
    const qRef = query(depRef, where("transactionReference", "==", transactionReference.trim()));
    const refSnap = await getDocs(qRef);
    if (!refSnap.empty) {
      res.status(400).json({ success: false, message: "Transaction reference ID already submitted" });
      return;
    }

    const screenshotUrl = `/uploads/${req.file.filename}`;

    const depositId = doc(collection(db, "deposits")).id;
    const depositData = {
      _id: depositId,
      user: req.user?._id,
      amount: numAmount,
      paymentMethod,
      transactionReference: transactionReference.trim(),
      screenshot: screenshotUrl,
      status: "pending",
      remarks: "",
      packageId: packageId || null,
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, "deposits", depositId), depositData);

    // Send email notification
    await sendDepositEmail(req.user.email, req.user.name, numAmount, "pending");

    res.status(201).json({
      success: true,
      message: "Deposit request submitted successfully. Waiting for admin approval.",
      data: depositData
    });
  } catch (error: any) {
    console.error("Deposit submit error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Get user's deposit requests history
// @route   GET /api/transactions/deposits
// @access  Private
export const getDeposits = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const snap = await getDocs(query(collection(db, "deposits"), where("user", "==", req.user?._id)));
    const deposits = snap.docs.map(docSnap => ({ _id: docSnap.id, ...docSnap.data() }));
    
    // Sort in memory
    deposits.sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt));

    res.json({ success: true, data: deposits });
  } catch (error: any) {
    console.error("Get deposits error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Submit withdrawal request
// @route   POST /api/transactions/withdraw
// @access  Private
export const submitWithdrawal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { amount } = req.body;
    if (!amount) {
      res.status(400).json({ success: false, message: "Amount is required" });
      return;
    }

    const numAmount = parseFloat(amount);
    const userDocRef = doc(db, "users", req.user?._id);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const user = userSnap.data();

    if (user.status !== "active") {
      res.status(400).json({ success: false, message: "Only active accounts can request withdrawals" });
      return;
    }

    const bd = user.bankDetails;
    const hasBank = bd && bd.holderName && ((bd.accountNumber && bd.bankName && bd.ifsc) || bd.upiId);
    if (!hasBank) {
      res.status(400).json({ success: false, message: "Please update your Bank Details or UPI ID in your Profile first" });
      return;
    }

    // Get limits and fee configurations
    let minWith = 1;
    let maxWith = 1000000;
    let feePercent = 5;

    const settingsSnap = await getDocs(collection(db, "settings"));
    if (!settingsSnap.empty) {
      const s = settingsSnap.docs[0].data();
      minWith = s.minWithdraw || 1;
      maxWith = s.maxWithdraw || 1000000;
      feePercent = s.withdrawalFeePercent || 5;
    }

    if (numAmount < minWith) {
      res.status(400).json({ success: false, message: `Withdrawal amount must be at least ₹${minWith}` });
      return;
    }

    if (user.walletBalance < numAmount) {
      res.status(400).json({ success: false, message: `Insufficient wallet balance. Available: $${user.walletBalance}` });
      return;
    }

    const charge = parseFloat(((feePercent * numAmount) / 100).toFixed(2));
    const netAmount = parseFloat((numAmount - charge).toFixed(2));

    // Debit wallet balance immediately (double spend check)
    const prevBalance = user.walletBalance;
    const newBalance = user.walletBalance - numAmount;

    await updateDoc(userDocRef, {
      walletBalance: newBalance,
      updatedAt: new Date().toISOString()
    });

    // Create withdrawal request log
    const withdrawalId = doc(collection(db, "withdrawals")).id;
    const withdrawalData = {
      _id: withdrawalId,
      user: userDocRef.id,
      amount: numAmount,
      charge,
      netAmount,
      bankDetails: {
        holderName: bd.holderName || "",
        accountNumber: bd.accountNumber || "",
        bankName: bd.bankName || "",
        ifsc: bd.ifsc || "",
        upiId: bd.upiId || ""
      },
      status: "pending",
      remarks: "",
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, "withdrawals", withdrawalId), withdrawalData);

    // Save transaction ledger record (Debit)
    const txId = doc(collection(db, "transactions")).id;
    await setDoc(doc(db, "transactions", txId), {
      _id: txId,
      user: userDocRef.id,
      amount: -numAmount,
      type: "withdrawal",
      description: `Withdrawal request submitted (ID: ${withdrawalId})`,
      balanceBefore: prevBalance,
      balanceAfter: newBalance,
      referenceId: withdrawalId,
      createdAt: new Date().toISOString()
    });

    // Send email notification
    await sendWithdrawEmail(user.email, user.name, numAmount, "pending");

    res.status(201).json({
      success: true,
      message: "Withdrawal request submitted successfully. Balance debited.",
      data: withdrawalData
    });
  } catch (error: any) {
    console.error("Withdrawal submit error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Get user's withdrawal requests history
// @route   GET /api/transactions/withdrawals
// @access  Private
export const getWithdrawals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const snap = await getDocs(query(collection(db, "withdrawals"), where("user", "==", req.user?._id)));
    const withdrawals = snap.docs.map(docSnap => ({ _id: docSnap.id, ...docSnap.data() }));

    // Sort in memory
    withdrawals.sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt));

    res.json({ success: true, data: withdrawals });
  } catch (error: any) {
    console.error("Get withdrawals error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get wallet statistics summary
// @route   GET /api/transactions/summary
// @access  Private
export const getWalletSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const usersRef = collection(db, "users");
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const user = userSnap.data();

    // Ensure today's ROI distribution is up to date in real-time
    await distributeRoi().catch(err => console.error("Realtime ROI check error:", err));

    // Parallelize core queries for ultra-fast response
    const [directSnap, txSnap, withSnap] = await Promise.all([
      getDocs(query(usersRef, where("sponsor", "==", userId))),
      getDocs(query(collection(db, "transactions"), where("user", "==", userId))),
      getDocs(query(collection(db, "withdrawals"), where("user", "==", userId)))
    ]);

    const directMembers = directSnap.size;

    // Total Team size (optimized to 5 levels for speed)
    let totalTeamCount = 0;
    let tempLevelIds = [userId];
    for (let l = 1; l <= 5; l++) {
      if (tempLevelIds.length === 0) break;
      const nextIds: string[] = [];

      for (let i = 0; i < tempLevelIds.length; i += 30) {
        const chunk = tempLevelIds.slice(i, i + 30);
        const q = query(usersRef, where("sponsor", "in", chunk));
        const snap = await getDocs(q);
        snap.forEach(docSnap => nextIds.push(docSnap.id));
      }

      if (nextIds.length === 0) break;
      totalTeamCount += nextIds.length;
      tempLevelIds = nextIds;
    }

    // Calculate all income totals from transaction history (source of truth)
    const todayIST = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
    const istDateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" });

    const txList = txSnap.docs.map(docSnap => docSnap.data());

    let todayIncomeVal = 0;
    let referralIncomeTotal = 0;  // all-time direct_income
    let downlineIncomeTotal = 0;  // all-time level_income
    let roiIncomeTotal = 0;       // all-time daily_roi
    let totalIncomeCalc = 0;      // all credit income types combined

    txList.forEach((tx: any) => {
      const amount = tx.amount || 0;
      if (amount <= 0) return; // skip debits/withdrawals

      const isIncomeType = ["direct_income", "level_income", "daily_roi"].includes(tx.type);

      if (isIncomeType) {
        totalIncomeCalc += amount;

        // Convert transaction ISO date to IST date YYYY-MM-DD
        const txDateIST = tx.createdAt ? istDateFormatter.format(new Date(tx.createdAt)) : "";
        if (txDateIST === todayIST) {
          todayIncomeVal += amount;
        }

        if (tx.type === "direct_income") referralIncomeTotal += amount;
        if (tx.type === "level_income") downlineIncomeTotal += amount;
        if (tx.type === "daily_roi") roiIncomeTotal += amount;
      }
    });

    let totalWithdrawnApproved = 0;
    let totalWithdrawnPending = 0;

    withSnap.docs.forEach(d => {
      const w = d.data();
      if (w.status === "approved") {
        totalWithdrawnApproved += (w.amount || 0);
      } else if (w.status === "pending") {
        totalWithdrawnPending += (w.amount || 0);
      }
    });


    const totalWithdrawn = parseFloat(totalWithdrawnApproved.toFixed(2));

    // True Wallet Balance = Total Income Credits - Total Withdrawals (Approved & Pending)
    const calcWalletBalance = parseFloat(Math.max(0, totalIncomeCalc - (totalWithdrawnApproved + totalWithdrawnPending)).toFixed(2));

    // Self-heal: fix corrupted walletBalance / totalIncome / referralIncome / downlineIncome on user doc
    const storedWallet = user.walletBalance || 0;
    const storedTotal = user.totalIncome || 0;
    const storedReferral = user.referralIncome || 0;
    const storedDownline = user.downlineIncome || 0;

    const healNeeded =
      Math.abs(storedWallet - calcWalletBalance) > 0.01 ||
      Math.abs(storedTotal - totalIncomeCalc) > 0.01 ||
      Math.abs(storedReferral - referralIncomeTotal) > 0.01 ||
      Math.abs(storedDownline - downlineIncomeTotal) > 0.01;

    if (healNeeded) {
      await updateDoc(userDocRef, {
        walletBalance: calcWalletBalance,
        totalIncome: parseFloat(totalIncomeCalc.toFixed(2)),
        referralIncome: parseFloat(referralIncomeTotal.toFixed(2)),
        downlineIncome: parseFloat(downlineIncomeTotal.toFixed(2)),
        updatedAt: new Date().toISOString()
      });
    }

    // Generate real weekly analytics for last 7 days IST
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyAnalytics: { label: string; income: number; dateStr: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = istDateFormatter.format(d);
      const dayLabel = daysOfWeek[d.getDay()];
      weeklyAnalytics.push({ label: dayLabel, income: 0, dateStr });
    }

    // Populate daily real income totals for last 7 days
    txList.forEach((tx: any) => {
      const amount = tx.amount || 0;
      if (amount <= 0) return;
      if (!["direct_income", "level_income", "daily_roi", "rank_bonus"].includes(tx.type)) return;

      const txDateIST = tx.createdAt ? istDateFormatter.format(new Date(tx.createdAt)) : "";
      const matchDay = weeklyAnalytics.find(w => w.dateStr === txDateIST);
      if (matchDay) {
        matchDay.income = parseFloat((matchDay.income + amount).toFixed(2));
      }
    });

    // Generate real monthly analytics (last 4 weeks)
    const monthlyAnalytics = [
      { label: "Week 1", income: 0 },
      { label: "Week 2", income: 0 },
      { label: "Week 3", income: 0 },
      { label: "Week 4", income: 0 }
    ];

    txList.forEach((tx: any) => {
      const amount = tx.amount || 0;
      if (amount <= 0 || !["direct_income", "level_income", "daily_roi", "rank_bonus"].includes(tx.type)) return;
      const txDate = tx.createdAt ? new Date(tx.createdAt) : null;
      if (!txDate) return;

      const diffDays = Math.floor((new Date().getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 28) {
        const weekIndex = 3 - Math.floor(diffDays / 7);
        if (monthlyAnalytics[weekIndex]) {
          monthlyAnalytics[weekIndex].income = parseFloat((monthlyAnalytics[weekIndex].income + amount).toFixed(2));
        }
      }
    });

    res.json({
      success: true,
      data: {
        walletBalance: calcWalletBalance,
        totalIncome: parseFloat(totalIncomeCalc.toFixed(2)),
        todayIncome: parseFloat(todayIncomeVal.toFixed(2)),
        referralIncome: parseFloat(referralIncomeTotal.toFixed(2)),
        downlineIncome: parseFloat(downlineIncomeTotal.toFixed(2)),
        totalWithdrawn,
        directMembers,
        totalTeam: totalTeamCount,
        analytics: {
          weekly: weeklyAnalytics.map(w => ({ label: w.label, income: w.income })),
          monthly: monthlyAnalytics
        },
        breakdown: {
          directIncome: parseFloat(referralIncomeTotal.toFixed(2)),
          levelIncome: parseFloat(downlineIncomeTotal.toFixed(2)),
          roiIncome: parseFloat(roiIncomeTotal.toFixed(2))
        }
      }
    });


  } catch (error: any) {
    console.error("Wallet summary error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};


