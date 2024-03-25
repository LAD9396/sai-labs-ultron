import inquirer from "inquirer";

export const setCraftingConfirm = async (
  resource: string,
  quantity: number,
  numCrew: number,
  duration: number,
) => {
  const answer = await inquirer.prompt([
    {
      type: "list",
      name: "confirm",
      message: `Are you sure to craft ${quantity} ${resource} using ${numCrew} crew members in ${duration} seconds?`,
      choices: ["Yes", "No"],
    },
  ]);

  const confirm = answer.confirm as string;

  return confirm;
};
