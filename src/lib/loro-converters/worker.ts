// Comlink wrappers for Loro items

import type { TransferHandler } from "comlink";
import { LoroMap, type Container, LoroMovableList, isContainer, LoroList } from "loro-crdt";
import { isLoroTransport, type LoroListTransport, type LoroMapTransport, type LoroTransport } from "./transport";
import type { LoroMapClient } from "./client";

// Convert a loro container into our transport type depending on what it is
function serializeContainer(container: Container): LoroTransport {
  if (container instanceof LoroMap) return serializeLoroMap(container);
  else if (container instanceof LoroMovableList || container instanceof LoroList) return serializeLoroList(container);

  throw new Error("unimplemented");
}

// Convert it back
function deserializeLoroTransport(serialized: LoroTransport) {
  if (serialized.loroType === "list" || serialized.loroType === "movable-list") return deserializeLoroList(serialized);
  else if (serialized.loroType === "map") return deserializeLoroMap(serialized);

  throw new Error("unimplemented");
}

// Make a new map transport, also serialize the keys
function serializeLoroMap(map: LoroMap): LoroMapTransport {
  const serialized: Record<string, unknown> = {};
  for (const [k, v] of map.entries()) {
    if (isContainer(v)) serialized[k] = serializeContainer(v);
    else serialized[k] = v;
  }
  return { loroType: "map", map: serialized };
}

function deserializeLoroMap(serialized: LoroMapTransport): LoroMap {
  const map = new LoroMap();
  for (const [k, v] of Object.entries(serialized.map)) {
    if (isLoroTransport(v)) map.setContainer(k, deserializeLoroTransport(v));
    else map.set(k, v);
  }
  return map;
}

function serializeLoroList(list: LoroList | LoroMovableList): LoroListTransport {
  const serialized = Array(list.length);
  for (let i = 0; i < list.length; i++) {
    const item = list.get(i);
    if (isContainer(item)) serialized[i] = serializeContainer(item);
    else serialized[i] = item;
  }
  return { loroType: list instanceof LoroList ? "list" : "movable-list", list: serialized };
}

function deserializeLoroList(serialized: LoroListTransport) {
  const list = serialized.loroType === "list" ? new LoroList() : new LoroMovableList();
  serialized.list.forEach((item, i) => {
    if (isLoroTransport(item)) list.insertContainer(i, deserializeLoroTransport(item));
    else list.insert(i, item);
  });
  return list;
}

// Handler to convert all Loro containers into transport types
export const loroWorkerHandler: TransferHandler<Container, LoroTransport> = {
  canHandle: isContainer,
  deserialize: deserializeLoroTransport,
  serialize(value) {
    return [serializeContainer(value), []];
  },
};