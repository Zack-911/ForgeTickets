"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const handlers_1 = require("../handlers");
const __1 = require("..");
exports.default = new handlers_1.TicketEventHandler({
    name: "ticketOpen",
    version: "1.0.0",
    description: "Fired when a ticket is opened.",
    listener: function (...args) {
        const commands = this.getExtension(__1.ForgeTickets, true).commands.get("ticketOpen");
        for (const command of commands) {
            forgescript_1.Interpreter.run({ client: this, command, data: command.compiled.code, obj: args[0], extras: { args } });
        }
    },
});
//# sourceMappingURL=ticketOpen.js.map