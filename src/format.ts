import { Category, Entry } from "./types";

export function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function formatChangelog(
  version: string,
  date: Date,
  categories: readonly Readonly<Category>[],
) {
  const changes = formatCategories(categories);
  return `## ${version}
Date: ${formatDate(date)}
${changes === "" ? "_No changes_" : changes}`;
}

export function formatCategories(
  categories: readonly Readonly<Category>[],
): string {
  return categories
    .map(({ emoji, title, children }) => {
      let category = "- ";
      if (emoji !== "") {
        category += `${emoji} `;
      }
      category += `${title}`;
      return [category, ...children.map((e) => formatEntry(e, 1))].join("\n");
    })
    .join("\n");
}

function formatEntry(entry: Readonly<Entry>, depth: number): string {
  let result = `${"  ".repeat(depth)}- ${entry.description}`;
  if (entry.mentions.length > 0) {
    result += ` (Reported by ${entry.mentions.map((m) => `@${m}`).join(", ")})`;
  }
  return [
    result,
    ...entry.children.map((child) => formatEntry(child, depth + 1)),
  ].join("\n");
}
