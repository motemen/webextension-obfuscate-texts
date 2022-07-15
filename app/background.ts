import browser from "webextension-polyfill";

const CONTEXT_MENU_ID = "obfuscate-texts";

browser.contextMenus.create({
  id: CONTEXT_MENU_ID,
  title: "Obfuscate",
  contexts: ["page", "selection"],
});

browser.contextMenus.onClicked.addListener((info, tab) => {
  runObfuscation({ tabId: tab?.id, frameId: info.frameId });
});

async function runObfuscation({
  tabId,
  frameId,
}: {
  tabId?: number;
  frameId?: number;
} = {}) {
  if (!tabId) {
    if (process.env.NODE_ENV === "development") {
      const [tab] = await browser.tabs.query({
        active: true,
        lastFocusedWindow: true,
      });
      tabId = tab.id;
    }
  }
  await browser.scripting.executeScript({
    target: { tabId: tabId!, frameIds: frameId ? [frameId] : undefined },
    files: ["script.js"],
  });
}

browser.action.onClicked.addListener(async (tab) => {
  await runObfuscation({ tabId: tab.id! });
});

declare var self: Window & typeof globalThis & { __test__: typeof __test__ };

export type workerThis = typeof self;

const __test__ = {
  activated: new Promise<void>((resolve) => {
    addEventListener("activate", () => {
      resolve();
    });
  }),
  runObfuscation,
};

if (process.env.NODE_ENV === "development") {
  self.__test__ = __test__;
}
