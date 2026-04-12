import "reflect-metadata"
import { DataBaseManager, TransformEvents } from "@tryforge/forge.db"
import { DataSource } from "typeorm"
import { TypedEmitter } from "tiny-typed-emitter"
import { ITicketEvents } from "../handlers"
import {
    Ticket,
    MongoTicket,
    TicketCategory,
    MongoTicketCategory,
    TicketTeam,
    MongoTicketTeam,
    BlacklistEntry,
    MongoBlacklistEntry,
    TicketPanel,
    MongoTicketPanel,
    GuildSettings,
    MongoGuildSettings,
    TicketState,
} from "./entities"
import type { Snowflake } from "discord.js"

type AnyTicket = typeof Ticket | typeof MongoTicket
type AnyTicketCategory = typeof TicketCategory | typeof MongoTicketCategory
type AnyTicketTeam = typeof TicketTeam | typeof MongoTicketTeam
type AnyBlacklistEntry = typeof BlacklistEntry | typeof MongoBlacklistEntry
type AnyTicketPanel = typeof TicketPanel | typeof MongoTicketPanel
type AnyGuildSettings = typeof GuildSettings | typeof MongoGuildSettings

export class TicketsDatabase extends DataBaseManager {
    public database = "forge-tickets.db"

    public entityManager = {
        sqlite: [Ticket, TicketCategory, TicketTeam, BlacklistEntry, TicketPanel, GuildSettings],
        mongodb: [
            MongoTicket,
            MongoTicketCategory,
            MongoTicketTeam,
            MongoBlacklistEntry,
            MongoTicketPanel,
            MongoGuildSettings,
        ],
        mysql: [Ticket, TicketCategory, TicketTeam, BlacklistEntry, TicketPanel, GuildSettings],
        postgres: [Ticket, TicketCategory, TicketTeam, BlacklistEntry, TicketPanel, GuildSettings],
    }

    public static entities: {
        Ticket: AnyTicket
        Category: AnyTicketCategory
        Team: AnyTicketTeam
        Blacklist: AnyBlacklistEntry
        Panel: AnyTicketPanel
        Settings: AnyGuildSettings
    }

    private db!: Promise<DataSource>
    private static db: DataSource
    private static emitter: TypedEmitter<TransformEvents<ITicketEvents>>

    constructor(private readonly emitter: TypedEmitter<TransformEvents<ITicketEvents>>) {
        super()
        this.type ??= "sqlite"
        this.db = this.getDB()
        const isMongo = this.type === "mongodb"
        TicketsDatabase.entities = {
            Ticket: isMongo ? MongoTicket : Ticket,
            Category: isMongo ? MongoTicketCategory : TicketCategory,
            Team: isMongo ? MongoTicketTeam : TicketTeam,
            Blacklist: isMongo ? MongoBlacklistEntry : BlacklistEntry,
            Panel: isMongo ? MongoTicketPanel : TicketPanel,
            Settings: isMongo ? MongoGuildSettings : GuildSettings,
        }
    }

    public async init() {
        TicketsDatabase.emitter = this.emitter
        TicketsDatabase.db = await this.db
        TicketsDatabase.emitter.emit("databaseConnect")
    }

    // ─── Ticket ────────────────────────────────────────────────────────────

    public static async getTicket(id: string): Promise<Ticket | null> {
        return (await this.db.getRepository(this.entities.Ticket).findOneBy({ id })) as Ticket | null
    }

    public static async getTicketByChannel(channelID: Snowflake): Promise<Ticket | null> {
        return (await this.db.getRepository(this.entities.Ticket).findOneBy({ channelID })) as Ticket | null
    }

    public static async findTickets(where?: Partial<Ticket>): Promise<Ticket[]> {
        return (await this.db.getRepository(this.entities.Ticket).find({ where: where as any })) as Ticket[]
    }

    public static async getOpenTicketsByUser(guildID: Snowflake, openerID: Snowflake): Promise<Ticket[]> {
        const all = (await this.db.getRepository(this.entities.Ticket).find({
            where: { guildID, openerID, deleted: false } as any,
        })) as Ticket[]
        return all.filter((t) => t.isActive())
    }

    public static async saveTicket(ticket: Ticket): Promise<void> {
        const old = await this.getTicket(ticket.id)
        if (old && (DataBaseManager as any).type === "mongodb") {
            await this.db.getRepository(this.entities.Ticket).update(old.id, ticket as any)
        } else {
            await this.db.getRepository(this.entities.Ticket).save(ticket as any)
        }
    }

    public static async deleteTicket(id: string): Promise<void> {
        await this.db.getRepository(this.entities.Ticket).delete({ id })
    }

    public static async getActiveTickets(guildID: Snowflake): Promise<Ticket[]> {
        const all = (await this.db
            .getRepository(this.entities.Ticket)
            .find({ where: { guildID, deleted: false } as any })) as Ticket[]
        return all.filter((t) => t.isActive())
    }

    public static async getTicketStats(guildID: Snowflake) {
        const all = (await this.db.getRepository(this.entities.Ticket).find({ where: { guildID } as any })) as Ticket[]
        return {
            total: all.length,
            open: all.filter((t) => t.state === TicketState.Open).length,
            claimed: all.filter((t) => t.state === TicketState.Claimed).length,
            closed: all.filter((t) => t.state === TicketState.Closed).length,
            pending: all.filter((t) => t.state === TicketState.Pending).length,
        }
    }

