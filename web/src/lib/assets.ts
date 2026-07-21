import manifest from "@/data/asset-covers.json";

type Folder = keyof typeof manifest;

/**
 * Путь к статичной картинке с хэшем в имени.
 *
 * Картинки отдаются с `expires 7d`. Если заменить файл под тем же именем,
 * вернувшийся посетитель ещё неделю видит старую версию — на этом уже
 * обожглись с плиткой категорий. Хэш меняет URL вместе с содержимым.
 */
export function assetUrl(folder: Folder, name: string): string {
  const file = (manifest[folder] as Record<string, string>)[name];
  return file ? `/${folder}/${file}` : `/${folder}/${name}.jpg`;
}
