import { httpServerHandler } from "cloudflare:node";
import backend from "./server.js";

const { server, configureRuntime, initializeDatabase } = backend;
const handleRequest = httpServerHandler(server);

let initialization;

export default {
  async fetch(request, env, ctx) {
    configureRuntime(env);
    initialization ??= initializeDatabase(env.HYPERDRIVE.connectionString);
    await initialization;
    return handleRequest.fetch(request, env, ctx);
  },
};
