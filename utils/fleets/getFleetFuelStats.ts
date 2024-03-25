import { PublicKey } from "@solana/web3.js";
import { ShipStats } from "@staratlas/sage";
import { SageFleetHandler } from "../../src/SageFleetHandler";
import { SageGameHandler } from "../../src/SageGameHandler";

export const getFleetFuelStats = async (
  fleetPubkey: PublicKey,
  gh: SageGameHandler,
  fh: SageFleetHandler
) => {
  // Get all fleet data
  const fleetAccount = await fh.getFleetAccount(fleetPubkey);
  if (fleetAccount.type !== "Success") return fleetAccount;
  const fleetStats = fleetAccount.fleet.data.stats as ShipStats;

  // Get current loaded fuel
  const fuelMint = gh.getResourceMintAddress("fuel");
  const tokenAccountsFrom = await gh.getParsedTokenAccountsByOwner(
    fleetAccount.fleet.data.fuelTank
  );
  if (tokenAccountsFrom.type !== "Success") return tokenAccountsFrom;
  const tokenAccountFrom = tokenAccountsFrom.tokenAccounts.find(
    (tokenAccount) => tokenAccount.mint.toBase58() === fuelMint.toBase58()
  );
  if (!tokenAccountFrom)
    return { type: "FleetFuelTankTokenAccountNotFound" as const };
  const currentLoadedFuel = tokenAccountFrom.amount;

  return { fleetStats, currentLoadedFuel, type: "Success" };
};
