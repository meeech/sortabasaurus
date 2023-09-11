function reorderTabs() {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    const pinnedTabs = tabs.filter((tab) => tab.pinned);
    const unpinnedTabs = tabs.filter((tab) => !tab.pinned);

    // Implement your sorting logic here
    unpinnedTabs.sort((a, b) => {
      const hostnameA = new URL(a.url).hostname;
      const hostnameB = new URL(b.url).hostname;
      return hostnameA.localeCompare(hostnameB);
    });
    const sortedTabs = [...pinnedTabs, ...unpinnedTabs];
    const tabIds = sortedTabs.map((tab) => tab.id);
    if (tabIds.length) {
      chrome.tabs.move(tabIds, { index: -1 });

    }
  });
}

chrome.action.onClicked.addListener((tab) => {
  reorderTabs();
});
