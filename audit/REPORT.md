# CyPress Reader — Store-readiness audit (Phase 1, report only)

**Audited:** production build on `main` at commit 02bfc0a = **CyPress 1.231** (web stamp `2026.11.02f`). Not 1.127. The preview site was not audited.
**Branch:** `audit/store-readiness`. No app code changed. No merge, build, deploy or store submission.
**Date:** 2026-11-02.

## How it was tested
- The live production web build (cypressreader.com, family path) driven in Chromium with Playwright, each run as a brand-new user with cleared data, at phone 390×844, small phone 360×740, landscape 844×390 and a Fold-like 884×1000, in day and night.
- Code read section by section to explain behavior and trace every setting.
- **Not testable here (no Android emulator, no phone):** Android permission prompts, hardware Back, widgets, notifications, lock-screen audio, read-aloud voices, install and update. Those findings say NEEDS-PHONE. Fold-width results are an approximation until checked on the real Fold.

## Totals
| Store-blocker | Must-fix | Should-fix | Nice-to-have | Info (verified OK / fixed) |
|---|---|---|---|---|
| 7 | 10 | 37 | 22 | 5 |

## Answer to the main question
A beginner can get from install to reading quickly: **2 taps** with "Skip for now", 4 with the quick setup, up to 9 when building their own list; the first story appears about 4 to 6 seconds after a cold start, and a returning user is reading in about 1 second. Story open takes 0.1 to 0.25 s. Nothing in first run asks for an account or a permission.
What stands in the way of the **Play Store** is not the reading experience but release plumbing and paperwork: target Android 16, a Play build without the self-updater, a real AAB pipeline, a privacy page and in-app privacy text that match what the app does (including a Cloudflare analytics script on the website), and a developer contact.

## Re-checks of known problems
| Known problem | Result |
|---|---|
| Mark all as read with no confirmation; finish page covering Undo | **Partly fixed:** Undo is no longer covered; still no confirmation (E1) |
| Back on the finish page leaving the app | **Fixed** on web; Android hardware Back needs your phone (E2) |
| Onboarding swipe directions reversed | **Fixed in onboarding; still reversed in the Tips list** (E3) |
| Mid-story "Read more" line cutting the story but counting it complete | **Still present** in some cases (E4) |
| Daily photo cover never showing its photo | **Fixed** (E5) |

## All findings, ranked (pick numbers in the first column)
Full detail for each ID is in `audit/sections/<letter>-*.md`; screenshots in `audit/img/` (full-size originals were not committed).

