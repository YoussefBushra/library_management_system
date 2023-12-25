import express from "express";
import {
  CheckOutBook,
  getBooksByBorrowerID,
  getOverdueBooks,
  returnBook,
} from "../controllers/borrowingProcessController.js";

const router = express.Router();

router.get("/overdue", getOverdueBooks);
router.get("/:borrowerId", getBooksByBorrowerID);

router.post("/", CheckOutBook);

router.put("/:processId", returnBook);

export default router;
