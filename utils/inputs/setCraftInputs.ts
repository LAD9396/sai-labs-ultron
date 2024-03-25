import { StarbaseInfo } from "../../common/starbases";
import { SageGameHandler } from "../../src/SageGameHandler";
import { setCraftingConfirm } from "./setCraftingConfirm";
import { setCraftingNumCrew } from "./setCraftingNumCrew";
import { setCraftingQuantity } from "./setCraftingQuantity";
import { setCraftingRecipe } from "./setCraftingRecipe";
import { setCraftingResource } from "./setCraftingResource";
import { setCraftingStarbase } from "./setCraftingStarbase";

export const setCraftInputs = async (
  gh: SageGameHandler,
) => {

  const starbaseName = await setCraftingStarbase();

  const resource = await setCraftingResource();

  const recipe = await setCraftingRecipe(resource, gh);

  const quantity = await setCraftingQuantity();

  const numCrew = await setCraftingNumCrew();

  const duration = Math.ceil((quantity / numCrew) * recipe.data.duration);

  const confirm = await setCraftingConfirm(resource, quantity, numCrew, duration);

  return {
    starbase: StarbaseInfo[starbaseName].coords,
    resource,
    recipe,
    quantity,
    numCrew,
    duration,
    confirm,
  };
};
