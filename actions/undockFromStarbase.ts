import { PublicKey } from "@solana/web3.js";
import { SageFleetHandler } from "../src/SageFleetHandler";
import { SageGameHandler } from "../src/SageGameHandler";

export const undockFromStarbase = async (
  fleetPubkey: PublicKey,
  gh: SageGameHandler,
  fh: SageFleetHandler
) => {
  console.log(" ");
  console.log("Undocking from starbase...");

  let ix = await fh.ixUndockFromStarbase(fleetPubkey);
  if (ix.type !== "Success") {
    throw new Error(ix.type);
  }

  await gh.sendDynamicTransactions(ix.ixs, false);

  console.log("Fleet undocked!");
  await gh.getQuattrinoBalance();
};
