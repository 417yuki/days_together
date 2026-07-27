import type { MapDefinition } from "../domain/maps/mapTypes";

export const starterMaps: MapDefinition[] = [
  {
    mapId: "starter_house_interior", name: "家の中", mapType: "interior",
    locations: [
      { locationId: "kitchen", label: "台所", position: { x: 0.24, y: 0.18 }, locationTags: ["cooking"], connectedLocationIds: ["table"] },
      { locationId: "workbench", label: "作業台", position: { x: 0.76, y: 0.19 }, locationTags: ["work"], connectedLocationIds: ["sofa"] },
      { locationId: "table", label: "テーブル", position: { x: 0.29, y: 0.43 }, locationTags: ["living"], connectedLocationIds: ["kitchen", "entrance"] },
      { locationId: "sofa", label: "ソファ", position: { x: 0.72, y: 0.43 }, locationTags: ["rest"], connectedLocationIds: ["workbench", "entrance"] },
      { locationId: "entrance", label: "玄関", position: { x: 0.52, y: 0.76 }, locationTags: ["gateway"], connectedLocationIds: ["table", "sofa"], gateway: { destinationMapId: "starter_garden", destinationLocationId: "front_of_house" } }
    ]
  },
  {
    mapId: "starter_garden", name: "庭", mapType: "outdoor",
    locations: [
      { locationId: "front_of_house", label: "家の前", position: { x: 0.5, y: 0.43 }, locationTags: ["gateway"], connectedLocationIds: ["garden", "shed"], gateway: { destinationMapId: "starter_house_interior", destinationLocationId: "entrance" } },
      { locationId: "shed", label: "物置", position: { x: 0.2, y: 0.72 }, locationTags: ["storage"], connectedLocationIds: ["front_of_house"] },
      { locationId: "garden", label: "庭", position: { x: 0.7, y: 0.78 }, locationTags: ["nature"], connectedLocationIds: ["front_of_house"] }
    ]
  }
];
