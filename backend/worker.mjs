import { httpServerHandler } from "cloudflare:node";
import backend from "./server.js";

const { server, configureRuntime, initializeDatabase } = backend;
const handleRequest = httpServerHandler(server);

export default {
  async fetch(request, env, ctx) {
    configureRuntime(env);
    await initializeDatabase(env.HYPERDRIVE.connectionString);
    return handleRequest.fetch(request, env, ctx);
  },
};
