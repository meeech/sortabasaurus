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
  const tabs = await browser.tabs.query({ currentWindow: true });

  // Determine which tabs are already in a group
  const hasGroupApi =
    typeof browser.tabGroups !== 'undefined' &&
    typeof browser.tabGroups.TAB_GROUP_ID_NONE !== 'undefined';
  const isUngrouped = (tab) =>
    !hasGroupApi || tab.groupId === browser.tabGroups.TAB_GROUP_ID_NONE;

  const ungroupedTabs = tabs.filter((tab) => !tab.pinned && isUngrouped(tab));

  ungroupedTabs.sort((a, b) => {
    return getSortKey(a.url).localeCompare(getSortKey(b.url));
  });

  // Move only ungrouped tabs, preserving position of pinned + grouped tabs
  const ungroupedIds = ungroupedTabs.map((tab) => tab.id);
  if (ungroupedIds.length) {
    await browser.tabs.move(ungroupedIds, { index: -1 });
  }

  // Group tabs: count ungrouped tabs by groupKey (hostname + first path segment)
  const groupCounts = {};
  for (const tab of ungroupedTabs) {
    const key = getGroupKey(tab.url);
    if (!groupCounts[key]) groupCounts[key] = [];
    groupCounts[key].push(tab.id);
  }

  // Only create groups for keys with more than 3 tabs
  if (browser.tabs.group) {
    for (const [key, ids] of Object.entries(groupCounts)) {
      if (ids.length > 3) {
        const groupId = await browser.tabs.group({ tabIds: ids });
        if (browser.tabGroups && browser.tabGroups.update) {
          await browser.tabGroups.update(groupId, { title: key });
        }
      }
    }
  }
}

// Badge is scoped per-tab so each window can show its own count
async function refreshBadges() {
  const tabs = await browser.tabs.query({});
  const counts = {};
  for (const tab of tabs) {
    counts[tab.windowId] = (counts[tab.windowId] || 0) + 1;
  }

  browser.browserAction.setBadgeBackgroundColor({ color: '#2f6f4f' });
  await Promise.allSettled(
    tabs.map((tab) =>
      browser.browserAction.setBadgeText({
        tabId: tab.id,
        text: String(counts[tab.windowId]),
      }),
    ),
  );
}

browser.browserAction.onClicked.addListener(async () => {
  await reorderTabs();
  refreshBadges();
});

browser.tabs.onCreated.addListener(refreshBadges);
browser.tabs.onRemoved.addListener(refreshBadges);
browser.tabs.onAttached.addListener(refreshBadges);
browser.tabs.onDetached.addListener(refreshBadges);
browser.tabs.onReplaced.addListener(refreshBadges);

refreshBadges();
