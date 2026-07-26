import cron from "node-cron";
import { db } from "../config/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { sendInactiveUserReminderEmail } from "./email";

/**
 * Sends a 24-hour reminder email to all registered users who haven't activated any plan yet.
 */
export const sendDailyRemindersToInactiveUsers = async (): Promise<{ sent: number; skipped: number }> => {
  console.log("[Reminder Cron] Starting daily reminder emails for unpaid/inactive users...");
  let sent = 0;
  let skipped = 0;

  try {
    const usersSnap = await getDocs(query(collection(db, "users"), where("role", "==", "user")));

    for (const docSnap of usersSnap.docs) {
      const user = docSnap.data();
      const userId = docSnap.id;

      if (!user.email) {
        skipped++;
        continue;
      }

      // Check if user has any active plan in userPlans
      const activePlansSnap = await getDocs(query(
        collection(db, "userPlans"),
        where("userId", "==", userId),
        where("status", "==", "active")
      ));

      if (activePlansSnap.empty) {
        // User has no active plan — send motivational 24-hour reminder email
        try {
          await sendInactiveUserReminderEmail(user.email, user.name || user.username, user.referralCode);
          sent++;
          console.log(`[Reminder Cron] Sent reminder email to ${user.email} (@${user.username})`);
        } catch (err) {
          console.error(`[Reminder Cron] Failed to send email to ${user.email}:`, err);
        }
      } else {
        skipped++;
      }
    }

    console.log(`[Reminder Cron] Completed. Sent: ${sent}, Skipped (Active/No Email): ${skipped}`);
    return { sent, skipped };
  } catch (error) {
    console.error("[Reminder Cron] Error running daily reminders:", error);
    return { sent, skipped };
  }
};

/**
 * Schedule daily reminder cron job — runs every day at 10:00 AM IST (04:30 UTC)
 */
export const startReminderCron = () => {
  cron.schedule("30 4 * * *", async () => {
    console.log("[Reminder Cron] Triggered at 10:00 AM IST");
    await sendDailyRemindersToInactiveUsers();
  }, {
    timezone: "UTC"
  });

  console.log("[Reminder Cron] Daily 24-hour inactive user reminder cron job scheduled for 10:00 AM IST.");
};
