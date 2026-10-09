# Preview site (try a branch without touching production)

Production (cypressreader.com, the Android build) only changes when `main` is pushed.
Experiments are tried on a **separate** site that has its own address, its own installed app and its own icon label,
so nothing here can reach real users.

- Preview repo: `cypressreader/cypress-preview` (GitHub Pages serves `docs/` on `main`)
- Preview address: https://cypressreader.github.io/cypress-preview/app/
- It is installed as its own PWA called **CyPress Preview** (orange theme colour, orange bar along the top edge,
  page title shows the branch's short commit).

## One-time setup (done by hand once)
1. Create the empty repo `cypress-preview` under `cypressreader` on github.com (public, no README).
2. Repo Settings, then Pages: Source = *Deploy from a branch*, Branch = `main`, Folder = `/docs`.
3. In this checkout: `git remote add preview https://github.com/cypressreader/cypress-preview.git`
   (already added in the Claude cloud checkout).

## Publish a branch (one command)
```
scripts/publish-preview.sh experiment/daily-redesign
```
It reads the branch from git (your working tree is untouched), builds the app the usual way
(`www/index.html` is the source, copied over `docs/app/`), stamps it as CyPress Preview and force-pushes
only that copy to the preview repo's `main`. Wait about a minute, then reload the PWA
(close and reopen it once if it still shows the old build).

Check what would be published without pushing:
```
scripts/publish-preview.sh experiment/daily-redesign --dry-run --out /tmp/pv   # then serve /tmp/pv/docs
```

## Safety
- Never pushes to `origin` and refuses to run if the `preview` remote is not the cypress-preview repo.
- The preview repo is disposable: every publish replaces its history.
- Merging an experiment into production is a separate step that only happens when you say so.
