"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const handlers_1 = require("../handlers");
const __1 = require("..");
exports.default = new handlers_1.TicketEventHandler({
    name: "ticketPriorityChange",
    version: "1.0.0",
    description: "Fired when a ticket's priority changes.",
    listener: async function (ticket, oldPriority, newPriority) {
        const ext = this.getExtension(__1.ForgeTickets, true);
        const commands = ext.commands.get("ticketPriorityChange");
        for (const command of commands) {
            forgescript_1.Interpreter.run({
                client: this,
                command,
                data: command.compiled.code,
                obj: ticket,
                extras: { ticket, oldPriority, newPriority },
            });
        }
    },
});
//# sourceMappingURL=ticketPriorityChange.js.map