import type { TextChannel, GuildMember } from "discord.js"
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    PermissionsBitField,
} from "discord.js"
import { ForgeClient } from "@tryforge/forgescript"
import { ForgeTickets } from ".."
import { TicketsDatabase } from "../structures/database"
import { Ticket, TicketState } from "../structures/entities"
import { TicketsManager } from "../managers/TicketsManager"
import noop from "../functions/noop"

/** Custom ID prefixes used throughout the button/modal system */
export const CID = {
    PANEL_OPEN: "fticket_panel_open", // fticket_panel_open:{categoryID}
    TICKET_CLOSE: "fticket_close", // fticket_close:{ticketID}
    TICKET_CLAIM: "fticket_claim", // fticket_claim:{ticketID}
    TICKET_UNCLAIM: "fticket_unclaim", // fticket_unclaim:{ticketID}
    TICKET_LOCK: "fticket_lock", // fticket_lock:{ticketID}
    TICKET_UNLOCK: "fticket_unlock", // fticket_unlock:{ticketID}
    TICKET_REOPEN: "fticket_reopen", // fticket_reopen:{ticketID}
    TICKET_DELETE: "fticket_delete", // fticket_delete:{ticketID}
    FORM_SUBMIT: "fticket_form", // fticket_form:{categoryID}  (modal)
} as const

function encode(prefix: string, ...parts: string[]) {
    return [prefix, ...parts].join(":")
}

function decode(id: string): [string, string[]] {
    const [prefix, ...parts] = id.split(":")
    return [prefix, parts]
}

export class TicketsInteractionHandler {
    constructor(private readonly client: ForgeClient) {
        this._register()
    }

    private _register() {
        this.client.on("interactionCreate", async (interaction) => {
            if (!interaction.inGuild()) return

            // ── Button interactions ────────────────────────────────────────

            if (interaction.isButton()) {
                const [prefix, parts] = decode(interaction.customId)

                switch (prefix) {
                    case CID.PANEL_OPEN:
                        return void (await this._handlePanelOpen(interaction, parts[0]))

                    case CID.TICKET_CLOSE:
                        return void (await this._handleClose(interaction, parts[0]))

                    case CID.TICKET_CLAIM:
                        return void (await this._handleClaim(interaction, parts[0]))

                    case CID.TICKET_UNCLAIM:
                        return void (await this._handleUnclaim(interaction, parts[0]))

                    case CID.TICKET_LOCK:
                        return void (await this._handleLock(interaction, parts[0]))

                    case CID.TICKET_UNLOCK:
                        return void (await this._handleUnlock(interaction, parts[0]))

                    case CID.TICKET_REOPEN:
                        return void (await this._handleReopen(interaction, parts[0]))

                    case CID.TICKET_DELETE:
                        return void (await this._handleDelete(interaction, parts[0]))
                }
                return
            }

            // ── Modal submissions ──────────────────────────────────────────

            if (interaction.isModalSubmit()) {
                const [prefix, parts] = decode(interaction.customId)
                if (prefix === CID.FORM_SUBMIT) {
                    return void (await this._handleFormSubmit(interaction, parts[0]))
                }
            }
        })
    }

    // ─── Panel: Open ticket (may show modal form first) ────────────────────

