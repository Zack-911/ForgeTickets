import { Interpreter } from "@tryforge/forgescript"
import { TicketEventHandler } from "../handlers"
import { ForgeTickets } from ".."
import { Ticket } from "../structures/entities"
import type { Snowflake } from "discord.js"

export default new TicketEventHandler({
    name: "ticketUnclaim",
    version: "1.0.0",
    description: "Fired when a ticket is unclaimed.",
    listener: async function (ticket: Ticket, unclaimedByID: Snowflake) {
        const ext = this.getExtension(ForgeTickets, true)
        const commands = ext.commands.get("ticketUnclaim")
        for (const command of commands) {
            Interpreter.run({
                client: this,
                command,
                data: command.compiled.code,
                obj: ticket,
                extras: { ticket, unclaimedByID },
            })
        }
    },
})
