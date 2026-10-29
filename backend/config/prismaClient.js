const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { AsyncLocalStorage } = require("node:async_hooks");

function createClient(connectionString) {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

const requestClients = new AsyncLocalStorage();
let client = process.env.DATABASE_URL
  ? createClient(process.env.DATABASE_URL)
  : null;
let clientConnectionString = process.env.DATABASE_URL || null;

async function withClient(connectionString, callback) {
  if (!connectionString) {
    throw new Error("A database connection string is required");
  }

  const requestClient = createClient(connectionString);
  let requestError;

  try {
    return await requestClients.run(requestClient, callback);
  } catch (error) {
    requestError = error;
    throw error;
  } finally {
    try {
      await requestClient.$disconnect();
    } catch (error) {
      console.error("Failed to disconnect request Prisma client:", error);
      if (!requestError) throw error;
    }
  }
}

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
      if (property === "withClient") return withClient;

      const activeClient = requestClients.getStore() || client;
      if (!activeClient) {
        throw new Error("The Prisma client has not been initialized");
      }

      const value = Reflect.get(activeClient, property, activeClient);
      return typeof value === "function" ? value.bind(activeClient) : value;
    },
  },
);