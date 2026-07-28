export type MapId = "starter_house_interior" | "starter_garden";

export type LocationRef = { mapId: MapId; locationId: string };

export type LocationDefinition = {
  locationId: string;
  label: string;
  position: { x: number; y: number };
  locationTags: string[];
  connectedLocationIds: string[];
  gateway?: { destinationMapId: MapId; destinationLocationId: string };
};

export type MapDefinition = {
  mapId: MapId;
  name: string;
  mapType: "interior" | "outdoor";
  locations: LocationDefinition[];
};
