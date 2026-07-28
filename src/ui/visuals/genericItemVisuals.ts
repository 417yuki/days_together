const NS = "http://www.w3.org/2000/svg";

export const genericVisualIds = ["food", "drink", "plant", "book", "tool_craft", "photo_memory", "gift", "furniture", "clothing", "small_goods"] as const;
export type GenericVisualId = typeof genericVisualIds[number];

export type GenericVisualDefinition = Readonly<{ path: string; accentPath: string }>;

export const genericVisualRegistry: Readonly<Record<GenericVisualId, GenericVisualDefinition>> = {
  food: { path: "M24 54h72c0 20-16 34-36 34S24 74 24 54Zm10-8c8-14 44-14 52 0", accentPath: "M43 35c0-8 7-13 17-13s17 5 17 13M51 22l-4-8m22 8 4-8" },
  drink: { path: "M31 32h49v38c0 12-10 20-22 20h-5c-12 0-22-8-22-20Zm49 9h7c15 0 15 23 0 23h-7", accentPath: "M43 25c-7-8 7-10 0-18m16 18c-7-8 7-10 0-18m16 18c-7-8 7-10 0-18" },
  plant: { path: "M39 60h42l-5 31H44Zm21 0V31", accentPath: "M59 43C35 43 33 20 33 20c22 0 27 14 26 23Zm2 3c24 0 27-24 27-24-23 0-28 15-27 24Z" },
  book: { path: "M18 25c18-5 32 0 42 10v58c-10-10-24-15-42-10Zm84 0c-18-5-32 0-42 10v58c10-10 24-15 42-10Z", accentPath: "M60 35v58M28 42c10-2 18 0 24 5m-24 9c10-2 18 0 24 5m40-19c-10-2-18 0-24 5" },
  tool_craft: { path: "M22 88 72 38m-9-15 15-8 20 20-8 15Zm1 35 25 25-13 13-25-25Z", accentPath: "M27 31h27M38 20v33m45 9 15 15M75 70l15 15" },
  photo_memory: { path: "M20 25h80v68H20Zm10 54 20-22 14 14 10-10 16 18", accentPath: "M40 43a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm25-21 8-8 8 8" },
  gift: { path: "M20 45h80v54H20Zm-5-18h90v18H15Zm45 0v72", accentPath: "M60 27c-20 0-24-17-11-17 10 0 11 17 11 17Zm0 0c20 0 24-17 11-17-10 0-11 17-11 17" },
  furniture: { path: "M26 55h68v32H26Zm8 32v14m52-14v14M32 55V25h56v30", accentPath: "M43 36h34M43 45h25M18 65h8m68 0h8" },
  clothing: { path: "M39 23 17 39l11 22 11-7v47h42V54l11 7 11-22-22-16c0 18-42 18-42 0Z", accentPath: "M48 70c8 5 16 5 24 0M50 84h20m-10-49v25" },
  small_goods: { path: "M22 42h76v54H22Zm-5-17h86v17H17Zm32 17v54", accentPath: "M61 59h22v20H61Zm-29 1 10-8 8 8-9 9Z" },
};

const aliases: Readonly<Record<string, GenericVisualId>> = { food: "food", drink: "drink", plant: "plant", book: "book", tool: "tool_craft", craft: "tool_craft", photo: "photo_memory", memory: "photo_memory", gift: "gift", furniture: "furniture", clothing: "clothing", toy: "small_goods", storage: "small_goods", misc: "small_goods" };

export const resolveGenericVisualKey = (key: string | null): GenericVisualId | null => key === null ? null : aliases[key] ?? null;
export const getGenericVisualDefinition = (id: string): GenericVisualDefinition | null => Object.hasOwn(genericVisualRegistry, id) ? genericVisualRegistry[id as GenericVisualId] : null;

export const GenericItemVisual = (id: GenericVisualId): SVGSVGElement | null => {
  const definition = getGenericVisualDefinition(id);
  if (!definition) return null;
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 120 110");
  svg.setAttribute("class", "generic-item-visual");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const main = document.createElementNS(NS, "path");
  main.setAttribute("class", "generic-item-visual__main");
  main.setAttribute("d", definition.path);
  const accent = document.createElementNS(NS, "path");
  accent.setAttribute("class", "generic-item-visual__accent");
  accent.setAttribute("d", definition.accentPath);
  svg.append(main, accent);
  return svg;
};
