import { Fleet, ShipStats } from "@staratlas/sage";

export const getScanConfig = async (
  fleet: Fleet,
) => {
  const fleetStats = fleet.data.stats as ShipStats;
  const miscStats = fleetStats.miscStats;

  const scanCoolDown = miscStats.scanCoolDown;

  const loopSequence = [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 1 },
    { x: -1, y: 0 },
    { x: -1, y: -1 },
    { x: 0, y: -1 },
    { x: 1, y: -1 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
  ]

  return { type: "Success" as const, scanCoolDown, loopSequence };
};
