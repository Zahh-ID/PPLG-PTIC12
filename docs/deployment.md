# Tests and GitHub Pages setup

Deployment is prepared but has not been run. No repository Pages settings have been changed. Pushes and pull requests only run checks; they cannot publish the game.

## Local verification

Use Node.js 24 and the committed lockfile:

```sh
npm ci
npm test
npm run build:web
npx puppeteer browsers install chrome
npm run test:browser
```

`npm test` checks project references and JavaScript syntax, 102 truth-table cases across 24 challenges, invalid circuit networks, actor masks/animation definitions, 144 giant-robot frames, map reachability and workflow safeguards. Checks do not rewrite the game project.

`build:web` exports `Animal Hunter.json` into ignored `dist/`, adds `.nojekyll`, and never uploads anything. It replaces only the fixed `dist/` output directory. The HTML5 exporter and its GDevelop core are pinned in `package-lock.json`; update them together and rerun the browser checks when changing versions. GDevelop itself is not required for this CLI export.

`test:browser` serves the export locally under `/circuit-rescue/` to check relative resource paths used by project Pages sites. It starts from the opening menu and exercises all 24 challenge dialogs, blank-answer rejection, token drag/drop, faulty-circuit repair, NAND-only construction, individual terminal progress, barriers, native platform jumping, a moving lift, mecha boarding, guardian phases and the winner scene. It fails for JavaScript exceptions or missing local resources. Screenshots/results go to ignored `.local/reports/`.

The browser test repositions the player, grants temporary invulnerability and shortens guardian health to keep regression checks fast. It checks real UI interactions, physics samples and campaign progression, rather than a complete manual traversal or combat balance. Mobile/touch and audio remain outside this coverage. GDevelop's external analytics requests are not treated as missing local assets.

Install Puppeteer's matching browser with `npx puppeteer browsers install chrome`; the download is cached. On Linux, use `npx puppeteer browsers install chrome --install-deps` to include required system libraries; both workflows include this step explicitly, including when npm skips dependency install scripts.

## GitHub Actions

- **Game checks** (`.github/workflows/check.yml`): runs on push, pull request or manual dispatch. Installs locked dependencies, runs tests, builds HTML5, runs browser regression, and retains test reports for seven days. It has read-only repository permissions and no deployment step.
- **GitHub Pages (manual)** (`.github/workflows/pages.yml`): only manual dispatch. Its `publish` checkbox defaults to **false**. Default execution tests/builds and provides a downloadable `circuit-rescue-web` artifact without publishing. Deployment requires `publish=true`, the `main` branch and a successful build plus tests.

No personal access token or repository secret is needed. Only the deployment job requests `pages: write` and `id-token: write`; it uses the `github-pages` environment. Consider environment reviewer protection before the first release.

## When you decide to publish later

1. Commit and push the setup. The manual workflow must exist on the default branch before GitHub shows its Run Workflow control.
2. In repository **Settings → Pages → Build and deployment**, select **GitHub Actions**. Do this only when ready; this setup has not changed it.
3. Open **Actions → GitHub Pages (manual) → Run workflow**, select `main`, and leave `publish` unchecked for a build-only trial.
4. After reviewing the build and test results, run it again from `main` with `publish` checked. That future action publishes the tested export.

The workflow uses GitHub's official [custom Pages workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) artifact/deployment flow and the [gdexporter HTML5 CLI](https://github.com/arthuro555/gdexporter). No `gh-pages` source branch or committed export is required.
