import { PublicKey } from "@solana/web3.js";
import { SageFleetHandler } from "../src/SageFleetHandler";
import { SageGameHandler } from "../src/SageGameHandler";
import { wait } from "../utils/actions/wait";

export const scanSdu = async (
  fleetPubkey: PublicKey,
  gh: SageGameHandler,
  fh: SageFleetHandler,
  cooldown: number,
  onlyDataRunner: boolean = false,
) => {
  try {
    console.log(" ");

    let ix = await fh.ixScanForSurveyDataUnits(fleetPubkey, onlyDataRunner);
    
    if (
      ix.type !== "Success" && 
      ix.type !== "CreateSduTokenAccount" &&
      ix.type !== "NoEnoughRepairKits" && 
      ix.type !== "FleetCargoIsFull") {
      throw new Error(ix.type);
    }

    if (ix.type === "NoEnoughRepairKits" || ix.type === "FleetCargoIsFull") {
      console.log(ix.type);
      return ix.type;
    }
    
    switch (ix.type) {
      case "CreateSduTokenAccount": {
        console.log(`Creating SDU token account...`);
        const tx = await gh.sendDynamicTransactions(ix.ixs, false);
        if (tx.type !== "Success") {
          throw new Error(tx.type)
        }
        console.log("SDU token account created!");
        await scanSdu(fleetPubkey, gh, fh, cooldown, onlyDataRunner);
        break;
      }
      case "Success": {
        console.log(`Scanning sector...`);
        const tx = await gh.sendDynamicTransactions(ix.ixs, false);
        if (tx.type !== "Success") {
          throw new Error(tx.type)
        }
        console.log(`Scan completed!`);
        console.log(`Waiting Scan Cooldown for ${cooldown} seconds...`);
        await wait(cooldown);
        // await scanSdu(fleetPubkey, gh, fh, cooldown, onlyDataRunner);
        break;
      }
    }

  } catch (e) {
    throw e;
  }
  
};
