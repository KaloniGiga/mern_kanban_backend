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
const userProfile_route_1 = __importDefault(require("./routes/userProfile.route"));
const path_1 = __importDefault(require("path"));
const workspace_route_1 = __importDefault(require("./routes/workspace.route"));
const board_route_1 = __importDefault(require("./routes/board.route"));
const favorite_route_1 = __importDefault(require("./routes/favorite.route"));
const card_route_1 = __importDefault(require("./routes/card.route"));
const list_route_1 = __importDefault(require("./routes/list.route"));
const error_middleware_1 = __importDefault(require("./middlewares/error.middleware"));
//configure the dotenv
(0, dotenv_1.config)();
//make the instance of express app
const app = (0, express_1.default)();
//configure mongodb
(0, db_1.configureDB)();
const BASE_PATH = process.env.BASE_PATH || "/api/v1";
const STATIC_PATH = process.env.STATIC_PATH || "/static";
const PUBLIC_DIR_NAME = process.env.PUBLIC_DIR_NAME || "public";
//middleware
app.use((0, cors_1.default)({ credentials: true }));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(BASE_PATH + STATIC_PATH, express_1.default.static(path_1.default.join(__dirname, PUBLIC_DIR_NAME)));
//configure routes
app.use("/api/v1", userProfile_route_1.default);
app.use("/api/v1", auth_route_1.default);
app.use("/api/v1", workspace_route_1.default);
app.use("/api/v1", board_route_1.default);
app.use("/api/v1", favorite_route_1.default);
app.use("/api/v1", card_route_1.default);
app.use("/api/v1", list_route_1.default);
app.use(error_middleware_1.default);
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running at port: ${process.env.PORT}`);
});
