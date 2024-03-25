import { PublicKey } from "@solana/web3.js";
import { Recipe } from "@staratlas/crafting";
import { SectorCoordinates } from "../common/types";
import { SageFleetHandler } from "../src/SageFleetHandler";
import { SageGameHandler } from "../src/SageGameHandler";
import { wait } from "../utils/actions/wait";
import { getRecipeIngredients } from "../utils/crafting/getRecipeIngredients";

export const startCrafting = async (
  profilePubkey: PublicKey,
  starbase: SectorCoordinates,
  resource: string,
  recipe: Recipe,
  quantity: number,
  numCrew: number,
  craftingId: number,
  time: number,
  gh: SageGameHandler,
  fh: SageFleetHandler
) => {
  console.log(" ");
  console.log(`Start crafting ${quantity} ${resource}...`);

  let ix = await fh.ixStartCrafting(profilePubkey, starbase, recipe, quantity, numCrew, craftingId);
  if (ix.type !== "Success") {
    throw new Error(ix.type);
  }

  const ixs = ix.ixs;

  const { inputs, outputs } = getRecipeIngredients(recipe);

  let last_ixs = [];
  if (inputs.length > 1) {
    const last_ix = ixs.pop();
    if (last_ix) {
      last_ixs.push(last_ix);
    }
  }

  const tx = await gh.sendDynamicTransactions(ixs, true);
  if (tx.type !== "Success") {
    throw new Error(tx.type)
  }

  if (last_ixs.length > 0) {
    const tx = await gh.sendDynamicTransactions(last_ixs, true);
    if (tx.type !== "Success") {
      throw new Error(tx.type)
    }
  }

  console.log(`Crafting started! Waiting for ${time} seconds...`);
  // gh.getQuattrinoBalance();
  await wait(time);
};
