import syncWorker from "./sync-worker?sharedworker&url";
import { browser } from "$app/environment";
import { proxy, transferHandlers, wrap } from "comlink";
import type { LoroObject } from "./sync-worker";
import { isLoroClient, loroClientHandler, type LoroClient, LoroMapClient } from "./loro-converters/client";
import { readable, type Readable } from "svelte/store";
import type { ClientDbStructure, Id } from "./db";

// Some default stuff to aid with prerendering
const defaultLoroObject = {
  getContainer: (_path: string) => null,
  subscribe: (_path: string, _callback: Function) => Promise.resolve(null),
  unsubscribe: (id: number) => {},
  save: () => {},
  trips: null
};

const worker = browser ? new SharedWorker(syncWorker, { type: "module", credentials: "same-origin", name: "sync-worker" }) : null;
const loroObject = worker ? wrap<LoroObject>(worker.port) : defaultLoroObject;

transferHandlers.set("loro-transport", loroClientHandler);

export async function subscribeToContainer<T extends {}>(path: string) {
  const currentValue = (await loroObject.getContainer(path)) as T | null;
  if (currentValue) {
    return readable(currentValue, set => {
      let subscriptionId: number | null = null;
      // Update when we get a subscription push
      loroObject.subscribe(path, proxy((value: T) => {
        set(value);
      })).then(id => subscriptionId = id);

      return () => subscriptionId && loroObject.unsubscribe(subscriptionId)
    });
  } else {
    // Just return a null-store
    return readable(null);
  }
}

let _trips: Readable<ClientDbStructure["trips"] | null> | null = null;
let _cities: Readable<ClientDbStructure["cities"] | null> | null = null;
export const trips = async () => _trips ?? (_trips = await subscribeToContainer<ClientDbStructure["trips"]>("trips"));
export const cities = async () => _cities ?? (_cities = await subscribeToContainer<ClientDbStructure["cities"]>("cities"));
export const loro = loroObject;