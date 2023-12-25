import pg from "pg";
import express from "express";

import dbConfig from "../config/db.config.js";

const { Pool } = pg;
const pool = new Pool(dbConfig);

const router = express.Router();

// Get all borrowers
export const getBorrowers = async (req, res) => {
  const client = await pool.connect();

  try {
    const result = await client.query("SELECT * FROM borrower");

    // Extract borrowers from the result
    const borrowers = result.rows;

    res.status(200).json(borrowers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching borrowers" });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Add a new borrower
export const addBorrower = async (req, res) => {
  const client = await pool.connect();

  try {
    //Get borrower attributes from request body
    const { name, email } = req.body;

    //get current date in YYYY-MM-DD format
    const registered_date = new Date().toISOString().slice(0, 10);

    await client.query(
      "INSERT INTO Borrower (name, email, registered_date) VALUES ($1, $2, $3)",
      [name, email, registered_date]
    );

    res.status(201).json({
      message: "Borrower added successfully",
      added: {
        borrower: { name, email, registered_date },
      },
    });
  } catch (error) {
    console.log(error);
    if (error.code === "23505") {
      res
        .status(400)
        .json({ message: "A borrower with the same email already exists" });
    } else {
      res.status(500).json({ message: "Error adding borrower" });
    }
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Update a borrower by ID
export const updateBorrower = async (req, res) => {
  const client = await pool.connect();

  try {
    const borrowerId = parseInt(req.params.id);
    const { name, email } = req.body;

    // Handle if borrower has the same values
    const existingBorrower = await client.query(
      "SELECT * FROM borrower WHERE borrower_id = $1",
      [borrowerId]
    );

    // Check if the borrower has the same values -> abort update process
    if (
      existingBorrower.rows.length > 0 &&
      existingBorrower.rows[0].name == name &&
      existingBorrower.rows[0].email == email
    ) {
      return res
        .status(400)
        .json({ message: "Borrower already has the same values" });
    }

    // Validate all atrribute exist (basic validation)
    if (!name || !email) {
      return res.status(400).json({ message: "Invalid borrower data" });
    }

    await client.query(
      "UPDATE borrower SET name = $1, email = $2 WHERE borrower_id = $3",
      [name, email, borrowerId]
    );

    res.status(200).json({ message: "Borrower updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating borrower" });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Delete a borrower by ID
export const deleteBorrower = async (req, res) => {
  const client = await pool.connect();

  try {
    const borrowerId = parseInt(req.params.id);

    // Handle if borrower does not exist
    const result = await client.query(
      "SELECT * FROM borrower WHERE borrower_id = $1",
      [borrowerId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Borrower not found" });

    await client.query("DELETE FROM borrower WHERE borrower_id = $1", [
      borrowerId,
    ]);

    res.status(200).json({
      message: "Borrower deleted successfully",
      Deleted_ID: borrowerId,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error deleting borrower" });
  } finally {
    if (client) {
      client.release();
    }
  }
};
