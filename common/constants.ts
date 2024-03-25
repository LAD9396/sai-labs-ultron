import { PublicKey } from "@solana/web3.js";
import { homedir } from "os";
import path from "path";
import { KeypairPath, RpcPath } from "./types";

export const MAX_AMOUNT = 999_999_999;

export const quattrinoTokenPubkey = new PublicKey(
  "qtr6BUeMKtt65HdYxXm75fLZ19184w4Yh4ZaPp4Ppks"
);

export const startOptions = ["Start", "Settings"];

export const resetOptions = [
  "Reset Profile 1 - Keypair",
  "Reset Profile 1 - RPC",
  "Reset Profile 2 - Keypair",
  "Reset Profile 2 - RPC",
  "Reset Profile 3 - Keypair",
  "Reset Profile 3 - RPC",
];

export const profiles = ["Profile 1", "Profile 2", "Profile 3"] as const;

export type Profile = (typeof profiles)[number];

export const activites = ["Mining", "Cargo", "Scan", "Craft"];

export const priority = ["None", "Basic", "Low", "Default", "Medium", "High"];

export const configDir1 = path.join(homedir(), ".ultronConfig1");
export const configDir2 = path.join(homedir(), ".ultronConfig2");
export const configDir3 = path.join(homedir(), ".ultronConfig3");

const rpcPath = (configDir: string) => path.join(configDir, "rpc.txt");

export const rpcPaths: RpcPath = {
  "Profile 1": rpcPath(configDir1),
  "Profile 2": rpcPath(configDir2),
  "Profile 3": rpcPath(configDir3),
};

const keypairPath = (configDir: string) => path.join(configDir, "keypair.json");

export const keypairPaths: KeypairPath = {
  "Profile 1": keypairPath(configDir1),
  "Profile 2": keypairPath(configDir2),
  "Profile 3": keypairPath(configDir3),
};

export const verifiedRpc = [
  "rpc.hellomoon.io",
  "solana-mainnet.g.alchemy.com",
  "mainnet.helius-rpc.com",
  "rpc.ironforge.network"
];

export const heliusFeeUrl = "https://n8n.lorenzodelia.com/webhook/f9636f10-e082-49ab-af39-d27fa9051c08"
