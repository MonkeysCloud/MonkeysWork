-- Fix table naming: the framework auto-generated these as useroauth / usersession
-- but the AuthController raw SQL references user_oauth / user_session
ALTER TABLE IF EXISTS useroauth RENAME TO user_oauth;
ALTER TABLE IF EXISTS usersession RENAME TO user_session;
