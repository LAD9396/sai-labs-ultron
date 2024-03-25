import { Provider, AnchorProvider, Program, Wallet, BN } from "@staratlas/anchor";
import {
  Account as TokenAccount,
  createBurnInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  TransactionSignature,
} from "@solana/web3.js";
import bs58 from "bs58";

import { CARGO_IDL, CargoIDLProgram, CargoType } from "@staratlas/cargo";
import {
  CRAFTING_IDL,
  CraftableItem,
  CraftingFacility,
  CraftingIDLProgram,
  CraftingProcess,
  Recipe,
  RecipeStatus,
} from "@staratlas/crafting";
import {
  AsyncSigner,
  InstructionReturn,
  buildDynamicTransactions,
  keypairToAsyncSigner,
  readAllFromRPC,
  readFromRPCOrError,
  sendTransaction,
  stringToByteArray,
  getParsedTokenAccountsByOwner
} from "@staratlas/data-source";
import {
  PLAYER_PROFILE_IDL,
  PlayerProfile,
  PlayerProfileIDL,
} from "@staratlas/player-profile";
import {
  PROFILE_FACTION_IDL,
  ProfileFactionAccount,
  ProfileFactionIDL,
} from "@staratlas/profile-faction";
import {
  CraftingInstance,
  Fleet,
  Game,
  GameState,
  MineItem,
  PlanetType,
  Resource,
  SAGE_IDL,
  SageIDLProgram,
  SagePlayerProfile,
  Sector,
  Starbase,
  StarbasePlayer,
  getCargoPodsByAuthority,
} from "@staratlas/sage";
import { quattrinoTokenPubkey } from "../common/constants";
import { SectorCoordinates } from "../common/types";
import { getPriorityFeeEstimate } from "../utils/fees/getPriorityFeeEstimate";

const findGame = async (provider: AnchorProvider) => {
  const program = await sageProgram(provider);
  const game = await program.account.game.all();

  return game;
};

const findAllPlanets = async (provider: AnchorProvider) => {
  const program = await sageProgram(provider);
  const planets = await program.account.planet.all([
    // {
    //     memcmp: {
    //         offset: 9,
    //         bytes: bs58.encode(Buffer.from('UST-1-3')),
    //     },
    // },
  ]);

  return planets;
};

const findAllSurveyDataUnitTracker = async (provider: AnchorProvider) => {
  const program = await sageProgram(provider);
  const surveyDataUnitTracker = await program.account.surveyDataUnitTracker.all();

  return surveyDataUnitTracker;
};

export const sageProgram = async (provider: AnchorProvider) => {
  return new Program(
    SAGE_IDL,
    new PublicKey(SageGameHandler.SAGE_PROGRAM_ID),
    provider
  );
};

export const craftingProgram = async (provider: AnchorProvider) => {
  return new Program(
    CRAFTING_IDL,
    new PublicKey(SageGameHandler.CRAFTING_PROGRAM_ID),
    provider
  );
};

interface SagePlanetAddresses {
  [key: string]: PublicKey;
}

interface SageResourcesMints {
  [key: string]: PublicKey;
}

export class SageGameHandler {
  // https://build.staratlas.com/dev-resources/mainnet-program-ids
  static readonly SAGE_PROGRAM_ID =
    "SAGEqqFewepDHH6hMDcmWy7yjHPpyKLDnRXKb3Ki8e6";
  static readonly CARGO_PROGRAM_ID =
    "Cargo8a1e6NkGyrjy4BQEW4ASGKs9KSyDyUrXMfpJoiH";
  static readonly PLAYER_PROFILE_PROGRAM_ID =
    "pprofELXjL5Kck7Jn5hCpwAL82DpTkSYBENzahVtbc9";
  static readonly PROFILE_FACTION_PROGRAM_ID =
    "pFACSRuobDmvfMKq1bAzwj27t6d2GJhSCHb1VcfnRmq";
  static readonly CRAFTING_PROGRAM_ID =
    "Craftf1EGzEoPFJ1rpaTSQG1F6hhRRBAf4gRo9hdSZjR";

