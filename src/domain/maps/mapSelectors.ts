import { starterMaps } from "../../data/starterMaps";
import type { MapDefinition, MapId } from "./mapTypes";

export const getMapById = (mapId: MapId): MapDefinition => {
  const map = starterMaps.find((candidate) => candidate.mapId === mapId);
  if (!map) throw new Error(`Unknown map: ${mapId}`);
  return map;
};
