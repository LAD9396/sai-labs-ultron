import { BN } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { byteArrayToString } from "@staratlas/data-source";
import { dockToStarbase } from "../actions/dockToStarbase";
import { exitSubwarp } from "../actions/exitSubwarp";
import { exitWarp } from "../actions/exitWarp";
import { loadCargo } from "../actions/loadCargo";
import { loadFuel } from "../actions/loadFuel";
import { scanSdu } from "../actions/scanSdu";
import { subwarpToSector } from "../actions/subwarpToSector";
import { undockFromStarbase } from "../actions/undockFromStarbase";
import { unloadCargo } from "../actions/unloadCargo";
import { warpToSector } from "../actions/warpToSector";
import { MAX_AMOUNT } from "../common/constants";
import { NotificationMessage } from "../common/notifications";
import { Resource } from "../common/resources";
import { SectorCoordinates } from "../common/types";
import { SageFleetHandler } from "../src/SageFleetHandler";
import { SageGameHandler } from "../src/SageGameHandler";
import { actionWrapper } from "../utils/actions/actionWrapper";
import { sendNotification } from "../utils/actions/sendNotification";
import { getBestScanSector } from "../utils/fleets/getBestScanSector";
import { getFleetFuelStats } from "../utils/fleets/getFleetFuelStats";
import { getScanConfig } from "../utils/fleets/getScanConfig";
import { setFleet } from "../utils/inputs/setFleet";
import { setScanInputs } from "../utils/inputs/setScanInputs";
import { canGoAndComeBack } from "../utils/sectors/canGoAndComeBack";
import { generateRoute } from "../utils/sectors/generateRoute";
import { sameCoordinates } from "../utils/sectors/sameCoordinates";

