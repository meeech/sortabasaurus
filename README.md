# Sortabasaurus

Sorts tabs by hostname, org, and repo. Groups tabs when 3+ share the same hostname/org.

## Why?

I have a tab problem. During the day I open a lot of tabs. This will group them to make it easier to manage.

## Install

Clone the repo and load the extension from the appropriate folder:

### Chrome
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `chrome/` folder

### Firefox
1. Go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on..."
3. Select `firefox/manifest.json`

**Note:** Firefox tab groups require Firefox 138+. Temporary add-ons don't persist across browser restarts.

## Build the Firefox .xpi

From the repo root:

```sh
cd firefox
zip -r ../sortabasaurus.xpi manifest.json background.js images/
```

## Release Checklist

1. Bump `version` in both `chrome/manifest.json` and `firefox/manifest.json`
2. Rebuild the .xpi (see above)
3. Commit and push
