import inquirer from "inquirer";

export const setCraftingQuantity = async () => {

  const answer = await inquirer.prompt([
    {
      type: "input",
      name: "quantity",
      message: "Enter quantity to craft (More than 0):",
      validate: (input) => {
        if (parseInt(input) && parseInt(input) > 0) return true;
        return "Please input a valid number.";
      },
    },
  ]);

  const quantity = parseInt(answer.quantity);

  return quantity;
};