  static readonly SAGE_RESOURCES_MINTS: SageResourcesMints = {
    food: new PublicKey("foodQJAztMzX1DKpLaiounNe2BDMds5RNuPC6jsNrDG"),
    ammo: new PublicKey("ammoK8AkX2wnebQb35cDAZtTkvsXQbi82cGeTnUvvfK"),
    fuel: new PublicKey("fueL3hBZjLLLJHiFH9cqZoozTG3XQZ53diwFPwbzNim"),
    tool: new PublicKey("tooLsNYLiVqzg8o4m3L2Uetbn62mvMWRqkog6PQeYKL"),
    arco: new PublicKey("ARCoQ9dndpg6wE2rRexzfwgJR3NoWWhpcww3xQcQLukg"),
    biomass: new PublicKey("MASS9GqtJz6ABisAxcUn3FeR4phMqH1XfG6LPKJePog"),
    carbon: new PublicKey("CARBWKWvxEuMcq3MqCxYfi7UoFVpL9c4rsQS99tw6i4X"),
    diamond: new PublicKey("DMNDKqygEN3WXKVrAD4ofkYBc4CKNRhFUbXP4VK7a944"),
    hydrogen: new PublicKey("HYDR4EPHJcDPcaLYUcNCtrXUdt1PnaN4MvE655pevBYp"),
    iron_ore: new PublicKey("FeorejFjRRAfusN9Fg3WjEZ1dRCf74o6xwT5vDt3R34J"),
    copper_ore: new PublicKey("CUore1tNkiubxSwDEtLc3Ybs1xfWLs8uGjyydUYZ25xc"),
    lumanite: new PublicKey("LUMACqD5LaKjs1AeuJYToybasTXoYQ7YkxJEc4jowNj"),
    rochinol: new PublicKey("RCH1Zhg4zcSSQK8rw2s6rDMVsgBEWa4kiv1oLFndrN5"),
    sdu: new PublicKey("SDUsgfSZaDhhZ76U3ZgvtFiXsfnHbf2VrzYxjBZ5YbM"),
    energy_substrate: new PublicKey("SUBSVX9LYiPrzHeg2bZrqFSDSKkrQkiCesr6SjtdHaX"),
    electromagnet: new PublicKey("EMAGoQSP89CJV5focVjrpEuE4CeqJ4k1DouQW7gUu7yX"),
    framework: new PublicKey("FMWKb7YJA5upZHbu5FjVRRoxdDw2FYFAu284VqUGF9C2"),
    power_source: new PublicKey("PoWRYJnw3YDSyXgNtN3mQ3TKUMoUSsLAbvE8Ejade3u"),
    particle_accelerator: new PublicKey("PTCLSWbwZ3mqZqHAporphY2ofio8acsastaHfoP87Dc"),
    radiation_absorber: new PublicKey("RABSXX6RcqJ1L5qsGY64j91pmbQVbsYRQuw1mmxhxFe"),
    super_conductor: new PublicKey("CoNDDRCNxXAMGscCdejioDzb6XKxSzonbWb36wzSgp5T"),
    strange_emitter: new PublicKey("EMiTWSLgjDVkBbLFaMcGU6QqFWzX9JX6kqs1UtUjsmJA"),
    crystal_lattice: new PublicKey("CRYSNnUd7cZvVfrEVtVNKmXiCPYdZ1S5pM5qG2FDVZHF"),
    copper_wire: new PublicKey("cwirGHLB2heKjCeTy4Mbp4M443fU4V7vy2JouvYbZna"),
    copper: new PublicKey("CPPRam7wKuBkYzN5zCffgNU17RKaeMEns4ZD83BqBVNR"),
    electronics: new PublicKey("ELECrjC8m9GxCqcm4XCNpFvkS8fHStAvymS6MJbe3XLZ"),
    graphene: new PublicKey("GRAPHKGoKtXtdPBx17h6fWopdT5tLjfAP8cDJ1SvvDn4"),
    hydrocarbon: new PublicKey("HYCBuSWCJ5ZEyANexU94y1BaBPtAX2kzBgGD2vES2t6M"),
    iron: new PublicKey("ironxrUhTEaBiR9Pgp6hy4qWx6V2FirDoXhsFP25GFP"),
    magnet: new PublicKey("MAGNMDeDJLvGAnriBvzWruZHfXNwWHhxnoNF75AQYM5"),
    polymer: new PublicKey("PoLYs2hbRt5iDibrkPT9e6xWuhSS45yZji5ChgJBvcB"),
    steel: new PublicKey("STEELXLJ8nfJy3P4aNuGxyNRbWPohqHSwxY75NsJRGG"),
  };

