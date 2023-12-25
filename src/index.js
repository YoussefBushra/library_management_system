import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";

import bookRoutes from "./routes/bookRoutes.js";
import borrowerRoutes from "./routes/borrowerRoutes.js";
import borrowingProcessRoutes from "./routes/borrowingProcessRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

const app = express();
dotenv.config();

// Middleware
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());

// Routes ~ Implementing all functional requirements
app.use("/books", bookRoutes);
app.use("/borrowers", borrowerRoutes);
app.use("/borrowingProcess", borrowingProcessRoutes);

// Routes ~ Bonus API endpoints
app.use("/reports", reportRoutes);

const port = process.env.PORT || 3000;

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
