import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // generate does not connect; placeholder keeps CLI 7 happy without .env
    url:
      process.env.DATABASE_URL ||
      "postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder",
  },
});
