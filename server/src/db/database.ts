import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const DB_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'kinly.db');
export const db = new Database(DB_PATH);

// Enable WAL mode for high concurrency performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
const schemaPath = path.join(__dirname, 'schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');
db.exec(schemaSql);

// -------------------------------------------------------------
// USER REPOSITORY
// -------------------------------------------------------------
export interface DbUser {
  id: string;
  name: string;
  username: string | null;
  email: string;
  password_hash: string;
  provider: string;
  is_verified: number;
  verification_code: string | null;
  created_at: string;
  updated_at: string;
}

export const usersRepo = {
  create: (user: {
    id: string;
    name: string;
    username?: string;
    email: string;
    passwordHash: string;
    provider?: string;
    isVerified?: boolean;
    verificationCode?: string;
  }) => {
    const stmt = db.prepare(`
      INSERT INTO users (id, name, username, email, password_hash, provider, is_verified, verification_code)
      VALUES (@id, @name, @username, @email, @passwordHash, @provider, @isVerified, @verificationCode)
    `);
    stmt.run({
      id: user.id,
      name: user.name,
      username: user.username || null,
      email: user.email.toLowerCase(),
      passwordHash: user.passwordHash,
      provider: user.provider || 'email',
      isVerified: user.isVerified ? 1 : 0,
      verificationCode: user.verificationCode || null,
    });
  },

  findByEmail: (email: string): DbUser | undefined => {
    const stmt = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)');
    return stmt.get(email) as DbUser | undefined;
  },

  findById: (id: string): DbUser | undefined => {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as DbUser | undefined;
  },

  verifyEmail: (email: string) => {
    const stmt = db.prepare('UPDATE users SET is_verified = 1, verification_code = NULL WHERE LOWER(email) = LOWER(?)');
    stmt.run(email);
  },

  setVerificationCode: (email: string, code: string) => {
    const stmt = db.prepare('UPDATE users SET verification_code = ? WHERE LOWER(email) = LOWER(?)');
    stmt.run(code, email);
  },

  updatePassword: (email: string, passwordHash: string) => {
    const stmt = db.prepare('UPDATE users SET password_hash = ? WHERE LOWER(email) = LOWER(?)');
    stmt.run(passwordHash, email);
  },
};

