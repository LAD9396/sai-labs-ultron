import { Recipe, RecipeInputsOutputs } from "@staratlas/crafting";

export const getRecipeIngredients = (
  recipe: Recipe,
) => {
  const ingredients = recipe.ingredientInputsOutputs;
  let inputs: RecipeInputsOutputs[] = [];
  let outputs: RecipeInputsOutputs[] = [];
  for (let i = 0; i < ingredients.length; i++) {
    const ingredient = ingredients[i];
    if (i < (ingredients.length - recipe.data.outputsCount)) {
      inputs.push(ingredient);
    } else {
      outputs.push(ingredient);
    }
  }
  return { inputs, outputs };
};
