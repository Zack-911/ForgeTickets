import { Interpreter } from "@tryforge/forgescript"
import { TicketEventHandler } from "../handlers"
import { ForgeTickets } from ".."
import { Ticket } from "../structures/entities"

export default new TicketEventHandler({
    name: "ticketTransfer",
    version: "1.0.0",
    description: "Fired when a ticket is transferred to a different team.",
    listener: async function (ticket: Ticket, fromTeamID: string | undefined, toTeamID: string | undefined) {
        const ext = this.getExtension(ForgeTickets, true)
        const commands = ext.commands.get("ticketTransfer")
        for (const command of commands) {
            Interpreter.run({
                client: this,
                command,
                data: command.compiled.code,
                obj: ticket,
                extras: { ticket, fromTeamID, toTeamID },
            })
        }
    },
})