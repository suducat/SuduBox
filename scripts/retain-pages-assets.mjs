// Keep three asset generations so an older cached HTML can finish booting
// and show the non-blocking update notice after a Pages deployment.
import {
  readdirSync,
  existsSync,
  readFileSync,
  writeFileSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
const repo = process.env.GITHUB_REPOSITORY;
if (!repo) throw new Error("GITHUB_REPOSITORY is required");
const generations = [readdirSync("dist/assets").sort()];
const directory = mkdtempSync(join(tmpdir(), "sudubox-pages-history-"));
const run = (args) =>
  spawnSync("gh", args, { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
try {
  const response = run([
    "api",
    `repos/${repo}/actions/workflows/deploy.yml/runs?status=success&branch=main&per_page=3`,
  ]);
  if (response.status !== 0) throw new Error(response.stderr);
  for (const previous of JSON.parse(response.stdout).workflow_runs) {
    const dest = join(directory, String(previous.id));
    mkdirSync(dest, { recursive: true });
    const download = run([
      "run",
      "download",
      String(previous.id),
      "--repo",
      repo,
      "--name",
      "github-pages",
      "--dir",
      dest,
    ]);
    if (download.status !== 0) {
      console.warn(
        `Previous artifact ${previous.id} unavailable; trying another.`,
      );
      continue;
    }
    const tar = spawnSync("tar", [
      "-xf",
      join(dest, "artifact.tar"),
      "-C",
      dest,
    ]);
    if (tar.status !== 0)
      throw new Error("Cannot extract previous Pages artifact");
    if (!existsSync(join(dest, "assets"))) continue;
    const manifest = join(dest, "asset-history.json");
    const history = existsSync(manifest)
      ? JSON.parse(readFileSync(manifest, "utf8"))
      : [readdirSync(join(dest, "assets")).sort()];
    for (const list of history) {
      if (generations.length >= 3) break;
      if (generations.some((g) => JSON.stringify(g) === JSON.stringify(list)))
        continue;
      // The manifest is repository-owned; accept flat asset basenames only.
      if (
        !Array.isArray(list) ||
        list.some(
          (n) =>
            typeof n !== "string" ||
            !n ||
            n.includes("/") ||
            n.includes("\\") ||
            n.includes(".."),
        )
      )
        throw new Error("Invalid asset history");
      for (const name of list) {
        if (!existsSync(join(dest, "assets", name)))
          throw new Error("Incomplete previous asset generation");
        cpSync(join(dest, "assets", name), join("dist/assets", name));
      }
      generations.push(list);
    }
    if (generations.length >= 3) break;
  }
  writeFileSync("dist/asset-history.json", JSON.stringify(generations));
  console.log(
    `Retained ${generations.length} asset generations for safe Pages updates.`,
  );
} finally {
  rmSync(directory, { recursive: true, force: true });
}
