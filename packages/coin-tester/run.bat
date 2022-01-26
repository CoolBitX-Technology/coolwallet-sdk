cd ../core
npm run build:types && npm run build:ts && cd ../coin-template && npm run build && cd ../coin-tester && npm ci && npm run dev
 

