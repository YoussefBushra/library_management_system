import pg from "pg";
import moment from "moment";

import dbConfig from "../config/db.config.js";
import { exportToCSV } from "../utils/export.js";

const { Pool } = pg;
const pool = new Pool(dbConfig);

// Get report data for the borrowing processes in the last (period) days With option to export to CSV
export const getAnalyticalReportForLastNDays = async (req, res) => {
  const client = await pool.connect();

  try {
    // Get period from request: eg. get the report of the last 30 days (period = 30)
    const period = req.params.period;

    const startDate = moment().subtract(period, "days").format("YYYY-MM-DD");
    const endDate = moment().format("YYYY-MM-DD");

    const query = `
          SELECT COUNT(*) as total_borrowed,
                 COUNT(*) FILTER (WHERE status = 'outstanding') as currently_borrowed,
                 COUNT(*) FILTER (WHERE status = 'returned') as returned
          FROM borrowingprocess
          WHERE check_out_date BETWEEN $1 AND $2
        `;

    const result = await client.query(query, [startDate, endDate]);
    const reportData = result.rows[0];

    if (req.query.format === "csv") {
      exportToCSV(result, "analytical_borrowing_report.csv", res);
    } else {
      res.json({ reportData });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generating report" });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Get report for borrowing processes for the last month with option to export to CSV
export const getAnalyticalReportOfLastMonth = async (req, res) => {
  const client = await pool.connect();

  try {
    const lastMonthStart = moment()
      .subtract(1, "month")
      .startOf("month")
      .format("YYYY-MM-DD");
    const lastMonthEnd = moment()
      .subtract(1, "month")
      .endOf("month")
      .format("YYYY-MM-DD");

    console.log(lastMonthStart);
    const query = `
      SELECT COUNT(*) AS total_borrows,
             COUNT(*) FILTER (WHERE status = 'outstanding') AS currently_borrowed,
             COUNT(*) FILTER (WHERE status = 'returned') AS returned_last_month
      FROM borrowingprocess
      WHERE check_out_date BETWEEN $1 AND $2;
    `;

    const result = await client.query(query, [lastMonthStart, lastMonthEnd]);
    const reportData = result.rows[0];

    if (req.query.format === "csv") {
      exportToCSV(result, "last_month_analytical_borrowing_report.csv", res);
    } else {
      res.json({ reportData });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generating report" });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Get report for specific interval with option to export to CSV
export const getAnalyticalReportByInterval = async (req, res) => {
  const client = await pool.connect();

  try {
    const { startDate, endDate } = req.query; // Get dates from query parameters

    if (!startDate || !endDate) {
      res.status(400).json({ message: "Missing start or end date" });
      return;
    }

    const query = `
      SELECT COUNT(*) as total_borrowed,
             COUNT(*) FILTER (WHERE status = 'outstanding') as currently_borrowed,
             COUNT(*) FILTER (WHERE status = 'returned') as returned_in_period
      FROM borrowingprocess
      WHERE check_out_date BETWEEN $1 AND $2
    `;

    const result = await client.query(query, [startDate, endDate]);
    const reportData = result.rows[0];

    if (req.query.format === "csv") {
      exportToCSV(result, "custom_analytical_borrowing_report.csv", res);
    } else {
      res.json({ reportData });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generating report" });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Get all borrowing processes of last month
export const getBorrowingProcessesOfLastMonth = async (req, res) => {
  const client = await pool.connect();

  try {
    const query = `
      SELECT *
      FROM borrowingprocess
      INNER JOIN book ON borrowingprocess.book_id = book.book_id
      INNER JOIN borrower ON borrowingprocess.borrower_id = borrower.borrower_id
    `;

    const result = await client.query(query);

    if (req.query.format === "csv") {
      exportToCSV(result, "last_month_borrowing_data.csv", res);
    } else {
      res.json({ borrowed: result.rows });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error exporting data" });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Get all overdue books of last month with option to export to CSV
export const getOverdueBooksLastMonth = async (req, res) => {
  const client = await pool.connect();
  try {
    const currentDate = moment().format("YYYY-MM-DD");

    const lastMonthStart = moment()
      .subtract(1, "month")
      .startOf("month")
      .format("YYYY-MM-DD");
    const lastMonthEnd = moment()
      .subtract(1, "month")
      .endOf("month")
      .format("YYYY-MM-DD");

    const query = `
      SELECT book.*, borrowingprocess.borrower_id, borrowingprocess.check_out_date, borrowingprocess.due_date, borrowingprocess.status
      FROM borrowingprocess
      INNER JOIN book
      ON borrowingprocess.book_id = book.book_id
      WHERE borrowingprocess.due_date < $1 AND borrowingprocess.status = 'outstanding' 
      AND borrowingprocess.due_date BETWEEN $2 AND $3
    `;

    const result = await client.query(query, [
      currentDate,
      lastMonthStart,
      lastMonthEnd,
    ]);

    // export to CSV option
    if (req.query.format === "csv") {
      exportToCSV(result, "overdue_borrows.csv", res);
    } else {
      res.json({ Due_Books: result.rows });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error exporting data" });
  } finally {
    if (client) {
      client.release();
    }
  }
};
