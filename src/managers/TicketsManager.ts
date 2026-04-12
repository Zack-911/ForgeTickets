import type { Snowflake, TextChannel, GuildMember } from "discord.js"
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    EmbedBuilder,
    MessageFlags,
    PermissionsBitField,
    time,
} from "discord.js"
import { ForgeClient } from "@tryforge/forgescript"
import { ForgeTickets } from ".."
import { TicketsDatabase } from "../structures/database"
import {
    Ticket,
    TicketCategory,
    TicketState,
    TicketPriority,
    TicketTeam,
    RoutingStrategy,
    ICategoryEmbed,
} from "../structures/entities"
import { ITicketEvents } from "../handlers"
import { TranscriptGenerator } from "./TranscriptGenerator"
import { SLAManager } from "./SLAManager"
import { encodeCID, CID } from "../handlers/TicketsInteractionHandler"
import noop from "../functions/noop"
import { TypedEmitter } from "tiny-typed-emitter"
import { TransformEvents } from "@tryforge/forge.db"

export interface IOpenTicketOptions {
    guildID: Snowflake
    openerID: Snowflake
    categoryID?: string
    member: GuildMember
    subject?: string
    formAnswers?: Record<string, string>
    priority?: TicketPriority
}

export class TicketsManager {
    private slaManager: SLAManager
    private autoCloseTimers = new Map<string, NodeJS.Timeout>()
    private deleteTimers = new Map<string, NodeJS.Timeout>()

    constructor(
        private readonly client: ForgeClient,
        private readonly emitter: TypedEmitter<TransformEvents<ITicketEvents>>
    ) {
        this.slaManager = new SLAManager(client, emitter)
        this._restoreTimers()
    }

    // ─── Open ─────────────────────────────────────────────────────────────

