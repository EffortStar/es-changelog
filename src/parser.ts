import { last } from "lodash";
import { Category, Entry } from "./types";
import { stripHtmlComments } from "./strip-html-comments";

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

/** Merge lines so that bulleted entries are never contain a newline **/
export function normalizeBullets(lines: string[]): string[] {
  const text = lines.filter((l) => l.trim() !== "").join("\n");
  return text.replace(/^([^#].*)$\s*([^#\s-])/gm, "$1 $2").split("\n");
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
  const matches = line.match(/^( *)(-?) *([^\]]+)(?:$|\[([^\[]*)])/);
  if (matches === null) {
    throw new ParseError(`Failed to parse entry: '${line}'`);
  }
  const [, indent, bullet, description, mentions] = matches;
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

export function parsePr(description: string): Category[] {
  // Fix input error.
  description = description.replaceAll("// -", "- //");

  let lines = description.trim().split("\n");

  let version = null as number | null;
  let versionIndex = -1;
  for (var i = 0; i < lines.length; i++) {
    version = parseVersion(lines[i]);
    if (version !== null) {
      versionIndex = i;
      break;
    }
  }

  lines = stripHtmlComments(lines.slice(versionIndex + 1).join("\n"))
    .split("\n")
    .filter((l) => l !== "");

  // Get version
  if (version === null) {
    throw new ParseError("No changelog version found");
  }
  if (version !== 1) {
    throw new ParseError(`Unsupported changelog version: ${version}`);
  }

  const changelogIndex = lines.findIndex((line) =>
    line.startsWith("## Changelog")
  );
  if (changelogIndex == -1) {
    throw new ParseError("No changelog section found");
  }

  const changelogStart = changelogIndex + 1;
  let changelogLength = lines
    .slice(changelogStart)
    .findIndex((line) => line.startsWith("## "));
  if (changelogLength == -1) {
    changelogLength = lines.length - changelogStart;
  }

  const changelogLines = normalizeBullets(
    lines.slice(changelogStart, changelogStart + changelogLength)
  );

  return changelogLines
    .reduce(
      (acc, line) => {
        // Needed for an apparent CRLF issue. Don't trim the start because we
        // care about indentation.
        line = line.trimEnd();

        if (line === "") {
          // Do nothing
        } else if (line.startsWith("#")) {
          const category = parseCategory(line);
          if (category !== null) {
            acc.push(category);
          }
        } else {
          const [entry, depth] = parseEntry(line);
          let entries = last(acc)!.children;
          for (let i = 0; i < depth; i++) {
            const target = last(entries);
            if (target === undefined) {
              console.warn("Malformed changelog entry");
              break;
            } else {
              entries = target.children;
            }
          }
          entries.push(entry);
        }
        return acc;
      },
      [
        {
          emoji: "❓",
          title: "Uncategorized",
          children: [],
        },
      ] as Category[]
    )
    .filter((e) => e.children.length > 0);
}
