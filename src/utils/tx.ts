import { sleep } from "../fetch/seqno";

export const TON_TTB = 60000; // 60s for tx

export async function waitTx() {
  await sleep(TON_TTB);
}
