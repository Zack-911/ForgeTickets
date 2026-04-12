"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketsInteractionHandler = exports.CID = void 0;
exports.encodeCID = encode;
exports.decodeCID = decode;
const discord_js_1 = require("discord.js");
const __1 = require("..");
const database_1 = require("../structures/database");
const noop_1 = __importDefault(require("../functions/noop"));
/** Custom ID prefixes used throughout the button/modal system */
exports.CID = {
    PANEL_OPEN: "fticket_panel_open", // fticket_panel_open:{categoryID}
    TICKET_CLOSE: "fticket_close", // fticket_close:{ticketID}
    TICKET_CLAIM: "fticket_claim", // fticket_claim:{ticketID}
    TICKET_UNCLAIM: "fticket_unclaim", // fticket_unclaim:{ticketID}
    TICKET_LOCK: "fticket_lock", // fticket_lock:{ticketID}
    TICKET_UNLOCK: "fticket_unlock", // fticket_unlock:{ticketID}
    TICKET_REOPEN: "fticket_reopen", // fticket_reopen:{ticketID}
    TICKET_DELETE: "fticket_delete", // fticket_delete:{ticketID}
    FORM_SUBMIT: "fticket_form", // fticket_form:{categoryID}  (modal)
};
function encode(prefix, ...parts) {
    return [prefix, ...parts].join(":");
}
function decode(id) {
    const [prefix, ...parts] = id.split(":");
    return [prefix, parts];
}
class TicketsInteractionHandler {
    client;
    constructor(client) {
        this.client = client;
        this._register();
    }
    _register() {
        this.client.on("interactionCreate", async (interaction) => {
            if (!interaction.inGuild())
                return;
            // ── Button interactions ────────────────────────────────────────
            if (interaction.isButton()) {
                const [prefix, parts] = decode(interaction.customId);
                switch (prefix) {
                    case exports.CID.PANEL_OPEN:
                        return void (await this._handlePanelOpen(interaction, parts[0]));
                    case exports.CID.TICKET_CLOSE:
                        return void (await this._handleClose(interaction, parts[0]));
                    case exports.CID.TICKET_CLAIM:
                        return void (await this._handleClaim(interaction, parts[0]));
                    case exports.CID.TICKET_UNCLAIM:
                        return void (await this._handleUnclaim(interaction, parts[0]));
                    case exports.CID.TICKET_LOCK:
                        return void (await this._handleLock(interaction, parts[0]));
                    case exports.CID.TICKET_UNLOCK:
                        return void (await this._handleUnlock(interaction, parts[0]));
                    case exports.CID.TICKET_REOPEN:
                        return void (await this._handleReopen(interaction, parts[0]));
                    case exports.CID.TICKET_DELETE:
                        return void (await this._handleDelete(interaction, parts[0]));
                }
                return;
            }
            // ── Modal submissions ──────────────────────────────────────────
            if (interaction.isModalSubmit()) {
                const [prefix, parts] = decode(interaction.customId);
                if (prefix === exports.CID.FORM_SUBMIT) {
                    return void (await this._handleFormSubmit(interaction, parts[0]));
                }
            }
        });
    }
    // ─── Panel: Open ticket (may show modal form first) ────────────────────
    async _handlePanelOpen(interaction, categoryID) {
        const mgr = this._mgr();
        const member = interaction.member;
        const category = await database_1.TicketsDatabase.getCategory(categoryID);
        if (!category || !category.enabled) {
            return interaction
                .reply({ content: "❌ This ticket category is currently unavailable.", flags: discord_js_1.MessageFlags.Ephemeral })
                .catch(noop_1.default);
        }
        // Blacklist check
        const roleIDs = member.roles.cache.map((r) => r.id);
        const bl = await database_1.TicketsDatabase.isBlacklisted(interaction.guildId, interaction.user.id, roleIDs);
        if (bl) {
            const reason = bl.reason ? ` Reason: ${bl.reason}` : "";
            return interaction
                .reply({
                content: `❌ You are blacklisted from opening tickets.${reason}`,
                flags: discord_js_1.MessageFlags.Ephemeral,
            })
                .catch(noop_1.default);
        }
        // Role restriction check
        if (category.blockedRoles?.some((r) => roleIDs.includes(r))) {
            return interaction
                .reply({
                content: "❌ You do not have permission to open tickets in this category.",
                flags: discord_js_1.MessageFlags.Ephemeral,
            })
                .catch(noop_1.default);
        }
        if (category.allowedRoles?.length && !category.allowedRoles.some((r) => roleIDs.includes(r))) {
            return interaction
                .reply({
                content: "❌ You do not have the required roles to open tickets in this category.",
                flags: discord_js_1.MessageFlags.Ephemeral,
            })
                .catch(noop_1.default);
        }
        // Max-per-user check
        if (category.maxPerUser > 0) {
            const open = await database_1.TicketsDatabase.getOpenTicketsByUser(interaction.guildId, interaction.user.id);
            const inCategory = open.filter((t) => t.categoryID === categoryID);
            if (inCategory.length >= category.maxPerUser) {
                return interaction
                    .reply({
                    content: `❌ You already have ${inCategory.length} open ticket(s) in this category (max: ${category.maxPerUser}).`,
                    flags: discord_js_1.MessageFlags.Ephemeral,
                })
                    .catch(noop_1.default);
            }
        }
        // If the category has a form, show the modal
        if (category.form?.length) {
            const modal = new discord_js_1.ModalBuilder()
                .setCustomId(encode(exports.CID.FORM_SUBMIT, categoryID))
                .setTitle(`Open Ticket — ${category.name}`);
            for (const field of category.form.slice(0, 5)) {
                const input = new discord_js_1.TextInputBuilder()
                    .setCustomId(field.key)
                    .setLabel(field.label)
                    .setStyle(field.style === "paragraph" ? discord_js_1.TextInputStyle.Paragraph : discord_js_1.TextInputStyle.Short)
                    .setRequired(field.required);
                if (field.placeholder)
                    input.setPlaceholder(field.placeholder);
                if (field.minLength)
                    input.setMinLength(field.minLength);
                if (field.maxLength)
                    input.setMaxLength(field.maxLength);
                modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(input));
            }
            return interaction.showModal(modal).catch(noop_1.default);
        }
        // No form — open immediately
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral }).catch(noop_1.default);
        const ticket = await mgr
            .openTicket({
            guildID: interaction.guildId,
            openerID: interaction.user.id,
            categoryID,
            member,
        })
            .catch(noop_1.default);
        if (ticket) {
            await interaction
                .editReply({ content: `✅ Your ticket has been created: <#${ticket.channelID}>` })
                .catch(noop_1.default);
        }
        else {
            await interaction.editReply({ content: "❌ Failed to create your ticket. Please try again." }).catch(noop_1.default);
        }
    }
    // ─── Form submission ───────────────────────────────────────────────────
    async _handleFormSubmit(interaction, categoryID) {
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral }).catch(noop_1.default);
        const mgr = this._mgr();
        const formAnswers = {};
        for (const [key, comp] of interaction.fields.fields) {
            formAnswers[key] = comp.value;
        }
        const ticket = await mgr
            .openTicket({
            guildID: interaction.guildId,
            openerID: interaction.user.id,
            categoryID,
            member: interaction.member,
            formAnswers,
        })
            .catch(noop_1.default);
        if (ticket) {
            await interaction
                .editReply({ content: `✅ Your ticket has been created: <#${ticket.channelID}>` })
                .catch(noop_1.default);
        }
        else {
            await interaction.editReply({ content: "❌ Failed to create your ticket. Please try again." }).catch(noop_1.default);
        }
    }
    // ─── Close ────────────────────────────────────────────────────────────
    async _handleClose(interaction, ticketID) {
        const ticket = await database_1.TicketsDatabase.getTicket(ticketID);
        if (!ticket || !ticket.isActive()) {
            return interaction
                .reply({ content: "❌ This ticket is not active.", flags: discord_js_1.MessageFlags.Ephemeral })
                .catch(noop_1.default);
        }
        if (!(await this._canManage(interaction, ticket))) {
            return interaction
                .reply({ content: "❌ You don't have permission to close this ticket.", flags: discord_js_1.MessageFlags.Ephemeral })
                .catch(noop_1.default);
        }
        await interaction.deferUpdate().catch(noop_1.default);
        await this._mgr().closeTicket(ticketID, interaction.user.id, "Closed via button").catch(noop_1.default);
    }
    // ─── Claim ────────────────────────────────────────────────────────────
    async _handleClaim(interaction, ticketID) {
        const ticket = await database_1.TicketsDatabase.getTicket(ticketID);
        if (!ticket || !ticket.isActive()) {
            return interaction
                .reply({ content: "❌ This ticket is not active.", flags: discord_js_1.MessageFlags.Ephemeral })
                .catch(noop_1.default);
        }
        if (!(await this._canManage(interaction, ticket))) {
            return interaction
                .reply({ content: "❌ You don't have permission to claim this ticket.", flags: discord_js_1.MessageFlags.Ephemeral })
                .catch(noop_1.default);
        }
        if (ticket.claimedBy) {
            return interaction
                .reply({
                content: `❌ This ticket is already claimed by <@${ticket.claimedBy}>.`,
                flags: discord_js_1.MessageFlags.Ephemeral,
            })
                .catch(noop_1.default);
        }
        await interaction.deferUpdate().catch(noop_1.default);
        await this._mgr().claimTicket(ticketID, interaction.user.id).catch(noop_1.default);
    }
    // ─── Unclaim ──────────────────────────────────────────────────────────
    async _handleUnclaim(interaction, ticketID) {
        const ticket = await database_1.TicketsDatabase.getTicket(ticketID);
        if (!ticket)
            return;
        if (!(await this._canManage(interaction, ticket))) {
            return interaction
                .reply({
                content: "❌ You don't have permission to unclaim this ticket.",
                flags: discord_js_1.MessageFlags.Ephemeral,
            })
                .catch(noop_1.default);
        }
        await interaction.deferUpdate().catch(noop_1.default);
        await this._mgr().unclaimTicket(ticketID, interaction.user.id).catch(noop_1.default);
    }
    // ─── Lock / Unlock ────────────────────────────────────────────────────
    async _handleLock(interaction, ticketID) {
        const ticket = await database_1.TicketsDatabase.getTicket(ticketID);
        if (!ticket)
            return;
        if (!(await this._canManage(interaction, ticket))) {
            return interaction
                .reply({ content: "❌ You don't have permission.", flags: discord_js_1.MessageFlags.Ephemeral })
                .catch(noop_1.default);
        }
        await interaction.deferUpdate().catch(noop_1.default);
        await this._mgr().lockTicket(ticketID, interaction.user.id).catch(noop_1.default);
    }
    async _handleUnlock(interaction, ticketID) {
        const ticket = await database_1.TicketsDatabase.getTicket(ticketID);
        if (!ticket)
            return;
        if (!(await this._canManage(interaction, ticket))) {
            return interaction
                .reply({ content: "❌ You don't have permission.", flags: discord_js_1.MessageFlags.Ephemeral })
                .catch(noop_1.default);
        }
        await interaction.deferUpdate().catch(noop_1.default);
        await this._mgr().unlockTicket(ticketID, interaction.user.id).catch(noop_1.default);
    }
    // ─── Reopen ───────────────────────────────────────────────────────────
    async _handleReopen(interaction, ticketID) {
        const ticket = await database_1.TicketsDatabase.getTicket(ticketID);
        if (!ticket)
            return;
        if (!(await this._canManage(interaction, ticket))) {
            return interaction
                .reply({ content: "❌ You don't have permission.", flags: discord_js_1.MessageFlags.Ephemeral })
                .catch(noop_1.default);
        }
        await interaction.deferUpdate().catch(noop_1.default);
        await this._mgr().reopenTicket(ticketID, interaction.user.id).catch(noop_1.default);
    }
    // ─── Delete ───────────────────────────────────────────────────────────
    async _handleDelete(interaction, ticketID) {
        const ticket = await database_1.TicketsDatabase.getTicket(ticketID);
        if (!ticket)
            return;
        if (!(await this._canManage(interaction, ticket, true))) {
            return interaction
                .reply({
                content: "❌ You don't have permission to delete this ticket.",
                flags: discord_js_1.MessageFlags.Ephemeral,
            })
                .catch(noop_1.default);
        }
        await interaction.deferUpdate().catch(noop_1.default);
        await this._mgr().deleteTicket(ticketID).catch(noop_1.default);
    }
    // ─── Helpers ──────────────────────────────────────────────────────────
    _mgr() {
        return this.client.getExtension(__1.ForgeTickets, true).ticketsManager;
    }
    async _canManage(interaction, ticket, requireDelete = false) {
        const member = interaction.member;
        const guildID = interaction.guildId;
        // Guild admins always can
        if (member.permissions.has(discord_js_1.PermissionsBitField.Flags.Administrator))
            return true;
        const settings = await database_1.TicketsDatabase.getSettings(guildID);
        if (settings.globalStaffRoles.some((r) => member.roles.cache.has(r)))
            return true;
        const category = ticket.categoryID ? await database_1.TicketsDatabase.getCategory(ticket.categoryID) : null;
        if (category?.staffRoles?.some((r) => member.roles.cache.has(r)))
            return true;
        if (ticket.teamID) {
            const team = await database_1.TicketsDatabase.getTeam(ticket.teamID);
            if (team) {
                if (requireDelete && !team.canDelete)
                    return false;
                if (team.members.includes(interaction.user.id))
                    return true;
                if (team.roles.some((r) => member.roles.cache.has(r)))
                    return true;
            }
        }
        // Ticket opener can close/reopen their own ticket (not claim/lock/delete)
        if (!requireDelete && ticket.openerID === interaction.user.id)
            return true;
        return false;
    }
}
exports.TicketsInteractionHandler = TicketsInteractionHandler;
//# sourceMappingURL=TicketsInteractionHandler.js.map