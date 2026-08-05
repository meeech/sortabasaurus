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
  const ungroupedTabs = tabs.filter(
    (tab) => !tab.pinned && tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE,
  );

  ungroupedTabs.sort((a, b) => {
    return getSortKey(a.url).localeCompare(getSortKey(b.url));
  });

  // Move only ungrouped tabs, preserving position of pinned + grouped tabs
  const ungroupedIds = ungroupedTabs.map((tab) => tab.id);
  if (ungroupedIds.length) {
    await chrome.tabs.move(ungroupedIds, { index: -1 });
  }

  // Group tabs: count ungrouped tabs by groupKey (hostname + first path segment)
  const groupCounts = {};
  for (const tab of ungroupedTabs) {
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

// Badge is scoped per-tab so each window can show its own count
async function refreshBadges() {
  const tabs = await chrome.tabs.query({});
  const counts = {};
  for (const tab of tabs) {
    counts[tab.windowId] = (counts[tab.windowId] || 0) + 1;
  }

  chrome.action.setBadgeBackgroundColor({ color: '#2f6f4f' });
  await Promise.allSettled(
    tabs.map((tab) =>
      chrome.action.setBadgeText({
        tabId: tab.id,
        text: String(counts[tab.windowId]),
      }),
    ),
  );
}

// Session restore fires one event per tab; coalesce into a single repaint
let pendingRefresh;
function scheduleBadgeRefresh() {
  clearTimeout(pendingRefresh);
  pendingRefresh = setTimeout(refreshBadges, 100);
}

chrome.action.onClicked.addListener(() => {
  reorderTabs();
});

// These two exist to wake the service worker; the top-level call below does
// the actual seeding once it re-evaluates
chrome.runtime.onStartup.addListener(scheduleBadgeRefresh);
chrome.runtime.onInstalled.addListener(scheduleBadgeRefresh);
chrome.tabs.onCreated.addListener(scheduleBadgeRefresh);
chrome.tabs.onRemoved.addListener(scheduleBadgeRefresh);
chrome.tabs.onAttached.addListener(scheduleBadgeRefresh);
chrome.tabs.onDetached.addListener(scheduleBadgeRefresh);
chrome.tabs.onReplaced.addListener(scheduleBadgeRefresh);

scheduleBadgeRefresh();
