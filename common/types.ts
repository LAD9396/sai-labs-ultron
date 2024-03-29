import { BN } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { Fleet, Starbase } from "@staratlas/sage";
import { Profile } from "./constants";
import { ResourceType } from "./resources";
import { StarbaseInfoKey } from "./starbases";

export type LabsAction<R, A extends any[]> = (...args: A) => Promise<R>;

export type FleetScan = {
  name: string;
  x: number;
  y: number;
  time: number;
  scanCooldown: number;
};

export type FleetData = {
  fleetName: string;
  fleetPubkey: PublicKey;
  fleetAccount: Fleet;
  currentSector?: SectorCoordinates;
};

export type FleetDataWithSector = {
  fleetName: string;
  fleetPubkey: PublicKey;
  fleetAccount: Fleet;
  currentSector: SectorCoordinates;
};

export type StarbaseData = {
  starbasePubkey: PublicKey;
  starbaseAccount: Starbase;
};

export type InputResourcesForCargo = {
  resource: ResourceType;
  amount: number;
};

export type SectorCoordinates = [BN, BN];

export type StarbaseResourceToMine = {
  starbase: StarbaseInfoKey;
  resourceToMine: ResourceType;
};

export type FleetState = {
  MoveSubwarp: "subwarp";
  MoveWarp: "warp";
};

export type EncryptedData = {
  iv: string;
  salt: string;
  content: string;
  tag: string;
};

export type RpcPath = Record<Profile, string>;

export type KeypairPath = Record<Profile, string>;

export type RouteStep = {
  from: SectorCoordinates;
  to: SectorCoordinates;
  warp: boolean;
};

export type SectorInfo = {
  coordinates: SectorCoordinates;
  sduProbability: number;
}

export type TransactionResult = {
  type: string;
  txSignature: string[];
}
