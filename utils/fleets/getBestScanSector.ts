import { ShipStats } from "@staratlas/sage";
import { SectorCoordinates } from "../../common/types";
import { SageGameHandler } from "../../src/SageGameHandler";
import { calcSectorsDistanceByCoords } from "../sectors/calcSectorsDistanceByCoords";
import { canGoAndComeBack } from "../sectors/canGoAndComeBack";
import { getSectorInfo } from "../sectors/getSectorInfo";

export const getBestScanSector = async (
  fleetStats: ShipStats,
  currentLoadedFuel: bigint,
  position: SectorCoordinates,
  starbaseTo: SectorCoordinates,
  warpToSector: boolean,
  warpToStarbase: boolean,
  reducedRange: boolean,
  gh: SageGameHandler,
) => {
  const sectorInfos = await getSectorInfo(gh);

  const inRangeSectors = sectorInfos.filter(sectorInfo => {
    return canGoAndComeBack(
      fleetStats,
      currentLoadedFuel,
      position,
      sectorInfo.coordinates,
      starbaseTo,
      warpToSector,
      warpToStarbase
    )
  });
  const inReducedRangeSectors = inRangeSectors.filter(sectorInfo => {
    const distances = calcSectorsDistanceByCoords(
      position,
      sectorInfo.coordinates
    );
    const distanceX = distances[0];
    const distanceY = distances[1];
    return distanceX.abs().toNumber() <= 2 && distanceY.abs().toNumber() <= 2;
  });
  if ((reducedRange ? inReducedRangeSectors : inRangeSectors).length == 0) {
    return;
  }
  const bestScanSector = (reducedRange ? inReducedRangeSectors : inRangeSectors).reduce((bestSectorInfo, sectorInfo) => {
    return bestSectorInfo.sduProbability > sectorInfo.sduProbability ? bestSectorInfo : sectorInfo
  });
  console.log(`Selected sector [${bestScanSector.coordinates[0]}, ${bestScanSector.coordinates[1]}] - probability: ${(bestScanSector.sduProbability * 100).toFixed(2)}%`);
  return bestScanSector.coordinates;
};