    private async _handlePanelOpen(interaction: any, categoryID: string) {
        const mgr = this._mgr()
        const member = interaction.member as GuildMember

        const category = await TicketsDatabase.getCategory(categoryID)
        if (!category || !category.enabled) {
            return interaction
                .reply({ content: "❌ This ticket category is currently unavailable.", flags: MessageFlags.Ephemeral })
                .catch(noop)
        }

        // Blacklist check
        const roleIDs = member.roles.cache.map((r: any) => r.id)
        const bl = await TicketsDatabase.isBlacklisted(interaction.guildId, interaction.user.id, roleIDs)
        if (bl) {
            const reason = bl.reason ? ` Reason: ${bl.reason}` : ""
            return interaction
                .reply({
                    content: `❌ You are blacklisted from opening tickets.${reason}`,
                    flags: MessageFlags.Ephemeral,
                })
                .catch(noop)
        }

        // Role restriction check
        if (category.blockedRoles?.some((r) => roleIDs.includes(r))) {
            return interaction
                .reply({
                    content: "❌ You do not have permission to open tickets in this category.",
                    flags: MessageFlags.Ephemeral,
                })
                .catch(noop)
        }
        if (category.allowedRoles?.length && !category.allowedRoles.some((r) => roleIDs.includes(r))) {
            return interaction
                .reply({
                    content: "❌ You do not have the required roles to open tickets in this category.",
                    flags: MessageFlags.Ephemeral,
                })
                .catch(noop)
        }

        // Max-per-user check
        if (category.maxPerUser > 0) {
            const open = await TicketsDatabase.getOpenTicketsByUser(interaction.guildId, interaction.user.id)
            const inCategory = open.filter((t) => t.categoryID === categoryID)
            if (inCategory.length >= category.maxPerUser) {
                return interaction
                    .reply({
                        content: `❌ You already have ${inCategory.length} open ticket(s) in this category (max: ${category.maxPerUser}).`,
                        flags: MessageFlags.Ephemeral,
                    })
                    .catch(noop)
            }
        }

        // If the category has a form, show the modal
        if (category.form?.length) {
            const modal = new ModalBuilder()
                .setCustomId(encode(CID.FORM_SUBMIT, categoryID))
                .setTitle(`Open Ticket — ${category.name}`)

            for (const field of category.form.slice(0, 5)) {
                const input = new TextInputBuilder()
                    .setCustomId(field.key)
                    .setLabel(field.label)
                    .setStyle(field.style === "paragraph" ? TextInputStyle.Paragraph : TextInputStyle.Short)
                    .setRequired(field.required)
                if (field.placeholder) input.setPlaceholder(field.placeholder)
                if (field.minLength) input.setMinLength(field.minLength)
                if (field.maxLength) input.setMaxLength(field.maxLength)
                modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input))
            }

