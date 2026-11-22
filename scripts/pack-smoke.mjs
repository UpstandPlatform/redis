import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const npm =
	process.platform === "win32" && process.env.npm_execpath ? process.execPath : "npm";
const npmPrefix = npm === process.execPath ? [process.env.npm_execpath] : [];
const temporaryDirectory = mkdtempSync(join(tmpdir(), "upstand-redis-pack-"));

try {
	const packed = JSON.parse(
		execFileSync(
			npm,
			[...npmPrefix, "pack", "--json", "--pack-destination", temporaryDirectory],
			{
				encoding: "utf8",
				stdio: ["ignore", "pipe", "inherit"],
			},
		),
	);
	const tarball = join(temporaryDirectory, packed[0].filename);
	execFileSync(
		npm,
		[...npmPrefix, "install", "--ignore-scripts", "--no-audit", "--no-fund", tarball],
		{
			cwd: temporaryDirectory,
			stdio: "inherit",
		},
	);
	execFileSync(
		process.execPath,
		[
			"--input-type=module",
			"-e",
			'await Promise.all(["@upstand/redis", "@upstand/redis/node", "@upstand/redis/ioredis", "@upstand/redis/bullmq", "@upstand/redis/rate-limit", "@upstand/redis/cache", "@upstand/redis/locks", "@upstand/redis/pubsub", "@upstand/redis/queue", "@upstand/redis/testing"].map((entry) => import(entry)));',
		],
		{ cwd: temporaryDirectory, stdio: "inherit" },
	);
	console.log("Package tarball smoke test passed.");
} finally {
	rmSync(temporaryDirectory, { recursive: true, force: true });
}
