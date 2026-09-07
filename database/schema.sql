CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS users(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 email TEXT UNIQUE NOT NULL,
 password_hash TEXT NOT NULL,
 role TEXT NOT NULL DEFAULT 'journalist',
 active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS articles(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 title TEXT NOT NULL,
 category TEXT NOT NULL DEFAULT 'General',
 status TEXT NOT NULL DEFAULT 'draft',
 body TEXT NOT NULL DEFAULT '',
 author_id UUID REFERENCES users(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS programmes(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 title TEXT NOT NULL,
 genre TEXT NOT NULL DEFAULT 'General',
 duration_minutes INT NOT NULL DEFAULT 60,
 description TEXT NOT NULL DEFAULT '',
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS schedule(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 programme_id UUID REFERENCES programmes(id),
 start_time TIMESTAMPTZ NOT NULL,
 duration_minutes INT NOT NULL DEFAULT 60,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS live_config(
 channel TEXT PRIMARY KEY,
 state TEXT NOT NULL DEFAULT 'on_air',
 route TEXT NOT NULL DEFAULT 'primary',
 programme TEXT NOT NULL DEFAULT '',
 message TEXT NOT NULL DEFAULT '',
 primary_stream TEXT NOT NULL DEFAULT '',
 backup_stream TEXT NOT NULL DEFAULT '',
 emergency_stream TEXT NOT NULL DEFAULT '',
 no_signal_stream TEXT NOT NULL DEFAULT '',
 updated_by UUID REFERENCES users(id),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS media_assets(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 name TEXT NOT NULL,
 type TEXT NOT NULL DEFAULT 'video',
 storage_url TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'READY',
 created_by UUID REFERENCES users(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS audit_log(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id UUID REFERENCES users(id),
 user_email TEXT,
 action TEXT NOT NULL,
 area TEXT NOT NULL,
 detail TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS live_config_channel_idx ON live_config(channel);
