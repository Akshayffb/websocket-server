import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { logError } from "../utils/logger";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

try {
  const connection = await pool.getConnection();
  connection.release();
} catch (err) {
  logError("Mysql connection failed: ", err.message);
}

export default pool;
