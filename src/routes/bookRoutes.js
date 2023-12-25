import express from "express";
import basicAuth from "express-basic-auth";
import rateLimit from "express-rate-limit";

import {
  getBooks,
  addBook,
  updateBook,
  deleteBook,
  getBookByID,
  findBook,
} from "../controllers/booksController.js";

const router = express.Router();

const authMiddleware = basicAuth({
  users: {
    youssef: "1234", // Replace with actual credentials
  },
  challenge: true, // Prompt for credentials if unauthorized
});

// Initializing rate limit
const BookAdditionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Allow 10 requests per window
});

router.get("/search", findBook); // Search books by ISBN, Title, or author (dynamic search)
router.get("/", getBooks); // Retreive all books
router.get("/:id", getBookByID); // Retreive a single book by ID

router.post("/", BookAdditionLimiter, addBook); // Add a new book to the DB

router.put("/:id", updateBook); // Update a book data by its ID

router.delete("/:id", authMiddleware, deleteBook); // Delete a book by its ID

export default router;
