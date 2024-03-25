import { Fleet, ShipStats } from "@staratlas/sage";
import { SectorCoordinates } from "../../common/types";

export const canGoAndComeBack = (
  fleetStats: ShipStats,
  currentLoadedFuel: bigint,
  from: SectorCoordinates,
  sectorTo: SectorCoordinates,
  starbaseTo: SectorCoordinates,
  warpToSector: boolean,
  warpToStarbase: boolean,
) => {
  const fuelNeededForSector = calculateFuelBurnWithCoords(
    fleetStats,
    from,
    sectorTo,
    warpToSector
  );
  const fuelNeededForStarbase = calculateFuelBurnWithCoords(
    fleetStats,
    sectorTo,
    starbaseTo,
    warpToStarbase
  );
  return currentLoadedFuel >= Math.ceil(fuelNeededForSector + fuelNeededForStarbase);
};

const calculateFuelBurnWithCoords = (
  fleetStats: ShipStats,
  from: SectorCoordinates,
  to: SectorCoordinates,
  warp: boolean,
) => {
  const fuelNeeded = !warp
    ? Fleet.calculateSubwarpFuelBurnWithCoords(
      fleetStats,
      from,
      to
    )
    : Fleet.calculateWarpFuelBurnWithCoords(
      fleetStats,
      from,
      to
    );
  return fuelNeeded;
};
