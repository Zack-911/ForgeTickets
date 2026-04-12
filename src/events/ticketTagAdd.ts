import { Interpreter } from "@tryforge/forgescript"
import { TicketEventHandler } from "../handlers"
import { ForgeTickets } from ".."
import { Ticket } from "../structures/entities"

export default new TicketEventHandler({
    name: "ticketTagAdd",
    version: "1.0.0",
    description: "Fired when a tag is added to a ticket.",
    listener: async function (ticket: Ticket, tag: string) {
        const ext = this.getExtension(ForgeTickets, true)
        const commands = ext.commands.get("ticketTagAdd")
        for (const command of commands) {
            Interpreter.run({
                client: this,
                command,
                data: command.compiled.code,
                obj: ticket,
                extras: { ticket, tag },
            })
        }
    },
})