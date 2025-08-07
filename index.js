import { WebSocketServer } from "ws";
import si from "systeminformation";
import pool from "./db/index.js";
import { fetchHistoricalData } from "./historical-api/data.js";
import { storeData } from "./db/store.js";

const wss = new WebSocketServer({ port: 8080 });

const symbols = [
  "NSE:INFY-EQ",
  "NSE:HDFCBANK-EQ",
  "NSE:ICICIBANK-EQ",
  "NSE:ITC-EQ",
  "NSE:LT-EQ",
];

const range_from = Math.floor(new Date("2022-08-01").getTime() / 1000);
const range_to = Math.floor(new Date("2022-08-15").getTime() / 1000);

const values = {
  resolution: "1",
  date_format: "0",
  range_from,
  range_to,
  cont_flag: "1",
};

async function fetchAndStoreAll() {
  for (const symbol of symbols) {
    const input = { ...values, symbol };

    try {
      const result = await fetchHistoricalData(input);
      if (result.s === "ok") {
        await storeData(result, symbol);
        console.log(`Stored data for ${symbol}`);
      } else {
        console.log(`Failed for ${symbol}:`, result.message);
      }
    } catch (err) {
      console.error(`Error for ${symbol}:`, err.message);
    }
  }
}

fetchAndStoreAll();
