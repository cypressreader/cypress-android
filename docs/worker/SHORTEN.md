# Own short links (manual setup, about 5 minutes)

Worker code: `docs/worker/short-link-worker.js`. It needs one KV namespace.

1. **Create the storage:** Cloudflare dashboard, Storage & databases, KV, Create a namespace named `CYPRESS_SHARE_LINKS`.
2. **Create the Worker:** Workers & Pages, Create, Worker (Hello World), name it `cypress-short-links`, Deploy, then Edit code, paste the whole of `short-link-worker.js` over the sample, Deploy.
3. **Bind the storage:** the Worker, Settings, Bindings, Add, KV namespace. Variable name exactly `CYPRESS_SHARE_LINKS`, namespace `CYPRESS_SHARE_LINKS`. Save and deploy.
4. **Route it:** Settings, Domains & Routes, Add, Route: add `cypressreader.com/api/shorten` and `cypressreader.com/s/*` (zone `cypressreader.com`; the domain must be proxied, the orange cloud). If another Worker already has a `cypressreader.com/*` route, these two more specific routes win over it.
5. **Check:** `curl -X POST https://cypressreader.com/api/shorten -d 'https://cypressreader.com/s.html#pTEST'` answers `{"id":"......","url":"https://cypressreader.com/s/......"}`, and opening that URL redirects. A GET on `/api/shorten` says `POST only`.

Only cypressreader.com share links can be stored (no open redirect). Links last about 13 months. Old long `/s/<packed story>` links are sent on to the share page. Removing the binding or the routes makes the app fall back to sharing the story's own web address.
