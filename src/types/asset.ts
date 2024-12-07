import {
  PoolAssetConfig,
  TON_MAINNET,
  TON_STORM_MAINNET,
  TON_TESTNET,
  UNDEFINED_ASSET,
  USDT_MAINNET,
  USDT_STORM_MAINNET,
} from "@evaafi/sdk";
import { StormSDK } from "@storm-trade/sdk";

enum ASSETS {
  USDT = "USDT",
  TON = "TON",
}

type AssetConfig = {
  [key in ASSETS]: {
    [key in "mainnet" | "testnet"]: {
      stormProvider: (client: any) => StormSDK;
      supplyEvaaAsset: PoolAssetConfig;
      borrowEvaaAsset: PoolAssetConfig;
    };
  };
};

const ASSET_CONFIG: AssetConfig = {
  [ASSETS.USDT]: {
    mainnet: {
      stormProvider: StormSDK.asTestnetUSDT,
      supplyEvaaAsset: USDT_STORM_MAINNET,
      borrowEvaaAsset: USDT_MAINNET,
    },
    testnet: {
      stormProvider: StormSDK.asMainnetUSDT,
      // evaa does not support storm testnet lp
      supplyEvaaAsset: UNDEFINED_ASSET,
      borrowEvaaAsset: UNDEFINED_ASSET,
    },
  },
  [ASSETS.TON]: {
    mainnet: {
      stormProvider: StormSDK.asMainnetNative,
      supplyEvaaAsset: TON_STORM_MAINNET,
      borrowEvaaAsset: TON_MAINNET,
    },
    testnet: {
      stormProvider: StormSDK.asTestnetNative,
      supplyEvaaAsset: UNDEFINED_ASSET,
      borrowEvaaAsset: TON_TESTNET,
    },
  },
};

export { ASSETS, ASSET_CONFIG };
