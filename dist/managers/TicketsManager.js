"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketsManager = void 0;
const discord_js_1 = require("discord.js");
const database_1 = require("../structures/database");
const entities_1 = require("../structures/entities");
const TranscriptGenerator_1 = require("./TranscriptGenerator");
const SLAManager_1 = require("./SLAManager");
const TicketsInteractionHandler_1 = require("../handlers/TicketsInteractionHandler");
const noop_1 = __importDefault(require("../functions/noop"));
class TicketsManager {
    client;
    emitter;
    slaManager;
    autoCloseTimers = new Map();
    deleteTimers = new Map();
    constructor(client, emitter) {
        this.client = client;
        this.emitter = emitter;
        this.slaManager = new SLAManager_1.SLAManager(client, emitter);
        this._restoreTimers();
    }
    // ─── Open ─────────────────────────────────────────────────────────────
    async openTicket(options) {
        const { guildID, openerID, categoryID, member, subject, formAnswers, priority } = options;
        const guild = this.client.guilds.cache.get(guildID);
        if (!guild)
            return null;
        const settings = await database_1.TicketsDatabase.getSettings(guildID);
        settings.totalTickets++;
        await database_1.TicketsDatabase.saveSettings(settings);
        const category = categoryID ? await database_1.TicketsDatabase.getCategory(categoryID) : null;
        // Determine team via smart routing
        const teamID = category ? await this._routeTicket(category, formAnswers, subject) : undefined;
        const team = teamID ? await database_1.TicketsDatabase.getTeam(teamID) : null;
        // Increment category counter
        if (category) {
            category.ticketCount++;
            await database_1.TicketsDatabase.saveCategory(category);
        }
        // Build channel name from template
        const channelName = category
            ? category.channelNameTemplate
                .replace("{count}", String(settings.totalTickets).padStart(4, "0"))
                .replace("{id}", openerID)
                .replace("{username}", member.user.username.replace(/[^a-z0-9-]/gi, "").toLowerCase())
            : `ticket-${String(settings.totalTickets).padStart(4, "0")}`;
        // Create the ticket channel
        const parentID = category?.parentChannelID;
        const channel = await guild.channels
            .create({
            name: channelName,
            type: discord_js_1.ChannelType.GuildText,
            parent: parentID ?? undefined,
            permissionOverwrites: this._buildPermissions(guild.id, openerID, category, team),
        })
            .catch(noop_1.default);
        if (!channel)
            return null;
        // Create ticket entity
        const ticket = new entities_1.Ticket({
            guildID,
            channelID: channel.id,
            openerID,
            categoryID: categoryID ?? undefined,
            teamID: teamID ?? undefined,
            state: entities_1.TicketState.Open,
            priority: priority ?? entities_1.TicketPriority.Medium,
            number: settings.totalTickets,
            subject,
            formAnswers,
            participants: [openerID],
        });
        // Initialise SLA status
        if (category?.sla) {
            ticket.slaStatus = {
                responseBreached: false,
                resolutionBreached: false,
            };
        }
        await database_1.TicketsDatabase.saveTicket(ticket);
        // Send the opening embed + control buttons
        await this._sendOpenEmbed(channel, ticket, category, team, member);
        // Ping team if enabled
        if (team?.pingOnOpen) {
            const mentions = [...team.roles.map((r) => `<@&${r}>`), ...team.members.map((m) => `<@${m}>`)].join(" ");
            if (mentions)
                await channel
                    .send({ content: mentions, flags: discord_js_1.MessageFlags.SuppressNotifications })
                    .catch(noop_1.default);
        }
        // Ping global staff
        if (settings.globalStaffRoles.length) {
            const mentions = settings.globalStaffRoles.map((r) => `<@&${r}>`).join(" ");
            if (mentions)
                await channel
                    .send({ content: mentions, flags: discord_js_1.MessageFlags.SuppressNotifications })
                    .catch(noop_1.default);
        }
        this.emitter.emit("ticketOpen", ticket);
        // DM opener
        if (settings.dmOnOpen) {
            const user = await this.client.users.fetch(openerID).catch(noop_1.default);
            user?.send({
                content: `✅ Your ticket **#${ticket.number}** has been created in **${guild.name}**: <#${channel.id}>`,
            }).catch(noop_1.default);
        }
        // Start SLA timer
        if (category?.sla) {
            this.slaManager.startSLA(ticket, category.sla);
        }
        // Start auto-close inactivity timer
        if (category?.autoCloseAfter && category.autoCloseAfter > 0) {
            this._scheduleAutoClose(ticket, category.autoCloseAfter);
        }
        // Log event
        await this._log(guildID, `🎫 Ticket **#${ticket.number}** opened by <@${openerID}>${category ? ` in **${category.name}**` : ""}`, 0x57f287);
        return ticket;
    }
    // ─── Close ────────────────────────────────────────────────────────────
    async closeTicket(ticketID, closedBy, reason) {
        const ticket = await database_1.TicketsDatabase.getTicket(ticketID);
        if (!ticket || !ticket.isActive())
            return null;
        const category = ticket.categoryID ? await database_1.TicketsDatabase.getCategory(ticket.categoryID) : null;
        const channel = this.client.channels.cache.get(ticket.channelID);
        // Generate transcript before modifying state
        if (channel && category) {
            await TranscriptGenerator_1.TranscriptGenerator.generate(ticket, channel, category).catch(noop_1.default);
        }
        ticket.state = entities_1.TicketState.Closed;
        ticket.closedAt = Date.now();
        ticket.closedBy = closedBy;
        ticket.closeReason = reason;
        await database_1.TicketsDatabase.saveTicket(ticket);
        this.slaManager.clearSLA(ticketID);
        this._clearAutoClose(ticketID);
        // Update channel — remove opener's access, send close embed
        if (channel) {
            const opener = await this.client.users.fetch(ticket.openerID).catch(noop_1.default);
            if (opener) {
                await channel.permissionOverwrites.edit(opener, { SendMessages: false, ViewChannel: false }).catch(noop_1.default);
            }
            await this._sendCloseEmbed(channel, ticket, category, closedBy);
        }
        this.emitter.emit("ticketClose", ticket, closedBy);
        const settings = await database_1.TicketsDatabase.getSettings(ticket.guildID);
        if (settings.dmOnClose) {
            const opener = await this.client.users.fetch(ticket.openerID).catch(noop_1.default);
            opener
                ?.send({ content: `📬 Your ticket **#${ticket.number}** has been closed. Reason: ${reason ?? "None"}` })
                .catch(noop_1.default);
        }
        if (category?.deleteAfter && category.deleteAfter > 0) {
            this._scheduleDelete(ticket, category.deleteAfter);
        }
        await this._log(ticket.guildID, `🔒 Ticket **#${ticket.number}** closed by <@${closedBy}>${reason ? `. Reason: ${reason}` : ""}`, 0xed4245);
        return ticket;
    }
    // ─── Claim ────────────────────────────────────────────────────────────
    async claimTicket(ticketID, claimedBy) {
        const ticket = await database_1.TicketsDatabase.getTicket(ticketID);
        if (!ticket || !ticket.isActive())
            return null;
        ticket.claimedBy = claimedBy;
        ticket.state = entities_1.TicketState.Claimed;
        ticket.touch();
        await database_1.TicketsDatabase.saveTicket(ticket);
        // Give claimer exclusive send permissions
        const channel = this.client.channels.cache.get(ticket.channelID);
        if (channel) {
            await channel.permissionOverwrites.edit(claimedBy, { SendMessages: true, ViewChannel: true }).catch(noop_1.default);
            await channel
                .send({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setDescription(`🎯 This ticket has been claimed by <@${claimedBy}>.`)
                        .setColor(0x5865f2)
                        .setTimestamp(),
                ],
            })
                .catch(noop_1.default);
        }
        this.emitter.emit("ticketClaim", ticket, claimedBy);
        // Reset SLA response timer — first response happened
        if (ticket.slaStatus && !ticket.slaStatus.firstResponseAt) {
            ticket.slaStatus.firstResponseAt = Date.now();
            await database_1.TicketsDatabase.saveTicket(ticket);
            this.slaManager.markFirstResponse(ticketID);
        }
        await this._log(ticket.guildID, `🎯 Ticket **#${ticket.number}** claimed by <@${claimedBy}>`, 0x5865f2);
        return ticket;
    }
    // ─── Unclaim ──────────────────────────────────────────────────────────
    async unclaimTicket(ticketID, unclaimedBy) {
        const ticket = await database_1.TicketsDatabase.getTicket(ticketID);
        if (!ticket)
            return null;
        const prev = ticket.claimedBy;
        ticket.claimedBy = undefined;
        ticket.state = entities_1.TicketState.Open;
        ticket.touch();
        await database_1.TicketsDatabase.saveTicket(ticket);
        const channel = this.client.channels.cache.get(ticket.channelID);
        if (channel) {
            if (prev)
                await channel.permissionOverwrites.delete(prev).catch(noop_1.default);
            await channel
                .send({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setDescription(`↩️ This ticket has been unclaimed by <@${unclaimedBy}>.`)
                        .setColor(0xfee75c)
                        .setTimestamp(),
                ],
            })
                .catch(noop_1.default);
        }
        this.emitter.emit("ticketUnclaim", ticket, unclaimedBy);
        await this._log(ticket.guildID, `↩️ Ticket **#${ticket.number}** unclaimed by <@${unclaimedBy}>`, 0xfee75c);
        return ticket;
    }
    // ─── Lock ─────────────────────────────────────────────────────────────
    async lockTicket(ticketID, lockedBy) {
        const ticket = await database_1.TicketsDatabase.getTicket(ticketID);
        if (!ticket)
            return null;
        ticket.state = entities_1.TicketState.Locked;
        ticket.touch();
        await database_1.TicketsDatabase.saveTicket(ticket);
        const channel = this.client.channels.cache.get(ticket.channelID);
        if (channel) {
            const opener = await this.client.users.fetch(ticket.openerID).catch(noop_1.default);
            if (opener)
                await channel.permissionOverwrites.edit(opener, { SendMessages: false }).catch(noop_1.default);
            await channel
                .send({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setDescription(`🔐 This ticket has been locked by <@${lockedBy}>. The opener can no longer send messages.`)
                        .setColor(0xed4245)
                        .setTimestamp(),
                ],
            })
                .catch(noop_1.default);
        }
        this.emitter.emit("ticketLock", ticket, lockedBy);
        await this._log(ticket.guildID, `🔐 Ticket **#${ticket.number}** locked by <@${lockedBy}>`, 0xed4245);
        return ticket;
    }
    // ─── Unlock ───────────────────────────────────────────────────────────
    async unlockTicket(ticketID, unlockedBy) {
        const ticket = await database_1.TicketsDatabase.getTicket(ticketID);
        if (!ticket)
            return null;
        ticket.state = entities_1.TicketState.Open;
        ticket.touch();
        await database_1.TicketsDatabase.saveTicket(ticket);
        const channel = this.client.channels.cache.get(ticket.channelID);
        if (channel) {
            const opener = await this.client.users.fetch(ticket.openerID).catch(noop_1.default);
            if (opener)
                await channel.permissionOverwrites.edit(opener, { SendMessages: true }).catch(noop_1.default);
            await channel
                .send({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setDescription(`🔓 This ticket has been unlocked by <@${unlockedBy}>.`)
                        .setColor(0x57f287)
                        .setTimestamp(),
                ],
            })
                .catch(noop_1.default);
        }
        this.emitter.emit("ticketUnlock", ticket, unlockedBy);
        await this._log(ticket.guildID, `🔓 Ticket **#${ticket.number}** unlocked by <@${unlockedBy}>`, 0x57f287);
        return ticket;
    }
    // ─── Reopen ───────────────────────────────────────────────────────────
    async reopenTicket(ticketID, reopenedBy) {
        const ticket = await database_1.TicketsDatabase.getTicket(ticketID);
        if (!ticket || ticket.state !== entities_1.TicketState.Closed)
            return null;
        const category = ticket.categoryID ? await database_1.TicketsDatabase.getCategory(ticket.categoryID) : null;
        const channel = this.client.channels.cache.get(ticket.channelID);
        ticket.state = entities_1.TicketState.Open;
        ticket.closedAt = undefined;
        ticket.closedBy = undefined;
        ticket.closeReason = undefined;
        ticket.touch();
        await database_1.TicketsDatabase.saveTicket(ticket);
        if (channel) {
            const opener = await this.client.users.fetch(ticket.openerID).catch(noop_1.default);
            if (opener)
                await channel.permissionOverwrites.edit(opener, { SendMessages: true, ViewChannel: true }).catch(noop_1.default);
            await channel
                .send({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setDescription(`🔄 This ticket has been reopened by <@${reopenedBy}>.`)
                        .setColor(0x57f287)
                        .setTimestamp(),
                ],
            })
                .catch(noop_1.default);
        }
        this.emitter.emit("ticketReopen", ticket);
        // Restart SLA if applicable
        if (category?.sla && ticket.slaStatus) {
            this.slaManager.startSLA(ticket, category.sla);
        }
        if (category?.autoCloseAfter && category.autoCloseAfter > 0) {
            this._scheduleAutoClose(ticket, category.autoCloseAfter);
        }
        await this._log(ticket.guildID, `🔄 Ticket **#${ticket.number}** reopened by <@${reopenedBy}>`, 0x57f287);
        return ticket;
    }
    // ─── Delete ───────────────────────────────────────────────────────────
    async deleteTicket(ticketID) {
        const ticket = await database_1.TicketsDatabase.getTicket(ticketID);
        if (!ticket)
            return false;
        const channel = this.client.channels.cache.get(ticket.channelID);
        await channel?.delete("Ticket deleted").catch(noop_1.default);
        ticket.deleted = true;
        await database_1.TicketsDatabase.saveTicket(ticket);
        this.slaManager.clearSLA(ticketID);
        this._clearAutoClose(ticketID);
        this._clearDelete(ticketID);
        this.emitter.emit("ticketDelete", ticket);
        await this._log(ticket.guildID, `🗑️ Ticket **#${ticket.number}** deleted (opened by <@${ticket.openerID}>)`, 0xeb459e);
        return true;
    }
    // ─── Transfer ─────────────────────────────────────────────────────────
    async transferTicket(ticketID, newTeamID) {
        const ticket = await database_1.TicketsDatabase.getTicket(ticketID);
        if (!ticket)
            return null;
        const oldTeamID = ticket.teamID;
        const newTeam = await database_1.TicketsDatabase.getTeam(newTeamID);
        if (!newTeam)
            return null;
        ticket.teamID = newTeamID;
        ticket.claimedBy = undefined;
        ticket.state = entities_1.TicketState.Open;
        ticket.touch();
        await database_1.TicketsDatabase.saveTicket(ticket);
        const channel = this.client.channels.cache.get(ticket.channelID);
        if (channel) {
            // Re-apply permissions for new team
            const overwrites = await this._buildTeamOverwrites(newTeam);
            for (const [id, perms] of overwrites) {
                await channel.permissionOverwrites.edit(id, perms).catch(noop_1.default);
            }
            await channel
                .send({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setDescription(`↗️ This ticket has been transferred to **${newTeam.name}**.`)
                        .setColor(0x5865f2)
                        .setTimestamp(),
                ],
            })
                .catch(noop_1.default);
        }
        this.emitter.emit("ticketTransfer", ticket, oldTeamID, newTeamID);
        await this._log(ticket.guildID, `↗️ Ticket **#${ticket.number}** transferred to team **${newTeam.name}**`, 0x5865f2);
        return ticket;
    }
    // ─── Add/Remove Participant ────────────────────────────────────────────
    async addParticipant(ticketID, userID) {
        const ticket = await database_1.TicketsDatabase.getTicket(ticketID);
        if (!ticket || ticket.participants.includes(userID))
            return ticket;
        ticket.participants.push(userID);
        ticket.touch();
        await database_1.TicketsDatabase.saveTicket(ticket);
        const channel = this.client.channels.cache.get(ticket.channelID);
        if (channel) {
            await channel.permissionOverwrites
                .edit(userID, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true })
                .catch(noop_1.default);
        }
        return ticket;
    }
    async removeParticipant(ticketID, userID) {
        const ticket = await database_1.TicketsDatabase.getTicket(ticketID);
        if (!ticket)
            return null;
        ticket.participants = ticket.participants.filter((p) => p !== userID);
        ticket.touch();
        await database_1.TicketsDatabase.saveTicket(ticket);
        const channel = this.client.channels.cache.get(ticket.channelID);
        if (channel) {
            await channel.permissionOverwrites.delete(userID).catch(noop_1.default);
        }
        return ticket;
    }
    // ─── Tags ─────────────────────────────────────────────────────────────
    async addTag(ticketID, tag) {
        const ticket = await database_1.TicketsDatabase.getTicket(ticketID);
        if (!ticket || ticket.tags.includes(tag))
            return ticket;
        ticket.tags.push(tag);
        await database_1.TicketsDatabase.saveTicket(ticket);
        this.emitter.emit("ticketTagAdd", ticket, tag);
        return ticket;
    }
    async removeTag(ticketID, tag) {
        const ticket = await database_1.TicketsDatabase.getTicket(ticketID);
        if (!ticket)
            return null;
        ticket.tags = ticket.tags.filter((t) => t !== tag);
        await database_1.TicketsDatabase.saveTicket(ticket);
        this.emitter.emit("ticketTagRemove", ticket, tag);
        return ticket;
    }
    // ─── Priority ─────────────────────────────────────────────────────────
    async setPriority(ticketID, priority) {
        const ticket = await database_1.TicketsDatabase.getTicket(ticketID);
        if (!ticket)
            return null;
        const old = ticket.priority;
        ticket.priority = priority;
        await database_1.TicketsDatabase.saveTicket(ticket);
        this.emitter.emit("ticketPriorityChange", ticket, old, priority);
        await this._log(ticket.guildID, `⚡ Ticket **#${ticket.number}** priority changed from **${old}** to **${priority}**`, 0xfee75c);
        return ticket;
    }
    // ─── Notes ────────────────────────────────────────────────────────────
    async addNote(ticketID, authorID, content) {
        const ticket = await database_1.TicketsDatabase.getTicket(ticketID);
        if (!ticket)
            return null;
        ticket.addNote(authorID, content);
        await database_1.TicketsDatabase.saveTicket(ticket);
        this.emitter.emit("ticketNoteAdd", ticket, authorID, content);
        return ticket;
    }
    // ─── Smart Routing ────────────────────────────────────────────────────
    async _routeTicket(category, formAnswers, subject) {
        if (!category.teamID && !category.routingRules?.length)
            return undefined;
        // Check routing rules first
        if (category.routingRules?.length && (formAnswers || subject)) {
            for (const rule of category.routingRules) {
                // Keyword matching against subject
                if (rule.keywords?.length && subject) {
                    const lc = subject.toLowerCase();
                    if (rule.keywords.some((kw) => lc.includes(kw.toLowerCase()))) {
                        return rule.targetTeamID;
                    }
                }
                // Form answer matching
                if (rule.formAnswers && formAnswers) {
                    const allMatch = Object.entries(rule.formAnswers).every(([k, v]) => formAnswers[k]?.toLowerCase().includes(v.toLowerCase()));
                    if (allMatch)
                        return rule.targetTeamID;
                }
            }
        }
        if (!category.teamID)
            return undefined;
        // Default team with routing strategy
        const team = await database_1.TicketsDatabase.getTeam(category.teamID);
        if (!team)
            return undefined;
        if (category.routingStrategy === entities_1.RoutingStrategy.RoundRobin) {
            const members = team.members.length ? team.members : team.roles;
            const idx = team.rrIndex % members.length;
            team.rrIndex = (team.rrIndex + 1) % Math.max(members.length, 1);
            await database_1.TicketsDatabase.saveTeam(team);
        }
        return team.id;
    }
    // ─── Channel Permissions ──────────────────────────────────────────────
    _buildPermissions(guildID, openerID, category, team) {
        const base = [
            // Deny @everyone
            { id: guildID, deny: [discord_js_1.PermissionsBitField.Flags.ViewChannel] },
            // Allow opener
            {
                id: openerID,
                allow: [
                    discord_js_1.PermissionsBitField.Flags.ViewChannel,
                    discord_js_1.PermissionsBitField.Flags.SendMessages,
                    discord_js_1.PermissionsBitField.Flags.ReadMessageHistory,
                    discord_js_1.PermissionsBitField.Flags.AttachFiles,
                ],
            },
        ];
        // Category staff roles
        if (category?.staffRoles) {
            for (const role of category.staffRoles) {
                base.push({
                    id: role,
                    allow: [
                        discord_js_1.PermissionsBitField.Flags.ViewChannel,
                        discord_js_1.PermissionsBitField.Flags.SendMessages,
                        discord_js_1.PermissionsBitField.Flags.ReadMessageHistory,
                        discord_js_1.PermissionsBitField.Flags.ManageMessages,
                        discord_js_1.PermissionsBitField.Flags.AttachFiles,
                    ],
                });
            }
        }
        // Team roles and members
        if (team) {
            for (const role of team.roles) {
                base.push({
                    id: role,
                    allow: [
                        discord_js_1.PermissionsBitField.Flags.ViewChannel,
                        discord_js_1.PermissionsBitField.Flags.SendMessages,
                        discord_js_1.PermissionsBitField.Flags.ReadMessageHistory,
                        discord_js_1.PermissionsBitField.Flags.ManageMessages,
                        discord_js_1.PermissionsBitField.Flags.AttachFiles,
                    ],
                });
            }
            for (const member of team.members) {
                base.push({
                    id: member,
                    allow: [
                        discord_js_1.PermissionsBitField.Flags.ViewChannel,
                        discord_js_1.PermissionsBitField.Flags.SendMessages,
                        discord_js_1.PermissionsBitField.Flags.ReadMessageHistory,
                        discord_js_1.PermissionsBitField.Flags.ManageMessages,
                        discord_js_1.PermissionsBitField.Flags.AttachFiles,
                    ],
                });
            }
        }
        return base;
    }
    async _buildTeamOverwrites(team) {
        const map = new Map();
        const allow = [
            discord_js_1.PermissionsBitField.Flags.ViewChannel,
            discord_js_1.PermissionsBitField.Flags.SendMessages,
            discord_js_1.PermissionsBitField.Flags.ReadMessageHistory,
            discord_js_1.PermissionsBitField.Flags.ManageMessages,
        ];
        for (const role of team.roles)
            map.set(role, { allow });
        for (const member of team.members)
            map.set(member, { allow });
        return map;
    }
    // ─── Embeds ───────────────────────────────────────────────────────────
    async _sendOpenEmbed(channel, ticket, category, team, member) {
        const embedDef = category?.openEmbed;
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(embedDef?.title ?? `🎫 Ticket #${ticket.number}`)
            .setDescription(embedDef?.description ??
            `Hello <@${ticket.openerID}>, welcome to your ticket!\nSupport staff will be with you shortly. Please describe your issue in detail.`)
            .setColor(embedDef?.color ?? 0x5865f2)
            .setTimestamp()
            .addFields({ name: "Category", value: category?.name ?? "General", inline: true }, {
            name: "Priority",
            value: `${this._priorityEmoji(ticket.priority)} ${ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}`,
            inline: true,
        }, { name: "Opened by", value: `<@${ticket.openerID}>`, inline: true });
        if (embedDef?.footerText)
            embed.setFooter({ text: embedDef.footerText, iconURL: embedDef.footerIconURL });
        if (embedDef?.thumbnailURL)
            embed.setThumbnail(embedDef.thumbnailURL);
        if (embedDef?.imageURL)
            embed.setImage(embedDef.imageURL);
        // Show form answers in embed
        if (ticket.formAnswers && Object.keys(ticket.formAnswers).length) {
            const category_ = ticket.categoryID
                ? await database_1.TicketsDatabase.getCategory(ticket.categoryID).catch(() => null)
                : null;
            for (const [key, value] of Object.entries(ticket.formAnswers)) {
                const fieldDef = category_?.form?.find((f) => f.key === key);
                embed.addFields({ name: fieldDef?.label ?? key, value: value || "N/A", inline: false });
            }
        }
        if (team)
            embed.addFields({ name: "Assigned Team", value: team.name, inline: true });
        // SLA footer note
        if (category?.sla?.responseTime) {
            embed.addFields({
                name: "⏱️ Response SLA",
                value: `${this._formatDuration(category.sla.responseTime)}`,
                inline: true,
            });
        }
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId((0, TicketsInteractionHandler_1.encodeCID)(TicketsInteractionHandler_1.CID.TICKET_CLOSE, ticket.id))
            .setLabel("Close")
            .setEmoji("🔒")
            .setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder()
            .setCustomId((0, TicketsInteractionHandler_1.encodeCID)(TicketsInteractionHandler_1.CID.TICKET_CLAIM, ticket.id))
            .setLabel("Claim")
            .setEmoji("🎯")
            .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
            .setCustomId((0, TicketsInteractionHandler_1.encodeCID)(TicketsInteractionHandler_1.CID.TICKET_LOCK, ticket.id))
            .setLabel("Lock")
            .setEmoji("🔐")
            .setStyle(discord_js_1.ButtonStyle.Secondary));
        await channel.send({ embeds: [embed], components: [row] }).catch(noop_1.default);
    }
    async _sendCloseEmbed(channel, ticket, category, closedBy) {
        const embedDef = category?.closeEmbed;
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(embedDef?.title ?? `🔒 Ticket Closed`)
            .setDescription(embedDef?.description ?? `This ticket has been closed by <@${closedBy}>.`)
            .setColor(embedDef?.color ?? 0xed4245)
            .setTimestamp()
            .addFields({ name: "Ticket #", value: `${ticket.number}`, inline: true }, { name: "Opened by", value: `<@${ticket.openerID}>`, inline: true }, { name: "Closed by", value: `<@${closedBy}>`, inline: true }, { name: "Close reason", value: ticket.closeReason ?? "None", inline: false });
        if (ticket.slaStatus) {
            embed.addFields({
                name: "First Response",
                value: ticket.slaStatus.firstResponseAt ? (0, discord_js_1.time)(new Date(ticket.slaStatus.firstResponseAt)) : "N/A",
                inline: true,
            }, {
                name: "SLA Breached",
                value: ticket.slaStatus.responseBreached || ticket.slaStatus.resolutionBreached ? "⚠️ Yes" : "✅ No",
                inline: true,
            });
        }
        if (embedDef?.footerText)
            embed.setFooter({ text: embedDef.footerText, iconURL: embedDef.footerIconURL });
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId((0, TicketsInteractionHandler_1.encodeCID)(TicketsInteractionHandler_1.CID.TICKET_REOPEN, ticket.id))
            .setLabel("Reopen")
            .setEmoji("🔄")
            .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
            .setCustomId((0, TicketsInteractionHandler_1.encodeCID)(TicketsInteractionHandler_1.CID.TICKET_DELETE, ticket.id))
            .setLabel("Delete")
            .setEmoji("🗑️")
            .setStyle(discord_js_1.ButtonStyle.Danger));
        await channel.send({ embeds: [embed], components: [row] }).catch(noop_1.default);
    }
    // ─── Auto-close timer ─────────────────────────────────────────────────
    _scheduleAutoClose(ticket, delay) {
        this._clearAutoClose(ticket.id);
        const timer = setTimeout(async () => {
            const fresh = await database_1.TicketsDatabase.getTicket(ticket.id);
            if (!fresh || !fresh.isActive())
                return;
            const inactive = Date.now() - (fresh.lastActivityAt ?? fresh.createdAt);
            if (inactive >= delay) {
                await this.closeTicket(ticket.id, this.client.user.id, "Auto-closed due to inactivity");
            }
            else {
                this._scheduleAutoClose(fresh, delay - inactive);
            }
        }, delay);
        this.autoCloseTimers.set(ticket.id, timer);
    }
    _clearAutoClose(ticketID) {
        const timer = this.autoCloseTimers.get(ticketID);
        if (timer) {
            clearTimeout(timer);
            this.autoCloseTimers.delete(ticketID);
        }
    }
    // ─── Auto-delete timer ────────────────────────────────────────────────
    _scheduleDelete(ticket, delay) {
        this._clearDelete(ticket.id);
        const timer = setTimeout(async () => {
            await this.deleteTicket(ticket.id);
        }, delay);
        this.deleteTimers.set(ticket.id, timer);
    }
    _clearDelete(ticketID) {
        const timer = this.deleteTimers.get(ticketID);
        if (timer) {
            clearTimeout(timer);
            this.deleteTimers.delete(ticketID);
        }
    }
    // ─── Restore timers on startup ─────────────────────────────────────────
    async _restoreTimers() {
        // Wait for bot to be ready
        this.client.once("clientReady", async () => {
            const guilds = this.client.guilds.cache;
            for (const [, guild] of guilds) {
                const tickets = await database_1.TicketsDatabase.getActiveTickets(guild.id);
                for (const ticket of tickets) {
                    const category = ticket.categoryID ? await database_1.TicketsDatabase.getCategory(ticket.categoryID) : null;
                    if (category?.sla)
                        this.slaManager.startSLA(ticket, category.sla);
                    if (category?.autoCloseAfter && category.autoCloseAfter > 0) {
                        const elapsed = Date.now() - (ticket.lastActivityAt ?? ticket.createdAt);
                        const remaining = category.autoCloseAfter - elapsed;
                        if (remaining <= 0) {
                            this.closeTicket(ticket.id, this.client.user.id, "Auto-closed due to inactivity").catch(noop_1.default);
                        }
                        else {
                            this._scheduleAutoClose(ticket, remaining);
                        }
                    }
                }
            }
        });
    }
    // ─── Logging ──────────────────────────────────────────────────────────
    async _log(guildID, message, color) {
        const settings = await database_1.TicketsDatabase.getSettings(guildID);
        if (!settings.logChannelID)
            return;
        const ch = this.client.channels.cache.get(settings.logChannelID);
        ch?.send({
            embeds: [new discord_js_1.EmbedBuilder().setDescription(message).setColor(color).setTimestamp()],
        }).catch(noop_1.default);
    }
    // ─── Helpers ──────────────────────────────────────────────────────────
    _priorityEmoji(priority) {
        const map = {
            [entities_1.TicketPriority.Low]: "🟢",
            [entities_1.TicketPriority.Medium]: "🟡",
            [entities_1.TicketPriority.High]: "🟠",
            [entities_1.TicketPriority.Urgent]: "🔴",
        };
        return map[priority] ?? "⚪";
    }
    _formatDuration(ms) {
        const s = ms / 1000;
        if (s < 60)
            return `${s}s`;
        const m = Math.floor(s / 60);
        if (m < 60)
            return `${m}m`;
        const h = Math.floor(m / 60);
        if (h < 24)
            return `${h}h`;
        return `${Math.floor(h / 24)}d`;
    }
}
exports.TicketsManager = TicketsManager;
//# sourceMappingURL=TicketsManager.js.map