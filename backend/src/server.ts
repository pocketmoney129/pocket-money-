import app from "./app";
import { startRoiCron } from "./utils/roiCron";
import { startReminderCron } from "./utils/reminderCron";

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
  // Start daily ROI distribution cron job
  startRoiCron();
  // Start daily inactive user reminder email cron job
  startReminderCron();
});

