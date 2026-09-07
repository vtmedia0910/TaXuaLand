# PostgreSQL/PostGIS local operations

Use an isolated LAND PostgreSQL 17 database. Docker option: set DATABASE_OWNER_PASSWORD to a newly generated secret and run `docker compose -f infra/compose.yml up -d`. Never connect migrations to another product.

Run `node --env-file=.env.local infra/migrate.ts` with DATABASE_URL pointing to the LAND owner connection. Migrations are transactional, serialized with an advisory lock and checked by SHA-256. Never edit an applied migration.

`DATABASE_TEST_URL` points to a local administrative maintenance database. Integration tests create a unique `land_test_<uuid>` database, apply all migrations, perform actual PostGIS queries and drop only that disposable database. This account needs CREATEDB; the application runtime must not have it.

On Windows without Docker, official [EDB binaries](https://www.enterprisedb.com/download-postgresql-binaries) and matching [PostGIS binaries](https://postgis.net/documentation/getting_started/install_windows/released_versions/) may be extracted into ignored `work/runtime`. Initialize with SCRAM authentication, bind only 127.0.0.1 and use a LAND-only random password. Run `postgres.exe -D work/database` when the restricted desktop sandbox prevents pg_ctl from creating a Windows restricted token. Do not install a system service or weaken authentication.

The initial local QA environment uses PostgreSQL 17.11 and PostGIS 3.6.2. Raw binaries and database files are excluded from Git. Deployment must use a migration owner and a separate least-privileged application role. Back up with pg_dump custom format, test pg_restore into an isolated database, retain immutable object release manifests alongside backups.