| # | ID | Severity | Status | Verified | Finding |
|---|---|---|---|---|---|
| 1 | A10 | Store-blocker | NEW | CODE | In-app self-update permission is a Play Store policy problem |
| 2 | D1 | Store-blocker | NEW | CODE | Target SDK is 35; Play needs 36 |
| 3 | D2 | Store-blocker | NEW | CODE | Self-updater and REQUEST_INSTALL_PACKAGES must be removed from the Play build |
| 4 | D3 | Store-blocker | NEW (KNOWN: HANDOFF.md:38 task 1 "confir | CODE | The AAB step is optional, silent on failure, and builds the sideload variant |
| 5 | D4 | Store-blocker | NEW | CONFIRMED | Live privacy page states the app is not on the Play Store, and describes GitHub updates |
| 6 | D5 | Store-blocker | NEW | CODE | In-app privacy sheet disagrees with what the app does |
| 7 | D6 | Store-blocker | NEW | CONFIRMED | No developer name or contact email anywhere |
| 8 | A1 | Must-fix | NEW | CONFIRMED | Android Back on the welcome slide silently skips onboarding for good |
| 9 | A6 | Must-fix | KNOWN-RECHECK (still present) | CODE | In-app Tips list says the opposite swipe directions (see E3) |
| 10 | D7 | Must-fix | NEW | CODE | Auto Backup is on: app data can leave the phone, contradicting "all data stays on your device" |
| 11 | D8 | Must-fix | NEW | CODE | Signing: Play App Signing, upload key, and the deep-link fingerprint |
| 12 | D9 | Must-fix | NEW | CODE | Foreground service and permission declarations (Play Console) |
| 13 | E2 | Must-fix | KNOWN-RECHECK (fixed on web; Android par | CONFIRMED | Back on the finish page leaves the app instead of going back |
| 14 | E3 | Must-fix | KNOWN-RECHECK (fixed in onboarding; stil | CONFIRMED | Onboarding swipe directions say the opposite of what the app does |
| 15 | E4 | Must-fix | KNOWN-RECHECK (partly fixed: still prese | CONFIRMED | A mid-story "Read more" line makes the cleaner discard the rest of the story |
| 16 | F1 | Must-fix | NEW | CONFIRMED | Cloudflare Web Analytics script is injected on the live site, contradicting the privacy page |
| 17 | F2 | Must-fix | NEW | CONFIRMED | Daily cover lead headline shrinks to body-text size, smaller than the quote beneath it |
| 18 | A2 | Should-fix | NEW | CONFIRMED | "Pick three topics" is wrong: one topic is enough |
| 19 | A3 | Should-fix | NEW | CONFIRMED | Disabled Next gives no visible reason; the quick "Start reading" is hidden below the fold |
| 20 | A4 | Should-fix | NEW | CONFIRMED | Five onboarding steps and a 33-chip topic list before the first story |
| 21 | A8 | Should-fix | NEW | CONFIRMED | Jargon and wording a beginner will meet |
| 22 | B1 | Should-fix | NEW | CONFIRMED | Daily "four views" tip repeats on every screen |
| 23 | B2 | Should-fix | NEW | CONFIRMED | Numbers disagree between modes |
| 24 | B4 | Should-fix | NEW | CONFIRMED | Saving a story from the phone reader is hidden inside "More" |
| 25 | B5 | Should-fix | NEW | CONFIRMED | Bad site address takes about 30 seconds to fail, error uses "feed" wording |
| 26 | B6 | Should-fix | NEW | CONFIRMED | Offline: no visible offline notice, and Add a site says "No feed found yet" |
| 27 | B7 | Should-fix | NEW | CONFIRMED | Following a site from search creates a real folder named "Unfiled", listed twice in the picker |
| 28 | B8 | Should-fix | NEW | CONFIRMED | No way to make a new folder from a site's settings or the sidebar |
| 29 | B14 | Should-fix | NEW | NEEDS-PHONE | Read aloud: only the failure path testable here |
| 30 | B15 | Should-fix | NEW | CONFIRMED | Third-party script blocked by the page policy on load |
| 31 | C1 | Should-fix | NEW | CONFIRMED | Developer test tools shipped in Settings |
| 32 | C2 | Should-fix | NEW | CODE | Hidden "(testing)" setting still alive |
| 33 | C3 | Should-fix | NEW | CONFIRMED / CODE | Wrong group / stale path text |
| 34 | C5 | Should-fix | NEW | CONFIRMED | Labels a beginner cannot parse |
| 35 | D11 | Should-fix | NEW | CODE | Cleartext policy |
| 36 | D12 | Should-fix | NEW | CONFIRMED | 16 KB page-size compatibility |
| 37 | D13 | Should-fix | NEW | CODE | Android 16 (API 36) behaviour changes likely to bite |
| 38 | D14 | Should-fix | NEW | CODE | Exported broadcast receiver without need |
| 39 | D15 | Should-fix | NEW | CODE | "Report a problem" sends more than the page says |
| 40 | D16 | Should-fix | NEW | CODE | Content/policy risk to decide before listing |
| 41 | D17 | Should-fix | NEW | CODE - D | Data safety form answers (to prepare) |
| 42 | E1 | Should-fix | KNOWN-RECHECK (changed: Undo no longer c | CONFIRMED | "Mark all as read" has no confirmation; finish page covers Undo |
| 43 | F3 | Should-fix | NEW | CONFIRMED | Black & White theme: "Headlines" tab text overflows into "Brief" |
| 44 | F4 | Should-fix | NEW | CONFIRMED | Closing the reader with the keyboard drops focus to the page top instead of the story that opened it |
| 45 | F5 | Should-fix | NEW | CONFIRMED | Collapsed search box is an invisible keyboard stop |
| 46 | F6 | Should-fix | NEW | CONFIRMED | Bottom "Search" tab: title collapses to "T…" / "Sa…" and the tab is not highlighted |
| 47 | F7 | Should-fix | NEW | CONFIRMED | Light / Dark / Dynamic choice uses aria-pressed on role="radio" |
| 48 | F9 | Should-fix | NEW | CONFIRMED | Reader top bar: spoken names differ from visible labels, buttons are small |
| 49 | F10 | Should-fix | NEW | CONFIRMED | Phone landscape: the first reader page shows only a small photo |
| 50 | F11 | Should-fix | NEW | CONFIRMED | Many controls are under 44px |
| 51 | F12 | Should-fix | NEW | CONFIRMED | Contrast below 4.5:1 in several themes |
| 52 | F13 | Should-fix | NEW | CODE | Jargon in settings: "relay", "worker", "OPML", Cloudflare steps |
| 53 | F14 | Should-fix | NEW | CODE | Native dialogs have no accessible name |
| 54 | F15 | Should-fix | NEW | CONFIRMED | First launch contacts four public proxy sites and logs a stream of console errors |
| 55 | A5 | Nice-to-have | NEW | CONFIRMED | "Skip for now" picks sites without asking, then explains |
| 56 | A7 | Nice-to-have | NEW (informational) | CONFIRMED | What's New matches the build (1.231); first run correctly skips it |
| 57 | A9 | Nice-to-have | NEW | CONFIRMED | Daily cover on first open has no photo two days out of three |
| 58 | B3 | Nice-to-have | NEW | CONFIRMED | Slow to a first story on a brand-new install, nothing to look at |
| 59 | B9 | Nice-to-have | NEW | CONFIRMED | "Site" and "feed" used interchangeably |
| 60 | B10 | Nice-to-have | NEW | CONFIRMED | Find in story counter is clipped |
| 61 | B11 | Nice-to-have | NEW | CONFIRMED | Highlight pop-up: unclear words and lingering toast |
| 62 | B12 | Nice-to-have | NEW | CONFIRMED | Search from Saved silently searches only Saved |
| 63 | B13 | Nice-to-have | NEW | CONFIRMED | Sunday issue on a new install is nearly empty |
| 64 | B17 | Nice-to-have | NEW | CONFIRMED | Themes and fold width |
| 65 | C4 | Nice-to-have | NEW | CONFIRMED | Duplicated controls |
| 66 | C6 | Nice-to-have | NEW | CONFIRMED | Destructive actions |
| 67 | C7 | Nice-to-have | NEW | CONFIRMED | Settings with no visible effect on web (verification gaps) |
| 68 | C8 | Nice-to-have | NEW | CONFIRMED | Page header focus box |
| 69 | D10 | Nice-to-have | NEW | CODE | Release-hygiene checks: debug code, test hooks, placeholders |
| 70 | D19 | Nice-to-have | NEW |  | Store listing assets and process (non-code) |
| 71 | F8 | Nice-to-have | NEW | CONFIRMED | Landmark and separator markup errors (axe) |
| 72 | F16 | Nice-to-have | NEW | CONFIRMED | "Tip: The Daily has four views" shows on All Stories, Brief and Sunday |
| 73 | F17 | Nice-to-have | NEW | CONFIRMED | Truncated labels in Settings header and summaries |
| 74 | F18 | Nice-to-have | NEW | CONFIRMED | Onboarding sample tiles: cut-off labels and an empty ring |
| 75 | F19 | Nice-to-have | NEW | CONFIRMED | Add a site: option cards cut off at the bottom of the list |
| 76 | F20 | Nice-to-have | NEW | CODE | Public insights page names themes that do not exist in the app |
| 77 | A11 | Info | KNOWN-RECHECK (fixed in onboarding, stil | CONFIRMED | Swipe directions in onboarding match the app (E3 sub-check) |
| 78 | A12 | Info |  |  | Other observations |
| 79 | B16 | Info | NEW | NEEDS-PHONE | Widgets (native only) |
| 80 | D18 | Info |  |  | Host-by-host privacy comparison (everything the code can contact, besides the publishers' own sites) |
| 81 | E5 | Info | KNOWN-RECHECK (fixed) | CONFIRMED | The Daily photo cover never shows its photo |

## Phase 2
Nothing is fixed until David sends pick numbers. Each pick is then done one at a time, re-checked with screenshots at phone and Fold width, and reverted at once if it breaks anything. No merge, build or deploy until David says so.
