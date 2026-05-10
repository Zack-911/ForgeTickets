import { Compiler, ForgeClient, Interpreter } from "@tryforge/forgescript"
import { TextChannel } from "discord.js"
import { TicketsDatabase } from "../structures/database"
import { Ticket } from "../structures/entities"

// ─── Event names ──────────────────────────────────────────────────────────────

export const RENDERER_EVENTS = [
    "open",
    "close",
    "claim",
    "unclaim",
    "lock",
    "unlock",
    "reopen",
    "transfer",
    "log",
] as const

export type TicketRendererEvent = (typeof RENDERER_EVENTS)[number]

/**
 * Proper TypeScript enum so ArgType.Enum works without type errors.
 * EnumLike requires a TS enum (which has both forward + reverse mappings).
 */
export enum TicketRendererEventEnum {
    open,
    close,
    claim,
    unclaim,
    lock,
    unlock,
    reopen,
    transfer,
    log,
}

// ─── TicketRenderer ───────────────────────────────────────────────────────────

export class TicketRenderer {
    /**
     * Global renderers — set via ForgeTickets options at startup.
     * Guild-specific renderers (stored in DB) take precedence over these.
     * Global is the fallback when no guild renderer is set for an event.
     */
    private globalRenderers: Partial<Record<TicketRendererEvent, string>>

    constructor(
        private readonly client: ForgeClient,
        globalRenderers: Partial<Record<TicketRendererEvent, string>> = {}
    ) {
        this.globalRenderers = globalRenderers
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
    public async render(
        event: TicketRendererEvent,
        guildID: string,
        channel: TextChannel,
        data: Record<string, string>
    ): Promise<boolean> {
        // 1. Guild-specific
        const settings = await TicketsDatabase.getSettings(guildID)
        const guildCode = settings.renderers?.[event]

        // 2. Global fallback
        const code = guildCode ?? this.globalRenderers[event]
        if (!code) return false

        try {
            const compiled = Compiler.compile(code)
            await Interpreter.run({
                client: this.client,
                command: null,
                data: compiled,
                obj: channel as any,
                environment: { ...data, ticketRendererEvent: event },
            })
        } catch (err) {
            console.error(`[ForgeTickets] Renderer "${event}" error:`, err)
        }

        return true
    }

    // ── Static data builders ─────────────────────────────────────────────────

    public static baseData(ticket: Ticket, categoryName?: string, teamName?: string): Record<string, string> {
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
        }
    }

    public static openData(ticket: Ticket, categoryName?: string, teamName?: string): Record<string, string> {
        const base = this.baseData(ticket, categoryName, teamName)
        const formData: Record<string, string> = {}
        if (ticket.formAnswers) {
            for (const [k, v] of Object.entries(ticket.formAnswers)) formData[`form_${k}`] = v
        }
        return { ...base, ...formData }
    }

    public static closeData(
        ticket: Ticket,
        closedBy: string,
        categoryName?: string,
        teamName?: string
    ): Record<string, string> {
        return {
            ...this.baseData(ticket, categoryName, teamName),
            closedByID: closedBy,
            closedByMention: `<@${closedBy}>`,
            closeReason: ticket.closeReason ?? "None",
            closedAt: ticket.closedAt ? new Date(ticket.closedAt).toISOString() : "",
            slaBreached: String(ticket.slaStatus?.responseBreached || ticket.slaStatus?.resolutionBreached || false),
            slaResponseBreached: String(ticket.slaStatus?.responseBreached ?? false),
            slaResolutionBreached: String(ticket.slaStatus?.resolutionBreached ?? false),
        }
    }

    public static claimData(
        ticket: Ticket,
        claimedBy: string,
        categoryName?: string,
        teamName?: string
    ): Record<string, string> {
        return {
            ...this.baseData(ticket, categoryName, teamName),
            claimedByID: claimedBy,
            claimedByMention: `<@${claimedBy}>`,
        }
    }

    public static unclaimData(
        ticket: Ticket,
        unclaimedBy: string,
        categoryName?: string,
        teamName?: string
    ): Record<string, string> {
        return {
            ...this.baseData(ticket, categoryName, teamName),
            unclaimedByID: unclaimedBy,
            unclaimedByMention: `<@${unclaimedBy}>`,
        }
    }

    public static lockData(
        ticket: Ticket,
        lockedBy: string,
        categoryName?: string,
        teamName?: string
    ): Record<string, string> {
        return {
            ...this.baseData(ticket, categoryName, teamName),
            lockedByID: lockedBy,
            lockedByMention: `<@${lockedBy}>`,
        }
    }

    public static unlockData(
        ticket: Ticket,
        unlockedBy: string,
        categoryName?: string,
        teamName?: string
    ): Record<string, string> {
        return {
            ...this.baseData(ticket, categoryName, teamName),
            unlockedByID: unlockedBy,
            unlockedByMention: `<@${unlockedBy}>`,
        }
    }

    public static reopenData(
        ticket: Ticket,
        reopenedBy: string,
        categoryName?: string,
        teamName?: string
    ): Record<string, string> {
        return {
            ...this.baseData(ticket, categoryName, teamName),
            reopenedByID: reopenedBy,
            reopenedByMention: `<@${reopenedBy}>`,
        }
    }

    public static transferData(ticket: Ticket, newTeamID: string, newTeamName: string): Record<string, string> {
        return {
            ...this.baseData(ticket),
            newTeamID,
            newTeamName,
            oldTeamID: ticket.teamID ?? "",
        }
    }

    public static logData(
        ticket: Ticket,
        event: TicketRendererEvent,
        logMessage: string,
        extra: Record<string, string> = {}
    ): Record<string, string> {
        return {
            ...this.baseData(ticket),
            ...extra,
            logMessage,
            ticketRendererEvent: event,
        }
    }
}
