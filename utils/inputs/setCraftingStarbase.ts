import inquirer from "inquirer";
import { StarbaseInfo, StarbaseInfoKey } from "../../common/starbases";

export const setCraftingStarbase = async (): Promise<StarbaseInfoKey> => {
  const starbaseChoices = Object.keys(StarbaseInfo);

  const starbaseAnswer = await inquirer.prompt([
    {
      type: "list",
      name: "craftingStarbase",
      message: "Choose the crafting starbase:",
      choices: starbaseChoices.map((item) => ({
        name: item,
        value: item,
      })),
    },
  ]);

  const starbase = starbaseAnswer.craftingStarbase as StarbaseInfoKey;

  return starbase;
};
