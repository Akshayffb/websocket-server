import dotenv from "dotenv";
dotenv.config();
import pool from "./index.js";
import { logError } from "../utils/logger.js";

/**
 * Stores historical candle data into the database
 * @param {Object} data - Object containing `candles` array and `symbol` string
 */
export async function storeData(data, symbol) {
  if (!data.candles || !Array.isArray(data.candles)) return;

  const values = data.candles.map((candle) => [
    symbol,
    candle[0], // timestamp
    candle[1], // open
    candle[2], // high
    candle[3], // low
    candle[4], // close
    candle[5], // volume
  ]);

  const query = `
    INSERT INTO historical_data
      (symbol, timestamp, open, high, low, close, volume)
    VALUES ?
  `;

  try {
    const [result] = await pool.query(query, [values]);
  } catch (err) {
    logError("Error inserting candle data:", err.message);
    throw err;
  }
}

/**
 * Fetches all stored candles for a given symbol from the database
 * @param {string} symbol - Symbol to fetch
 * @returns {Promise<Array>}
 */
export async function getStoredData(symbol) {
  const query = `
    SELECT timestamp, open, high, low, close, volume
    FROM historical_data
    WHERE symbol = ?
    ORDER BY timestamp ASC
  `;
  try {
    const [rows] = await pool.query(query, [symbol]);
    return rows.map((row) => ({
      time: row.timestamp,
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      volume: row.volume,
    }));
  } catch (err) {
    logError(`Error fetching stored data for ${symbol}:`, err.message);
    throw err;
  }
}

/**
 * Checks if data exists in the database for a symbol
 * @param {string} symbol - Symbol to check
 * @returns {Promise<boolean>}
 */
export async function hasData(symbol) {
  const query = `SELECT COUNT(*) as count FROM historical_data WHERE symbol = ?`;
  try {
    const [rows] = await pool.query(query, [symbol]);
    return rows[0].count > 0;
  } catch (err) {
    logError(`Error checking data for ${symbol}:`, err.message);
    throw err;
  }
}
