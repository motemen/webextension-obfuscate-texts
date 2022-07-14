async function runObfuscation(tabId?: number) {
  if (!tabId) {
    const [tab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });
    tabId = tab.id;
  }
  await chrome.scripting.executeScript({
    target: { tabId: tabId! },
    files: ["script.js"],
  });
}

chrome.action.onClicked.addListener(async (tab) => {
  console.log(tab);
  await runObfuscation(tab.id!);
});

declare interface Window {
  __test__runObfuscation: (tabId?: number) => Promise<void>;
  __test__activated: Promise<void>;
}

self.__test__activated = new Promise<void>((resolve) => {
  addEventListener("activate", () => {
    resolve();
  });
});

self.__test__runObfuscation = runObfuscation;