  ready: Promise<string>;

  program: SageIDLProgram;
  playerProfileProgram: Program<PlayerProfileIDL>;
  profileFactionProgram: Program<ProfileFactionIDL>;
  cargoProgram: CargoIDLProgram;
  craftingProgram: CraftingIDLProgram;

  connection: Connection;
  provider: AnchorProvider;
  priority: string;

  funder: AsyncSigner;
  gameId?: PublicKey;
  gameState?: PublicKey;
  cargoStatsDefinition?: PublicKey;
  cargoStatsDefinitionSeqId?: number;
  craftingDomain?: PublicKey;
  mints?: { [key: string]: PublicKey };

  game?: Game;
  planetLookup?: SagePlanetAddresses;
  surveyDataUnitTracker?: PublicKey;
  surveyDataUnitTrackerAccountSigner?: PublicKey;

  constructor(funder: Keypair, connection: Connection, priority: string) {
    this.connection = connection;
    this.provider = new AnchorProvider(
      connection,
      new Wallet(funder),
      AnchorProvider.defaultOptions()
    );
    this.priority = priority;

    this.program = new Program(
      SAGE_IDL,
      new PublicKey(SageGameHandler.SAGE_PROGRAM_ID),
      this.provider
    );
    this.cargoProgram = new Program(
      CARGO_IDL,
      new PublicKey(SageGameHandler.CARGO_PROGRAM_ID),
      this.provider
    );
    this.playerProfileProgram = new Program(
      PLAYER_PROFILE_IDL,
      new PublicKey(SageGameHandler.PLAYER_PROFILE_PROGRAM_ID),
      this.provider
    );
    this.profileFactionProgram = new Program(
      PROFILE_FACTION_IDL,
      new PublicKey(SageGameHandler.PROFILE_FACTION_PROGRAM_ID),
      this.provider
    );
    this.craftingProgram = new Program(
      CRAFTING_IDL,
      new PublicKey(SageGameHandler.CRAFTING_PROGRAM_ID),
      this.provider
    );

    this.funder = keypairToAsyncSigner(funder);

    this.ready = Promise.all([
      findGame(this.provider),
      findAllPlanets(this.provider),
      findAllSurveyDataUnitTracker(this.provider),
    ]).then((result) => {
      const [game] = result[0];
      const planets = result[1];
      const [sduTracker] = result[2];

      this.gameId = game.publicKey;
      this.gameState = game.account.gameState;
      this.cargoStatsDefinition = game.account.cargo.statsDefinition;
      this.cargoStatsDefinitionSeqId = 1;
      this.craftingDomain = game.account.crafting.domain;
      this.mints = game.account.mints;

      this.planetLookup = planets.reduce((lookup, planetAccount) => {
        const pubkey = planetAccount.publicKey;
        const planet = planetAccount.account;

        if (planet.planetType === PlanetType.AsteroidBelt) {
          const sector = planet.sector.toString();
          lookup[sector] = pubkey;
        }

        return lookup;
      }, {} as SagePlanetAddresses);

      this.surveyDataUnitTracker = sduTracker.publicKey;
      this.surveyDataUnitTrackerAccountSigner = sduTracker.account.signer;

      return Promise.resolve("ready");
    });
  }

