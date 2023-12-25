import pg from "pg";
import moment from "moment";

import dbConfig from "../config/db.config.js";

const { Pool } = pg;
const pool = new Pool(dbConfig);

// Get all books for specific borrower that are not yet returned
export const getBooksByBorrowerID = async (req, res) => {
  const client = await pool.connect();

  try {
    const borrowerId = parseInt(req.params.borrowerId);

    const query = `
          SELECT book.*, borrowingprocess.check_out_date, borrowingprocess.due_date, borrowingprocess.status
          FROM borrowingprocess
          INNER JOIN book
          ON borrowingprocess.book_id = book.book_id
          WHERE borrowingprocess.borrower_id = $1 AND
          status = 'outstanding'
          ORDER BY check_out_date DESC
        `;

    const result = await client.query(query, [borrowerId]);

    const borrowedBooks = result.rows.map((row) => ({
      book_id: row.book_id,
      title: row.title,
      borrowed_since: moment(row.check_out_date).format("YYYY-MM-DD"),
      due_date: moment(row.due_date).format("YYYY-MM-DD"),
    }));

    res.status(200).json(borrowedBooks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching borrowed books" });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Get all overdue books
export const getOverdueBooks = async (req, res) => {
  const client = await pool.connect();

  try {
    const currentDate = moment().format("YYYY-MM-DD");

    const client = await pool.connect();

    const query = `
    SELECT DISTINCT book.*, borrowingprocess.check_out_date, borrowingprocess.due_date, borrowingprocess.status, borrower.borrower_id, borrower.name
    FROM borrowingprocess
    INNER JOIN book
      ON borrowingprocess.book_id = book.book_id
    INNER JOIN borrower
      ON borrowingprocess.borrower_id = borrower.borrower_id
    WHERE borrowingprocess.due_date < $1 AND borrowingprocess.status = 'outstanding'
    `;

    const result = await client.query(query, [currentDate]);

    const overdueBooks = result.rows.map((row) => ({
      borrower_id: row.borrower_id,
      name: row.name,
      book_id: row.book_id,
      title: row.title,
      check_out_date: moment(row.check_out_date).format("YYYY-MM-DD"),
      due_date: moment(row.due_date).format("YYYY-MM-DD"),
    }));

    res.status(200).json(overdueBooks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching overdue books" });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Checkout book: Add book ID to borrowingProcess table & decrement available quantity in Book table
export const CheckOutBook = async (req, res) => {
  const client = await pool.connect();

  try {
    const { borrower_id, book_id } = req.body;
    const currentDate = moment().format("YYYY-MM-DD");

    // Set default due date to be after 15 days from borrowing the book.
    const dueDate = moment().add(15, "days").format("YYYY-MM-DD");

    // Check book quantity before book Checkout
    const bookQuantityResult = await client.query(
      "SELECT available_quantity FROM book WHERE book_id = $1",
      [book_id]
    );

    const bookQuantity = bookQuantityResult.rows[0].available_quantity;

    if (bookQuantity > 0) {
      // Begin transaction to ensure consistency
      await client.query("BEGIN");

      try {
        // Checkout book
        const result = await client.query(
          "INSERT INTO borrowingprocess (borrower_id, book_id, check_out_date, due_date) VALUES ($1, $2, $3, $4)",
          [borrower_id, book_id, currentDate, dueDate]
        );

        // Decrement available quantity in book table
        const updateResult = await client.query(
          "UPDATE book SET available_quantity = available_quantity - 1 WHERE book_id = $1",
          [book_id]
        );

        // Check if quantity was decremented successfully
        if (updateResult.rowCount === 1) {
          await client.query("COMMIT"); // Commit changes if successful
          res.status(201).json({ message: "Checkout is successfull" });
        } else {
          await client.query("ROLLBACK"); // Rollback if quantity update failed
          res
            .status(400)
            .json({ message: "Error: Book quantity could not be updated" });
        }
      } catch (error) {
        await client.query("ROLLBACK"); // Rollback on any error
        console.error(error);
        res.status(500).json({ message: "Error adding borrowing process" });
      } finally {
        if (client) {
          client.release();
        }
      }
    } else {
      res.status(400).json({ message: "Error: Book is not available" });
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Error: Cannot execute your operation" });
  }
};

// Return book: Change status from 'outstanding' to 'returned' & increment quantity in Book table
export const returnBook = async (req, res) => {
  const client = await pool.connect();

  try {
    const process_id = parseInt(req.params.processId);

    const returnDate = moment().format("YYYY-MM-DD");

    // Begin transaction
    await client.query("BEGIN");

    try {
      // Update borrowing process status
      const updateProcessResult = await client.query(
        "UPDATE borrowingprocess SET status = $1, return_date = $2 WHERE process_id = $3 AND status = $4",
        ["returned", returnDate, process_id, "outstanding"]
      );

      // Get book id
      const book_idResult = await client.query(
        "SELECT book_id FROM borrowingprocess WHERE process_id = $1",
        [process_id]
      );

      const book_id = book_idResult.rows[0].book_id;

      // Check if status was updated successfully
      if (updateProcessResult.rowCount === 1) {
        // Increment available quantity in book table
        const updateBookResult = await client.query(
          "UPDATE book SET available_quantity = available_quantity + 1 WHERE book_id = $1",
          [book_id]
        );

        // Commit changes
        await client.query("COMMIT");
        res
          .status(200)
          .json({ message: "Book returned successfully, Hope you liked it" });
      } else {
        await client.query("ROLLBACK"); // Rollback if status update failed
        res
          .status(400)
          .json({ message: "Error: Book is not currently borrowed" });
      }
    } catch (error) {
      await client.query("ROLLBACK");
      console.error(error);
      res.status(500).json({ message: "Error returning book" });
    } finally {
      if (client) {
        client.release();
      }
    }
  } catch (error) {
    // ... (handle outer errors)
  }
};
