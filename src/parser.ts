import { last } from "lodash";
import MarkdownIt from "markdown-it";
import { Category, Entry } from "./types";
import { stripHtmlComments } from "./strip-html-comments";

const markdown = new MarkdownIt();
type MarkdownToken = ReturnType<MarkdownIt["parse"]>[number];

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

/** Repair wrapped commit-message lines before parsing the Markdown. */
export function normalizeBullets(lines: string[]): string[] {
  return lines
    .filter((line) => line.trim() !== "")
    .reduce((normalized, line) => {
      const previous = last(normalized);
      if (
        previous !== undefined &&
        !previous.startsWith("#") &&
        !line.startsWith("#") &&
        !/^\s*-/.test(line)
      ) {
        normalized[normalized.length - 1] = `${previous} ${line.trim()}`;
      } else {
        normalized.push(line);
      }
      return normalized;
    }, [] as string[]);
}

export function parseVersion(line: string): number | null {
  const matches = line.match(/<!--\s+es-changelog-version\s+(\d+)\s+-->/);
  if (matches === null || matches.length < 2) {
    return null;
  }
  return parseInt(matches[1]);
}

export function parseCategory(line: string): Category | null {
  const matches = line.match(/\s*#+\s*([^\w\s]*)\s*([\w\s]+)/);
  if (matches === null) {
    return null;
  }
  const [, emoji, title] = matches;
  return { emoji, title, children: [] };
}

export function parseEntry(line: string): [Entry, number] {
  const matches = line.match(/^( *)(-?)(.*?)(?:$|\[([^\[]*)])$/);
  if (matches === null) {
    throw new ParseError(`Failed to parse entry: '${line}'`);
  }
  const [, indent, bullet, description, mentions] = matches as (
    | string
    | undefined
  )[];
  if (indent === undefined) {
    throw new ParseError(`Failed to parse entry indent: '${line}'`);
  }
  if (description === undefined) {
    throw new ParseError(`Failed to parse entry description: '${line}'`);
  }
  const depth = bullet === "" ? 0 : Math.floor(indent.length / 2);
  return [
    {
      description: description.trim(),
      mentions:
        mentions == null ? [] : mentions.split(",").map((m) => m.trim()),
      children: [],
    },
    depth,
  ];
}

function parseEntryText(text: string): Entry {
  const normalized = text.replace(/\s+/g, " ").trim();
  const mentionMatch = normalized.match(/^(.*?)(?:\s+\[([^\[]*)])$/);

  return {
    description: (mentionMatch?.[1] ?? normalized).trim(),
    mentions:
      mentionMatch?.[2] == null
        ? []
        : mentionMatch[2].split(",").map((mention) => mention.trim()),
    children: [],
  };
}

function categoryFromHeading(heading: string): Category {
  const normalized = heading.trim();
  const [first, ...rest] = normalized.split(/\s+/);
  const hasEmoji = first !== undefined && !/[\p{L}\p{N}]/u.test(first);

  return {
    emoji: hasEmoji ? first : "",
    title: hasEmoji ? rest.join(" ") : normalized,
    children: [],
  };
}

function parseList(tokens: MarkdownToken[], start: number): [Entry[], number] {
  const entries: Entry[] = [];
  let index = start + 1;

  while (index < tokens.length && tokens[index].type !== "bullet_list_close") {
    if (tokens[index].type !== "list_item_open") {
      index++;
      continue;
    }

    const text: string[] = [];
    const children: Entry[] = [];
    index++;

    while (index < tokens.length && tokens[index].type !== "list_item_close") {
      const token = tokens[index];
      if (token.type === "inline") {
        text.push(token.content);
      } else if (token.type === "bullet_list_open") {
        const [nested, nextIndex] = parseList(tokens, index);
        children.push(...nested);
        index = nextIndex;
        continue;
      }
      index++;
    }

    const entry = parseEntryText(text.join(" "));
    entry.children = children;
    entries.push(entry);
    index++;
  }

  return [entries, index + 1];
}

export function parsePr(description: string): Category[] {
  // Fix input error.
  description = description.replaceAll("// -", "- //");

  let lines = description.trim().split("\n");
  let version: number | null = null;
  let versionIndex = -1;

  for (let index = 0; index < lines.length; index++) {
    version = parseVersion(lines[index]);
    if (version !== null) {
      versionIndex = index;
      break;
    }
  }

  if (version === null) {
    throw new ParseError("No changelog version found");
  }
  if (version !== 1) {
    throw new ParseError(`Unsupported changelog version: ${version}`);
  }

  lines = stripHtmlComments(lines.slice(versionIndex + 1).join("\n")).split(
    "\n",
  );

  const tokens = markdown.parse(normalizeBullets(lines).join("\n"), {});
  const categories: Category[] = [
    {
      emoji: "\u2753",
      title: "Uncategorized",
      children: [],
    },
  ];
  let foundChangelog = false;
  let inChangelog = false;

  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];

    if (token.type === "heading_open" && token.tag === "h2") {
      const heading = tokens[index + 1]?.content.trim();
      if (inChangelog) {
        break;
      }
      inChangelog = heading === "Changelog";
      foundChangelog ||= inChangelog;
      index += 2;
      continue;
    }

    if (!inChangelog) {
      continue;
    }

    if (token.type === "heading_open") {
      const heading = tokens[index + 1]?.content;
      if (heading !== undefined) {
        categories.push(categoryFromHeading(heading));
      }
      index += 2;
    } else if (token.type === "bullet_list_open") {
      const [entries, nextIndex] = parseList(tokens, index);
      last(categories)!.children.push(...entries);
      index = nextIndex - 1;
    } else if (token.type === "paragraph_open") {
      const text = tokens[index + 1]?.content;
      if (text !== undefined) {
        last(categories)!.children.push(parseEntryText(text));
      }
      index += 2;
    }
  }

  if (!foundChangelog) {
    throw new ParseError("No changelog section found");
  }

  return categories.filter((category) => category.children.length > 0);
}
