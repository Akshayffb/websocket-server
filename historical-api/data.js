import dotenv from "dotenv";
dotenv.config();
import { logError } from "../utils/logger.js";

import { fyersModel } from "fyers-api-v3";

const appId = process.env.FYERS_APP_ID;
const accessToken = process.env.FYERS_ACCESS_TOKEN;

if (!appId || !accessToken) {
  logError(
    "Missing one or more required environment variables: FYERS_APP_ID, FYERS_ACCESS_TOKEN. Exiting application."
  );
  process.exit(1);
}

const fyers = new fyersModel();
fyers.setAppId(appId);
fyers.setAccessToken(accessToken);

export async function fetchHistoricalData(data) {
  try {
    return fyers.getHistory(data);
  } catch (err) {
    throw err;
  }
}
