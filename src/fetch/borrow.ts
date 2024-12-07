import { Evaa, PriceData } from "@evaafi/sdk";
import { Address, OpenedContract } from "@ton/core";

export async function waitForBorrowLimitChange(
  evaa: OpenedContract<Evaa>,
  userAddress: Address,
  assetId: bigint
): Promise<[bigint, PriceData]> {
  const evaaUserContract = evaa.getOpenedUserContract(userAddress);

  // sync for correct prices
  await evaa.getSync();
  const evaaPrices = await evaa.getPrices();

  await evaaUserContract.getSync(
    evaa.data.assetsData,
    evaa.data.assetsConfig,
    evaaPrices.dict
  );

  const isCalculated = evaaUserContract.calculateUserData(
    evaa.data.assetsData,
    evaa.data.assetsConfig,
    evaaPrices.dict
  );

  const userData = evaaUserContract.data;

  if (!isCalculated || userData.type !== "active") {
    // TODO: add lite user sc data usage
    throw new Error("oracle prices not available");
  }

  return [userData.borrowLimits.get(assetId), evaaPrices];
}
