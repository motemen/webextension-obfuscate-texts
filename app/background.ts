chrome.action.onClicked.addListener(async (tab) => {
  console.log(tab);
  await chrome.scripting.executeScript({
    target: { tabId: tab.id! },
    files: ["script.js"],
  });
});