    public async openTicket(options: IOpenTicketOptions): Promise<Ticket | null> {
        const { guildID, openerID, categoryID, member, subject, formAnswers, priority } = options
        const guild = this.client.guilds.cache.get(guildID)
        if (!guild) return null

        const settings = await TicketsDatabase.getSettings(guildID)
        settings.totalTickets++
        await TicketsDatabase.saveSettings(settings)

        const category = categoryID ? await TicketsDatabase.getCategory(categoryID) : null

        // Determine team via smart routing
        const teamID = category ? await this._routeTicket(category, formAnswers, subject) : undefined
        const team = teamID ? await TicketsDatabase.getTeam(teamID) : null

        // Increment category counter
        if (category) {
            category.ticketCount++
            await TicketsDatabase.saveCategory(category)
        }

        // Build channel name from template
        const channelName = category
            ? category.channelNameTemplate
                  .replace("{count}", String(settings.totalTickets).padStart(4, "0"))
                  .replace("{id}", openerID)
                  .replace("{username}", member.user.username.replace(/[^a-z0-9-]/gi, "").toLowerCase())
            : `ticket-${String(settings.totalTickets).padStart(4, "0")}`

        // Create the ticket channel
        const parentID = category?.parentChannelID
        const channel = await guild.channels
            .create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: parentID ?? undefined,
                permissionOverwrites: this._buildPermissions(guild.id, openerID, category, team),
            })
            .catch(noop)

        if (!channel) return null

        // Create ticket entity
        const ticket = new Ticket({
            guildID,
            channelID: channel.id,
            openerID,
            categoryID: categoryID ?? undefined,
            teamID: teamID ?? undefined,
            state: TicketState.Open,
            priority: priority ?? TicketPriority.Medium,
            number: settings.totalTickets,
            subject,
            formAnswers,
            participants: [openerID],
        })

        // Initialise SLA status
        if (category?.sla) {
            ticket.slaStatus = {
                responseBreached: false,
                resolutionBreached: false,
            }
        }

        await TicketsDatabase.saveTicket(ticket)

        // Send the opening embed + control buttons
        await this._sendOpenEmbed(channel as TextChannel, ticket, category, team, member)

        // Ping team if enabled
        if (team?.pingOnOpen) {
            const mentions = [...team.roles.map((r) => `<@&${r}>`), ...team.members.map((m) => `<@${m}>`)].join(" ")
            if (mentions)
                await (channel as TextChannel)
                    .send({ content: mentions, flags: MessageFlags.SuppressNotifications })
                    .catch(noop)
        }

        // Ping global staff
        if (settings.globalStaffRoles.length) {
            const mentions = settings.globalStaffRoles.map((r) => `<@&${r}>`).join(" ")
            if (mentions)
                await (channel as TextChannel)
                    .send({ content: mentions, flags: MessageFlags.SuppressNotifications })
                    .catch(noop)
        }

        this.emitter.emit("ticketOpen", ticket)

        // DM opener
        if (settings.dmOnOpen) {
            const user = await this.client.users.fetch(openerID).catch(noop)
            user?.send({
                content: `✅ Your ticket **#${ticket.number}** has been created in **${guild.name}**: <#${channel.id}>`,
            }).catch(noop)
        }

        // Start SLA timer
        if (category?.sla) {
            this.slaManager.startSLA(ticket, category.sla)
        }

        // Start auto-close inactivity timer
        if (category?.autoCloseAfter && category.autoCloseAfter > 0) {
            this._scheduleAutoClose(ticket, category.autoCloseAfter)
        }

        // Log event
        await this._log(
            guildID,
            `🎫 Ticket **#${ticket.number}** opened by <@${openerID}>${category ? ` in **${category.name}**` : ""}`,
            0x57f287
        )

        return ticket
    }

    // ─── Close ────────────────────────────────────────────────────────────

    public async closeTicket(ticketID: string, closedBy: Snowflake, reason?: string): Promise<Ticket | null> {
        const ticket = await TicketsDatabase.getTicket(ticketID)
        if (!ticket || !ticket.isActive()) return null

        const category = ticket.categoryID ? await TicketsDatabase.getCategory(ticket.categoryID) : null
        const channel = this.client.channels.cache.get(ticket.channelID) as TextChannel | undefined

        // Generate transcript before modifying state
        if (channel && category) {
            await TranscriptGenerator.generate(ticket, channel, category).catch(noop)
        }

        ticket.state = TicketState.Closed
        ticket.closedAt = Date.now()
        ticket.closedBy = closedBy
        ticket.closeReason = reason
        await TicketsDatabase.saveTicket(ticket)

        this.slaManager.clearSLA(ticketID)
        this._clearAutoClose(ticketID)

        // Update channel — remove opener's access, send close embed
        if (channel) {
            const opener = await this.client.users.fetch(ticket.openerID).catch(noop)
            if (opener) {
                await channel.permissionOverwrites.edit(opener, { SendMessages: false, ViewChannel: false }).catch(noop)
            }
            await this._sendCloseEmbed(channel, ticket, category, closedBy)
        }

        this.emitter.emit("ticketClose", ticket, closedBy)

        const settings = await TicketsDatabase.getSettings(ticket.guildID)
        if (settings.dmOnClose) {
            const opener = await this.client.users.fetch(ticket.openerID).catch(noop)
            opener
                ?.send({ content: `📬 Your ticket **#${ticket.number}** has been closed. Reason: ${reason ?? "None"}` })
                .catch(noop)
        }

        if (category?.deleteAfter && category.deleteAfter > 0) {
            this._scheduleDelete(ticket, category.deleteAfter)
        }

        await this._log(
            ticket.guildID,
            `🔒 Ticket **#${ticket.number}** closed by <@${closedBy}>${reason ? `. Reason: ${reason}` : ""}`,
            0xed4245
        )
        return ticket
    }

    // ─── Claim ────────────────────────────────────────────────────────────

    public async claimTicket(ticketID: string, claimedBy: Snowflake): Promise<Ticket | null> {
        const ticket = await TicketsDatabase.getTicket(ticketID)
        if (!ticket || !ticket.isActive()) return null

        ticket.claimedBy = claimedBy
        ticket.state = TicketState.Claimed
        ticket.touch()
        await TicketsDatabase.saveTicket(ticket)

        // Give claimer exclusive send permissions
        const channel = this.client.channels.cache.get(ticket.channelID) as TextChannel | undefined
        if (channel) {
            await channel.permissionOverwrites.edit(claimedBy, { SendMessages: true, ViewChannel: true }).catch(noop)
            await channel
                .send({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(`🎯 This ticket has been claimed by <@${claimedBy}>.`)
                            .setColor(0x5865f2)
                            .setTimestamp(),
                    ],
                })
                .catch(noop)
        }

        this.emitter.emit("ticketClaim", ticket, claimedBy)

        // Reset SLA response timer — first response happened
        if (ticket.slaStatus && !ticket.slaStatus.firstResponseAt) {
            ticket.slaStatus.firstResponseAt = Date.now()
            await TicketsDatabase.saveTicket(ticket)
            this.slaManager.markFirstResponse(ticketID)
        }

        await this._log(ticket.guildID, `🎯 Ticket **#${ticket.number}** claimed by <@${claimedBy}>`, 0x5865f2)
        return ticket
    }

    // ─── Unclaim ──────────────────────────────────────────────────────────

    public async unclaimTicket(ticketID: string, unclaimedBy: Snowflake): Promise<Ticket | null> {
        const ticket = await TicketsDatabase.getTicket(ticketID)
        if (!ticket) return null

        const prev = ticket.claimedBy
        ticket.claimedBy = undefined
        ticket.state = TicketState.Open
        ticket.touch()
        await TicketsDatabase.saveTicket(ticket)

        const channel = this.client.channels.cache.get(ticket.channelID) as TextChannel | undefined
        if (channel) {
            if (prev) await channel.permissionOverwrites.delete(prev).catch(noop)
            await channel
                .send({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(`↩️ This ticket has been unclaimed by <@${unclaimedBy}>.`)
                            .setColor(0xfee75c)
                            .setTimestamp(),
                    ],
                })
                .catch(noop)
        }

        this.emitter.emit("ticketUnclaim", ticket, unclaimedBy)
        await this._log(ticket.guildID, `↩️ Ticket **#${ticket.number}** unclaimed by <@${unclaimedBy}>`, 0xfee75c)
        return ticket
    }

    // ─── Lock ─────────────────────────────────────────────────────────────

    public async lockTicket(ticketID: string, lockedBy: Snowflake): Promise<Ticket | null> {
        const ticket = await TicketsDatabase.getTicket(ticketID)
        if (!ticket) return null

        ticket.state = TicketState.Locked
        ticket.touch()
        await TicketsDatabase.saveTicket(ticket)

        const channel = this.client.channels.cache.get(ticket.channelID) as TextChannel | undefined
        if (channel) {
            const opener = await this.client.users.fetch(ticket.openerID).catch(noop)
            if (opener) await channel.permissionOverwrites.edit(opener, { SendMessages: false }).catch(noop)
            await channel
                .send({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(
                                `🔐 This ticket has been locked by <@${lockedBy}>. The opener can no longer send messages.`
                            )
                            .setColor(0xed4245)
                            .setTimestamp(),
                    ],
                })
                .catch(noop)
        }

        this.emitter.emit("ticketLock", ticket, lockedBy)
        await this._log(ticket.guildID, `🔐 Ticket **#${ticket.number}** locked by <@${lockedBy}>`, 0xed4245)
        return ticket
    }

    // ─── Unlock ───────────────────────────────────────────────────────────

    public async unlockTicket(ticketID: string, unlockedBy: Snowflake): Promise<Ticket | null> {
        const ticket = await TicketsDatabase.getTicket(ticketID)
        if (!ticket) return null

        ticket.state = TicketState.Open
        ticket.touch()
        await TicketsDatabase.saveTicket(ticket)

        const channel = this.client.channels.cache.get(ticket.channelID) as TextChannel | undefined
        if (channel) {
            const opener = await this.client.users.fetch(ticket.openerID).catch(noop)
            if (opener) await channel.permissionOverwrites.edit(opener, { SendMessages: true }).catch(noop)
            await channel
                .send({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(`🔓 This ticket has been unlocked by <@${unlockedBy}>.`)
                            .setColor(0x57f287)
                            .setTimestamp(),
                    ],
                })
                .catch(noop)
        }

        this.emitter.emit("ticketUnlock", ticket, unlockedBy)
        await this._log(ticket.guildID, `🔓 Ticket **#${ticket.number}** unlocked by <@${unlockedBy}>`, 0x57f287)
        return ticket
    }

    // ─── Reopen ───────────────────────────────────────────────────────────

    public async reopenTicket(ticketID: string, reopenedBy: Snowflake): Promise<Ticket | null> {
        const ticket = await TicketsDatabase.getTicket(ticketID)
        if (!ticket || ticket.state !== TicketState.Closed) return null

        const category = ticket.categoryID ? await TicketsDatabase.getCategory(ticket.categoryID) : null
        const channel = this.client.channels.cache.get(ticket.channelID) as TextChannel | undefined

        ticket.state = TicketState.Open
        ticket.closedAt = undefined
        ticket.closedBy = undefined
        ticket.closeReason = undefined
        ticket.touch()
        await TicketsDatabase.saveTicket(ticket)

        if (channel) {
            const opener = await this.client.users.fetch(ticket.openerID).catch(noop)
            if (opener)
                await channel.permissionOverwrites.edit(opener, { SendMessages: true, ViewChannel: true }).catch(noop)
            await channel
                .send({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(`🔄 This ticket has been reopened by <@${reopenedBy}>.`)
                            .setColor(0x57f287)
                            .setTimestamp(),
                    ],
                })
                .catch(noop)
        }

        this.emitter.emit("ticketReopen", ticket)

        // Restart SLA if applicable
        if (category?.sla && ticket.slaStatus) {
            this.slaManager.startSLA(ticket, category.sla)
        }

        if (category?.autoCloseAfter && category.autoCloseAfter > 0) {
            this._scheduleAutoClose(ticket, category.autoCloseAfter)
        }

        await this._log(ticket.guildID, `🔄 Ticket **#${ticket.number}** reopened by <@${reopenedBy}>`, 0x57f287)
        return ticket
    }

    // ─── Delete ───────────────────────────────────────────────────────────

    public async deleteTicket(ticketID: string): Promise<boolean> {
        const ticket = await TicketsDatabase.getTicket(ticketID)
        if (!ticket) return false

        const channel = this.client.channels.cache.get(ticket.channelID) as TextChannel | undefined
        await channel?.delete("Ticket deleted").catch(noop)

        ticket.deleted = true
        await TicketsDatabase.saveTicket(ticket)

        this.slaManager.clearSLA(ticketID)
        this._clearAutoClose(ticketID)
        this._clearDelete(ticketID)

        this.emitter.emit("ticketDelete", ticket)
        await this._log(
            ticket.guildID,
            `🗑️ Ticket **#${ticket.number}** deleted (opened by <@${ticket.openerID}>)`,
            0xeb459e
        )
        return true
    }

    // ─── Transfer ─────────────────────────────────────────────────────────

    public async transferTicket(ticketID: string, newTeamID: string): Promise<Ticket | null> {
        const ticket = await TicketsDatabase.getTicket(ticketID)
        if (!ticket) return null

        const oldTeamID = ticket.teamID
        const newTeam = await TicketsDatabase.getTeam(newTeamID)
        if (!newTeam) return null

        ticket.teamID = newTeamID
        ticket.claimedBy = undefined
        ticket.state = TicketState.Open
        ticket.touch()
        await TicketsDatabase.saveTicket(ticket)

        const channel = this.client.channels.cache.get(ticket.channelID) as TextChannel | undefined
        if (channel) {
            // Re-apply permissions for new team
            const overwrites = await this._buildTeamOverwrites(newTeam)
            for (const [id, perms] of overwrites) {
                await channel.permissionOverwrites.edit(id, perms).catch(noop)
            }
            await channel
                .send({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(`↗️ This ticket has been transferred to **${newTeam.name}**.`)
                            .setColor(0x5865f2)
                            .setTimestamp(),
                    ],
                })
                .catch(noop)
        }

        this.emitter.emit("ticketTransfer", ticket, oldTeamID, newTeamID)
        await this._log(
            ticket.guildID,
            `↗️ Ticket **#${ticket.number}** transferred to team **${newTeam.name}**`,
            0x5865f2
        )
        return ticket
    }

    // ─── Add/Remove Participant ────────────────────────────────────────────

    public async addParticipant(ticketID: string, userID: Snowflake): Promise<Ticket | null> {
        const ticket = await TicketsDatabase.getTicket(ticketID)
        if (!ticket || ticket.participants.includes(userID)) return ticket

        ticket.participants.push(userID)
        ticket.touch()
        await TicketsDatabase.saveTicket(ticket)

        const channel = this.client.channels.cache.get(ticket.channelID) as TextChannel | undefined
        if (channel) {
            await channel.permissionOverwrites
                .edit(userID, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true })
                .catch(noop)
        }
        return ticket
    }

    public async removeParticipant(ticketID: string, userID: Snowflake): Promise<Ticket | null> {
        const ticket = await TicketsDatabase.getTicket(ticketID)
        if (!ticket) return null

        ticket.participants = ticket.participants.filter((p) => p !== userID)
        ticket.touch()
        await TicketsDatabase.saveTicket(ticket)

        const channel = this.client.channels.cache.get(ticket.channelID) as TextChannel | undefined
        if (channel) {
            await channel.permissionOverwrites.delete(userID).catch(noop)
        }
        return ticket
    }

    // ─── Tags ─────────────────────────────────────────────────────────────

    public async addTag(ticketID: string, tag: string): Promise<Ticket | null> {
        const ticket = await TicketsDatabase.getTicket(ticketID)
        if (!ticket || ticket.tags.includes(tag)) return ticket
        ticket.tags.push(tag)
        await TicketsDatabase.saveTicket(ticket)
        this.emitter.emit("ticketTagAdd", ticket, tag)
        return ticket
    }

    public async removeTag(ticketID: string, tag: string): Promise<Ticket | null> {
        const ticket = await TicketsDatabase.getTicket(ticketID)
        if (!ticket) return null
        ticket.tags = ticket.tags.filter((t) => t !== tag)
        await TicketsDatabase.saveTicket(ticket)
        this.emitter.emit("ticketTagRemove", ticket, tag)
        return ticket
    }

    // ─── Priority ─────────────────────────────────────────────────────────

    public async setPriority(ticketID: string, priority: TicketPriority): Promise<Ticket | null> {
        const ticket = await TicketsDatabase.getTicket(ticketID)
        if (!ticket) return null
        const old = ticket.priority
        ticket.priority = priority
        await TicketsDatabase.saveTicket(ticket)
        this.emitter.emit("ticketPriorityChange", ticket, old, priority)
        await this._log(
            ticket.guildID,
            `⚡ Ticket **#${ticket.number}** priority changed from **${old}** to **${priority}**`,
            0xfee75c
        )
        return ticket
    }

    // ─── Notes ────────────────────────────────────────────────────────────

    public async addNote(ticketID: string, authorID: Snowflake, content: string): Promise<Ticket | null> {
        const ticket = await TicketsDatabase.getTicket(ticketID)
        if (!ticket) return null
        ticket.addNote(authorID, content)
        await TicketsDatabase.saveTicket(ticket)
        this.emitter.emit("ticketNoteAdd", ticket, authorID, content)
        return ticket
    }

    // ─── Smart Routing ────────────────────────────────────────────────────

    private async _routeTicket(
        category: TicketCategory,
        formAnswers?: Record<string, string>,
        subject?: string
    ): Promise<string | undefined> {
        if (!category.teamID && !category.routingRules?.length) return undefined

        // Check routing rules first
        if (category.routingRules?.length && (formAnswers || subject)) {
            for (const rule of category.routingRules) {
                // Keyword matching against subject
                if (rule.keywords?.length && subject) {
                    const lc = subject.toLowerCase()
                    if (rule.keywords.some((kw) => lc.includes(kw.toLowerCase()))) {
                        return rule.targetTeamID
                    }
                }
                // Form answer matching
                if (rule.formAnswers && formAnswers) {
                    const allMatch = Object.entries(rule.formAnswers).every(([k, v]) =>
                        formAnswers[k]?.toLowerCase().includes(v.toLowerCase())
                    )
                    if (allMatch) return rule.targetTeamID
                }
            }
        }

        if (!category.teamID) return undefined

        // Default team with routing strategy
        const team = await TicketsDatabase.getTeam(category.teamID)
        if (!team) return undefined

        if (category.routingStrategy === RoutingStrategy.RoundRobin) {
            const members = team.members.length ? team.members : team.roles
            const idx = team.rrIndex % members.length
            team.rrIndex = (team.rrIndex + 1) % Math.max(members.length, 1)
            await TicketsDatabase.saveTeam(team)
        }

        return team.id
    }

    // ─── Channel Permissions ──────────────────────────────────────────────

    private _buildPermissions(
        guildID: Snowflake,
        openerID: Snowflake,
        category: TicketCategory | null,
        team: TicketTeam | null
    ) {
        const base: any[] = [
            // Deny @everyone
            { id: guildID, deny: [PermissionsBitField.Flags.ViewChannel] },
            // Allow opener
            {
                id: openerID,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory,
                    PermissionsBitField.Flags.AttachFiles,
                ],
            },
        ]

        // Category staff roles
        if (category?.staffRoles) {
            for (const role of category.staffRoles) {
                base.push({
                    id: role,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory,
                        PermissionsBitField.Flags.ManageMessages,
                        PermissionsBitField.Flags.AttachFiles,
                    ],
                })
            }
        }

        // Team roles and members
        if (team) {
            for (const role of team.roles) {
                base.push({
                    id: role,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory,
                        PermissionsBitField.Flags.ManageMessages,
                        PermissionsBitField.Flags.AttachFiles,
                    ],
                })
            }
            for (const member of team.members) {
                base.push({
                    id: member,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory,
                        PermissionsBitField.Flags.ManageMessages,
                        PermissionsBitField.Flags.AttachFiles,
                    ],
                })
            }
        }

        return base
    }

    private async _buildTeamOverwrites(team: TicketTeam): Promise<Map<string, any>> {
        const map = new Map<string, any>()
        const allow = [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory,
            PermissionsBitField.Flags.ManageMessages,
        ]
        for (const role of team.roles) map.set(role, { allow })
        for (const member of team.members) map.set(member, { allow })
        return map
    }

    // ─── Embeds ───────────────────────────────────────────────────────────

    private async _sendOpenEmbed(
        channel: TextChannel,
        ticket: Ticket,
        category: TicketCategory | null,
        team: TicketTeam | null,
        member: GuildMember
    ) {
        const embedDef = category?.openEmbed
        const embed = new EmbedBuilder()
            .setTitle(embedDef?.title ?? `🎫 Ticket #${ticket.number}`)
            .setDescription(
                embedDef?.description ??
                    `Hello <@${ticket.openerID}>, welcome to your ticket!\nSupport staff will be with you shortly. Please describe your issue in detail.`
            )
            .setColor(embedDef?.color ?? 0x5865f2)
            .setTimestamp()
            .addFields(
                { name: "Category", value: category?.name ?? "General", inline: true },
                {
                    name: "Priority",
                    value: `${this._priorityEmoji(ticket.priority)} ${ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}`,
                    inline: true,
                },
                { name: "Opened by", value: `<@${ticket.openerID}>`, inline: true }
            )

        if (embedDef?.footerText) embed.setFooter({ text: embedDef.footerText, iconURL: embedDef.footerIconURL })
        if (embedDef?.thumbnailURL) embed.setThumbnail(embedDef.thumbnailURL)
        if (embedDef?.imageURL) embed.setImage(embedDef.imageURL)

        // Show form answers in embed
        if (ticket.formAnswers && Object.keys(ticket.formAnswers).length) {
            const category_ = ticket.categoryID
                ? await TicketsDatabase.getCategory(ticket.categoryID).catch(() => null)
                : null
            for (const [key, value] of Object.entries(ticket.formAnswers)) {
                const fieldDef = category_?.form?.find((f) => f.key === key)
                embed.addFields({ name: fieldDef?.label ?? key, value: value || "N/A", inline: false })
            }
        }

        if (team) embed.addFields({ name: "Assigned Team", value: team.name, inline: true })

        // SLA footer note
        if (category?.sla?.responseTime) {
            embed.addFields({
                name: "⏱️ Response SLA",
                value: `${this._formatDuration(category.sla.responseTime)}`,
                inline: false,
            })
        }

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(encodeCID(CID.TICKET_CLOSE, ticket.id))
                .setLabel("Close")
                .setEmoji("🔒")
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId(encodeCID(CID.TICKET_CLAIM, ticket.id))
                .setLabel("Claim")
                .setEmoji("🎯")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(encodeCID(CID.TICKET_LOCK, ticket.id))
                .setLabel("Lock")
                .setEmoji("🔐")
                .setStyle(ButtonStyle.Secondary)
        )

        await channel.send({ embeds: [embed], components: [row] }).catch(noop)
    }

    private async _sendCloseEmbed(
        channel: TextChannel,
        ticket: Ticket,
        category: TicketCategory | null,
        closedBy: Snowflake
    ) {
        const embedDef = category?.closeEmbed
        const embed = new EmbedBuilder()
            .setTitle(embedDef?.title ?? `🔒 Ticket Closed`)
            .setDescription(embedDef?.description ?? `This ticket has been closed by <@${closedBy}>.`)
            .setColor(embedDef?.color ?? 0xed4245)
            .setTimestamp()
            .addFields(
                { name: "Ticket #", value: `${ticket.number}`, inline: true },
                { name: "Opened by", value: `<@${ticket.openerID}>`, inline: true },
                { name: "Closed by", value: `<@${closedBy}>`, inline: true },
                { name: "Close reason", value: ticket.closeReason ?? "None", inline: false }
            )

        if (ticket.slaStatus) {
            embed.addFields(
                {
                    name: "First Response",
                    value: ticket.slaStatus.firstResponseAt ? time(new Date(ticket.slaStatus.firstResponseAt)) : "N/A",
                    inline: true,
                },
                {
                    name: "SLA Breached",
                    value:
                        ticket.slaStatus.responseBreached || ticket.slaStatus.resolutionBreached ? "⚠️ Yes" : "✅ No",
                    inline: true,
                }
            )
        }

        if (embedDef?.footerText) embed.setFooter({ text: embedDef.footerText, iconURL: embedDef.footerIconURL })

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(encodeCID(CID.TICKET_REOPEN, ticket.id))
                .setLabel("Reopen")
                .setEmoji("🔄")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(encodeCID(CID.TICKET_DELETE, ticket.id))
                .setLabel("Delete")
                .setEmoji("🗑️")
                .setStyle(ButtonStyle.Danger)
        )

        await channel.send({ embeds: [embed], components: [row] }).catch(noop)
    }

    // ─── Auto-close timer ─────────────────────────────────────────────────

    private _scheduleAutoClose(ticket: Ticket, delay: number) {
        this._clearAutoClose(ticket.id)
        const timer = setTimeout(async () => {
            const fresh = await TicketsDatabase.getTicket(ticket.id)
            if (!fresh || !fresh.isActive()) return
            const inactive = Date.now() - (fresh.lastActivityAt ?? fresh.createdAt)
            if (inactive >= delay) {
                await this.closeTicket(ticket.id, this.client.user!.id, "Auto-closed due to inactivity")
            } else {
                this._scheduleAutoClose(fresh, delay - inactive)
            }
        }, delay)
        this.autoCloseTimers.set(ticket.id, timer)
    }

    private _clearAutoClose(ticketID: string) {
        const timer = this.autoCloseTimers.get(ticketID)
        if (timer) {
            clearTimeout(timer)
            this.autoCloseTimers.delete(ticketID)
        }
    }

    // ─── Auto-delete timer ────────────────────────────────────────────────

    private _scheduleDelete(ticket: Ticket, delay: number) {
        this._clearDelete(ticket.id)
        const timer = setTimeout(async () => {
            await this.deleteTicket(ticket.id)
        }, delay)
        this.deleteTimers.set(ticket.id, timer)
    }

    private _clearDelete(ticketID: string) {
        const timer = this.deleteTimers.get(ticketID)
        if (timer) {
            clearTimeout(timer)
            this.deleteTimers.delete(ticketID)
        }
    }

    // ─── Restore timers on startup ─────────────────────────────────────────

    private async _restoreTimers() {
        // Wait for bot to be ready
        this.client.once("clientReady" as any, async () => {
            const guilds = this.client.guilds.cache
            for (const [, guild] of guilds) {
                const tickets = await TicketsDatabase.getActiveTickets(guild.id)
                for (const ticket of tickets) {
                    const category = ticket.categoryID ? await TicketsDatabase.getCategory(ticket.categoryID) : null

                    if (category?.sla) this.slaManager.startSLA(ticket, category.sla)

                    if (category?.autoCloseAfter && category.autoCloseAfter > 0) {
                        const elapsed = Date.now() - (ticket.lastActivityAt ?? ticket.createdAt)
                        const remaining = category.autoCloseAfter - elapsed
                        if (remaining <= 0) {
                            this.closeTicket(ticket.id, this.client.user!.id, "Auto-closed due to inactivity").catch(
                                noop
                            )
                        } else {
                            this._scheduleAutoClose(ticket, remaining)
                        }
                    }
                }
            }
        })
    }

    // ─── Logging ──────────────────────────────────────────────────────────

    private async _log(guildID: Snowflake, message: string, color: number) {
        const settings = await TicketsDatabase.getSettings(guildID)
        if (!settings.logChannelID) return
        const ch = this.client.channels.cache.get(settings.logChannelID) as TextChannel | undefined
        ch?.send({
            embeds: [new EmbedBuilder().setDescription(message).setColor(color).setTimestamp()],
        }).catch(noop)
    }

    // ─── Helpers ──────────────────────────────────────────────────────────

    private _priorityEmoji(priority: TicketPriority) {
        const map: Record<TicketPriority, string> = {
            [TicketPriority.Low]: "🟢",
            [TicketPriority.Medium]: "🟡",
            [TicketPriority.High]: "🟠",
            [TicketPriority.Urgent]: "🔴",
        }
        return map[priority] ?? "⚪"
    }

    private _formatDuration(ms: number): string {
        const s = ms / 1000
        if (s < 60) return `${s}s`
        const m = Math.floor(s / 60)
        if (m < 60) return `${m}m`
        const h = Math.floor(m / 60)
        if (h < 24) return `${h}h`
        return `${Math.floor(h / 24)}d`
    }
}
