export const LOCAL_ACCESS_SCHEMA = `
CREATE TABLE local_credentials(user_id TEXT PRIMARY KEY REFERENCES local_users(id),salt TEXT NOT NULL CHECK(length(salt)=32),password_hash TEXT NOT NULL CHECK(length(password_hash)=64),algorithm TEXT NOT NULL CHECK(algorithm='SCRYPT')) STRICT;
`;