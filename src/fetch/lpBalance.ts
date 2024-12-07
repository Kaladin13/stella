import { StormSDK } from "@storm-trade/sdk";
import { sleep } from "@ton/blueprint";
import { Address } from "@ton/core";

export async function waitForLpBalanceChange(
  userAddress: Address,
  timeout: number,
  storm: StormSDK
) {
  const startTime = Date.now();
  const initialBalance = await storm.lpBalanceOf(userAddress);
  let currentBalance = initialBalance;
  let delay = 3000; // Initial delay in milliseconds

  while (Date.now() - startTime < timeout) {
    await sleep(delay);
    currentBalance = await storm.lpBalanceOf(userAddress);

    if (currentBalance !== initialBalance) {
      return currentBalance;
    }

    // Exponential backoff
    delay = Math.min(delay * 2, 10000); // Cap the delay at 10 seconds
  }

  throw new Error(
    "Timeout: Balance did not change within the specified timeout period"
  );
}

export async function getLpBalance(userAddress: Address, storm: StormSDK) {
  return await storm.lpBalanceOf(userAddress);
}
