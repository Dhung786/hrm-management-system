#!/bin/sh
set -eu

: "${HRM_APP_USER:?HRM_APP_USER is required}"
: "${HRM_APP_PASSWORD:?HRM_APP_PASSWORD is required}"
: "${POSTGRES_EXPORTER_USER:?POSTGRES_EXPORTER_USER is required}"
: "${POSTGRES_EXPORTER_PASSWORD:?POSTGRES_EXPORTER_PASSWORD is required}"

psql -v ON_ERROR_STOP=1 \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --set=db_name="$POSTGRES_DB" \
  --set=app_user="$HRM_APP_USER" \
  --set=app_password="$HRM_APP_PASSWORD" \
  --set=metrics_user="$POSTGRES_EXPORTER_USER" \
  --set=metrics_password="$POSTGRES_EXPORTER_PASSWORD" <<'EOSQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'app_user', :'app_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'app_user') \gexec

SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'metrics_user', :'metrics_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'metrics_user') \gexec

GRANT CONNECT ON DATABASE :"db_name" TO :"app_user";
GRANT USAGE, CREATE ON SCHEMA public TO :"app_user";

GRANT CONNECT ON DATABASE :"db_name" TO :"metrics_user";
GRANT pg_monitor TO :"metrics_user";
EOSQL
