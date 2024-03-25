import { PublicKey } from "@solana/web3.js";
import { SageGameHandler } from "../../src/SageGameHandler";
import { getRecipeIngredients } from "./getRecipeIngredients";

export const getRecipesByResourceMint = async (
  resourceMint: PublicKey,
  gh: SageGameHandler,
) => {
  const activeRecipes = await gh.getActiveRecipeAccounts();
  const recipes = activeRecipes.filter(recipe => {
    const { inputs, outputs } = getRecipeIngredients(recipe);
    return outputs.some(output => output.mint.equals(resourceMint));
  });
  return recipes;
};
