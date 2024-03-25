import inquirer from "inquirer";
import { Resource, ResourceType } from "../../common/resources";

export const setCraftingResource = async () => {
  const resourceAnswer = await inquirer.prompt([
    {
      type: "list",
      name: "resourceToCraft",
      message: "Choose the resource to craft:",
      choices: [
        Resource.Ammo,
        Resource.Copper,
        Resource.CopperWire,
        Resource.CrystalLattice,
        Resource.Electromagnet,
        Resource.Electronics,
        Resource.EnergySubstrate,
        Resource.Food,
        Resource.Framework,
        Resource.Fuel,
        Resource.Graphene,
        Resource.Hydrocarbon,
        Resource.Iron,
        Resource.Magnet,
        Resource.ParticleAccelerator,
        Resource.Polymer,
        Resource.PowerSource,
        Resource.RadiationAbsorber,
        Resource.Steel,
        Resource.StrangeEmitter,
        Resource.SuperConductor,
        Resource.Tool,
      ],
    },
  ]);

  const resourceToCraft = resourceAnswer.resourceToCraft as ResourceType;

  return resourceToCraft;
};
