function getGroupKey(url) {
  try {
    const parsed = new URL(url);
    const firstPath = parsed.pathname.split('/').filter(Boolean)[0] || '';
    return `${parsed.hostname}/${firstPath}`;
  } catch {
    return url;
  }
}

function getSortKey(url) {
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split('/').filter(Boolean).slice(0, 2);
    return [parsed.hostname, ...pathParts].join('/');
  } catch {
    return url;
  }
}

async function reorderTabs() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const pinnedTabs = tabs.filter((tab) => tab.pinned);
  const unpinnedTabs = tabs.filter((tab) => !tab.pinned);

  unpinnedTabs.sort((a, b) => {
    return getSortKey(a.url).localeCompare(getSortKey(b.url));
  });

  const sortedTabs = [...pinnedTabs, ...unpinnedTabs];
  const tabIds = sortedTabs.map((tab) => tab.id);
  if (tabIds.length) {
    await chrome.tabs.move(tabIds, { index: -1 });
  }

  // Group tabs: count tabs by groupKey (hostname + first path segment)
  const groupCounts = {};
  for (const tab of unpinnedTabs) {
    const key = getGroupKey(tab.url);
    if (!groupCounts[key]) groupCounts[key] = [];
    groupCounts[key].push(tab.id);
  }

  // Only create groups for keys with more than 3 tabs
  for (const [key, ids] of Object.entries(groupCounts)) {
    if (ids.length > 3) {
      const groupId = await chrome.tabs.group({ tabIds: ids });
      await chrome.tabGroups.update(groupId, { title: key });
    }
  }
}

chrome.action.onClicked.addListener(() => {
  reorderTabs();
});
