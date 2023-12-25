import express from "express";

import {
  getOverdueBooksLastMonth,
  getAnalyticalReportForLastNDays,
  getAnalyticalReportOfLastMonth,
  getAnalyticalReportByInterval,
  getBorrowingProcessesOfLastMonth,
} from "../controllers/reportsController.js";

const router = express.Router();

router.get("/analytics/lastmonth", getAnalyticalReportOfLastMonth); // Get analytical report for borrowing processes for the last month
router.get("/analytics/:period", getAnalyticalReportForLastNDays); // Get analytical report data for the borrowing processes in the last (period) days
router.get("/analytics", getAnalyticalReportByInterval); // Get report for specific interval

router.get("/borrowing/overdue", getOverdueBooksLastMonth); // Get report for overdue borrowing processes last month
router.get("/borrowing", getBorrowingProcessesOfLastMonth); // Get report for all borrows of last month

export default router;