  async getPlanetAccount(planetName: string) {
    const program = await sageProgram(this.provider);

    const [planet] = await program.account.planet.all([
      {
        memcmp: {
          offset: 9,
          bytes: bs58.encode(Buffer.from(planetName)),
        },
      },
    ]);

    return planet;
  }

  async getPlayerProfileAccounts(playerPubkey: PublicKey) {
    const accountInfo = await this.connection.getProgramAccounts(
      new PublicKey(SageGameHandler.PLAYER_PROFILE_PROGRAM_ID),
      {
        filters: [
          {
            memcmp: {
              offset: 30,
              bytes: playerPubkey.toBase58(),
            },
          },
        ],
      }
    );

    return accountInfo;
  }

  async getPlayerProfileAccount(
    playerProfilePubkey: PublicKey
  ): Promise<PlayerProfile> {
    const playerProfile = readFromRPCOrError(
      this.provider.connection,
      this.playerProfileProgram,
      playerProfilePubkey,
      PlayerProfile,
      "confirmed"
    );

    return playerProfile;
  }

  async findAllFleetsByPlayerProfile(playerProfile: PublicKey) {
    const program = await sageProgram(this.provider);

    /* const fleets = await program.account.fleet.all([
      {
        memcmp: {
          offset: 41,
          bytes: playerProfile.toBase58(),
        },
      },
    ]); */

    const fetchFleets = await readAllFromRPC(
      this.connection,
      program,
      Fleet,
      "confirmed",
      [
        {
          memcmp: {
            offset: 41,
            bytes: playerProfile.toBase58(),
          },
        },
      ]
    );

    const fleets = fetchFleets.flatMap((fleet) =>
      fleet.type === "ok" ? [fleet.data] : []
    );

    return fleets;
  }

  getCargoTypeAddress(mint: PublicKey) {
    if (!this.cargoStatsDefinition || !this.cargoStatsDefinitionSeqId) {
      throw Error("this.cargoStatsDefinition not set (or missing SeqId)");
    }

    const [cargoType] = CargoType.findAddress(
      this.cargoProgram,
      this.cargoStatsDefinition,
      mint,
      this.cargoStatsDefinitionSeqId
    );

    return cargoType;
  }

  getFleetAddress(playerProfile: PublicKey, fleetName: string) {
    if (!this.gameId) {
      throw Error("this.gameId not set");
    }

    const fleetLabel = stringToByteArray(fleetName, 32);
    const [fleet] = Fleet.findAddress(
      this.program,
      this.gameId,
      playerProfile,
      fleetLabel
    );

    return fleet;
  }

  getMineItemAddress(mint: PublicKey) {
    if (!this.gameId) {
      throw Error("this.gameId not set");
    }

    const [mineItem] = MineItem.findAddress(this.program, this.gameId, mint);

    return mineItem;
  }

  getPlanetAddress(coordinates: SectorCoordinates) {
    if (!this.planetLookup) {
      throw Error("this.planetLookup not set");
    }

    return this.planetLookup[coordinates.toString()];
  }

  getResrouceAddress(mineItem: PublicKey, planet: PublicKey) {
    const [resource] = Resource.findAddress(this.program, mineItem, planet);

    return resource;
  }

  getResourceMintAddress(resource: string) {
    return SageGameHandler.SAGE_RESOURCES_MINTS[resource];
  }

  getResourceNameByMint(mint: PublicKey) {
    const resourceKeys = Object.keys(SageGameHandler.SAGE_RESOURCES_MINTS);
    return resourceKeys.find(resourceKey => {
      return SageGameHandler.SAGE_RESOURCES_MINTS[resourceKey].equals(mint);
    });
  }

