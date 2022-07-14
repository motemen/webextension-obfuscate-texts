import { test, expect, chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

// https://github.com/microsoft/playwright/issues/7447#issuecomment-880230577
test.use({
  context: [
    async ({}, use) => {
      const userDataDir = fs.mkdtempSync(
        path.join(os.tmpdir(), "webextension-obfuscate-texts-")
      );
      const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        channel: "chrome",
        args: [
          "--no-sandbox",
          `--disable-extensions-except=./test-dist/chrome`,
          `--load-extension=./test-dist/chrome`,
        ],
      });
      await use(context);
      await context.close();
    },
    { scope: "test" },
  ],
});

test("obfuscate whole page", async ({ page, context }) => {
  await page.goto("https://www.example.com/");

  let [worker] = context.serviceWorkers();
  if (!worker) {
    worker = await context.waitForEvent("serviceworker");
  }

  await worker.evaluate(function () {
    return self.__test__activated;
  });

  await worker.evaluate(function () {
    return self.__test__runObfuscation();
  });

  await page.waitForTimeout(3 * 1000);
});
