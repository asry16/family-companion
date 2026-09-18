-- Kinly Relational Database Schema (SQLite / PostgreSQL Compatible)

PRAGMA foreign_keys = ON;

-- 1. Users (Auth Accounts)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  provider TEXT DEFAULT 'email',
  is_verified INTEGER DEFAULT 0,
  verification_code TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Families (Household Circles)
CREATE TABLE IF NOT EXISTS families (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  address TEXT DEFAULT 'Home',
  home_city TEXT DEFAULT '',
  created_by_user_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 3. Family Members
CREATE TABLE IF NOT EXISTS family_members (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  user_id TEXT,
  name TEXT NOT NULL,
  relation TEXT NOT NULL,
  initials TEXT NOT NULL,
  avatar_color TEXT DEFAULT '#3B82F6',
  photo_url TEXT,
  phone TEXT DEFAULT '',
  is_self INTEGER DEFAULT 0,
  status_message TEXT DEFAULT 'Connected',
  current_place_id TEXT,
  human_location TEXT DEFAULT 'At Home',
  battery_level INTEGER DEFAULT 100,
  is_charging INTEGER DEFAULT 0,
  ringer_mode TEXT DEFAULT 'sound', -- 'sound', 'silent', 'vibrate', 'dnd'
  device_model TEXT DEFAULT 'Smartphone',
  coords_x REAL DEFAULT 50.0,
  coords_y REAL DEFAULT 50.0,
  latitude REAL DEFAULT 28.4595,
  longitude REAL DEFAULT 77.0266,
  is_sharing_location INTEGER DEFAULT 1,
  sharing_duration TEXT DEFAULT 'always',
  availability TEXT DEFAULT 'available', -- 'available', 'busy', 'in_transit', 'offline'
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 4. Family Places
CREATE TABLE IF NOT EXISTS family_places (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'home', -- 'home', 'office', 'school', 'hospital', etc.
  address TEXT NOT NULL,
  emoji TEXT DEFAULT '📍',
  coords_x REAL DEFAULT 50.0,
  coords_y REAL DEFAULT 50.0,
  latitude REAL,
  longitude REAL,
  is_safe_zone INTEGER DEFAULT 1,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

-- 5. Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'general', -- 'groceries', 'bills', 'health', 'chores', 'kids', 'general'
  assigned_to_member_id TEXT,
  created_by_member_id TEXT,
  due_date TEXT,
  due_time TEXT,
  priority TEXT DEFAULT 'important', -- 'urgent', 'important', 'normal'
  is_completed INTEGER DEFAULT 0,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to_member_id) REFERENCES family_members(id) ON DELETE SET NULL
);

-- 6. Calendar Events
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  location TEXT DEFAULT 'Home',
  category TEXT DEFAULT 'family', -- 'doctor', 'family', 'school', 'celebration', 'work'
  notes TEXT,
  attendee_ids_json TEXT DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

-- 7. Reminders
CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  title TEXT NOT NULL,
  target_member_id TEXT,
  time TEXT NOT NULL,
  due_date TEXT NOT NULL,
  category TEXT DEFAULT 'general', -- 'medicine', 'bill', 'pickup', 'call', 'general'
  urgency TEXT DEFAULT 'important',
  is_done INTEGER DEFAULT 0,
  repeat TEXT DEFAULT 'none',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (target_member_id) REFERENCES family_members(id) ON DELETE SET NULL
);

-- 8. Documents
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT DEFAULT 'receipt', -- 'electricity_bill', 'medical_prescription', 'receipt', 'insurance', 'tax', 'id_card'
  amount REAL,
  currency TEXT DEFAULT '₹',
  due_date TEXT,
  provider TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'verified'
  assigned_to_member_id TEXT,
  scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  fields_json TEXT DEFAULT '[]',
  suggested_actions_json TEXT DEFAULT '[]',
  notes TEXT,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to_member_id) REFERENCES family_members(id) ON DELETE SET NULL
);

-- 9. Memories
CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'household', -- 'household', 'documents', 'health', 'preferences', 'moments'
  saved_location TEXT NOT NULL,
  last_verified TEXT DEFAULT 'Recently',
  notes TEXT DEFAULT '',
  tags_json TEXT DEFAULT '[]',
  related_member_ids_json TEXT DEFAULT '[]',
  emoji TEXT DEFAULT '📘',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

-- 10. Smart Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  priority TEXT DEFAULT 'normal', -- 'urgent', 'important', 'normal'
  is_read INTEGER DEFAULT 0,
  category TEXT DEFAULT 'general',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

-- Indexes for lightning-fast queries
CREATE INDEX IF NOT EXISTS idx_members_family ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_tasks_family ON tasks(family_id);
CREATE INDEX IF NOT EXISTS idx_events_family ON events(family_id);
CREATE INDEX IF NOT EXISTS idx_reminders_family ON reminders(family_id);
CREATE INDEX IF NOT EXISTS idx_documents_family ON documents(family_id);
CREATE INDEX IF NOT EXISTS idx_memories_family ON memories(family_id);
CREATE INDEX IF NOT EXISTS idx_notifications_family ON notifications(family_id);
