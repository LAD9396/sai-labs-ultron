import inquirer from "inquirer";

export const setSearchBehavior = async (): Promise<string> => {
  const searchBehaviors = [
    {
      name: "Static",
      value: "static",
    },
    {
      name: "Loop",
      value: "loop",
    },
    {
      name: "Autopilot",
      value: "autopilot",
    },
  ];

  const answer = await inquirer.prompt([
    {
      type: "list",
      name: "searchBehavior",
      message: "Choose the fleet search behavior:",
      choices: searchBehaviors,
    },
  ]);

  const searchBehavior = answer.searchBehavior;

  return searchBehavior;
};
