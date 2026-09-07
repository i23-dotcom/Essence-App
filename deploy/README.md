# Deployment

## VPS / cloud outline
1. Provision Linux server with Docker and Docker Compose.
2. Create a private `.env.production` from the example.
3. Set a long random `POSTGRES_PASSWORD` and `JWT_SECRET`.
4. Set `CORS_ORIGIN` to the exact Essence Network public origin(s).
5. Run `docker compose -f deploy/docker-compose.yml up -d --build`.
6. Verify `/api/health`.
7. Put Nginx/Caddy/Traefik in front with HTTPS.
8. Schedule `backup-postgres.sh` to an off-server backup destination.
9. Configure monitoring and alerts.
10. Connect the real HLS/DASH primary and backup streams.

Do not expose PostgreSQL directly to the public internet.
