import { Knex } from "knex";

const config: Knex.Config = {
  client: "mysql2",
  connection: {
    host: "localhost",
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
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
