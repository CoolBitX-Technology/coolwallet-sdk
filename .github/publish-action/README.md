## Build

`dist/` is not committed. The `Build publish action` step in `.github/workflows/beta-publish.yml` runs `npm ci && npm run build` before the action is used, so changes to `index.ts` / `utils.ts` (including the package list) take effect without a manual build.

To check a build locally:

```
npm ci
npm run build
```

Build from a copy outside the repo if you want `dist/` to match CI: inside the repo, ncc also picks up modules from the root `node_modules` (e.g. the optional `encoding` dependency of node-fetch) and bundles them.
