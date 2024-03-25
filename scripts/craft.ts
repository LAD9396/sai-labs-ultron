import { PublicKey } from "@solana/web3.js";
import { claimCrafting } from "../actions/claimCrafting";
import { startCrafting } from "../actions/startCrafting";
import { NotificationMessage } from "../common/notifications";
import { SageFleetHandler } from "../src/SageFleetHandler";
import { SageGameHandler } from "../src/SageGameHandler";
import { actionWrapper } from "../utils/actions/actionWrapper";
import { sendNotification } from "../utils/actions/sendNotification";
import { setCraftInputs } from "../utils/inputs/setCraftInputs";

export const craft = async (
  profilePubkey: PublicKey,
  gh: SageGameHandler,
  fh: SageFleetHandler,
  cycles: number
) => {
  // 1. prendere in input tutti i dati necessari per craft
  // - in quale starbase vuoi craftare
  // - quale risorsa vuoi craftare
  // - quantità da craftare
  // - numero di elementi della crew
  const {
    starbase,
    resource,
    recipe,
    quantity,
    numCrew,
    duration,
    confirm,
  } = await setCraftInputs(gh);

  if (confirm == "No") return { type: "CraftingProcessNotConfirmed" as const };

  // 2. calcolare tutti i dati necessari correlati agli input
  const craftingId = Math.floor(Math.random() * 999999999);

  // 3. avviare l'automazione utilizzando i dati forniti dall'utente
  for (let i = 0; i < cycles; i++) {
    try {

      await actionWrapper(
        startCrafting,
        profilePubkey,
        starbase,
        resource,
        recipe,
        quantity,
        numCrew,
        craftingId,
        duration,
        gh,
        fh
      );

      await actionWrapper(
        claimCrafting,
        profilePubkey,
        starbase,
        resource,
        recipe,
        quantity,
        craftingId,
        gh,
        fh
      );

      await sendNotification(NotificationMessage.CRAFT_SUCCESS);
    } catch (e) {
      await sendNotification(NotificationMessage.CRAFT_ERROR);
      break;
    }
  }

  return { type: "Success" as const };
};
