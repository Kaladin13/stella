import { UIProvider } from "@ton/blueprint";
import { sleep } from "../fetch/seqno";

export const TON_TTB = 60000; // 60s for tx

export async function waitTx(ui: UIProvider) {
  ui.write("Waiting for transaction to be confirmed...");
  await sleep(TON_TTB);
}
