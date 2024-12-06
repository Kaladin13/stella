import { StormSDK } from "@storm-trade/sdk";

enum ASSETS {
  USDT = "USDT",
  TON = "TON",
}

const ASSET_CONFIG = {
  [ASSETS.USDT]: {
    provider: StormSDK.asMainnetUSDT,
    testnetProvider: StormSDK.asTestnetUSDT,
  },
  [ASSETS.TON]: {
    provider: StormSDK.asMainnetNative,
    testnetProvider: StormSDK.asTestnetNative,
  },
};

export { ASSETS, ASSET_CONFIG };
