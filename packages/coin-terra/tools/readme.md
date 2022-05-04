## Terra.js Bundler

Tool to generate @terra-core.js.

### Generation Steps:

1. Create single bundle file from `SignDoc.tx` with esbuild
2. Remove some useless functions(ex. fromAnimo, toAnimo) with babel
3. Export the type we want with babel