    // ─── Category ──────────────────────────────────────────────────────────

    public static async getCategory(id: string): Promise<TicketCategory | null> {
        return (await this.db.getRepository(this.entities.Category).findOneBy({ id })) as TicketCategory | null
    }

    public static async getCategoriesByGuild(guildID: Snowflake): Promise<TicketCategory[]> {
        return (await this.db
            .getRepository(this.entities.Category)
            .find({ where: { guildID } as any })) as TicketCategory[]
    }

    public static async saveCategory(cat: TicketCategory): Promise<void> {
        const old = await this.getCategory(cat.id)
        if (old && (DataBaseManager as any).type === "mongodb") {
            await this.db.getRepository(this.entities.Category).update(old.id, cat as any)
        } else {
            await this.db.getRepository(this.entities.Category).save(cat as any)
        }
    }

    public static async deleteCategory(id: string): Promise<void> {
        await this.db.getRepository(this.entities.Category).delete({ id })
    }

    // ─── Team ──────────────────────────────────────────────────────────────

    public static async getTeam(id: string): Promise<TicketTeam | null> {
        return (await this.db.getRepository(this.entities.Team).findOneBy({ id })) as TicketTeam | null
    }

    public static async getTeamsByGuild(guildID: Snowflake): Promise<TicketTeam[]> {
        return (await this.db.getRepository(this.entities.Team).find({ where: { guildID } as any })) as TicketTeam[]
    }

    public static async saveTeam(team: TicketTeam): Promise<void> {
        const old = await this.getTeam(team.id)
        if (old && (DataBaseManager as any).type === "mongodb") {
            await this.db.getRepository(this.entities.Team).update(old.id, team as any)
        } else {
            await this.db.getRepository(this.entities.Team).save(team as any)
        }
    }

    public static async deleteTeam(id: string): Promise<void> {
        await this.db.getRepository(this.entities.Team).delete({ id })
    }

    // ─── Blacklist ─────────────────────────────────────────────────────────

    public static async getBlacklist(guildID: Snowflake): Promise<BlacklistEntry[]> {
        const entries = (await this.db
            .getRepository(this.entities.Blacklist)
            .find({ where: { guildID } as any })) as BlacklistEntry[]
        for (const entry of entries) {
            if (entry.isExpired()) {
                this.db
                    .getRepository(this.entities.Blacklist)
                    .delete({ id: entry.id })
                    .catch(() => {})
            }
        }
        return entries.filter((e) => !e.isExpired())
    }

    public static async isBlacklisted(
        guildID: Snowflake,
        userID: Snowflake,
        roleIDs: Snowflake[]
    ): Promise<BlacklistEntry | null> {
        const active = await this.getBlacklist(guildID)
        return (
            active.find(
                (e) =>
                    (e.type === "user" && e.targetID === userID) || (e.type === "role" && roleIDs.includes(e.targetID))
            ) ?? null
        )
    }

    public static async addBlacklist(entry: BlacklistEntry): Promise<void> {
        await this.db.getRepository(this.entities.Blacklist).save(entry as any)
    }

    public static async removeBlacklist(guildID: Snowflake, targetID: Snowflake): Promise<void> {
        const entry = await this.db.getRepository(this.entities.Blacklist).findOneBy({ guildID, targetID } as any)
        if (entry) await this.db.getRepository(this.entities.Blacklist).delete({ id: (entry as BlacklistEntry).id })
    }

    // ─── Panel ─────────────────────────────────────────────────────────────

    public static async getPanel(id: string): Promise<TicketPanel | null> {
        return (await this.db.getRepository(this.entities.Panel).findOneBy({ id })) as TicketPanel | null
    }

    public static async getPanelByMessage(messageID: Snowflake): Promise<TicketPanel | null> {
        return (await this.db.getRepository(this.entities.Panel).findOneBy({ messageID } as any)) as TicketPanel | null
    }

    public static async savePanel(panel: TicketPanel): Promise<void> {
        const old = await this.getPanel(panel.id)
        if (old && (DataBaseManager as any).type === "mongodb") {
            await this.db.getRepository(this.entities.Panel).update(old.id, panel as any)
        } else {
            await this.db.getRepository(this.entities.Panel).save(panel as any)
        }
    }

    public static async deletePanel(id: string): Promise<void> {
        await this.db.getRepository(this.entities.Panel).delete({ id })
    }

    // ─── Guild Settings ────────────────────────────────────────────────────

    public static async getSettings(guildID: Snowflake): Promise<GuildSettings> {
        const existing = (await this.db
            .getRepository(this.entities.Settings)
            .findOneBy({ guildID } as any)) as GuildSettings | null
        if (existing) return existing
        const fresh = new GuildSettings({ guildID })
        await this.db.getRepository(this.entities.Settings).save(fresh as any)
        return fresh
    }

    public static async saveSettings(settings: GuildSettings): Promise<void> {
        const old = await this.db.getRepository(this.entities.Settings).findOneBy({ guildID: settings.guildID } as any)
        if (old && (DataBaseManager as any).type === "mongodb") {
            await this.db.getRepository(this.entities.Settings).update(settings.guildID, settings as any)
        } else {
            await this.db.getRepository(this.entities.Settings).save(settings as any)
        }
    }
}
