import inquirer from "inquirer";
import { SageGameHandler } from "../../src/SageGameHandler";
import { getRecipeIngredients } from "../crafting/getRecipeIngredients";
import { getRecipesByResourceMint } from "../crafting/getRecipesByResourceMint";

export const setCraftingRecipe = async (
  resource: string,
  gh: SageGameHandler,
) => {
  const resourceMint = gh.getResourceMintAddress(resource);
  const recipes = await getRecipesByResourceMint(resourceMint, gh);

  let choices = [];
  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i];
    const { inputs, outputs } = getRecipeIngredients(recipe);
    const inputsText = inputs.map(input => {
      return `${input.amount} ${gh.getResourceNameByMint(input.mint)}`
    }).join(", ");
    const outputsText = outputs.map(output => {
      return `${output.amount} ${gh.getResourceNameByMint(output.mint)}`
    }).join(", ");
    const choice = `${i + 1}) inputs: ${inputsText} => output: ${outputsText}`;
    choices.push(choice);
  }

  const resourceAnswer = await inquirer.prompt([
    {
      type: "list",
      name: "recipe",
      message: "Choose the recipe:",
      choices: choices,
    },
  ]);

  const recipeString = resourceAnswer.recipe as string;
  const selectedRecipe = recipes[Number(recipeString.charAt(0)) - 1];

  return selectedRecipe;
};
