import { Knex } from "knex";

const config: Knex.Config = {
  client: "mysql2",
  connection: {
    host: "localhost",
    user: "root",
    password: "root",
    database: "koperasi_db",
  },
  migrations: {
    directory: "./db/migrations",
    tableName: "knex_migrations",
  },
  seeds: {
    directory: "./db/seeds",
  },
};

export default config;
