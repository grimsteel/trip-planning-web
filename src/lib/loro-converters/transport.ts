export interface LoroMapTransport { loroType: "map", map: Record<string, unknown> };
export interface LoroListTransport { loroType: "list" | "movable-list", list: unknown[] };

export type LoroTransport = LoroMapTransport | LoroListTransport;

export function isLoroTransport(value: any): value is LoroTransport {
  return typeof value === "object" && "loroType" in value && ["list", "movable-list", "map"].includes(value.loroType);
};