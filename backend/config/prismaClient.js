const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

function createClient(connectionString) {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

let client = process.env.DATABASE_URL
  ? createClient(process.env.DATABASE_URL)
  : null;
let clientConnectionString = process.env.DATABASE_URL || null;

async function initialize(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error("A database connection string is required");
  }

  if (!client) {
    client = createClient(connectionString);
    clientConnectionString = connectionString;
  } else if (clientConnectionString !== connectionString) {
    throw new Error("Prisma client was initialized for a different database");
  }
}

module.exports = new Proxy(
  {},
  {
    get(_target, property) {
      if (property === "initialize") return initialize;
      if (!client) {
        throw new Error("The Prisma client has not been initialized");
      }

      const value = Reflect.get(client, property, client);
      return typeof value === "function" ? value.bind(client) : value;
    },
  },
);