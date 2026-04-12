import { Interpreter } from "@tryforge/forgescript"
import { TicketEventHandler } from "../handlers"
import { ForgeTickets } from ".."
import { Ticket } from "../structures/entities"

export default new TicketEventHandler({
    name: "ticketSLABreach",
    version: "1.0.0",
    description: "Fired when a ticket breaches its SLA.",
    listener: async function (ticket: Ticket, breachType: "response" | "resolution") {
        const ext = this.getExtension(ForgeTickets, true)
        const commands = ext.commands.get("ticketSLABreach")
        for (const command of commands) {
            Interpreter.run({
                client: this,
                command,
                data: command.compiled.code,
                obj: ticket,
                extras: { ticket, breachType },
            })
        }
    },
})