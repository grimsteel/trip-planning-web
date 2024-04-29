import { onMount } from "svelte";
import SyncWorker from "$lib/sync-worker?sharedworker";
import type { Id, TripAttrs } from "./db";

type Subscription<T> = (value: T) => void;
type Trips = Record<Id, { attrs: TripAttrs, cities: Id[] }>;

let worker: SharedWorker | null = null;

onMount(() => {
  worker = new SyncWorker({ name: "sync-worker" });
  console.log("hi 2");
});

console.log("hi 1")

export const trips = {
  subscriptions: [] as Subscription<Trips>[],
  currentValue: {} as Trips,
  subscriptionId: null as number | null,

  subscribe(subscription: Subscription<Trips>) {
    subscription(this.currentValue);
    this.subscriptions.push(subscription);
    return () => {
      
    }
  },

  startSubscribing() {
    if (this.subscriptionId === null && worker !== null) {
      // TODO: stuff with worker
    }
  }
}