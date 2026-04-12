"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SLAManager = void 0;
const discord_js_1 = require("discord.js");
const database_1 = require("../structures/database");
const noop_1 = __importDefault(require("../functions/noop"));
class SLAManager {
    client;
    emitter;
    entries = new Map();
    constructor(client, emitter) {
        this.client = client;
        this.emitter = emitter;
    }
    startSLA(ticket, config) {
        this.clearSLA(ticket.id);
        const entry = { firstResponseMarked: false };
        if (config.responseTime && config.responseTime > 0) {
            entry.responseTimer = setTimeout(async () => {
                const fresh = await database_1.TicketsDatabase.getTicket(ticket.id);
                if (!fresh?.isActive() || fresh.slaStatus?.firstResponseAt)
                    return;
                if (fresh.slaStatus) {
                    fresh.slaStatus.responseBreached = true;
                    fresh.slaStatus.responseBreachedAt = Date.now();
                    await database_1.TicketsDatabase.saveTicket(fresh);
                }
                this.emitter.emit("ticketSLABreach", fresh, "response");
                await this._sendBreachAlert(fresh, "response", config);
            }, config.responseTime);
        }
        if (config.resolutionTime && config.resolutionTime > 0) {
            entry.resolutionTimer = setTimeout(async () => {
                const fresh = await database_1.TicketsDatabase.getTicket(ticket.id);
                if (!fresh?.isActive())
                    return;
                if (fresh.slaStatus) {
                    fresh.slaStatus.resolutionBreached = true;
                    fresh.slaStatus.resolutionBreachedAt = Date.now();
                    await database_1.TicketsDatabase.saveTicket(fresh);
                }
                this.emitter.emit("ticketSLABreach", fresh, "resolution");
                await this._sendBreachAlert(fresh, "resolution", config);
            }, config.resolutionTime);
        }
        this.entries.set(ticket.id, entry);
    }
    markFirstResponse(ticketID) {
        const entry = this.entries.get(ticketID);
        if (!entry || entry.firstResponseMarked)
            return;
        entry.firstResponseMarked = true;
        // Cancel response timer — SLA met
        if (entry.responseTimer) {
            clearTimeout(entry.responseTimer);
            entry.responseTimer = undefined;
        }
    }
    clearSLA(ticketID) {
        const entry = this.entries.get(ticketID);
        if (!entry)
            return;
        if (entry.responseTimer)
            clearTimeout(entry.responseTimer);
        if (entry.resolutionTimer)
            clearTimeout(entry.resolutionTimer);
        this.entries.delete(ticketID);
    }
    async _sendBreachAlert(ticket, type, config) {
        const channelID = config.alertChannelID ?? ticket.channelID;
        const ch = this.client.channels.cache.get(channelID);
        if (!ch)
            return;
        const label = type === "response" ? "Response SLA" : "Resolution SLA";
        const mentions = config.alertRoles?.map((r) => `<@&${r}>`).join(" ") ?? "";
        await ch
            .send({
            content: mentions || undefined,
            embeds: [
                new discord_js_1.EmbedBuilder()
                    .setTitle(`⚠️ SLA Breach — ${label}`)
                    .setDescription(`Ticket **#${ticket.number}** has breached its **${label}** deadline.`)
                    .setColor(0xed4245)
                    .addFields({ name: "Ticket", value: `<#${ticket.channelID}>`, inline: true }, { name: "Opener", value: `<@${ticket.openerID}>`, inline: true })
                    .setTimestamp(),
            ],
        })
            .catch(noop_1.default);
    }
}
exports.SLAManager = SLAManager;
//# sourceMappingURL=SLAManager.js.map