import { sectorCoordinatesLogPrefix, sectorScanMultiplierLogPrefix, sectorScanProbabilityLogPrefix } from "../../common/constants";
import { SageGameHandler } from "../../src/SageGameHandler";

export const getScanResult = async (
  signature: string,
  gh: SageGameHandler,
) => {
  const solanaConnection = gh.provider.connection;
  const transaction = await solanaConnection.getTransaction(
    signature,
    { commitment: "finalized", maxSupportedTransactionVersion: 2 }
  );

  let messages = transaction?.meta?.logMessages?.filter(message => {
    return message.startsWith(sectorCoordinatesLogPrefix) || message.startsWith(sectorScanProbabilityLogPrefix) || message.startsWith(sectorScanMultiplierLogPrefix)
  });

  if (messages && messages.length == 3) {
    const sectorMessage = messages.find(message => message.startsWith(sectorCoordinatesLogPrefix));
    const probabilityMessage = messages.find(message => message.startsWith(sectorScanProbabilityLogPrefix));
    const multiplierMessage = messages.find(message => message.startsWith(sectorScanMultiplierLogPrefix));
    const coordinates = sectorMessage?.replace(sectorCoordinatesLogPrefix, "").replace("[", "").replace("]", "").split(", ");
    const probability = Number(probabilityMessage?.replace(sectorScanProbabilityLogPrefix, ""));
    const multiplier = Number(multiplierMessage?.replace(sectorScanMultiplierLogPrefix, ""));
    if (coordinates && probability) {
      if (multiplier > 0) {
        console.log(`Found SDU in sector [${coordinates[0]}, ${coordinates[1]}] - probability: ${(probability * 100).toFixed(2)}%`);
        return "Success" as const;
      }
    }
  }
  return "NotFoundSDU" as const;
};
