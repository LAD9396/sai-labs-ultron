import { PublicKey } from "@solana/web3.js";
import { Recipe } from "@staratlas/crafting";
import { SectorCoordinates } from "../common/types";
import { SageFleetHandler } from "../src/SageFleetHandler";
import { SageGameHandler } from "../src/SageGameHandler";

export const claimCrafting = async (
  profilePubkey: PublicKey,
  starbase: SectorCoordinates,
  resource: string,
  recipe: Recipe,
  quantity: number,
  craftingId: number,
  gh: SageGameHandler,
  fh: SageFleetHandler
) => {
  console.log(" ");
  console.log(`Claiming outputs...`);

  let ix = await fh.ixClaimCrafting(profilePubkey, starbase, recipe, craftingId);
  if (ix.type !== "Success") {
    throw new Error(ix.type);
  }

  const tx = await gh.sendDynamicTransactions(ix.ixs, false);
  if (tx.type !== "Success") {
    throw new Error(tx.type)
  }

  console.log(`Crafted ${quantity} ${resource}!`);
  // gh.getQuattrinoBalance();
};
