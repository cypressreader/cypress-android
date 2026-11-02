# Insights page (about 5 minutes, one time)

Turns on three things that all live in the cypressreader.com worker:
- the app's optional weekly usage counts (`POST /api/stats`, off on every phone unless the person turns it on),
- Settings > Report a problem (`POST /api/report`),
- your private page at **https://cypressreader.com/insights**, which only opens with your key.

Until this is done, the app quietly keeps working: Report a problem says it couldn't send, and counts are not sent.

## 1. Make the storage
1. Cloudflare dashboard, **Storage & databases** (or **Workers & Pages**), then **KV**.
2. **Create a namespace**, name it `cypress-stats`, save.

## 2. Connect it and add your key
1. **Workers & Pages**, the worker that serves cypressreader.com, **Settings**, **Bindings**.
2. **Add**, **KV namespace**: Variable name `STATS` (capitals), namespace `cypress-stats`. Save.
3. Still in **Settings**, **Variables and Secrets**, **Add**: type **Secret**, name `INSIGHTS_KEY`, value a long password only you know (a password manager can make one). Save.

## 3. Put in the new worker code
**Edit code**, replace everything with `docs/worker/share-worker.js` from this repository, **Deploy**.

## 4. Check it
Open https://cypressreader.com/insights, type your key, tick "Remember on this browser". You should see the page (empty until the first counts arrive, about a week after people turn them on; turn it on yourself in the app to see one sooner, it sends about 45 seconds after the next app start).
Want a look first? https://cypressreader.com/insights?demo shows made-up numbers.

## What is stored
Each weekly count is one entry with no ID and no internet address. Problem reports keep the person's words and the details shown to them. Everything expires after about 13 months.

## Cost
The free Workers KV plan allows 1,000 writes a day (one per device per week, so roughly 7,000 devices with counts turned on) and 1,000 list operations a day (each page open uses one per 1,000 entries).
