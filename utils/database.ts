// Define a schema
import { BN } from "@project-serum/anchor";
import mongoose from "mongoose";
import { SectorCoordinates, SectorInfo } from "../common/types";

const Schema = mongoose.Schema;

const CoordModelSchema = new Schema({
    coord1_string: String,
    coord2_string: String,
    percent_string: String,
    last_scan: Date,
});

const mongoAtlasUri =
    "mongodb+srv://saiuser:x0RKvvuIr8Ceyk5v@sa-data.aokdyym.mongodb.net/sa-data?ssl=true&connectTimeoutMS=5000&maxPoolSize=50";

//connect to db
export const connectDB = async () => {
    mongoose.set('strictQuery', false)
    mongoose.connect(mongoAtlasUri, {
        serverSelectionTimeoutMS: 30000, // Aumenta il timeout a 30 secondi
    });
    console.log('Connected to sector infos DB')
}

// Compile model from schema
const CoordModel = mongoose.model("CoordModel", CoordModelSchema);

//Add data to database
export const upsert = async (c1: String, c2: String, p: String) => {
    const filter = { coord1_string: c1, coord2_string: c2 };
    const update = { percent_string: p, last_scan: new Date() };
    const options = { upsert: true, new: true };
    const result = await CoordModel.findOneAndUpdate(filter, update, options);
    // console.log(`Added sector info record: [${result?.coord1_string}, ${result?.coord2_string}] - ${result?.percent_string}`);
}

export const getAllSectorInfos = async (): Promise<SectorInfo[]> => {
    const allCoords = await CoordModel.find().maxTimeMS(60000);;
    const allSectorInfos = allCoords.map(coord => {
        return {
            coordinates: ([new BN(coord.coord1_string), new BN(coord.coord2_string)] as SectorCoordinates),
            sduProbability: Number(coord.percent_string)
        } as SectorInfo;
    });
    return allSectorInfos;
}
