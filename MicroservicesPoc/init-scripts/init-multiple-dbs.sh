#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE users_db;
    CREATE DATABASE orders_db;
EOSQL

echo "Bases users_db et orders_db créées avec succès."
