import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "check overdue invoices",
  { hourUTC: 7, minuteUTC: 0 },
  internal.invoices.checkAndMarkOverdue
);

// Runs 1 hour after overdue-marking so newly-overdue invoices are already
// flagged before we send the after_0 / after_7 / after_14 reminders.
crons.cron(
  "send invoice reminders",
  "0 8 * * *",
  internal.reminders.processReminderEmails,
  {}
);

export default crons;
