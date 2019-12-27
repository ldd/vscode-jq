import { exec } from "child_process";
import { promisify } from "util";

const wrappedSpawn = promisify(exec);

const DEFAULT_FILE = "sample.json";

export const DEFAULT_COMMAND = "map(select(.craftable) | {name, frame})";

export async function runJQ(
  command: string = DEFAULT_COMMAND,
  file: string = DEFAULT_FILE
) {
  const { stdout } = await wrappedSpawn(`jq '${command}' ${file}`);
  return stdout;
}

export function stringifyCommand(command: string = "") {
  return `${command.slice(0, 8)}...`;
}
