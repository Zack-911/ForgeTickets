import { Interpreter } from "@tryforge/forgescript"
import { TicketEventHandler } from "../handlers"
import { ForgeTickets } from ".."
import { Ticket } from "../structures/entities"
import type { Snowflake } from "discord.js"

export default new TicketEventHandler({
    name: "ticketNoteAdd",
    version: "1.0.0",
    description: "Fired when a note is added to a ticket.",
    listener: async function (ticket: Ticket, authorID: Snowflake, content: string) {
        const ext = this.getExtension(ForgeTickets, true)
        const commands = ext.commands.get("ticketNoteAdd")
        for (const command of commands) {
            Interpreter.run({
                client: this,
                command,
                data: command.compiled.code,
                obj: ticket,
                extras: { ticket, authorID, content },
            })
        }
    },
})