  getSectorAddress(coordinates: [BN, BN]) {
    if (!this.gameId) {
      throw Error("this.gameId not set");
    }

    const [sector] = Sector.findAddress(this.program, this.gameId, coordinates);

    return sector;
  }

  getStarbaseAddress(coordinates: [BN, BN]) {
    if (!this.gameId) {
      throw Error("this.gameId not set");
    }

    const [starbase] = Starbase.findAddress(
      this.program,
      this.gameId,
      coordinates
    );

    return starbase;
  }

  getStarbasePlayerAddress(
    starbase: PublicKey,
    sagePlayerProfile: PublicKey,
    starbaseSeqId: number
  ) {
    if (!this.gameId) {
      throw Error("this.gameId not set");
    }

    const [starbasePlayer] = StarbasePlayer.findAddress(
      this.program,
      starbase,
      sagePlayerProfile,
      starbaseSeqId
    );

    return starbasePlayer;
  }

  async getStarbasePlayerAccount(starbasePlayerPubkey: PublicKey) {
    try {
      const starbasePlayer = await readFromRPCOrError(
        this.provider.connection,
        this.program,
        starbasePlayerPubkey,
        StarbasePlayer,
        "confirmed"
      );
      return { type: "Success" as const, starbasePlayer };
    } catch (e) {
      return { type: "StarbasePlayerNotFound" as const };
    }
  }

  async getCargoPodsByAuthority(authority: PublicKey) {
    try {
      const fetchCargoPods = await getCargoPodsByAuthority(
        this.provider.connection,
        this.cargoProgram,
        authority
      );

      const cargoPods = fetchCargoPods.flatMap((pod) =>
        pod.type === "ok" ? [pod.data] : []
      );

      if (cargoPods.length == 0) return { type: "CargoPodsNotFound" as const };

      return { type: "Success" as const, cargoPods };
    } catch (e) {
      return { type: "CargoPodsNotFound" as const };
    }
  }

  /* async getOrCreateAssociatedTokenAccount(mint: PublicKey, owner: PublicKey) {
    const { address, instructions } = await getOrCreateAssociatedTokenAccount(
      this.provider.connection,
      mint,
      owner,
      true
    );

    return { address, instructions };
  } */

  getSagePlayerProfileAddress(playerProfile: PublicKey) {
    if (!this.gameId) {
      throw Error("this.gameId not set");
    }

    const [sagePlayerProfile] = SagePlayerProfile.findAddress(
      this.program,
      playerProfile,
      this.gameId
    );

    return sagePlayerProfile;
  }

  getProfileFactionAddress(playerProfile: PublicKey) {
    const [profileFaction] = ProfileFactionAccount.findAddress(
      this.profileFactionProgram,
      playerProfile
    );

    return profileFaction;
  }

  async getCraftingFacilityAccount(craftingFacilityPubkey: PublicKey) {
    const program = await craftingProgram(this.provider);
    const craftingFacilityAccount = await readFromRPCOrError(
      this.connection,
      program,
      craftingFacilityPubkey,
      CraftingFacility,
      'processed'
    );
    return craftingFacilityAccount;
  }

  async getCraftableItemAccount(craftableItemPubkey: PublicKey) {
    const program = await craftingProgram(this.provider);
    const craftableItemAccount = await readFromRPCOrError(
      this.connection,
      program,
      craftableItemPubkey,
      CraftableItem,
      'processed'
    );
    return craftableItemAccount;
  }

  async getActiveRecipeAccounts() {
    const program = await craftingProgram(this.provider);
    const recipeAccounts = await readAllFromRPC(
      this.connection,
      program,
      Recipe,
      'processed'
    );
    const recipes = recipeAccounts.flatMap((recipe) =>
      recipe.type === "ok" ? [recipe.data] : []
    );
    return recipes.filter((recipe) => recipe.data.status === RecipeStatus.Active);
  }

