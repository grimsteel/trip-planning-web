import { decode, encode } from "./ws-message";
import { loadLoroSave, type Id, type TripAttrs } from "./db";
import { LoroText, isContainer, type Container, LoroMap, LoroMovableList } from "loro-crdt";

export type WorkerRxMessage = ({
  // Subscribe to a container
  type: "subscribe",
  path: string
} | {
  type: "unsubscribe",
  subscriptionId: number,
} | {
  type: "create-trip",
  tripId: Id,
  attrs: TripAttrs
}) & {
  id: number
};

export type WorkerTxMessage = ({
  type: "subscribed",
  subscriptionId: number,
  value: unknown,
  id?: number
} | {
  type: "update",
  subscriptionId: number,
  value: unknown
});

// Wrapped MessagePort with convenience functions
class WrappedPort {
  port: MessagePort;
  onMessage: (data: WorkerRxMessage, sendResponse: (data: WorkerTxMessage) => void, e: MessageEvent) => void;
  constructor(port: MessagePort, onMessage: WrappedPort["onMessage"]) {
    this.port = port;
    this.onMessage = onMessage;
  }

  start() {
    this.port.addEventListener("message", e => {
      if (typeof e.data === "object") {
        const data = e.data as WorkerRxMessage;
        // Function to send a response with this id
        const sendResponse = (response: Parameters<Parameters<WrappedPort["onMessage"]>[1]>[0]) => this.port.postMessage({ ...response, id: data.id });
        // Call the callback 
        this.onMessage(data, sendResponse, e);
      }
    });
    this.port.start();
  }

  postMessage(data: WorkerTxMessage) {
    this.port.postMessage(data);
  }
}

function containerToString(container: Container) {
  return container instanceof LoroText ? container.toString() : container.toJson();
}

declare const self: SharedWorkerGlobalScope;

const loro = await loadLoroSave();

console.log(loro)
self.addEventListener("connect", e => {
  const port = e.ports[0];
  if (port) {
    const wrappedPort = new WrappedPort(port, (data, sendResponse) => {
      // Handle messages from the port
      switch (data.type) {

        case "subscribe":
          // Subscribe to a path
          const loroItem = loro.getByPath(data.path);
          if (loroItem && isContainer(loroItem)) {
            const subscriptionId = loroItem.subscribe(e => {
              // Send an update every time it changes
              wrappedPort.postMessage({ type: "update", subscriptionId, value: containerToString(loroItem) })
            });
            sendResponse({ type: "subscribed", subscriptionId, value: containerToString(loroItem) })
          }
          break;

        case "unsubscribe":
          // Unsubscribe from a path
          loro.unsubscribe(data.subscriptionId);
          break;

        case "create-trip":
          // Create a trip
          const trips = loro.getMap("trips");
          const trip = trips.setContainer(data.tripId, new LoroMap());
          trip.set("attrs", data.attrs);
          trip.setContainer("cities", new LoroMovableList());
          loro.commit();
          break;
      }
    });
    wrappedPort.start();
  }
});

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