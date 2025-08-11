import dotenv from "dotenv";
dotenv.config();
import { WebSocketServer } from "ws";
import { fetchHistoricalData } from "./historical-api/data.js";
import { storeData, getStoredData, hasData } from "./db/query.js";
import { logInfo, logWarn, logError, logDebug } from "./utils/logger.js";

const wss = new WebSocketServer({ port: 8080 });
const intervalTime = process.env.SEND_INTERVAL_MS;

// Symbols from .env → only used for fetching & storing historical data
const envSymbols = (process.env.SYMBOLS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const range_from = Math.floor(new Date("2022-08-01").getTime() / 1000);
const range_to = Math.floor(new Date("2022-08-15").getTime() / 1000);

const values = {
  resolution: "1",
  date_format: "0",
  range_from,
  range_to,
  cont_flag: "1",
};

// Fetch and store data from envSymbols
async function fetchAndStoreAll() {
  if (!envSymbols.length) {
    logWarn("No symbols in env file. Skipping historical API call.");
    return;
  }

  for (const symbol of envSymbols) {
    const alreadyStored = await hasData(symbol);
    logDebug(`Checking DB for ${symbol} → alreadyStored: ${alreadyStored}`);

    if (alreadyStored) {
      logInfo(`Data for ${symbol} already exists. Skipping fetch.`);
      continue;
    }

    logInfo(`Fetching historical data for ${symbol}...`);

    try {
      const result = await fetchHistoricalData({ ...values, symbol });
      logDebug(`Fetch result for ${symbol}: ${JSON.stringify(result)}`);

      if (result.s === "ok" && result.candles?.length) {
        logInfo(`Fetched ${result.candles.length} candles for ${symbol}`);
        await storeData(result.candles, symbol);
        logInfo(`Stored data for ${symbol}`);
      } else {
        logWarn(`No data for ${symbol}: ${result.message || "Unknown reason"}`);
      }
    } catch (err) {
      logError(err, `FetchError: ${symbol}`);
    }
  }
}

function startWebSocketServer() {
  wss.on("connection", (ws) => {
    logInfo("Client connected");

    let subscribedSymbols = [];

    ws.on("message", async (msg) => {
      try {
        const { action, symbols: clientSymbols } = JSON.parse(msg.toString());

        if (
          action === "subscribe" &&
          Array.isArray(clientSymbols) &&
          clientSymbols.length
        ) {
          subscribedSymbols = clientSymbols;
          logInfo(`Client subscribed to: ${JSON.stringify(subscribedSymbols)}`);

          // Load stored data for subscribed symbols
          const symbolData = {};
          for (const symbol of subscribedSymbols) {
            const data = await getStoredData(symbol);
            logDebug(`Loaded ${data.length} candles for ${symbol}`);
            symbolData[symbol] = data;
          }

          let index = 0;
          const interval = setInterval(() => {
            let dataLeft = false;
            logDebug(`Streaming cycle index: ${index}`);

            for (const symbol of subscribedSymbols) {
              const data = symbolData[symbol];
              if (data && data[index]) {
                dataLeft = true;
                const candleMsg = {
                  symbol,
                  ltp: data[index].close,
                  timestamp: data[index].time,
                  type: "sf",
                };
                logDebug(
                  `Sending candle for ${symbol}: ${JSON.stringify(candleMsg)}`
                );
                ws.send(JSON.stringify(candleMsg));
              }
            }

            if (!dataLeft) {
              logWarn("No more data to stream. Closing connection...");
              clearInterval(interval);
              ws.close();
            }

            index++;
          }, intervalTime);

          ws.on("close", () => {
            clearInterval(interval);
            logInfo("Client disconnected");
          });
        }
      } catch (err) {
        logError(err, "MessageParseError");
      }
    });

    ws.on("error", (err) => {
      logError(err, "SocketError");
    });
  });
}

(async function init() {
  await fetchAndStoreAll();
  startWebSocketServer();
  logInfo("Server Ready on ws://localhost:8080");
})();