  getCraftingProcessAddress(craftingFacilityPubkey: PublicKey, craftingRecipePubkey: PublicKey, craftingId: BN) {
    const [craftingProcess] = CraftingProcess.findAddress(
      this.craftingProgram,
      craftingFacilityPubkey,
      craftingRecipePubkey,
      craftingId,
    );
    return craftingProcess;
  }

  getCraftingInstanceAddress(starbasePlayerPubkey: PublicKey, craftingProcessPubkey: PublicKey) {
    const [craftingInstance] = CraftingInstance.findAddress(
      this.program,
      starbasePlayerPubkey,
      craftingProcessPubkey,
    );
    return craftingInstance;
  }

  getCraftableItemAddress(craftingDomainPubkey: PublicKey, mint: PublicKey) {
    const [craftableItem] = CraftableItem.findAddress(
      this.craftingProgram,
      craftingDomainPubkey,
      mint,
    );
    return craftableItem;
  }

  async loadPlayerProfileFleets(playerProfile: PublicKey) {
    if (!this.gameId) {
      throw Error("this.gameId not set");
    }

    const program = await sageProgram(this.provider);
    const fleets = await program.account.fleet.all([
      {
        memcmp: {
          offset: 41,
          bytes: playerProfile.toBase58(),
        },
      },
    ]);

    return fleets;
  }

  async loadGame() {
    if (!this.gameId) {
      throw Error("this.gameId not set");
    }

    this.game = await readFromRPCOrError(
      this.connection,
      this.program,
      this.gameId,
      Game,
      "confirmed"
    );

    return this.game;
  }

  async loadGameState() {
    if (!this.gameState) {
      throw Error("this.gameState not set");
    }
    return await readFromRPCOrError(
      this.connection,
      this.program,
      this.gameState,
      GameState,
      "confirmed"
    );
  }

  async getParsedTokenAccountsByOwner(owner: PublicKey) {
    try {
      const tokenAccounts = (await getParsedTokenAccountsByOwner(
        this.connection,
        owner
      )) as TokenAccount[];
      return { type: "Success" as const, tokenAccounts };
    } catch (e) {
      return { type: "TokenAccountsNotFound" as const };
    }
  }

  ixBurnQuattrinoToken() {
    const fromATA = getAssociatedTokenAddressSync(
      quattrinoTokenPubkey,
      this.funder.publicKey()
    );

    const ix = createBurnInstruction(
      fromATA,
      quattrinoTokenPubkey,
      this.funder.publicKey(),
      1
    );

    const iws: InstructionReturn = async (funder) => ({
      instruction: ix,
      signers: [funder],
    });

    return iws;
  }

  async getQuattrinoBalance() {
    try {
      const fromATA = getAssociatedTokenAddressSync(
        quattrinoTokenPubkey,
        this.funder.publicKey()
      );
      const tokenBalance =
        await this.provider.connection.getTokenAccountBalance(fromATA);

      if (!tokenBalance.value.uiAmount)
        throw new Error("UnableToLoadBalance");

      return {
        type: "Success" as const,
        message: `You have ${tokenBalance.value.amount} QTTR`,
        tokenBalance: tokenBalance.value.uiAmount,
      };
    } catch (e) {
      return { type: "UnableToLoadBalance" as const, message: "Unable to fetch QTTR balance. If you don't have any QTTR in your wallet, please buy some and try again" };
    }
  }

  /* async buildAndSignTransaction(
    instructions: InstructionReturn | InstructionReturn[],
    fee: boolean
  ) {
    if (fee) {
      try {
        const fromATA = getAssociatedTokenAddressSync(
          quattrinoTokenPubkey,
          this.funder.publicKey()
        );
        const tokenBalance =
          await this.provider.connection.getTokenAccountBalance(fromATA);
        if (tokenBalance.value.uiAmount === 0)
          return { type: "NoEnoughTokensToPerformLabsAction" as const };
      } catch (e) {
        return { type: "NoEnoughTokensToPerformLabsAction" as const };
      }

      const ixs = Array.isArray(instructions) ? instructions : [instructions];
      ixs.push(this.ixBurnQuattrinoToken());
    }

    try {
      const stx = await buildAndSignTransaction(instructions, this.funder, {
        connection: this.connection,
      });
      return { type: "Success" as const, stx };
    } catch (e) {
      return { type: "BuildAndSignTransactionError" as const };
    }
  } */

