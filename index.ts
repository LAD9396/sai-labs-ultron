#!/usr/bin/env node

import { version } from "./package.json";
import { cargo } from "./scripts/cargo";
import { mining } from "./scripts/mining";
import { scan } from "./scripts/scan";
import { craft } from "./scripts/craft";
import { SageFleetHandler } from "./src/SageFleetHandler";
import { getConnection } from "./utils/inputs/getConnection";
import { getKeypairFromSecret } from "./utils/inputs/getKeypairFromSecret";
import { inputProfile } from "./utils/inputs/inputProfile";
import { loadGame } from "./utils/inputs/loadGame";
import { resetProfile } from "./utils/inputs/resetProfile";
import { setActivity } from "./utils/inputs/setActivity";
import { setCycles } from "./utils/inputs/setCycles";
import { setCharacter } from "./utils/inputs/setCharacter";
import { setStart } from "./utils/inputs/setStart";
import { setupProfileData } from "./utils/inputs/setupProfileData";
import { setPriority } from "./utils/inputs/setPriority";

const main = async () => {
  console.log(`Welcome to Ultron ${version}!`);

  const { startOption } = await setStart();

  if (startOption === "Settings") {
    await resetProfile();
    return;
  }

  const priorityFees = await setPriority();

  // qui l'utente sceglie il profilo desiderato
  const { profile } = await inputProfile();

  // qui si controlla se il profilo esiste già, se no, lo si crea
  await setupProfileData(profile);

  // qui si impostano il keypair e la connection
  const keypair = await getKeypairFromSecret(profile);

  const connection = getConnection(profile);

  if (connection.type !== "Success") {
    return;
  }

  // qui comincia lo script
  const sageGameHandler = await loadGame(keypair, connection.result, priorityFees.priority);
  const sageFleetHandler = new SageFleetHandler(sageGameHandler);
  /* const profilePubkey = await sageGameHandler.getPlayerProfileAddress(
    keypair.publicKey
  ); */

  const profileAccounts = await sageGameHandler.getPlayerProfileAccounts(
    keypair.publicKey
  );

  const profilePubkey = profileAccounts.length == 1 ? profileAccounts[0].pubkey : await setCharacter(profileAccounts);

  console.log("You're in! Let's go");

  const qttrBalance = await sageGameHandler.getQuattrinoBalance();
  if (qttrBalance.type !== "Success" || qttrBalance.tokenBalance == 0) return;
  console.log(qttrBalance.message)

  /* const fleet = await setFleet(
    sageGameHandler,
    sageFleetHandler,
    profilePubkey
  );
  if (fleet.type !== "Success") return; */

  const activity = await setActivity();

  const cycles = await setCycles();

  switch (activity) {
    case "Mining":
      while (true) {
        const m = await mining(
          profilePubkey,
          sageGameHandler,
          sageFleetHandler,
          cycles
        );
        if (m.type !== "Success") {
          console.log(m.type);
          return;
        }
        break;
      }
      break;
    case "Cargo":
      while (true) {
        const c = await cargo(
          profilePubkey,
          sageGameHandler,
          sageFleetHandler,
          cycles
        );
        if (c.type !== "Success") {
          console.log(c.type);
          return;
        }
        break;
      }
      break;
    case "Scan":
      while (true) {
        const s = await scan(
          profilePubkey,
          sageGameHandler,
          sageFleetHandler,
          cycles
        );
        if (s.type !== "Success") { 
          console.log(s.type)
          return;
        };
        break;
      }
      break;
    case "Craft":
      while (true) {
        const c = await craft(
          profilePubkey,
          sageGameHandler,
          sageFleetHandler,
          cycles
        );
        if (c.type !== "Success") {
          console.log(c.type);
          return;
        }
        break;
      }
      break;
    default:
      return;
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
