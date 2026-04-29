import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "check overdue invoices",
  { hourUTC: 7, minuteUTC: 0 },
  internal.invoices.checkAndMarkOverdue
);

export default crons;
