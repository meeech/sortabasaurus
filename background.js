function reorderTabs() {
  browser.tabs.query({ currentWindow: true }).then((tabs) => {
    const pinnedTabs = tabs.filter((tab) => tab.pinned);
    const unpinnedTabs = tabs.filter((tab) => !tab.pinned);

    unpinnedTabs.sort((a, b) => {
      const urlA = new URL(a.url);
      const urlB = new URL(b.url);
      
      const hostCompare = urlA.hostname.localeCompare(urlB.hostname);
      if (hostCompare !== 0) return hostCompare;
      
      const pathPartsA = urlA.pathname.split('/').filter(Boolean).slice(0, 2);
      const pathPartsB = urlB.pathname.split('/').filter(Boolean).slice(0, 2);
      
      for (let i = 0; i < 2; i++) {
        const partA = pathPartsA[i] || '';
        const partB = pathPartsB[i] || '';
        const cmp = partA.localeCompare(partB);
        if (cmp !== 0) return cmp;
      }
      return 0;
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
