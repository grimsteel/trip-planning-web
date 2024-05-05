import type { TransferHandler } from "comlink";
import { isLoroTransport, type LoroTransport } from "./transport";

export class LoroListClient<T> extends Array<T> {}
export class LoroMovableListClient<T> extends Array<T> {}
export class LoroMapClient<T extends Record<string, unknown>> {
  value: T
  constructor(value: T) {
    this.value = value;
  }
  get<K extends keyof T>(key: K): T[K] {
    return this.value[key];
  }
  set<K extends keyof T>(key: K, value: T[K]) {
    this.value[key] = value;
  }
  [Symbol.iterator]() {
    const entries = Object.entries(this.value) as [keyof T, T[keyof T]][];
    let idx = -1;

    return {
      next() {
        const value = entries[++idx];
        return {
          value,
          done: idx >= entries.length
        }
      }
    }
  }
};

export type LoroClient = LoroListClient<unknown> | LoroMovableListClient<unknown> | LoroMapClient<Record<string, unknown>>;

export function isLoroClient(value: unknown): value is LoroClient {
  return value instanceof LoroListClient || value instanceof LoroMovableListClient || value instanceof LoroMapClient;
}

function trySerializeLoroClient(value: unknown): unknown {
  if (isLoroClient(value)) return serializeLoroClient(value);
  else return value;
}

function tryDeserializeLoroTransport(value: unknown): unknown {
  if (isLoroTransport(value)) return deserializeLoroTransport(value);
  else return value;
}

function serializeLoroClient(value: LoroClient): LoroTransport {
  if (value instanceof LoroListClient) return { loroType: "list", list: value.map(trySerializeLoroClient) };
  else if (value instanceof LoroMovableListClient) return { loroType: "movable-list", list: value.map(trySerializeLoroClient) };
  else return {
    loroType: "map",
    map: Object.fromEntries(
      Object.entries(value.value)
        // Map any containers to their respective types
        .map(([k, v]) => [k, trySerializeLoroClient(v)])
    )
  }
}

// Convert the transport back into our client type
function deserializeLoroTransport(value: LoroTransport): LoroClient {
  // basically just by setting the prototype
  if (value.loroType === "list") return LoroListClient.from(value.list, tryDeserializeLoroTransport);
  else if (value.loroType === "movable-list") return LoroMovableListClient.from(value.list, tryDeserializeLoroTransport);
  else if (value.loroType === "map") return new LoroMapClient(
    Object.fromEntries(
      Object.entries(value.map)
        // Map any containers to their respective types
        .map(([k, v]) => [k, tryDeserializeLoroTransport(v)])
    )
  );

  throw new Error("unimplemented");
}

// Handler to convert all Loro client types (basically just loro types w/o loro) into transport types
export const loroClientHandler: TransferHandler<LoroClient, LoroTransport> = {
  canHandle: isLoroClient,
  serialize(value) {
    return [serializeLoroClient(value), []];
  },
  deserialize: deserializeLoroTransport
}