# Medly Delivery

## Current Running Link

- Same machine: http://localhost:3000
- Same Wi-Fi/network: http://192.168.1.62:3000

The server is currently running in production mode on port `3000`.

## How To Run Before Delivery

From the project folder:

```bash
npm run db:start
npm run build
npm run delivery:start
```

## Quick Check

Open:

```text
http://localhost:3000
```

For another device on the same Wi-Fi/network, open:

```text
http://192.168.1.62:3000
```

Important: the Wi-Fi/network link only works while this computer is on, connected to the same network, PostgreSQL is running, and the Next.js server is running.
