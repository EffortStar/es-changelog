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

export function stripPrivateEntries(categories: readonly Readonly<Entry>[]): Readonly<Entry>[] {
  return categories.reduce((acc, entry) => {
    if (entry.description.startsWith("//")) {
      return acc;
    }
    acc.push({
      description: entry.description,
      mentions: entry.mentions,
      children: stripPrivateEntries(entry.children),
    })
    return acc;
  }, [] as Readonly<Entry>[]);
}

export function stripPrivateFromCategories(categories: readonly Readonly<Category>[]): Readonly<Category>[] {
  var result = [];
  for (const { title, emoji, children } of categories) {
    var c = stripPrivateEntries(children);
    if (c.length > 0) {
      result.push({
        title: title,
        emoji: emoji,
        children: c,
      });
    }
  }
  return result;
}