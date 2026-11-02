# CyPress Reader: Google Play listing kit

Everything here is ready to paste into Play Console. Images are in `store/play/` (regenerate with `store/src/render.js`).

## Images
| Slot in Play Console | File | Size |
|---|---|---|
| App icon | `play/icon-512.png` | 512 x 512 |
| Feature graphic | `play/feature-graphic-1024x500.png` | 1024 x 500 |
| Phone screenshots (upload in this order) | `play/phone-1-daily.png` ... `phone-6-private.png` | 1080 x 1920 |
| 7-inch and 10-inch tablet screenshots (same two files in both) | `play/tablet-1-daily.png`, `play/tablet-2-reader.png` | 2560 x 1600 |

All app screens use the built-in made-up sample stories, so no real publisher names or photos appear.

## Store text
**App name (30 max):** CyPress Reader

**Short description (80 max):**
Your favorite sites, made into a beautiful daily magazine. Private by design.

**Full description (4000 max):**
CyPress Reader turns the sites you follow into a calm, beautiful magazine you can read in minutes.

EVERY MORNING AND EVENING, A FRESH EDITION
The Daily gathers the best new stories from your sites into one edition with a cover story, short reads and deep dives. Finish it and you're done. No endless scrolling.

READING THAT FEELS LIKE PRINT
Clean pages, beautiful type and themes for every mood. Choose card sizes, layouts and fonts, or pick a Quick Look and start reading.

LISTEN LIKE A PODCAST
Read aloud turns any story into audio, with a player on your lock screen. Download a Natural voice for an even more human sound.

ALL YOUR SITES IN ONE PLACE
Follow news sites, blogs and magazines. Search by topic to find new ones, group them into folders, and save stories to read later, even offline.

PRIVATE BY DESIGN
No account. No tracking of what you read. Your sites, saved stories and reading history stay on your phone. Optional anonymous usage counts are off unless you turn them on.

MADE FOR BIG SCREENS TOO
On tablets and foldables, read side by side: your stories on one side, the open story on the other.

## Category and contact
- App category: News & Magazines
- Tags: news reader, magazine, read later
- Developer name: Cy (the Google account itself is in David's legal name; only the display name is Cy)
- Contact email: cypressreader@gmail.com
- Website: https://cypressreader.com
- Privacy policy URL: https://cypressreader.com/privacy.html

## Content rating questionnaire (IARC): suggested answers
- Category: Reference, News, or Educational
- Violence, sexual content, profanity, drugs, gambling: the app has none of its own. It shows whatever the sites the person chooses publish, so answer **Yes** to "Does the app display or link to unrestricted web content / user-chosen content?"
- People can't talk to each other in the app, there's no user-generated content shared with others, and no location sharing.
- Digital purchases: **Yes** (subscription)
- Expect a Teen or Mature 17+ style rating because of the open web content.

## Target audience
- Age groups: 18 and over (optionally 16-17). Do **not** pick any age under 13, and do not join the Families program.

## News app declaration
- Is it a news app? **Yes** (News & Magazines). Google asks for contact details and the publisher's ownership on the store page and in the app; the app shows each site's name and links to its original story.

## Data safety form: suggested answers
Does the app collect or share user data? **Yes** (only what is listed here).
| Data type | Collected or shared | Why | Optional? |
|---|---|---|---|
| App interactions (feature use counts) | Collected | Analytics | Yes, off unless turned on |
| Crash logs / diagnostics (error messages, app version) | Collected | Analytics, app functionality | Yes (usage counts or Report a problem) |
| Other user-generated content (problem report text) | Collected | App functionality (support) | Yes, only when sent |
| Search history (words typed to find new sites; places typed for Near you) | Shared with Feedly, Google News, Bing News | App functionality | Yes, only when used |
| Purchase history | Handled by Google Play | Subscription | Required for paid features |
- Is data encrypted in transit? **Yes**
- Can people ask for their data to be deleted? **Yes** (email request; usage counts hold no ID and expire after about 13 months)
- No account, no location, no contacts, no photos, no advertising ID.

## Permissions you will be asked about
- Foreground service (media playback): used for Read aloud so audio keeps playing with the screen off. Play asks for a short video showing it: start Read aloud, lock the phone, show the lock-screen player.
- Notifications: new-story alerts and the audio player.

## Before the first upload (must fix in code)
See `FIXES.md`, "Play Store readiness": target Android 16 (API 36), remove the self-updater for the Play build, add Play Billing, update privacy page and website.
