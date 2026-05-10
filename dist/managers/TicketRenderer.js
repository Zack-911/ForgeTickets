"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketRenderer = exports.TicketRendererEventEnum = exports.RENDERER_EVENTS = void 0;
const forgescript_1 = require("@tryforge/forgescript");
const database_1 = require("../structures/database");
// ─── Event names ──────────────────────────────────────────────────────────────
exports.RENDERER_EVENTS = [
    "open",
    "close",
    "claim",
    "unclaim",
    "lock",
    "unlock",
    "reopen",
    "transfer",
    "log",
];
/**
 * Proper TypeScript enum so ArgType.Enum works without type errors.
 * EnumLike requires a TS enum (which has both forward + reverse mappings).
 */
var TicketRendererEventEnum;
(function (TicketRendererEventEnum) {
    TicketRendererEventEnum[TicketRendererEventEnum["open"] = 0] = "open";
    TicketRendererEventEnum[TicketRendererEventEnum["close"] = 1] = "close";
    TicketRendererEventEnum[TicketRendererEventEnum["claim"] = 2] = "claim";
    TicketRendererEventEnum[TicketRendererEventEnum["unclaim"] = 3] = "unclaim";
    TicketRendererEventEnum[TicketRendererEventEnum["lock"] = 4] = "lock";
    TicketRendererEventEnum[TicketRendererEventEnum["unlock"] = 5] = "unlock";
    TicketRendererEventEnum[TicketRendererEventEnum["reopen"] = 6] = "reopen";
    TicketRendererEventEnum[TicketRendererEventEnum["transfer"] = 7] = "transfer";
    TicketRendererEventEnum[TicketRendererEventEnum["log"] = 8] = "log";
})(TicketRendererEventEnum || (exports.TicketRendererEventEnum = TicketRendererEventEnum = {}));
// ─── TicketRenderer ───────────────────────────────────────────────────────────
class TicketRenderer {
    client;
    /**
     * Global renderers — set via ForgeTickets options at startup.
     * Guild-specific renderers (stored in DB) take precedence over these.
     * Global is the fallback when no guild renderer is set for an event.
     */
    globalRenderers;
    constructor(client, globalRenderers = {}) {
        this.client = client;
        this.globalRenderers = globalRenderers;
    }
    /**
     * Run the renderer for `event` in `guildID`.
     *
     * Precedence:
     *   1. Guild-specific renderer (stored in DB per guild)
     *   2. Global renderer (set in ForgeTickets options at startup)
     *   3. Nothing — caller falls back to default embed
     *
     * Returns true if a renderer ran, false if the caller should use its default.
     */
    async render(event, guildID, channel, data) {
        // 1. Guild-specific
        const settings = await database_1.TicketsDatabase.getSettings(guildID);
        const guildCode = settings.renderers?.[event];
        // 2. Global fallback
        const code = guildCode ?? this.globalRenderers[event];
        if (!code)
            return false;
        try {
            const compiled = forgescript_1.Compiler.compile(code);
            await forgescript_1.Interpreter.run({
                client: this.client,
                command: null,
                data: compiled,
                obj: channel,
                environment: { ...data, ticketRendererEvent: event },
            });
        }
        catch (err) {
            console.error(`[ForgeTickets] Renderer "${event}" error:`, err);
        }
        return true;
    }
    // ── Static data builders ─────────────────────────────────────────────────
    static baseData(ticket, categoryName, teamName) {
        return {
            ticketId: ticket.id,
            ticketNumber: String(ticket.number),
            ticketNumberPadded: String(ticket.number).padStart(4, "0"),
            openerID: ticket.openerID,
            openerMention: `<@${ticket.openerID}>`,
            channelID: ticket.channelID,
            guildID: ticket.guildID,
            priority: ticket.priority,
            state: ticket.state,
            categoryID: ticket.categoryID ?? "",
            categoryName: categoryName ?? "",
            teamID: ticket.teamID ?? "",
            teamName: teamName ?? "",
            createdAt: new Date(ticket.createdAt).toISOString(),
            subject: ticket.subject ?? "",
            tags: ticket.tags.join(", "),
            participants: ticket.participants.join(", "),
            noteCount: String(ticket.notes?.length ?? 0),
        };
    }
    static openData(ticket, categoryName, teamName) {
        const base = this.baseData(ticket, categoryName, teamName);
        const formData = {};
        if (ticket.formAnswers) {
            for (const [k, v] of Object.entries(ticket.formAnswers))
                formData[`form_${k}`] = v;
        }
        return { ...base, ...formData };
    }
    static closeData(ticket, closedBy, categoryName, teamName) {
        return {
            ...this.baseData(ticket, categoryName, teamName),
            closedByID: closedBy,
            closedByMention: `<@${closedBy}>`,
            closeReason: ticket.closeReason ?? "None",
            closedAt: ticket.closedAt ? new Date(ticket.closedAt).toISOString() : "",
            slaBreached: String(ticket.slaStatus?.responseBreached || ticket.slaStatus?.resolutionBreached || false),
            slaResponseBreached: String(ticket.slaStatus?.responseBreached ?? false),
            slaResolutionBreached: String(ticket.slaStatus?.resolutionBreached ?? false),
        };
    }
    static claimData(ticket, claimedBy, categoryName, teamName) {
        return {
            ...this.baseData(ticket, categoryName, teamName),
            claimedByID: claimedBy,
            claimedByMention: `<@${claimedBy}>`,
        };
    }
    static unclaimData(ticket, unclaimedBy, categoryName, teamName) {
        return {
            ...this.baseData(ticket, categoryName, teamName),
            unclaimedByID: unclaimedBy,
            unclaimedByMention: `<@${unclaimedBy}>`,
        };
    }
    static lockData(ticket, lockedBy, categoryName, teamName) {
        return {
            ...this.baseData(ticket, categoryName, teamName),
            lockedByID: lockedBy,
            lockedByMention: `<@${lockedBy}>`,
        };
    }
    static unlockData(ticket, unlockedBy, categoryName, teamName) {
        return {
            ...this.baseData(ticket, categoryName, teamName),
            unlockedByID: unlockedBy,
            unlockedByMention: `<@${unlockedBy}>`,
        };
    }
    static reopenData(ticket, reopenedBy, categoryName, teamName) {
        return {
            ...this.baseData(ticket, categoryName, teamName),
            reopenedByID: reopenedBy,
            reopenedByMention: `<@${reopenedBy}>`,
        };
    }
    static transferData(ticket, newTeamID, newTeamName) {
        return {
            ...this.baseData(ticket),
            newTeamID,
            newTeamName,
            oldTeamID: ticket.teamID ?? "",
        };
    }
    static logData(ticket, event, logMessage, extra = {}) {
        return {
            ...this.baseData(ticket),
            ...extra,
            logMessage,
            ticketRendererEvent: event,
        };
    }
}
exports.TicketRenderer = TicketRenderer;
//# sourceMappingURL=TicketRenderer.js.map