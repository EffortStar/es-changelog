import { Category, Entry } from "./types";

export function flattenCategories(
  categories: readonly Readonly<Category>[],
): Category[] {
  const map = new Map<string, Category>();

  for (const category of categories) {
    const key = category.title.toLowerCase();
    if (map.has(key)) {
      const previous = map.get(key)!;
      map.set(key, {
        ...previous,
        children: [...previous.children, ...category.children],
      });
    } else {
      map.set(key, category);
    }
  }

  return [...map.values()];
}