  /* async sendTransaction(tx: TransactionReturn) {
    try {
      const result = await sendTransaction(tx, this.connection, {
        commitment: "finalized",
        sendOptions: {
          skipPreflight: false,
          maxRetries: 5,
        },
      });

      if (result.value.isErr()) {
        return {
          type: "SendTransactionFailed" as const,
          result: result.value.error,
        };
      }
      const txSignature = result.value.value;
      return { type: "Success" as const, result: txSignature };
    } catch (e) {
      return {
        type: "SendTransactionFailed" as const,
        result: e,
      };
    }
  } */

  async sendDynamicTransactions(
    instructions: InstructionReturn[],
    fee: boolean,
    beforeIxs: InstructionReturn[] = [],
    afterIxs: InstructionReturn[] = []
  ) {
    if (fee) {
      const qttrBalance = await this.getQuattrinoBalance()
      
      if (qttrBalance.type !== "Success") {
        console.log(qttrBalance.message)
        return qttrBalance;
      }

      if (qttrBalance.tokenBalance === 0)
        return { type: "NoEnoughTokensToPerformLabsAction" as const };

      console.log(qttrBalance.message);
    }

    const connection = this.connection;

    let feeEstimate = { priorityFeeEstimate: this.priority !== "Basic" ? 0 : 5000 };
    if (this.priority !== "None" && this.priority !== "Basic") {
      const txsEstimate = await buildDynamicTransactions(
        instructions, 
        this.funder, 
        { connection },
        beforeIxs,
        fee ? [...afterIxs, this.ixBurnQuattrinoToken()] : afterIxs
      );
  
      if (txsEstimate.isErr()) {
        return { type: "BuildDynamicTransactionFailed" as const, result: txsEstimate.error };
      }

      feeEstimate = await getPriorityFeeEstimate(this.priority, txsEstimate.value[0]);
    }

    if (feeEstimate.priorityFeeEstimate > 1000000) {
      return { type: "PriorityFeeTooHigh" as const, result: "The Priority Fee Estimate is too high" };
    }

    const computePrice = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: Math.round(feeEstimate.priorityFeeEstimate),
    });
    console.log("Priority Fee estimate: ", (Math.round(feeEstimate.priorityFeeEstimate) / 1000000), "Lamports per CU");

    const computePriceIx: InstructionReturn = async (funder) => ({
      instruction: computePrice,
      signers: [funder],
    });

    const txs = await buildDynamicTransactions(
      instructions, 
      this.funder, 
      { connection },
      [computePriceIx, ...beforeIxs],
      fee ? [...afterIxs, this.ixBurnQuattrinoToken()] : afterIxs
    );

    if (txs.isErr()) {
      return { type: "BuildDynamicTransactionFailed" as const, result: txs.error };
    }

    let txSignature: TransactionSignature[] = [];

    try {
      for (const tx of txs.value) {
        const result = await sendTransaction(tx, connection, {
          commitment: "confirmed",
          sendOptions: {
            skipPreflight: false,
            preflightCommitment: "confirmed",
          },
        });

        if (result.value.isErr()) {
          return { type: "SendTransactionFailed" as const, result: result.value.error };
        }

        txSignature.push(result.value.value);
      }

      if (txSignature.length === 0)
        throw new Error("SendTransactionsFailed")

      return { type: "Success" as const, txSignature };
    } catch (e) {
      return { type: "SendTransactionsFailed" as const }
    }
  }
}
