import dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
export default {
  connectionString: databaseUrl,
};
