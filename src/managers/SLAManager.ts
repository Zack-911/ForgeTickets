import type { TextChannel } from "discord.js"
import { EmbedBuilder } from "discord.js"
import { ForgeClient } from "@tryforge/forgescript"
import { TypedEmitter } from "tiny-typed-emitter"
import { TransformEvents } from "@tryforge/forge.db"
import { ITicketEvents } from "../handlers"
import { Ticket } from "../structures/entities"
import { ISLAConfig } from "../structures/entities"
import { TicketsDatabase } from "../structures/database"
import noop from "../functions/noop"

interface SLAEntry {
    responseTimer?: NodeJS.Timeout
    resolutionTimer?: NodeJS.Timeout
    firstResponseMarked: boolean
}

export class SLAManager {
    private entries = new Map<string, SLAEntry>()

    constructor(
        private readonly client: ForgeClient,
        private readonly emitter: TypedEmitter<TransformEvents<ITicketEvents>>,
    ) {}

    public startSLA(ticket: Ticket, config: ISLAConfig) {
        this.clearSLA(ticket.id)
        const entry: SLAEntry = { firstResponseMarked: false }

        if (config.responseTime && config.responseTime > 0) {
            entry.responseTimer = setTimeout(async () => {
                const fresh = await TicketsDatabase.getTicket(ticket.id)
                if (!fresh?.isActive() || fresh.slaStatus?.firstResponseAt) return
                if (fresh.slaStatus) {
                    fresh.slaStatus.responseBreached = true
                    fresh.slaStatus.responseBreachedAt = Date.now()
                    await TicketsDatabase.saveTicket(fresh)
                }
                this.emitter.emit("ticketSLABreach", fresh!, "response")
                await this._sendBreachAlert(fresh!, "response", config)
            }, config.responseTime)
        }

        if (config.resolutionTime && config.resolutionTime > 0) {
            entry.resolutionTimer = setTimeout(async () => {
                const fresh = await TicketsDatabase.getTicket(ticket.id)
                if (!fresh?.isActive()) return
                if (fresh.slaStatus) {
                    fresh.slaStatus.resolutionBreached = true
                    fresh.slaStatus.resolutionBreachedAt = Date.now()
                    await TicketsDatabase.saveTicket(fresh)
                }
                this.emitter.emit("ticketSLABreach", fresh!, "resolution")
                await this._sendBreachAlert(fresh!, "resolution", config)
            }, config.resolutionTime)
        }

        this.entries.set(ticket.id, entry)
    }

    public markFirstResponse(ticketID: string) {
        const entry = this.entries.get(ticketID)
        if (!entry || entry.firstResponseMarked) return
        entry.firstResponseMarked = true
        // Cancel response timer — SLA met
        if (entry.responseTimer) {
            clearTimeout(entry.responseTimer)
            entry.responseTimer = undefined
        }
    }

    public clearSLA(ticketID: string) {
        const entry = this.entries.get(ticketID)
        if (!entry) return
        if (entry.responseTimer)   clearTimeout(entry.responseTimer)
        if (entry.resolutionTimer) clearTimeout(entry.resolutionTimer)
        this.entries.delete(ticketID)
    }

    private async _sendBreachAlert(ticket: Ticket, type: "response" | "resolution", config: ISLAConfig) {
        const channelID = config.alertChannelID ?? ticket.channelID
        const ch = this.client.channels.cache.get(channelID) as TextChannel | undefined
        if (!ch) return

        const label = type === "response" ? "Response SLA" : "Resolution SLA"
        const mentions = config.alertRoles?.map(r => `<@&${r}>`).join(" ") ?? ""

        await ch.send({
            content: mentions || undefined,
            embeds: [
                new EmbedBuilder()
                    .setTitle(`⚠️ SLA Breach — ${label}`)
                    .setDescription(`Ticket **#${ticket.number}** has breached its **${label}** deadline.`)
                    .setColor(0xED4245)
                    .addFields(
                        { name: "Ticket", value: `<#${ticket.channelID}>`, inline: true },
                        { name: "Opener", value: `<@${ticket.openerID}>`, inline: true },
                    )
                    .setTimestamp()
            ]
        }).catch(noop)
    }
}
