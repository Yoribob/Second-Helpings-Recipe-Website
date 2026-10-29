import { httpServerHandler } from "cloudflare:node";
import backend from "./server.js";

const { server, configureRuntime, withDatabaseClient } = backend;
const handleRequest = httpServerHandler(server);

export default {
  async fetch(request, env, ctx) {
    configureRuntime(env);
    return withDatabaseClient(env.HYPERDRIVE.connectionString, () =>
      handleRequest.fetch(request, env, ctx),
    );
  },
};
