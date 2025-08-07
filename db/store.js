import dotenv from "dotenv";
dotenv.config();
import pool from "./index.js";

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
    console.log(`Inserted ${result.affectedRows} rows for symbol ${symbol}`);
  } catch (err) {
    console.error("Error inserting candle data:", err.message);
    throw err;
  }
}