            return interaction.showModal(modal).catch(noop)
        }

        // No form — open immediately
        await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(noop)
        const ticket = await mgr
            .openTicket({
                guildID: interaction.guildId,
                openerID: interaction.user.id,
                categoryID,
                member,
            })
            .catch(noop)

        if (ticket) {
            await interaction
                .editReply({ content: `✅ Your ticket has been created: <#${ticket.channelID}>` })
                .catch(noop)
        } else {
            await interaction.editReply({ content: "❌ Failed to create your ticket. Please try again." }).catch(noop)
        }
    }

    // ─── Form submission ───────────────────────────────────────────────────

    private async _handleFormSubmit(interaction: any, categoryID: string) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(noop)
        const mgr = this._mgr()
        const formAnswers: Record<string, string> = {}
        for (const [key, comp] of interaction.fields.fields) {
            formAnswers[key] = comp.value
        }

        const ticket = await mgr
            .openTicket({
                guildID: interaction.guildId,
                openerID: interaction.user.id,
                categoryID,
                member: interaction.member as GuildMember,
                formAnswers,
            })
            .catch(noop)

        if (ticket) {
            await interaction
                .editReply({ content: `✅ Your ticket has been created: <#${ticket.channelID}>` })
                .catch(noop)
        } else {
            await interaction.editReply({ content: "❌ Failed to create your ticket. Please try again." }).catch(noop)
        }
    }

    // ─── Close ────────────────────────────────────────────────────────────

    private async _handleClose(interaction: any, ticketID: string) {
        const ticket = await TicketsDatabase.getTicket(ticketID)
        if (!ticket || !ticket.isActive()) {
            return interaction
                .reply({ content: "❌ This ticket is not active.", flags: MessageFlags.Ephemeral })
                .catch(noop)
        }
        if (!(await this._canManage(interaction, ticket))) {
            return interaction
                .reply({ content: "❌ You don't have permission to close this ticket.", flags: MessageFlags.Ephemeral })
                .catch(noop)
        }

        await interaction.deferUpdate().catch(noop)
        await this._mgr().closeTicket(ticketID, interaction.user.id, "Closed via button").catch(noop)
    }

    // ─── Claim ────────────────────────────────────────────────────────────

    private async _handleClaim(interaction: any, ticketID: string) {
        const ticket = await TicketsDatabase.getTicket(ticketID)
        if (!ticket || !ticket.isActive()) {
            return interaction
                .reply({ content: "❌ This ticket is not active.", flags: MessageFlags.Ephemeral })
                .catch(noop)
        }
        if (!(await this._canManage(interaction, ticket))) {
            return interaction
                .reply({ content: "❌ You don't have permission to claim this ticket.", flags: MessageFlags.Ephemeral })
                .catch(noop)
        }
        if (ticket.claimedBy) {
            return interaction
                .reply({
                    content: `❌ This ticket is already claimed by <@${ticket.claimedBy}>.`,
                    flags: MessageFlags.Ephemeral,
                })
                .catch(noop)
        }

        await interaction.deferUpdate().catch(noop)
        await this._mgr().claimTicket(ticketID, interaction.user.id).catch(noop)
    }

    // ─── Unclaim ──────────────────────────────────────────────────────────

    private async _handleUnclaim(interaction: any, ticketID: string) {
        const ticket = await TicketsDatabase.getTicket(ticketID)
        if (!ticket) return
        if (!(await this._canManage(interaction, ticket))) {
            return interaction
                .reply({
                    content: "❌ You don't have permission to unclaim this ticket.",
                    flags: MessageFlags.Ephemeral,
                })
                .catch(noop)
        }

        await interaction.deferUpdate().catch(noop)
        await this._mgr().unclaimTicket(ticketID, interaction.user.id).catch(noop)
    }

    // ─── Lock / Unlock ────────────────────────────────────────────────────

    private async _handleLock(interaction: any, ticketID: string) {
        const ticket = await TicketsDatabase.getTicket(ticketID)
        if (!ticket) return
        if (!(await this._canManage(interaction, ticket))) {
            return interaction
                .reply({ content: "❌ You don't have permission.", flags: MessageFlags.Ephemeral })
                .catch(noop)
        }
        await interaction.deferUpdate().catch(noop)
        await this._mgr().lockTicket(ticketID, interaction.user.id).catch(noop)
    }

    private async _handleUnlock(interaction: any, ticketID: string) {
        const ticket = await TicketsDatabase.getTicket(ticketID)
        if (!ticket) return
        if (!(await this._canManage(interaction, ticket))) {
            return interaction
                .reply({ content: "❌ You don't have permission.", flags: MessageFlags.Ephemeral })
                .catch(noop)
        }
        await interaction.deferUpdate().catch(noop)
        await this._mgr().unlockTicket(ticketID, interaction.user.id).catch(noop)
    }

    // ─── Reopen ───────────────────────────────────────────────────────────

    private async _handleReopen(interaction: any, ticketID: string) {
        const ticket = await TicketsDatabase.getTicket(ticketID)
        if (!ticket) return
        if (!(await this._canManage(interaction, ticket))) {
            return interaction
                .reply({ content: "❌ You don't have permission.", flags: MessageFlags.Ephemeral })
                .catch(noop)
        }
        await interaction.deferUpdate().catch(noop)
        await this._mgr().reopenTicket(ticketID, interaction.user.id).catch(noop)
    }

    // ─── Delete ───────────────────────────────────────────────────────────

    private async _handleDelete(interaction: any, ticketID: string) {
        const ticket = await TicketsDatabase.getTicket(ticketID)
        if (!ticket) return
        if (!(await this._canManage(interaction, ticket, true))) {
            return interaction
                .reply({
                    content: "❌ You don't have permission to delete this ticket.",
                    flags: MessageFlags.Ephemeral,
                })
                .catch(noop)
        }
        await interaction.deferUpdate().catch(noop)
        await this._mgr().deleteTicket(ticketID).catch(noop)
    }

    // ─── Helpers ──────────────────────────────────────────────────────────

    private _mgr(): TicketsManager {
        return this.client.getExtension(ForgeTickets, true).ticketsManager
    }

    private async _canManage(interaction: any, ticket: Ticket, requireDelete = false): Promise<boolean> {
        const member = interaction.member as GuildMember
        const guildID = interaction.guildId

        // Guild admins always can
        if (member.permissions.has(PermissionsBitField.Flags.Administrator)) return true

        const settings = await TicketsDatabase.getSettings(guildID)
        if (settings.globalStaffRoles.some((r) => member.roles.cache.has(r))) return true

        const category = ticket.categoryID ? await TicketsDatabase.getCategory(ticket.categoryID) : null
        if (category?.staffRoles?.some((r) => member.roles.cache.has(r))) return true

        if (ticket.teamID) {
            const team = await TicketsDatabase.getTeam(ticket.teamID)
            if (team) {
                if (requireDelete && !team.canDelete) return false
                if (team.members.includes(interaction.user.id)) return true
                if (team.roles.some((r) => member.roles.cache.has(r))) return true
            }
        }

        // Ticket opener can close/reopen their own ticket (not claim/lock/delete)
        if (!requireDelete && ticket.openerID === interaction.user.id) return true

        return false
    }
}

export { encode as encodeCID, decode as decodeCID }