export const scan = async (
  profilePubkey: PublicKey,
  gh: SageGameHandler,
  fh: SageFleetHandler,
  cycles: number
) => {
  // 1. prendere in input tutti i dati necessari per scan SDU
  // - quale flotta vuoi usare
  // - dove vuoi andare
  // - vuoi spostarti in warp o subwarp (calcolare la rotta)
  const fleetResponse = await setFleet(
    gh,
    fh,
    profilePubkey,
  );
  if (fleetResponse.type !== "Success") return fleetResponse;
  const fleet = fleetResponse.fleet;
  const position = fleetResponse.position;

  const fleetShips = await fh.getFleetShipsAccount(fleet.data.fleetShips);

  if (fleetShips.type !== "Success") return fleetShips;

  const fleetShipsData = fleetShips.fleetShips.fleetShips;

  const fleetShipsMint = [];
  let allSuccess = true;

  for (const ship of fleetShipsData) {
    const shipAccount = await fh.getShipAccount(ship.ship);
    if (shipAccount.type !== "Success") {
      allSuccess = false;
      break;
    }
    fleetShipsMint.push(shipAccount.ship.data.mint);
  }
  if (!allSuccess) return { type: "NotAllShipAccountsFetched" as const };

  // console.log("Fleet ships:", fleetShipsMint.map((ship) => ship.toBase58()));

  const filterDataRunner = fleetShipsMint.filter((ship) =>
    !ship.equals(new PublicKey("9czEqEZ4EkRt7N3HWDcw9qqwys3xRRjGdbn8Jhk8Khwj")) &&
    !ship.equals(new PublicKey("RaYfM1RLfxQJWF8RZravTshKj1aHaWBNXF94VWToY9n"))
  );

  const onlyDataRunner = filterDataRunner.length === 0;
  console.log("Is a only data runner fleet?:", onlyDataRunner ? "Yes (auto-computed)" : "No (auto-computed)");

  const {
    searchBehavior,
    sectorTo,
    movementType,
    subMovementType,
  } = await setScanInputs(position);

  // 2. calcolare tutti i dati necessari correlati agli input
  const fleetPubkey = fleet.key;
  const fleetName = byteArrayToString(fleet.data.fleetLabel);

  const scanConfig = await getScanConfig(fleet);

  // 3. avviare l'automazione utilizzando i dati forniti dall'utente
  for (let i = 0; i < cycles; i++) {
    try {
      await actionWrapper(loadFuel, fleetPubkey, MAX_AMOUNT, gh, fh);

      if (!onlyDataRunner) {
        await actionWrapper(
          loadCargo,
          fleetPubkey,
          Resource.Tool,
          MAX_AMOUNT,
          gh,
          fh
        );
      }

      await actionWrapper(undockFromStarbase, fleetPubkey, gh, fh);

      let from = position;
      let scanCount = 0;
      while (true) {
        let scanSector = sectorTo;
        if (searchBehavior == "loop" && sectorTo) {
          const sequenceElement = scanConfig.loopSequence[scanCount % scanConfig.loopSequence.length];
          scanSector = [
            new BN(sequenceElement.x).add(sectorTo[0]),
            new BN(sequenceElement.y).add(sectorTo[1])
          ] as SectorCoordinates;
        }
        if (searchBehavior == "autopilot") {
          const fleetFuelStats = await getFleetFuelStats(fleet.key, gh, fh);
          if (fleetFuelStats.type !== "Success") return fleetFuelStats;
          const fleetStats = fleetFuelStats.fleetStats;
          const currentLoadedFuel = fleetFuelStats.currentLoadedFuel;
          const bestScanSector = await actionWrapper(
            getBestScanSector,
            fleetStats,
            currentLoadedFuel,
            from,
            position,
            (scanCount > 0 ? subMovementType : movementType) == "warp",
            movementType == "warp",
            scanCount > 0,
            gh
          );
          scanSector = bestScanSector;
        }

        if (!scanSector) {
          break;
        }

        if (!sameCoordinates(from, scanSector)) {
          const fleetFuelStats = await getFleetFuelStats(fleet.key, gh, fh);
          if (fleetFuelStats.type !== "Success") return fleetFuelStats;
          const fleetStats = fleetFuelStats.fleetStats;
          const currentLoadedFuel = fleetFuelStats.currentLoadedFuel;
          const fleetCanGoAndComeBack = canGoAndComeBack(
            fleetStats,
            currentLoadedFuel,
            from,
            scanSector,
            position,
            (scanCount > 0 ? subMovementType : movementType) == "warp",
            movementType == "warp",
          );
          if (!fleetCanGoAndComeBack) break;
        }

        if (scanSector && !sameCoordinates(from, scanSector)) {
          let routeScan = await generateRoute(
            fleetPubkey,
            from,
            scanSector,
            (scanCount > 0 ? subMovementType : movementType) == "warp",
            gh,
            fh
          );
          if (routeScan.type !== "Success") return routeScan;

          for (const trip of routeScan.result) {
            if (trip.warp) {
              await actionWrapper(
                warpToSector,
                fleetPubkey,
                trip.from,
                trip.to,
                gh,
                fh,
                true
              );
              await actionWrapper(exitWarp, fleetPubkey, gh, fh);
            }
            if (!trip.warp) {
              await actionWrapper(
                subwarpToSector,
                fleetPubkey,
                trip.from,
                trip.to,
                gh,
                fh
              );
              await actionWrapper(exitSubwarp, fleetPubkey, gh, fh);
            }
          }
        }
        from = scanSector;

        const scanResult = await actionWrapper(
          scanSdu,
          fleetPubkey,
          gh,
          fh,
          scanConfig.scanCoolDown,
          onlyDataRunner
        );
        if (scanResult === "NoEnoughRepairKits" || scanResult === "FleetCargoIsFull") {
          break;
        }
        scanCount++;
      }

      if (!sameCoordinates(from, position)) {
        let routeBack = position
          ? await generateRoute(
            fleetPubkey,
            from,
            position,
            movementType == "warp",
            gh,
            fh
          )
          : { type: "StarbaseNotFound" as const };
        if (routeBack.type !== "Success") return routeBack;

        for (const trip of routeBack.result) {
          if (trip.warp) {
            await actionWrapper(
              warpToSector,
              fleetPubkey,
              trip.from,
              trip.to,
              gh,
              fh,
              true
            );
            await actionWrapper(exitWarp, fleetPubkey, gh, fh);
          }
          if (!trip.warp) {
            await actionWrapper(
              subwarpToSector,
              fleetPubkey,
              trip.from,
              trip.to,
              gh,
              fh
            );
            await actionWrapper(exitSubwarp, fleetPubkey, gh, fh);
          }
        }
      }

      await actionWrapper(dockToStarbase, fleetPubkey, gh, fh);

      if (!onlyDataRunner) {
        await actionWrapper(
          unloadCargo,
          fleetPubkey,
          Resource.Tool,
          MAX_AMOUNT,
          gh,
          fh
        );
      }

      await actionWrapper(
        unloadCargo,
        fleetPubkey,
        Resource.Sdu,
        MAX_AMOUNT,
        gh,
        fh
      );

      await sendNotification(NotificationMessage.SCAN_SUCCESS, fleetName);
    } catch (e) {
      await sendNotification(NotificationMessage.SCAN_ERROR, fleetName);
      break;
    }
  }

  return { type: "Success" as const };
};
