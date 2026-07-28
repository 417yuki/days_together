import type { CharacterState } from "../characters/characterTypes";
import type { LocationRef, MapDefinition } from "../maps/mapTypes";

export type MovementState = {
  path: LocationRef[];
  nextIndex: number;
  destination: LocationRef;
};

export type LocationGraph = Map<string, LocationRef[]>;
export const locationKey = ({ mapId, locationId }: LocationRef): string => `${mapId}:${locationId}`;

export const buildLocationGraph = (maps: MapDefinition[], reportInvalid: (message: string) => void = () => undefined): LocationGraph => {
  const nodes = new Map(maps.flatMap((map) => map.locations.map((location) => [locationKey({ mapId: map.mapId, locationId: location.locationId }), { mapId: map.mapId, locationId: location.locationId }] as const)));
  const graph: LocationGraph = new Map([...nodes.keys()].map((key) => [key, []]));
  const connect = (from: LocationRef, to: LocationRef, description: string): void => {
    const fromKey = locationKey(from); const toKey = locationKey(to);
    if (!nodes.has(fromKey) || !nodes.has(toKey)) { reportInvalid(`無効な接続を無視しました: ${description}`); return; }
    const neighbors = graph.get(fromKey)!;
    if (!neighbors.some((neighbor) => locationKey(neighbor) === toKey)) neighbors.push(to);
  };
  maps.forEach((map) => map.locations.forEach((location) => {
    const from = { mapId: map.mapId, locationId: location.locationId };
    location.connectedLocationIds.forEach((locationId) => { const to = { mapId: map.mapId, locationId }; connect(from, to, `${locationKey(from)} -> ${locationKey(to)}`); connect(to, from, `${locationKey(to)} -> ${locationKey(from)}`); });
    if (location.gateway) connect(from, { mapId: location.gateway.destinationMapId, locationId: location.gateway.destinationLocationId }, `${locationKey(from)} gateway`);
  }));
  return graph;
};

export const findShortestPath = (graph: LocationGraph, start: LocationRef, destination: LocationRef): LocationRef[] | null => {
  const startKey = locationKey(start); const destinationKey = locationKey(destination);
  if (!graph.has(startKey) || !graph.has(destinationKey)) return null;
  const queue: LocationRef[][] = [[start]]; const visited = new Set([startKey]);
  while (queue.length) {
    const path = queue.shift()!; const current = path[path.length - 1];
    if (locationKey(current) === destinationKey) return path;
    for (const neighbor of graph.get(locationKey(current)) ?? []) {
      const key = locationKey(neighbor); if (visited.has(key)) continue; visited.add(key); queue.push([...path, neighbor]);
    }
  }
  return null;
};

export const startMovement = (character: CharacterState, destination: LocationRef, graph: LocationGraph): MovementState | null => {
  const path = findShortestPath(graph, character, destination);
  return !path || path.length < 2 ? null : { path, nextIndex: 1, destination };
};

export const advanceMovement = (character: CharacterState, movement: MovementState): { character: CharacterState; movement: MovementState | null } => {
  const next = movement.path[movement.nextIndex];
  if (!next) return { character, movement: null };
  const updated = { ...character, ...next }; const nextIndex = movement.nextIndex + 1;
  return { character: updated, movement: nextIndex >= movement.path.length ? null : { ...movement, nextIndex } };
};
