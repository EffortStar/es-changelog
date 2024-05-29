import { closeSync, openSync, readFileSync, writeSync } from "fs";

// https://stackoverflow.com/a/49889780/317135
export function prependToFile(path: string, text: string) {
  const data = readFileSync(path);
  const fd = openSync(path, "w+");
  const insert = Buffer.from(text);
  writeSync(fd, insert, 0, insert.length, 0);
  writeSync(fd, data, 0, data.length, insert.length);
  closeSync(fd);
}