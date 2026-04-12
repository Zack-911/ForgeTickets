"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketsDatabase = void 0;
require("reflect-metadata");
const forge_db_1 = require("@tryforge/forge.db");
const entities_1 = require("./entities");
class TicketsDatabase extends forge_db_1.DataBaseManager {
    emitter;
    database = "forge-tickets.db";
    entityManager = {
        sqlite: [entities_1.Ticket, entities_1.TicketCategory, entities_1.TicketTeam, entities_1.BlacklistEntry, entities_1.TicketPanel, entities_1.GuildSettings],
        mongodb: [entities_1.MongoTicket, entities_1.MongoTicketCategory, entities_1.MongoTicketTeam, entities_1.MongoBlacklistEntry, entities_1.MongoTicketPanel, entities_1.MongoGuildSettings],
        mysql: [entities_1.Ticket, entities_1.TicketCategory, entities_1.TicketTeam, entities_1.BlacklistEntry, entities_1.TicketPanel, entities_1.GuildSettings],
        postgres: [entities_1.Ticket, entities_1.TicketCategory, entities_1.TicketTeam, entities_1.BlacklistEntry, entities_1.TicketPanel, entities_1.GuildSettings],
    };
    static entities;
    db;
    static db;
    static emitter;
    constructor(emitter) {
        super();
        this.emitter = emitter;
        this.type ??= "sqlite";
        this.db = this.getDB();
        const isMongo = this.type === "mongodb";
        TicketsDatabase.entities = {
            Ticket: isMongo ? entities_1.MongoTicket : entities_1.Ticket,
            Category: isMongo ? entities_1.MongoTicketCategory : entities_1.TicketCategory,
            Team: isMongo ? entities_1.MongoTicketTeam : entities_1.TicketTeam,
            Blacklist: isMongo ? entities_1.MongoBlacklistEntry : entities_1.BlacklistEntry,
            Panel: isMongo ? entities_1.MongoTicketPanel : entities_1.TicketPanel,
            Settings: isMongo ? entities_1.MongoGuildSettings : entities_1.GuildSettings,
        };
    }
    async init() {
        TicketsDatabase.emitter = this.emitter;
        TicketsDatabase.db = await this.db;
        TicketsDatabase.emitter.emit("databaseConnect");
    }
    // ─── Ticket ────────────────────────────────────────────────────────────
    static async getTicket(id) {
        return await this.db.getRepository(this.entities.Ticket).findOneBy({ id });
    }
    static async getTicketByChannel(channelID) {
        return await this.db.getRepository(this.entities.Ticket).findOneBy({ channelID });
    }
    static async findTickets(where) {
        return await this.db.getRepository(this.entities.Ticket).find({ where: where });
    }
    static async getOpenTicketsByUser(guildID, openerID) {
        const all = await this.db.getRepository(this.entities.Ticket).find({
            where: { guildID, openerID, deleted: false }
        });
        return all.filter(t => t.isActive());
    }
    static async saveTicket(ticket) {
        const old = await this.getTicket(ticket.id);
        if (old && forge_db_1.DataBaseManager.type === "mongodb") {
            await this.db.getRepository(this.entities.Ticket).update(old.id, ticket);
        }
        else {
            await this.db.getRepository(this.entities.Ticket).save(ticket);
        }
    }
    static async deleteTicket(id) {
        await this.db.getRepository(this.entities.Ticket).delete({ id });
    }
    static async getActiveTickets(guildID) {
        const all = await this.db.getRepository(this.entities.Ticket).find({ where: { guildID, deleted: false } });
        return all.filter(t => t.isActive());
    }
    static async getTicketStats(guildID) {
        const all = await this.db.getRepository(this.entities.Ticket).find({ where: { guildID } });
        return {
            total: all.length,
            open: all.filter(t => t.state === entities_1.TicketState.Open).length,
            claimed: all.filter(t => t.state === entities_1.TicketState.Claimed).length,
            closed: all.filter(t => t.state === entities_1.TicketState.Closed).length,
            pending: all.filter(t => t.state === entities_1.TicketState.Pending).length,
        };
    }
    // ─── Category ──────────────────────────────────────────────────────────
    static async getCategory(id) {
        return await this.db.getRepository(this.entities.Category).findOneBy({ id });
    }
    static async getCategoriesByGuild(guildID) {
        return await this.db.getRepository(this.entities.Category).find({ where: { guildID } });
    }
    static async saveCategory(cat) {
        const old = await this.getCategory(cat.id);
        if (old && forge_db_1.DataBaseManager.type === "mongodb") {
            await this.db.getRepository(this.entities.Category).update(old.id, cat);
        }
        else {
            await this.db.getRepository(this.entities.Category).save(cat);
        }
    }
    static async deleteCategory(id) {
        await this.db.getRepository(this.entities.Category).delete({ id });
    }
    // ─── Team ──────────────────────────────────────────────────────────────
    static async getTeam(id) {
        return await this.db.getRepository(this.entities.Team).findOneBy({ id });
    }
    static async getTeamsByGuild(guildID) {
        return await this.db.getRepository(this.entities.Team).find({ where: { guildID } });
    }
    static async saveTeam(team) {
        const old = await this.getTeam(team.id);
        if (old && forge_db_1.DataBaseManager.type === "mongodb") {
            await this.db.getRepository(this.entities.Team).update(old.id, team);
        }
        else {
            await this.db.getRepository(this.entities.Team).save(team);
        }
    }
    static async deleteTeam(id) {
        await this.db.getRepository(this.entities.Team).delete({ id });
    }
    // ─── Blacklist ─────────────────────────────────────────────────────────
    static async getBlacklist(guildID) {
        const entries = await this.db.getRepository(this.entities.Blacklist).find({ where: { guildID } });
        for (const entry of entries) {
            if (entry.isExpired()) {
                this.db.getRepository(this.entities.Blacklist).delete({ id: entry.id }).catch(() => { });
            }
        }
        return entries.filter(e => !e.isExpired());
    }
    static async isBlacklisted(guildID, userID, roleIDs) {
        const active = await this.getBlacklist(guildID);
        return active.find(e => (e.type === "user" && e.targetID === userID) ||
            (e.type === "role" && roleIDs.includes(e.targetID))) ?? null;
    }
    static async addBlacklist(entry) {
        await this.db.getRepository(this.entities.Blacklist).save(entry);
    }
    static async removeBlacklist(guildID, targetID) {
        const entry = await this.db.getRepository(this.entities.Blacklist).findOneBy({ guildID, targetID });
        if (entry)
            await this.db.getRepository(this.entities.Blacklist).delete({ id: entry.id });
    }
    // ─── Panel ─────────────────────────────────────────────────────────────
    static async getPanel(id) {
        return await this.db.getRepository(this.entities.Panel).findOneBy({ id });
    }
    static async getPanelByMessage(messageID) {
        return await this.db.getRepository(this.entities.Panel).findOneBy({ messageID });
    }
    static async savePanel(panel) {
        const old = await this.getPanel(panel.id);
        if (old && forge_db_1.DataBaseManager.type === "mongodb") {
            await this.db.getRepository(this.entities.Panel).update(old.id, panel);
        }
        else {
            await this.db.getRepository(this.entities.Panel).save(panel);
        }
    }
    static async deletePanel(id) {
        await this.db.getRepository(this.entities.Panel).delete({ id });
    }
    // ─── Guild Settings ────────────────────────────────────────────────────
    static async getSettings(guildID) {
        const existing = await this.db.getRepository(this.entities.Settings).findOneBy({ guildID });
        if (existing)
            return existing;
        const fresh = new entities_1.GuildSettings({ guildID });
        await this.db.getRepository(this.entities.Settings).save(fresh);
        return fresh;
    }
    static async saveSettings(settings) {
        const old = await this.db.getRepository(this.entities.Settings).findOneBy({ guildID: settings.guildID });
        if (old && forge_db_1.DataBaseManager.type === "mongodb") {
            await this.db.getRepository(this.entities.Settings).update(settings.guildID, settings);
        }
        else {
            await this.db.getRepository(this.entities.Settings).save(settings);
        }
    }
}
exports.TicketsDatabase = TicketsDatabase;
//# sourceMappingURL=database.js.map