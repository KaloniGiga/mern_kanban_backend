"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const configureDB = async () => {
    mongoose_1.default
        .connect(process.env.MONGO_URL)
        .then((data) => {
        console.log(`Database connected: ${data.connection.host}`);
    })
        .catch((err) => {
        console.log(`Error: ${err.message}`);
        process.exit(1);
    });
};
exports.configureDB = configureDB;
