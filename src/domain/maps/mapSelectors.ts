import { starterMaps } from "../../data/starterMaps";
import type { MapDefinition, MapId } from "./mapTypes";
import type { CharacterState } from "../characters/characterTypes";

export const getMapById = (mapId: MapId): MapDefinition => {
  const map = starterMaps.find((candidate) => candidate.mapId === mapId);
  if (!map) throw new Error(`Unknown map: ${mapId}`);
  return map;
};

export type CharacterPlacement = { character: CharacterState; location: MapDefinition["locations"][number] };

export const selectCharactersOnMap = (characters: CharacterState[], map: MapDefinition): CharacterPlacement[] =>
  characters.flatMap((character) => {
    if (character.mapId !== map.mapId) return [];
    const location = map.locations.find(({ locationId }) => locationId === character.locationId);
    return location ? [{ character, location }] : [];
  });

export const selectProxyCharacters = (characters: CharacterState[], viewedMap: MapDefinition): CharacterPlacement[] =>
  characters.flatMap((character) => {
    if (character.mapId === viewedMap.mapId) return [];
    const gateway = viewedMap.locations.find((location) => location.gateway?.destinationMapId === character.mapId);
    return gateway ? [{ character, location: gateway }] : [];
  });
