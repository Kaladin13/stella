import { NetworkProvider, sleep } from "@ton/blueprint";
import { Evaa, MAINNET_LP_POOL_CONFIG, TESTNET_POOL_CONFIG } from "@evaafi/sdk";
import { fromNano, toNano, TonClient4 } from "@ton/ton";
import { ASSET_CONFIG, ASSETS } from "../src/types/asset";
import { waitForLpBalanceChange } from "../src/utils/lpBalance";

export async function run(provider: NetworkProvider) {
  const isTestnet = provider.network() !== "mainnet";

  const ui = provider.ui();

  const baseAsset = (await ui.choose(
    "Select base asset",
    Object.values(ASSETS),
    (c: string) => c
  )) as ASSETS;

  const stormProvider = isTestnet
    ? ASSET_CONFIG[baseAsset].testnetProvider
    : ASSET_CONFIG[baseAsset].provider;

  const evaa = provider.open(
    new Evaa({
      poolConfig: isTestnet ? TESTNET_POOL_CONFIG : MAINNET_LP_POOL_CONFIG,
    })
  );

  // we can cast like this if we provide RPC API key in blueprint.config.ts
  const storm = stormProvider(provider.api() as TonClient4);

  await evaa.getSync();

  const baseAmount = parseFloat(
    await ui.input(`Enter initial position for strategy(in ${baseAsset})`)
  );

  const stake = await storm.stake({
    amount: toNano(baseAmount),
    userAddress: provider.sender().address,
  });

  try {
    const balanceBefore = await storm.lpBalanceOf(provider.sender().address);
    console.log(`LP Balance before: ${fromNano(balanceBefore)}`);
  } catch (e) {
    console.log("errr", e);
  }

  await provider.sender().send({
    to: stake.to,
    value: stake.value,
    body: stake.body,
  });

  // use expanential backoff to wait for balance change, thx to ton ttb
  console.log(
    `Balance after providing to vault ${fromNano(
      await waitForLpBalanceChange(provider.sender().address, 60000, storm)
    )}`
  );
}
