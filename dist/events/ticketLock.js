"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const handlers_1 = require("../handlers");
const __1 = require("..");
exports.default = new handlers_1.TicketEventHandler({
    name: "ticketLock",
    version: "1.0.0",
    description: "Fired when a ticket is locked.",
    listener: async function (ticket, lockedByID) {
        const ext = this.getExtension(__1.ForgeTickets, true);
        const commands = ext.commands.get("ticketLock");
        for (const command of commands) {
            forgescript_1.Interpreter.run({
                client: this,
                command,
                data: command.compiled.code,
                obj: ticket,
                extras: { ticket, lockedByID },
            });
        }
    },
});
//# sourceMappingURL=ticketLock.js.map