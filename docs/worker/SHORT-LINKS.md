# Short share links (about 5 minutes, one time)

CyPress can turn a long share link into a short one like `https://cypressreader.com/s/k3F9aQz`.
The story is kept in Cloudflare's key-value storage (Workers KV) for about 13 months.
Only the headline, source, photo link, date, colour and the story's address are stored.

If you skip this, nothing breaks: the app keeps making the longer links.

Cloudflare's menus move around from time to time, so the names below may differ a little.

## 1. Make the storage

1. Sign in to the Cloudflare dashboard.
2. Open **Storage & databases** (or **Workers & Pages**), then **KV**.
3. Click **Create a namespace**, name it `cypress-short`, and save.

## 2. Connect it to your worker

1. Open **Workers & Pages** and click the worker that serves cypressreader.com.
2. Go to **Settings**, then **Bindings** (older dashboards: **Variables**, then **KV Namespace Bindings**).
3. Click **Add**, choose **KV namespace**.
4. For **Variable name** type exactly `SHORT` (capital letters).
5. For **KV namespace** pick `cypress-short`. Save.

## 3. Put in the new worker code

1. In the same worker, click **Edit code** (or **Quick edit**).
2. Replace everything with the contents of `docs/worker/share-worker.js` from this repository.
3. Click **Deploy**.

## 4. Check it

Open `https://cypressreader.com/api/short` in a browser.

- You see `{"error":"POST only"}`: it is working.
- You see `{"error":"Short links are not set up"}`: the `SHORT` binding in step 2 is missing or misspelled.

Then update the app, share a story, and the link should be about 35 characters long.

## Cost

Cloudflare's free plan allows roughly 1,000 writes and 100,000 reads a day, which is far more than one person shares.
Check Cloudflare's current pricing page for Workers KV before you start. If it asks for a card or a paid plan, stop.

## Removing it

Delete the `SHORT` binding. Old short links then show "expired", and the app goes back to long links.
