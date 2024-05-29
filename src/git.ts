import { simpleGit } from 'simple-git';

export async function getMergeDescriptionsBetween(from: string, to: string): Promise<string[]> {
  const log = await simpleGit().log({ from, to, multiLine: true});

  return log.all.reduce((acc, { message, body }) => {
    if (message.startsWith("Merge pull request")) {
      const index = body.indexOf("\n\n");
      acc.push(body.slice(index + 2));
    }
    return acc;
  }, [] as string[]);
}