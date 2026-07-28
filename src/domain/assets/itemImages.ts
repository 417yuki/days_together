export const ITEM_IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export type ItemImageMimeType = typeof ITEM_IMAGE_MIME_TYPES[number];
export const MAX_ITEM_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_ORIGINAL_NAME_LENGTH = 120;

export type AssetKind = "item_image" | "character_pin";
export type AssetMetadata = { assetId: string; kind: AssetKind; ownerId: string; mimeType: ItemImageMimeType; byteSize: number; originalName: string; createdAt: string; updatedAt: string };
export type AssetBlobRecord = { assetId: string; blob: Blob };
export type ItemImageAsset = { metadata: AssetMetadata; blob: Blob };

const control = /[\u0000-\u001f\u007f]/u;
export const isSafeAssetId = (value: unknown): value is string => typeof value === "string" && value.length >= 1 && value.length <= 100 && !control.test(value);
export const validateOriginalName = (name: string): string => {
  if (!name || name.length > MAX_ORIGINAL_NAME_LENGTH || control.test(name)) throw new Error(`ファイル名は${MAX_ORIGINAL_NAME_LENGTH}文字以内で、制御文字を含まないものを選んでください。`);
  return name;
};

export const validateItemImage = async (file: File): Promise<ItemImageMimeType> => {
  if (!ITEM_IMAGE_MIME_TYPES.includes(file.type as ItemImageMimeType)) throw new Error("PNG、JPEG、WebPの画像を選んでください。");
  if (file.size === 0) throw new Error("空のファイルは登録できません。");
  if (file.size > MAX_ITEM_IMAGE_BYTES) throw new Error("画像は10 MiB以下にしてください。");
  validateOriginalName(file.name);
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const png = bytes.length >= 8 && [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a].every((v, i) => bytes[i] === v);
  const jpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const webp = bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if ((file.type === "image/png" && !png) || (file.type === "image/jpeg" && !jpeg) || (file.type === "image/webp" && !webp)) throw new Error("画像の形式とファイル内容が一致しません。");
  return file.type as ItemImageMimeType;
};

export const parseAssetMetadata = (value: unknown, expectedKind?: AssetKind): AssetMetadata | null => {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (!isSafeAssetId(v.assetId) || !["item_image", "character_pin"].includes(v.kind as string) || (expectedKind && v.kind !== expectedKind) || !isSafeAssetId(v.ownerId) || !ITEM_IMAGE_MIME_TYPES.includes(v.mimeType as ItemImageMimeType) || typeof v.byteSize !== "number" || v.byteSize < 1 || v.byteSize > MAX_ITEM_IMAGE_BYTES || typeof v.originalName !== "string" || !v.originalName || v.originalName.length > MAX_ORIGINAL_NAME_LENGTH || control.test(v.originalName) || typeof v.createdAt !== "string" || !Number.isFinite(Date.parse(v.createdAt)) || typeof v.updatedAt !== "string" || !Number.isFinite(Date.parse(v.updatedAt))) return null;
  return v as AssetMetadata;
};
