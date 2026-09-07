# Essence Network — Master Control / Production CMS

This package is the next production-control layer for Essence Network.

## Control surfaces
- Master dashboard
- Editorial Desk
- Programme Production
- TV Guide / EPG
- Live Control
- Emergency / NO SIGNAL / ON AIR state controls
- Media Library registration
- Website publishing settings prototype
- Users & role model
- Audit log
- PostgreSQL persistence
- JWT authentication + bcrypt password hashing
- API rate limiting
- Docker deployment foundation
- PostgreSQL backup script
- GitHub Actions API syntax checks

## Start locally
1. Install Node.js 20+ and PostgreSQL 16+.
2. Copy `server/.env.example` to `server/.env` and set secure values.
3. Create the database and run `database/schema.sql`.
4. From `server/`: `npm install`
5. Run `npm run seed:admin`
6. Run `npm start`
7. Serve `admin/` from a web server and set `localStorage.essence_api` to your API URL.
8. Sign-in UI can be connected to the API login endpoint; the current master console expects a JWT in localStorage.

## Docker
See `deploy/docker-compose.yml` and `deploy/README.md`.

## Important production boundary
This is deployment-ready infrastructure, not a live broadcast by itself. Actual transmission still requires a real encoder/ingest, origin/packager, CDN, HLS/DASH streams, media storage, monitoring, HTTPS and operational procedures.

## Roles
Admin, editor, journalist, producer and additional operational roles should follow least privilege.

## Security before public launch
- Replace all example secrets.
- Use HTTPS.
- Restrict CORS to real domains.
- Put API behind a reverse proxy/WAF.
- Use managed PostgreSQL or hardened PostgreSQL.
- Encrypt/backup database and media.
- Add refresh-token/session strategy and stronger request validation before internet exposure.
- Create separate operator accounts; never share the super-admin password.
