// run-tests.mjs

import { execSync } from "child_process";

function run() {
    console.log("\n🧪 Running tests before commit...\n");

    try {
        execSync("npm run test", {
            encoding: "utf-8",
            stdio: "inherit",
        });

        console.log("\nAll tests passed. Commit will proceed.\n");
        process.exit(0);
    } catch {
        console.error("\nTests failed. Commit aborted.");
        console.error("Fix the failing tests and try again.\n");
        process.exit(1);
    }
}

run();
