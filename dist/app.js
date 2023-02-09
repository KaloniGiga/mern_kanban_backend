"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = require("dotenv");
const db_1 = require("./utils/db");
const cors_1 = __importDefault(require("cors"));
const auth_route_1 = __importDefault(require("./routes/auth.route"));
//configure the dotenv
(0, dotenv_1.config)();
//make the instance of express app
const app = (0, express_1.default)();
//configure mongodb
(0, db_1.configureDB)();
//middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/', (req, res, next) => {
    res.send("hello world");
});
//configure routes
app.use('/api/v1', auth_route_1.default);
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running at port: ${process.env.PORT}`);
});
