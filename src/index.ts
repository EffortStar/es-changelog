import args from "args";
import { simpleGit } from "simple-git";
import { ParseError, parsePr } from "./parser";
import { Category } from "./types";
import { flattenCategories, stripPrivateEntries, stripPrivateFromCategories } from "./categories";
import { formatChangelog } from "./format";
import { execSync } from "child_process";
import { prependToFile } from "./file";

args
  .option("from", "The version to start from")
  .option("to", "The version to end on") // See https://github.com/steveukx/git-js/issues/995
  .option("public", "Include internal changes", false)
  .option(
    "out",
    "The path to prepend the changelog to. Otherwise the change will be sent to stdout.",
  )
  .option(
    "suppress-errors",
    "Suppress error logs from invalid changelogs",
    false,
  );

function getVersionDate(version: string): Date {
  const dateIso = execSync(`git log ${version} -1 --format=%cI`)
    .toString()
    .trim();
  return new Date(dateIso);
}

async function getChangelogEntry(from: string, to: string, includePrivate: boolean, suppressErrors: boolean): Promise<string> {
  const date = getVersionDate(to);
  const log = await simpleGit().log({
    from,
    to,
    multiLine: true,
    "--merges": true,
  } as any);

  const categories = log.all.reduce((acc, { message, body, hash, date }) => {
    const index = body.indexOf("\n\n");
    const description = body.slice(index + 2);
    try {
      acc.push(...parsePr(description));
    } catch (e) {
      if (e instanceof ParseError) {
        if (!suppressErrors) {
          console.error(`${e.message}: ${message} (${hash.slice(0, 7)})`);
        }
      } else {
        throw e;
      }
    }
    return acc;
  }, [] as Category[]);

  let flattened = flattenCategories(categories);

  if (!includePrivate) {
    flattened = stripPrivateFromCategories(flattened);
  }

  return formatChangelog(to, date, flattened);
}

export async function main() {
  const { from, to, suppressErrors, out, public: pub } = args.parse(process.argv);

  if (from === undefined || to === undefined) {
    console.error("Both 'from' and 'to' are required.");
    args.showHelp();
    return;
  }

  const changelog = await getChangelogEntry(from, to, !pub, suppressErrors);

  if (out === undefined) {
    console.log(changelog);
  } else {
    prependToFile(out, `${changelog}\n\n`);
  }
}