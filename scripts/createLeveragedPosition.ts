import { NetworkProvider } from "@ton/blueprint";
import {
  Evaa,
  FEES,
  MAINNET_LP_POOL_CONFIG,
  TESTNET_POOL_CONFIG,
} from "@evaafi/sdk";
import { Cell, fromNano, toNano, TonClient4 } from "@ton/ton";
import { ASSET_CONFIG, ASSETS } from "../src/types/asset";
import { getLpBalance, waitForLpBalanceChange } from "../src/fetch/lpBalance";
import { waitForBorrowLimitChange } from "../src/fetch/borrow";
import { TON_TTB, waitTx } from "../src/utils/tx";

export async function run(provider: NetworkProvider) {
  try {
    const isTestnet = provider.network() !== "mainnet";

    const ui = provider.ui();

    const baseAsset = (await ui.choose(
      "Select base asset",
      Object.values(ASSETS),
      (c: string) => c
    )) as ASSETS;

    const config = isTestnet
      ? ASSET_CONFIG[baseAsset].testnet
      : ASSET_CONFIG[baseAsset].mainnet;

    const stormProvider = config.stormProvider;

    const evaa = provider.open(
      new Evaa({
        poolConfig: isTestnet ? TESTNET_POOL_CONFIG : MAINNET_LP_POOL_CONFIG,
      })
    );

    // we can cast like this if we provide RPC API key in blueprint.config.ts
    const storm = stormProvider(provider.api() as TonClient4);

    const treshold = parseFloat(
      await ui.input(`Enter leverage loop treshold(in ${baseAsset})`)
    );

    const isInitialStakeNeeded = await ui.input(
      `Stake initial position for strategy? (y/n)`
    );

    let slpBalance: bigint;
    let loopCount = 1;
    let leveragedPosition = 0;

    if (isInitialStakeNeeded !== "n") {
      const baseAmount = parseFloat(
        await ui.input(`Enter initial position for strategy(in ${baseAsset})`)
      );

      leveragedPosition += baseAmount;

      const stake = await storm.stake({
        amount: toNano(baseAmount),
        userAddress: provider.sender().address,
      });

      try {
        const balanceBefore = await storm.lpBalanceOf(
          provider.sender().address
        );
        ui.write(`LP Balance before: ${fromNano(balanceBefore)}`);
      } catch (e) {
        console.debug(`Failed to fetch LP balance before: ${e}`);
      }

      ui.write(`Sending ${baseAmount} ${baseAsset} to Storm Vault`);
      await provider.sender().send({
        to: stake.to,
        value: stake.value,
        body: stake.body,
      });

      // use expanential backoff to wait for balance change, thx to ton ttb
      // if we throw on lp change it's okay to drop
      slpBalance = await waitForLpBalanceChange(
        provider.sender().address,
        TON_TTB,
        storm
      );

      loopCount += 1;
    } else {
      slpBalance = await getLpBalance(provider.sender().address, storm);
    }

    while (toNano(treshold) < slpBalance) {
      ui.write(
        `Leverage loop #${loopCount} has started with SLP Balance in vault: ${fromNano(
          slpBalance
        )}`
      );

      ui.write(`Sending ${fromNano(slpBalance)} as collateral supply to Evaa`);
      await evaa.sendSupply(provider.sender(), FEES.SUPPLY_JETTON, {
        queryID: 0n,
        includeUserCode: true,
        userAddress: provider.sender().address,
        amount: slpBalance,
        asset: config.supplyEvaaAsset,
        payload: Cell.EMPTY,
        amountToTransfer: toNano(0),
      });

      await waitTx(ui);

      // TODO: change hardcoded timeout to exponential backoff fetch
      const [borrowLimit, evaaPrices] = await waitForBorrowLimitChange(
        evaa,
        provider.sender().address,
        config.borrowEvaaAsset.assetId
      );

      ui.write(`Borrow limit on ${baseAsset}: ${fromNano(borrowLimit)}`);
      ui.write(`Borrowing ${fromNano(borrowLimit)} ${baseAsset} from Evaa`);

      await evaa.sendWithdraw(provider.sender(), FEES.WITHDRAW, {
        queryID: 0n,
        includeUserCode: true,
        userAddress: provider.sender().address,
        amount: borrowLimit,
        asset: config.borrowEvaaAsset,
        priceData: evaaPrices.dataCell,
        payload: Cell.EMPTY,
        amountToTransfer: toNano(0),
      });

      await waitTx(ui);

      const stake = await storm.stake({
        amount: borrowLimit,
        userAddress: provider.sender().address,
      });

      ui.write(`Sending ${fromNano(borrowLimit)} ${baseAsset} to Storm Vault`);
      await provider.sender().send({
        to: stake.to,
        value: stake.value,
        body: stake.body,
      });

      slpBalance = await waitForLpBalanceChange(
        provider.sender().address,
        TON_TTB,
        storm
      );

      leveragedPosition += parseFloat(fromNano(borrowLimit));
      loopCount += 1;
    }

    ui.write(
      `Strategy has ended with ${loopCount} loops and leveraged position ${leveragedPosition} ${baseAsset}`
    );
  } catch (e) {
    provider
      .ui()
      .write(
        `Strategy failed, check that jetton wallet for chosen asset is deployed`
      );
    console.debug(`Reason: ${e}`);
  }
}
