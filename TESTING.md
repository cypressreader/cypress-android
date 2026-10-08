# Real-device testing checklist

Things that could not be reproduced in a desktop browser and need a check on a real phone. Tick them off after trying them on the Android app (and, where noted, the web app in a phone browser).

## Open items

- [ ] **Nav badge stuck after "I have 5 minutes".**
  1. Open The Daily and tap "I have 5 minutes", then read or skip through the short list.
  2. Go back to the main lists.
  3. Check that the badge on the nav (the unread count) shows the real unread count, not the number from before.
  - Expected: the badge matches the number of unread stories.
  - Where: Android app and the web app on a phone.

- [ ] **"Why am I seeing this?" popover clipped near the screen edge.**
  1. On a story card near the right edge (and near the bottom), tap the small "i".
  2. Check the whole explanation is visible, with nothing cut off by the screen edge or the bottom bar.
  3. Try it on a card in the first column and the last column, in portrait and landscape.
  - Expected: the popover stays fully inside the screen.
  - Where: Android app and the web app on a phone.

## Must verify on a device before the next release

- [ ] **"Read it now" from a cold start.** Fully close CyPress (swipe it away from recent apps), then in another app (Chrome, for example) use Share, then CyPress.
  1. The "Shared with CyPress" box should appear on top, with Read it now, Add as a feed, Save the link for later and Cancel.
  2. Tap Read it now. The story should open in the reader.
  3. Repeat right after installing an update (so the What's New box is also waiting) and on a brand-new install (so set-up is waiting). The share box should appear once those are closed, never hidden underneath.
  - What is already checked: the app-side path was simulated in a desktop browser with a pretend pending share, and a bug where What's New or set-up covered the share box was found and fixed. What is not checked: Android handing the shared text to the app when it starts from cold. That needs a real phone.

- [ ] **The Daily downloads its edition ahead of time (Wi-Fi only).** Open The Daily on Wi-Fi with "Get stories ready in advance" set to anything but Off.
  1. Within a few seconds stories start getting a small check mark, one at a time with a pause between, and Quick Briefs and Deep Dives fill in as real reading times arrive (the page only redraws when you are at the top and not touching the screen).
  2. **Off switch:** set "Get stories ready in advance" to Off, then open The Daily. Nothing should download.
  3. **Wi-Fi only:** switch to mobile data (turn Wi-Fi off) before opening The Daily. Nothing should download, even if "Only on Wi-Fi" is off in Settings. Then start on Wi-Fi and turn Wi-Fi off a few stories in: it should stop after the story in progress.
  4. **Other stops:** it must not run in Offline mode, with Data saver on, or when the phone is in battery saver or the app's low-battery mode. It must stop when you leave The Daily (open All, Saved and so on) and when the edition changes (at 5:00 AM or 5:00 PM).
  5. **Failures:** a story that can't be downloaded stays under "Also in this edition", the page never breaks or waits on it, and it is not tried again until the next edition.
  6. Keep an eye on mobile data and battery use over a day on a real phone.
  - What is already checked: all of the above was exercised in a desktop browser with the download faked and the connection type, settings and page changed on the fly. Android's real connection type, battery saver and background limits are not checked.

## Added with recent changes (worth a look too)

- [ ] Tapping "Read on the original site" on a Subscriber Preview card opens a Chrome Custom Tab (Android app only).
- [ ] Sharing a link into CyPress shows "Read it now", and it opens the story in the reader.
- [ ] The Daily shows the right edition for the time of day (Morning from 5:00 AM, Evening from 5:00 PM) and ends with "You're all caught up".
