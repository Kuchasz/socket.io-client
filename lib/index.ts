import { Manager, ManagerOptions } from "./manager";
import { Socket, SocketOptions } from "./socket";
import { url } from "./url";

const debug = require("debug")("socket.io-client");

/**
 * Managers cache.
 */
export const managers: Record<string, Manager> = {};

/**
 * Looks up an existing `Manager` for multiplexing.
 * If the user summons:
 *
 *   `io('http://localhost/a');`
 *   `io('http://localhost/b');`
 *
 * We reuse the existing instance based on same scheme/port/host,
 * and we initialize sockets for each namespace.
 *
 * @public
 */
function lookup(opts?: Partial<ManagerOptions & SocketOptions>): Socket;
function lookup(
  uri: string,
  opts?: Partial<ManagerOptions & SocketOptions>
): Socket;
function lookup(
  uri: string | Partial<ManagerOptions & SocketOptions>,
  opts?: Partial<ManagerOptions & SocketOptions>
): Socket;
function lookup(
  uri: string | Partial<ManagerOptions & SocketOptions>,
  opts?: Partial<ManagerOptions & SocketOptions>
): Socket {
  if (typeof uri === "object") {
    opts = uri;
    uri = undefined;
  }

  opts = opts || {};

  const parsed = url(uri as string, opts.path || "/socket.io");
  const source = parsed.source;
  const id = parsed.id;
  const path = parsed.path;
  const sameNamespace = managers[id] && path in managers[id]["nsps"];
  const newConnection =
    opts.forceNew ||
    opts["force new connection"] ||
    false === opts.multiplex ||
    sameNamespace;

  let io: Manager;

  if (newConnection) {
    debug("ignoring socket cache for %s", source);
    io = new Manager(source, opts);
  } else {
    if (!managers[id]) {
      debug("new io instance for %s", source);
      managers[id] = new Manager(source, opts);
    }
    io = managers[id];
  }
  if (parsed.query && !opts.query) {
    opts.query = parsed.queryKey;
  }
  return io.socket(parsed.path, opts);
}

/**
 * Protocol version.
 *
 * @public
 */

export { protocol } from "socket.io-parser";

/**
 * `connect`.
 *
 * @param {String} uri
 * @public
 */

export const connect = lookup;

/**
 * Expose constructors for standalone build.
 *
 * @public
 */

export { Manager, ManagerOptions } from "./manager";
export { Socket } from "./socket";
export { lookup as io, SocketOptions };
export default lookup;
