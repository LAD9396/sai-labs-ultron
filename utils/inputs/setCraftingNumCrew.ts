import inquirer from "inquirer";

export const setCraftingNumCrew = async () => {
  const answer = await inquirer.prompt([
    {
      type: "input",
      name: "numCrew",
      message: "Enter number of crew members (More than 0):",
      validate: (input) => {
        if (parseInt(input) && parseInt(input) > 0) return true;
        return "Please input a valid number.";
      },
    },
  ]);

  const numCrew = parseInt(answer.numCrew);

  return numCrew;
};
