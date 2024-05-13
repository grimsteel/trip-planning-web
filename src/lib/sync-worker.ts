import type { ProxyMarked } from "comlink";
import type { LoroList, LoroMap, LoroMovableList } from "loro-crdt";
import type { LoroListClient, LoroMapClient, LoroMovableListClient } from "./loro-converters/client";

declare const self: SharedWorkerGlobalScope;

// This is an ES module with top level await, but the initial connect ev is fired immediately for SharedWorkers

let initialPort = null as MessagePort | null;

// Initial listener to just get a hold of the initial port
self.addEventListener("connect", e => {
  initialPort = e.ports[0];
  //initialPort.addEventListener("message", e => console.log(e))
}, { once: true });

// Load everything now that we have the initial port
const { expose, transferHandlers } = await import ("comlink");
const { loadLoroSave, saveLoro } = await import("$lib/db");
const { isContainer } = await import("loro-crdt");
const { loroWorkerHandler } = await import("./loro-converters/worker");

transferHandlers.set("loro-transport", loroWorkerHandler)

const loro = await loadLoroSave();
console.log(loro)

const clientObject = {
  // TODO: remove this `loro` property (only for debugging)
  loro,
  trips: loro.getMap("trips"),
  cities: loro.getMap("cities"),

  getContainer(path: string) {
    console.debug("get", path)
    const container = loro.getByPath(path);
    if (isContainer(container)) {
      return container;
    } else {
      return null;
    }
  },
  subscribe(path: string, callback: ((value: any) => void) & ProxyMarked) {
    console.debug("subscribe", path);
    const container = this.getContainer(path);
    if (container) {
      return container.subscribe(() => {
        callback(container);
      }); 
    } else {
      // Can only subscribe to containers
      return null;
    }
  },
  unsubscribe(id: number) {
    console.debug("unsubscribe", id);
    loro.unsubscribe(id);
  },
  save: () => saveLoro(loro),

  // More specific functions
  editCity(id: string, lat: number, long: number) {
    const city = this.cities.get(id);
    if (city) {
      city.set("lat", lat);
      city.set("long", long);
    }
  }
};

// Handle the initial port
if (initialPort !== null) {
  expose(clientObject, initialPort);
}

// Actual listener
self.addEventListener("connect", e => {
  const port = e.ports[0];
  if (port) {
    expose(clientObject, port);
  }
});

// Map a loro container to a client container
type MapLoroType<T> = 
  T extends LoroMap<infer Inner> ? LoroMapClient<Inner> : 
  T extends LoroList<infer Inner> ? LoroListClient<Inner> : 
  T extends LoroMovableList<infer Inner> ? LoroMovableListClient<Inner> : 
  T extends Record<string, unknown> ? MappedObject<T>
  : T;
// Map a function with loro params and a loro return type to the respective client values
// @ts-expect-error
type MappedFn<Fn extends (...args: any) => any> = (...args: MappedObject<Parameters<Fn>>) => MapLoroType<ReturnType<Fn>>
// Map the object to client values
type MappedObject<T> = {
  [K in keyof T]: 
    T[K] extends (...args: any) => any ? MappedFn<T[K]> :
      MapLoroType<T[K]>
};


export type LoroObject = MappedObject<typeof clientObject>;
/*const ws = new WebSocket("ws://127.0.0.1:8080/");
ws.binaryType = "arraybuffer";
ws.addEventListener("message", e => {
  if (e.data instanceof ArrayBuffer) {
    const message = decode(e.data);
    if (message) {
      console.log(message);
    }
  }
});*/