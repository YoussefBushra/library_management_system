import express from "express";
import rateLimit from "express-rate-limit";

import {
  addBorrower,
  deleteBorrower,
  getBorrowers,
  updateBorrower,
} from "../controllers/borrowersController.js";

const router = express.Router();

// Initializing rate limit
const RegisteringLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Allow 10 requests per window
});

router.get("/", getBorrowers); // get all borrowers

// Bonus rate limitting
router.post("/", RegisteringLimiter, addBorrower); // add new borrower with rate limiting

router.put("/:id", updateBorrower); // update borrower

router.delete("/:id", deleteBorrower); // delete borrower

export default router;
