import { BN } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { SectorCoordinates, SectorInfo } from "../../common/types";
import { SageGameHandler } from "../../src/SageGameHandler";
import { actionWrapper } from "../actions/actionWrapper";
import { connectDB, getAllSectorInfos, upsert } from "../database";

const SECTOR_LOG = "Program log: Sector: ";
const PROBABILYTY_LOG = "Program log: SDU probability: ";
const MULTIPLIER_LOG = "Program log: SDU Multiplier: ";

export const getSectorInfo = async (
  gh: SageGameHandler,
) => {
  // const surveyDataUnitTracker = gh.surveyDataUnitTracker as PublicKey;
  // const solanaConnection = gh.provider.connection;
  // const signatures = await solanaConnection.getSignaturesForAddress(
  //   surveyDataUnitTracker,
  //   { limit: 50 },
  //   "finalized"
  // ).then(res => {
  //   return res.map(item => item.signature);
  // });

  // const transactions = await solanaConnection.getTransactions(
  //   signatures,
  //   { commitment: "finalized", maxSupportedTransactionVersion: 2 }
  // );

  // let newSectorInfos: SectorInfo[] = [];
  // transactions.forEach(transaction => {
  //   let messages = transaction?.meta?.logMessages?.filter(message => {
  //     return message.startsWith(SECTOR_LOG) || message.startsWith(PROBABILYTY_LOG) || message.startsWith(MULTIPLIER_LOG)
  //   });
  //   if (messages && messages.length == 3) {
  //     const sectorMessage = messages.find(message => message.startsWith(SECTOR_LOG));
  //     const probabilityMessage = messages.find(message => message.startsWith(PROBABILYTY_LOG));
  //     const multiplierMessage = messages.find(message => message.startsWith(MULTIPLIER_LOG));
  //     const coordinates = sectorMessage?.replace(SECTOR_LOG, "").replace("[", "").replace("]", "").split(", ");
  //     const probability = Number(probabilityMessage?.replace(PROBABILYTY_LOG, ""));
  //     const multiplier = Number(multiplierMessage?.replace(MULTIPLIER_LOG, ""));
  //     if (coordinates && probability && multiplier == 0) {
  //       newSectorInfos.push(
  //         {
  //           coordinates: ([new BN(coordinates[0]), new BN(coordinates[1])] as SectorCoordinates),
  //           sduProbability: probability
  //         } as SectorInfo
  //       );
  //     }
  //   }
  // });

  await actionWrapper(connectDB);
  // try {
  //   newSectorInfos.forEach(async newSectorInfo => {
  //     await upsert(newSectorInfo.coordinates[0], newSectorInfo.coordinates[1], newSectorInfo.sduProbability.toString());
  //   });
  // } catch (e) {
  //   console.log("Error updating DB with new sector infos");
  // }
  const sectorInfos = await actionWrapper(getAllSectorInfos);
  console.log(`Found ${sectorInfos.length} sectors to scan`);
  return sectorInfos;
};
