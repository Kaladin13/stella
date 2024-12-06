import { configDotenv } from "dotenv";
configDotenv();
import { Config } from "@ton/blueprint";

export const config: Config = {
  network: {
    endpoint: "https://toncenter.com/api/v2/jsonRPC",
    type: "mainnet",
    version: "v2",
    key: process.env.RPC_API_KEY,
  },
};
