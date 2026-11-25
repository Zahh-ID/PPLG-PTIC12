# Tests and GitHub Pages setup

The game is deployed at [Circuit Rescue](https://zahh-id.github.io/PPLG-PTIC12/). Pushes and pull requests only run checks; publishing updates requires the manual Pages workflow with `publish=true` on `main`.

## Local verification

Use Node.js 24 and the committed lockfile:

```sh
npm ci
npm test
npm run build:web
npx puppeteer browsers install chrome
npm run test:modals
npm run test:mobile-browser
npm run test:journey
npm run test:browser
npm run test:mobile
```

`npm test` checks project references and JavaScript syntax, 102 truth-table cases across 24 challenges, invalid circuit networks, actor masks/animation definitions, 144 giant-robot frames, map reachability and workflow safeguards. Checks do not rewrite the game project.

`build:web` exports `Animal Hunter.json` into ignored `dist/`, adds `.nojekyll`, and never uploads anything. It replaces only the fixed `dist/` output directory. The HTML5 exporter and its GDevelop core are pinned in `package-lock.json`; update them together and rerun the browser checks when changing versions. GDevelop itself is not required for this CLI export.

The build first generates SVG/Lottie UI assets and synchronizes readable event sources into the project. It then bundles the compiled theme, metadata, logo, vector animation JSON, local Anime.js/Lottie runtimes and licenses, and both UI controllers into `dist/vector-ui/`; no animation CDN is needed. `test:modals` checks real logo/icon vector rendering, single-play feedback, plain-language examples, input locking, pause/resume ordering, focus, portrait board bounds, rotation during entry and reduced-motion behavior. Both workflows run it before the remaining browser suites. These checks do not establish visual acceptance.

`test:browser` serves the export locally under `/circuit-rescue/` to check relative resource paths used by project Pages sites. It starts from the opening menu and exercises all 24 challenge dialogs, blank-answer rejection, token drag/drop, faulty-circuit repair, NAND-only construction, individual terminal progress, barriers, native platform jumping, a moving lift, mecha boarding, guardian phases and the winner scene. It fails for JavaScript exceptions or missing local resources. Screenshots/results go to ignored `.local/reports/`.

`test:journey` checks the Indonesian default, English persistence after reload, translated native text and challenge feedback, all eight introductions, direct selection of any level, completion/back/menu/next routing, the final ending and portrait level-list layout. Circuit regression selects English explicitly so feedback assertions remain stable; the journey suite tests the actual default language. Both GitHub workflows run journey, mobile/device and campaign browser tests before publishing.

`test:mobile-browser` checks a real user-activated Fullscreen API request and exit, localized rejection/unsupported fallbacks, suppressed mobile browser gestures, preserved dialog scrolling, fullscreen inside dialogs, and untouched desktop behavior. The fullscreen target is the document element, so HTML UI stays visible. [Fullscreen requires user activation](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen); [touch-action rules](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action) distinguish custom game gestures from scrollable dialogs. Browser and OS support still determine fullscreen/orientation availability; browser/system exit controls are not disabled.

The browser test repositions the player, grants temporary invulnerability and shortens guardian health to keep regression checks fast. It checks real UI interactions, physics samples and campaign progression, rather than a complete manual traversal or combat balance. `test:mobile` adds fourteen touch/device checks: multi-finger movement/fire/jump, cancellation, slide-away release, pause/continue, interaction/dialog suppression, portrait fit, mecha shield, focus loss, hidden controls on desktop/narrow desktop/touch laptops, and large-tablet landscape detection. Physical-device/browser testing and audio remain outside this coverage. GDevelop's external analytics requests are not treated as missing local assets.

Install Puppeteer's matching browser locally with `npx puppeteer browsers install chrome`; the download is cached. GitHub workflows use the Chrome already installed on the Ubuntu runner through `PUPPETEER_EXECUTABLE_PATH`, avoiding a separate browser download. You can also set this variable to a locally installed Chrome executable. On other Linux machines, `npx puppeteer browsers install chrome --install-deps` includes the required system libraries.

## GitHub Actions

- **Game checks** (`.github/workflows/check.yml`): runs on push, pull request or manual dispatch. Installs locked dependencies, runs tests, builds HTML5, runs browser regression, and retains test reports for seven days. It has read-only repository permissions and no deployment step.
- **GitHub Pages (manual)** (`.github/workflows/pages.yml`): only manual dispatch. Its `publish` checkbox defaults to **false**. Default execution tests/builds and provides a downloadable `circuit-rescue-web` artifact without publishing. Deployment requires `publish=true`, the `main` branch and a successful build plus tests.

No personal access token or repository secret is needed. Only the deployment job requests `pages: write` and `id-token: write`; it uses the `github-pages` environment. Consider environment reviewer protection before the first release.

## Publishing updates

1. Commit and push the setup. The manual workflow must exist on the default branch before GitHub shows its Run Workflow control.
2. In repository **Settings → Pages → Build and deployment**, use **GitHub Actions**; this is already configured for PPLG-PTIC12.
3. Open **Actions → GitHub Pages (manual) → Run workflow**, select `main`, and leave `publish` unchecked for a build-only trial.
4. After reviewing the build and test results, run it again from `main` with `publish` checked. That future action publishes the tested export.

The workflow uses GitHub's official [custom Pages workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) artifact/deployment flow and the [gdexporter HTML5 CLI](https://github.com/arthuro555/gdexporter). No `gh-pages` source branch or committed export is required.