// -------------------------------------------------------------
// FAMILY REPOSITORY
// -------------------------------------------------------------
export interface DbFamily {
  id: string;
  name: string;
  invite_code: string;
  address: string;
  home_city: string;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export const familiesRepo = {
  create: (family: {
    id: string;
    name: string;
    inviteCode: string;
    address?: string;
    homeCity?: string;
    createdByUserId?: string;
  }) => {
    const stmt = db.prepare(`
      INSERT INTO families (id, name, invite_code, address, home_city, created_by_user_id)
      VALUES (@id, @name, @inviteCode, @address, @homeCity, @createdByUserId)
    `);
    stmt.run({
      id: family.id,
      name: family.name,
      inviteCode: family.inviteCode.toUpperCase(),
      address: family.address || 'Home',
      homeCity: family.homeCity || '',
      createdByUserId: family.createdByUserId || null,
    });
  },

  findById: (id: string): DbFamily | undefined => {
    const stmt = db.prepare('SELECT * FROM families WHERE id = ?');
    return stmt.get(id) as DbFamily | undefined;
  },

  findByInviteCode: (code: string): DbFamily | undefined => {
    const clean = code.trim();
    const normalized = clean.replace(/[\s-]/g, '').toUpperCase();
    const stmt = db.prepare(`
      SELECT * FROM families 
      WHERE REPLACE(UPPER(invite_code), '-', '') = ?
         OR UPPER(invite_code) = UPPER(?)
      LIMIT 1
    `);
    const found = stmt.get(normalized, clean) as DbFamily | undefined;
    if (found) return found;

    // Backward-compatible alias for Asmita Roy's household
    if (normalized === 'KIN4402' || normalized === '4402' || normalized === 'KIN9608' || normalized === '9608') {
      const alias = db.prepare(`SELECT * FROM families WHERE id = 'family_1789878985984'`).get() as DbFamily | undefined;
      if (alias) return alias;
    }
    return undefined;
  },

  updateProfile: (id: string, profile: { name?: string; address?: string; homeCity?: string }) => {
    const stmt = db.prepare(`
      UPDATE families
      SET name = COALESCE(@name, name),
          address = COALESCE(@address, address),
          home_city = COALESCE(@homeCity, home_city),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `);
    stmt.run({
      id,
      name: profile.name || null,
      address: profile.address || null,
      homeCity: profile.homeCity || null,
    });
  },
};

// -------------------------------------------------------------
// MEMBERS REPOSITORY
// -------------------------------------------------------------
export interface DbFamilyMember {
  id: string;
  family_id: string;
  user_id: string | null;
  name: string;
  relation: string;
  initials: string;
  avatar_color: string;
  photo_url: string | null;
  phone: string;
  is_self: number;
  status_message: string;
  current_place_id: string | null;
  human_location: string;
  battery_level: number;
  is_charging: number;
  ringer_mode: string;
  device_model: string;
  coords_x: number;
  coords_y: number;
  latitude: number | null;
  longitude: number | null;
  is_sharing_location: number;
  sharing_duration: string;
  availability: string;
  last_updated: string;
}

export const membersRepo = {
  findByFamilyId: (familyId: string): DbFamilyMember[] => {
    const stmt = db.prepare('SELECT * FROM family_members WHERE family_id = ?');
    return stmt.all(familyId) as DbFamilyMember[];
  },

  findByUserId: (userId: string): DbFamilyMember | undefined => {
    const stmt = db.prepare('SELECT * FROM family_members WHERE user_id = ?');
    return stmt.get(userId) as DbFamilyMember | undefined;
  },

  findById: (id: string): DbFamilyMember | undefined => {
    const stmt = db.prepare('SELECT * FROM family_members WHERE id = ?');
    return stmt.get(id) as DbFamilyMember | undefined;
  },

  create: (m: Partial<DbFamilyMember> & { id: string; family_id: string; name: string; relation: string; initials: string }) => {
    const stmt = db.prepare(`
      INSERT INTO family_members (
        id, family_id, user_id, name, relation, initials, avatar_color,
        phone, is_self, status_message, current_place_id, human_location,
        battery_level, is_charging, ringer_mode, device_model,
        coords_x, coords_y, latitude, longitude, is_sharing_location,
        sharing_duration, availability
      ) VALUES (
        @id, @family_id, @user_id, @name, @relation, @initials, @avatar_color,
        @phone, @is_self, @status_message, @current_place_id, @human_location,
        @battery_level, @is_charging, @ringer_mode, @device_model,
        @coords_x, @coords_y, @latitude, @longitude, @is_sharing_location,
        @sharing_duration, @availability
      )
    `);
    stmt.run({
      id: m.id,
      family_id: m.family_id,
      user_id: m.user_id || null,
      name: m.name,
      relation: m.relation,
      initials: m.initials,
      avatar_color: m.avatar_color || '#3B82F6',
      phone: m.phone || '',
      is_self: m.is_self ? 1 : 0,
      status_message: m.status_message || 'Connected',
      current_place_id: m.current_place_id || null,
      human_location: m.human_location || 'At Home',
      battery_level: m.battery_level ?? 100,
      is_charging: m.is_charging ? 1 : 0,
      ringer_mode: m.ringer_mode || 'sound',
      device_model: m.device_model || 'Smartphone',
      coords_x: m.coords_x ?? 50.0,
      coords_y: m.coords_y ?? 50.0,
      latitude: m.latitude || 28.4595,
      longitude: m.longitude || 77.0266,
      is_sharing_location: m.is_sharing_location ?? 1,
      sharing_duration: m.sharing_duration || 'always',
      availability: m.availability || 'available',
    });
  },

  update: (id: string, updates: Partial<DbFamilyMember>) => {
    const fields = Object.keys(updates).filter((k) => k !== 'id');
    if (fields.length === 0) return;
    const setClause = fields.map((f) => `${f} = @${f}`).join(', ');
    const stmt = db.prepare(`UPDATE family_members SET ${setClause}, last_updated = CURRENT_TIMESTAMP WHERE id = @id`);
    stmt.run({ ...updates, id });
  },

  delete: (id: string) => {
    const stmt = db.prepare('DELETE FROM family_members WHERE id = ?');
    stmt.run(id);
  },
};

// -------------------------------------------------------------
// PLACES REPOSITORY
// -------------------------------------------------------------
export interface DbPlace {
  id: string;
  family_id: string;
  name: string;
  type: string;
  address: string;
  emoji: string;
  coords_x: number;
  coords_y: number;
  latitude: number | null;
  longitude: number | null;
  is_safe_zone: number;
}

export const placesRepo = {
  findByFamilyId: (familyId: string): DbPlace[] => {
    const stmt = db.prepare('SELECT * FROM family_places WHERE family_id = ?');
    return stmt.all(familyId) as DbPlace[];
  },

  create: (p: DbPlace) => {
    const stmt = db.prepare(`
      INSERT INTO family_places (id, family_id, name, type, address, emoji, coords_x, coords_y, latitude, longitude, is_safe_zone)
      VALUES (@id, @family_id, @name, @type, @address, @emoji, @coords_x, @coords_y, @latitude, @longitude, @is_safe_zone)
    `);
    stmt.run(p);
  },
};

// -------------------------------------------------------------
// TASKS REPOSITORY
// -------------------------------------------------------------
export interface DbTask {
  id: string;
  family_id: string;
  title: string;
  category: string;
  assigned_to_member_id: string | null;
  created_by_member_id: string | null;
  due_date: string | null;
  due_time: string | null;
  priority: string;
  is_completed: number;
  note: string | null;
  created_at: string;
}

export const tasksRepo = {
  findByFamilyId: (familyId: string): DbTask[] => {
    const stmt = db.prepare('SELECT * FROM tasks WHERE family_id = ? ORDER BY is_completed ASC, created_at DESC');
    return stmt.all(familyId) as DbTask[];
  },

  create: (t: Omit<DbTask, 'created_at'>) => {
    const stmt = db.prepare(`
      INSERT INTO tasks (id, family_id, title, category, assigned_to_member_id, created_by_member_id, due_date, due_time, priority, is_completed, note)
      VALUES (@id, @family_id, @title, @category, @assigned_to_member_id, @created_by_member_id, @due_date, @due_time, @priority, @is_completed, @note)
    `);
    stmt.run(t);
  },

  update: (id: string, updates: Partial<DbTask>) => {
    const fields = Object.keys(updates).filter((k) => k !== 'id');
    if (fields.length === 0) return;
    const setClause = fields.map((f) => `${f} = @${f}`).join(', ');
    const stmt = db.prepare(`UPDATE tasks SET ${setClause} WHERE id = @id`);
    stmt.run({ ...updates, id });
  },

  delete: (id: string) => {
    const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
    stmt.run(id);
  },
};

// -------------------------------------------------------------
// EVENTS REPOSITORY
// -------------------------------------------------------------
export interface DbEvent {
  id: string;
  family_id: string;
  title: string;
  date: string;
  time: string;
  duration_minutes: number;
  location: string;
  category: string;
  notes: string | null;
  attendee_ids_json: string;
  created_at: string;
}

export const eventsRepo = {
  findByFamilyId: (familyId: string): DbEvent[] => {
    const stmt = db.prepare('SELECT * FROM events WHERE family_id = ? ORDER BY date ASC, time ASC');
    return stmt.all(familyId) as DbEvent[];
  },

  create: (e: Omit<DbEvent, 'created_at'>) => {
    const stmt = db.prepare(`
      INSERT INTO events (id, family_id, title, date, time, duration_minutes, location, category, notes, attendee_ids_json)
      VALUES (@id, @family_id, @title, @date, @time, @duration_minutes, @location, @category, @notes, @attendee_ids_json)
    `);
    stmt.run(e);
  },

  delete: (id: string) => {
    const stmt = db.prepare('DELETE FROM events WHERE id = ?');
    stmt.run(id);
  },
};

// -------------------------------------------------------------
// REMINDERS REPOSITORY
// -------------------------------------------------------------
export interface DbReminder {
  id: string;
  family_id: string;
  title: string;
  target_member_id: string | null;
  time: string;
  due_date: string;
  category: string;
  urgency: string;
  is_done: number;
  repeat: string;
  created_at: string;
}

export const remindersRepo = {
  findByFamilyId: (familyId: string): DbReminder[] => {
    const stmt = db.prepare('SELECT * FROM reminders WHERE family_id = ? ORDER BY is_done ASC, due_date ASC');
    return stmt.all(familyId) as DbReminder[];
  },

  create: (r: Omit<DbReminder, 'created_at'>) => {
    const stmt = db.prepare(`
      INSERT INTO reminders (id, family_id, title, target_member_id, time, due_date, category, urgency, is_done, repeat)
      VALUES (@id, @family_id, @title, @target_member_id, @time, @due_date, @category, @urgency, @is_done, @repeat)
    `);
    stmt.run(r);
  },

  update: (id: string, updates: Partial<DbReminder>) => {
    const fields = Object.keys(updates).filter((k) => k !== 'id');
    if (fields.length === 0) return;
    const setClause = fields.map((f) => `${f} = @${f}`).join(', ');
    const stmt = db.prepare(`UPDATE reminders SET ${setClause} WHERE id = @id`);
    stmt.run({ ...updates, id });
  },

  delete: (id: string) => {
    const stmt = db.prepare('DELETE FROM reminders WHERE id = ?');
    stmt.run(id);
  },
};

// -------------------------------------------------------------
// DOCUMENTS REPOSITORY
// -------------------------------------------------------------
export interface DbDocument {
  id: string;
  family_id: string;
  title: string;
  type: string;
  amount: number | null;
  currency: string;
  due_date: string | null;
  provider: string | null;
  status: string;
  assigned_to_member_id: string | null;
  scanned_at: string;
  fields_json: string;
  suggested_actions_json: string;
  notes: string | null;
}

export const documentsRepo = {
  findByFamilyId: (familyId: string): DbDocument[] => {
    const stmt = db.prepare('SELECT * FROM documents WHERE family_id = ? ORDER BY scanned_at DESC');
    return stmt.all(familyId) as DbDocument[];
  },

  create: (d: DbDocument) => {
    const stmt = db.prepare(`
      INSERT INTO documents (
        id, family_id, title, type, amount, currency, due_date,
        provider, status, assigned_to_member_id, scanned_at,
        fields_json, suggested_actions_json, notes
      ) VALUES (
        @id, @family_id, @title, @type, @amount, @currency, @due_date,
        @provider, @status, @assigned_to_member_id, @scanned_at,
        @fields_json, @suggested_actions_json, @notes
      )
    `);
    stmt.run(d);
  },

  updateStatus: (id: string, status: string) => {
    const stmt = db.prepare('UPDATE documents SET status = ? WHERE id = ?');
    stmt.run(status, id);
  },

  delete: (id: string) => {
    const stmt = db.prepare('DELETE FROM documents WHERE id = ?');
    stmt.run(id);
  },
};

// -------------------------------------------------------------
// MEMORIES REPOSITORY
// -------------------------------------------------------------
export interface DbMemory {
  id: string;
  family_id: string;
  title: string;
  category: string;
  saved_location: string;
  last_verified: string;
  notes: string;
  tags_json: string;
  related_member_ids_json: string;
  emoji: string;
  created_at: string;
}

export const memoriesRepo = {
  findByFamilyId: (familyId: string): DbMemory[] => {
    const stmt = db.prepare('SELECT * FROM memories WHERE family_id = ? ORDER BY created_at DESC');
    return stmt.all(familyId) as DbMemory[];
  },

  create: (m: Omit<DbMemory, 'created_at'>) => {
    const stmt = db.prepare(`
      INSERT INTO memories (id, family_id, title, category, saved_location, last_verified, notes, tags_json, related_member_ids_json, emoji)
      VALUES (@id, @family_id, @title, @category, @saved_location, @last_verified, @notes, @tags_json, @related_member_ids_json, @emoji)
    `);
    stmt.run(m);
  },

  delete: (id: string) => {
    const stmt = db.prepare('DELETE FROM memories WHERE id = ?');
    stmt.run(id);
  },
};

// -------------------------------------------------------------
// NOTIFICATIONS REPOSITORY
// -------------------------------------------------------------
export interface DbNotification {
  id: string;
  family_id: string;
  title: string;
  body: string;
  priority: string;
  is_read: number;
  category: string;
  created_at: string;
}

export const notificationsRepo = {
  findByFamilyId: (familyId: string): DbNotification[] => {
    const stmt = db.prepare('SELECT * FROM notifications WHERE family_id = ? ORDER BY created_at DESC LIMIT 50');
    return stmt.all(familyId) as DbNotification[];
  },

  create: (n: Omit<DbNotification, 'created_at'>) => {
    const stmt = db.prepare(`
      INSERT INTO notifications (id, family_id, title, body, priority, is_read, category)
      VALUES (@id, @family_id, @title, @body, @priority, @is_read, @category)
    `);
    stmt.run(n);
  },

  markRead: (id: string) => {
    const stmt = db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?');
    stmt.run(id);
  },
};
