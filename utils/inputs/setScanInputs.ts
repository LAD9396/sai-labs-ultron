import { SectorCoordinates } from "../../common/types";
import { sameCoordinates } from "../sectors/sameCoordinates";
import { setCoordinates } from "./setCoordinates";
import { setMovementType } from "./setMovementType";
import { setSearchBehavior } from "./setSearchBehavior";
import { setSubMovementType } from "./setSubMovementType";

export const setScanInputs = async (position: SectorCoordinates) => {

  const searchBehavior = await setSearchBehavior();

  if (searchBehavior == "autopilot") {
    return {
      searchBehavior,
      undefined,
      movementType: "subwarp",
      subMovementType: "subwarp",
    };
  }

  const coords = await setCoordinates();

  const movementType = !sameCoordinates(position, coords)
    ? await setMovementType()
    : "";

  const subMovementType = searchBehavior !== "static"
    ? await setSubMovementType()
    : "";

  return {
    searchBehavior,
    sectorTo: coords,
    movementType,
    subMovementType,
  };
};
