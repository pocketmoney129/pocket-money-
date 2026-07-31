import cron from "node-cron";
import { db } from "../config/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  query,
  where
} from "firebase/firestore";
import { sendDailyRoiEmail } from "./email";

/**
 * Gets today's date string in IST as "YYYY-MM-DD"
 */
export const getTodayIST = (): string => {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  };
  const formatter = new Intl.DateTimeFormat("en-CA", options);
  return formatter.format(new Date());
};

// Global in-memory lock to prevent race conditions or concurrent duplicate execution
let isProcessingRoi = false;

/**
 * Core ROI distribution logic.
 * Queries the `userPlans` collection — each approved deposit creates one userPlan doc.
 * Supports multiple active plans per user.
 */
export const distributeRoi = async (): Promise<{ credited: number; skipped: number; expired: number }> => {
  if (isProcessingRoi) {
    console.log("[ROI Cron] Distribution already in progress. Skipping duplicate concurrent run.");
    return { credited: 0, skipped: 0, expired: 0 };
  }

  isProcessingRoi = true;
  const todayStr = getTodayIST();
  console.log(`[ROI Cron] Starting daily ROI distribution for ${todayStr}...`);

  let credited = 0;
  let skipped = 0;
  let expired = 0;

  try {
    // Query all active user plans
    const plansSnap = await getDocs(
      query(collection(db, "userPlans"), where("status", "==", "active"))
    );

    for (const planDocSnap of plansSnap.docs) {
      const planId = planDocSnap.id;

      // Re-fetch fresh plan doc from Firestore right before processing to avoid concurrency duplicate
      const freshPlanSnap = await getDoc(doc(db, "userPlans", planId));
      if (!freshPlanSnap.exists()) {
        skipped++;
        continue;
      }

      const plan = freshPlanSnap.data();
      const userId = plan.userId;

      // Double-check: Skip if today's ROI was already distributed for this plan or status is not active
      if (plan.lastRoiDate === todayStr || plan.status !== "active") {
        skipped++;
        continue;
      }

      // Check if plan ROI days are completed
      const roiDaysCompleted = plan.roiDaysCompleted || 0;
      const expiryDays = plan.expiryDays || 25;

      if (roiDaysCompleted >= expiryDays) {
        // Plan fully completed — mark expired
        await updateDoc(doc(db, "userPlans", planId), {
          status: "expired",
          completedAt: new Date().toISOString()
        });
        expired++;
        console.log(`[ROI Cron] Plan ${planId} for user ${userId} fully completed (${expiryDays} days).`);
        continue;
      }

      // Fetch fresh user data for wallet balance
      const userDocRef = doc(db, "users", userId);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) {
        skipped++;
        continue;
      }

      const user = userSnap.data();

      const getFallbackDailyRoi = (name: string, price: number): number => {
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

      let dailyRoiAmount = plan.dailyRoi && plan.dailyRoi > 0
        ? parseFloat((plan.dailyRoi).toFixed(2))
        : getFallbackDailyRoi(plan.packageName, plan.purchasePrice);

      if (dailyRoiAmount <= 0) {
        skipped++;
        continue;
      }

      const prevBalance = user.walletBalance || 0;
      const newBalance = parseFloat((prevBalance + dailyRoiAmount).toFixed(2));
      const newTotalIncome = parseFloat(((user.totalIncome || 0) + dailyRoiAmount).toFixed(2));
      const newRoiDays = roiDaysCompleted + 1;

      // Update plan FIRST: increment days count and lock lastRoiDate to prevent double credit
      await updateDoc(doc(db, "userPlans", planId), {
        lastRoiDate: todayStr,
        roiDaysCompleted: newRoiDays,
        dailyRoi: dailyRoiAmount,
        ...(newRoiDays >= expiryDays && {
          status: "expired",
          completedAt: new Date().toISOString()
        })
      });

      // Credit ROI to user wallet
      await updateDoc(userDocRef, {
        walletBalance: newBalance,
        totalIncome: newTotalIncome,
        updatedAt: new Date().toISOString()
      });

      // Create daily_roi transaction record
      const txId = doc(collection(db, "transactions")).id;
      await setDoc(doc(db, "transactions", txId), {
        _id: txId,
        user: userId,
        amount: dailyRoiAmount,
        type: "daily_roi",
        description: `Daily ROI - ${plan.packageName} (Day ${newRoiDays}/${expiryDays})`,
        balanceBefore: prevBalance,
        balanceAfter: newBalance,
        planId,
        createdAt: new Date().toISOString()
      });

      credited++;
      console.log(
        `[ROI Cron] Credited ₹${dailyRoiAmount} to user ${user.username} ` +
        `for plan "${plan.packageName}" (Day ${newRoiDays}/${expiryDays})`
      );

      // Send daily ROI email notification to user
      if (user.email) {
        sendDailyRoiEmail(
          user.email,
          user.name || user.username,
          plan.packageName,
          dailyRoiAmount,
          newTotalIncome,
          newBalance
        ).catch(err => console.error(`[ROI Cron] Email error for ${user.email}:`, err));
      }

    }

    console.log(`[ROI Cron] Done. Credited: ${credited}, Skipped: ${skipped}, Expired: ${expired}`);
    return { credited, skipped, expired };
  } catch (error) {
    console.error("[ROI Cron] Error during ROI distribution:", error);
    return { credited, skipped, expired };
  } finally {
    isProcessingRoi = false;
  }
};

/**
 * Schedule daily ROI cron — runs at 12:01 AM IST (18:31 UTC), on server startup, and periodically
 */
export const startRoiCron = () => {
  // 1. Cron schedule at 12:01 AM IST
  cron.schedule("31 18 * * *", async () => {
    console.log("[ROI Cron] Triggered at 12:01 AM IST");
    await distributeRoi();
  }, {
    timezone: "UTC"
  });

  // 2. Initial distribution check 5 seconds after server startup
  setTimeout(() => {
    console.log("[ROI Cron] Initial server startup ROI distribution check...");
    distributeRoi().catch(err => console.error("[ROI Cron] Startup distribution error:", err));
  }, 5000);

  // 3. Periodic safety check every 30 minutes to catch missed runs if server slept/restarted
  setInterval(() => {
    distributeRoi().catch(err => console.error("[ROI Cron] Periodic distribution error:", err));
  }, 30 * 60 * 1000);

  console.log("[ROI Cron] Daily ROI cron job, startup check, and periodic safety check active.");
};
