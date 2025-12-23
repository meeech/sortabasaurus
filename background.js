function reorderTabs() {
  browser.tabs.query({ currentWindow: true }).then((tabs) => {
    const pinnedTabs = tabs.filter((tab) => tab.pinned);
    const unpinnedTabs = tabs.filter((tab) => !tab.pinned);

    unpinnedTabs.sort((a, b) => {
      const hostnameA = new URL(a.url).hostname;
      const hostnameB = new URL(b.url).hostname;
      return hostnameA.localeCompare(hostnameB);
    });

    const sortedTabs = [...pinnedTabs, ...unpinnedTabs];
    const tabIds = sortedTabs.map((tab) => tab.id);
    if (tabIds.length) {
      browser.tabs.move(tabIds, { index: -1 });
    }
  });
}

browser.browserAction.onClicked.addListener(() => {
  reorderTabs();
});
