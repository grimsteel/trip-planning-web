import { get, set } from "idb-keyval";
import { Loro, LoroMap, LoroMovableList, VersionVector, type Container } from "loro-crdt";
import { nanoid } from "nanoid";

// Just to make it clear
export type Id = string;
export type DoubleId = `${Id}${Id}`;
type MapWithAttrs<Attrs, T extends Record<string, unknown>> = LoroMap<{ attrs: Attrs } & T>;
export interface TripAttrs { name: string, date: string };
export interface CityAttrs { name: string, lat: number, long: number };

interface DbStructure {
  trips: LoroMap<Record<Id, MapWithAttrs<TripAttrs, { cities: LoroMovableList<Id> }>>>,
  cities: LoroMap<Record<Id, MapWithAttrs<CityAttrs, { places: LoroMovableList<Id> }>>>,
  edges: LoroMap<Record<DoubleId, LoroMovableList<Id>>>,
  [key: string]: Container
}

export const randomId = () => nanoid(10);

export async function loadLoroSave() {
  const savedSnapshot = await get<Uint8Array>("saved-snapshot");
  const savedUpdates = await get<Uint8Array[]>("saved-updates");
  const peerId = await get<bigint>("peer-id");

  // Create the loro instance from the saved snapshot if applicable
  const loro = savedSnapshot ? (Loro.fromSnapshot(savedSnapshot) as Loro<DbStructure>) : new Loro<DbStructure>();

  // Reuse our existing peer id
  if (peerId) loro.setPeerId(peerId);
  else await set("peer-id", loro.peerId);

  // Apply any updates needed
  if (savedUpdates) loro.importUpdateBatch(savedUpdates);

  return loro;
}

/**
 * Save changes made to the Loro instance to the database
 * @param loro The loro instance
 */
export async function saveLoro(loro: Loro) {
  const lastSavedVersion = await get<ReturnType<VersionVector["toJSON"]>>("saved-version");
  const update = loro.exportFrom(new VersionVector(lastSavedVersion));
  const existingUpdates = (await get<Uint8Array[]>("saved-updates")) ?? [];

  // Never store more than 10 updates
  if (existingUpdates.length >= 10) {
    const snapshot = loro.exportSnapshot();
    await set("saved-snapshot", snapshot);
    // Clear saved updates
    await set("saved-updates", []);
  } else {
    // Add this update and save
    existingUpdates.push(update);
    await set("saved-updates", existingUpdates);
  }

  await set("saved-version", loro.version().toJSON());
}