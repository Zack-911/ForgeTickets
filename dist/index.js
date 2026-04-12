"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForgeTickets = void 0;
const forgescript_1 = require("@tryforge/forgescript");
const tiny_typed_emitter_1 = require("tiny-typed-emitter");
const database_1 = require("./structures/database");
const TicketsManager_1 = require("./managers/TicketsManager");
const TicketsCommandManager_1 = require("./managers/TicketsCommandManager");
const TicketsInteractionHandler_1 = require("./handlers/TicketsInteractionHandler");
const path_1 = __importDefault(require("path"));
class ForgeTickets extends forgescript_1.ForgeExtension {
    options;
    name = "forge.tickets";
    description = "A powerful, fully-featured ticket system for ForgeScript.";
    version = require("../package.json").version;
    requireExtensions = ["forge.db"];
    client;
    commands;
    ticketsManager;
    emitter = new tiny_typed_emitter_1.TypedEmitter();
    constructor(options = {}) {
        super();
        this.options = options;
    }
    async init(client) {
        this.client = client;
        this.commands = new TicketsCommandManager_1.TicketsCommandManager(client);
        forgescript_1.EventManager.load("ForgeTicketsEvents", path_1.default.join(__dirname, "./events"));
        this.load(path_1.default.join(__dirname, "./native"));
        new TicketsInteractionHandler_1.TicketsInteractionHandler(client);
        await new database_1.TicketsDatabase(this.emitter).init();
        this.ticketsManager = new TicketsManager_1.TicketsManager(client, this.emitter);
        if (this.options.events?.length) {
            client.events.load("ForgeTicketsEvents", this.options.events);
        }
    }
}
exports.ForgeTickets = ForgeTickets;
__exportStar(require("./handlers"), exports);
__exportStar(require("./managers"), exports);
__exportStar(require("./structures"), exports);
//# sourceMappingURL=index.js.map