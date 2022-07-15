import { test, expect, chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { type workerThis } from "../app/background";

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

  await worker.evaluate(function (this: workerThis) {
    return this.__test__.activated;
  });

  await worker.evaluate(function (this: workerThis) {
    return this.__test__.runObfuscation();
  });

  await page.waitForTimeout(3 * 1000);
});

test("obfuscate selection", async ({ page, context }) => {
  await page.goto("https://www.example.com/");

  let [worker] = context.serviceWorkers();
  if (!worker) {
    worker = await context.waitForEvent("serviceworker");
  }

  await worker.evaluate(function (this: workerThis) {
    return this.__test__.activated;
  });

  await page.evaluate(function () {
    const selection = document.getSelection();
    const range = new Range();
    range.setStart(document.querySelector("h1")!.firstChild!, 10);
    range.setEnd(document.querySelector("p")!.firstChild!, 100);
    selection?.addRange(range);
  });

  await worker.evaluate(function (this: workerThis) {
    return this.__test__.runObfuscation();
  });

  await page.waitForTimeout(3 * 1000);
});
