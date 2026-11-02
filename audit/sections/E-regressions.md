# Section E: Regression re-checks (production 1.231)

### E1 "Mark all as read" has no confirmation; finish page covers Undo
- Status: KNOWN-RECHECK (changed: Undo no longer covered; still no confirmation) · Severity: Should-fix · Verified: CONFIRMED
- Where: www/index.html:11580 `$('#mr').onclick` (marks every story in `cur`, toast with Undo, 6 s); finish page `#fin` z-index 2000 (3247) vs `#toast` z-index 60 (1445) plus later overrides.
- Now: One tap on the double-check icon in the header (next to Search) marks the whole list read at once, with no question. A toast "Marked 48 stories as read / Undo" appears for 6 seconds and is the only way back. When the Daily is completed, the "Fin." page now shows with the toast still visible above it and Undo reachable (elementFromPoint at Undo returned the Undo button; screenshot shows the toast under the card). So the covering bug is fixed. Side findings: (a) the count is the visible list (48) while the Daily says 40 stories read; (b) in my run Mark all did not complete the Daily (37 of 40) because the Daily re-forms after the marks, so the Fin page is reachable but not guaranteed by this button; the Fin page was reached by forcing read state and calling finCheck(). (c) the icon is small and sits beside Search, easy to hit by mistake; an aria-label "Mark all as read" exists.
- Should: Either a confirm (it affects up to 48 stories, and Daily progress) or a longer-lived Undo (10 s) and a label on the icon.
- Shots: shots/E/E1-phone-day.png, shots/E/E1-finish-phone-day.png

### E2 Back on the finish page leaves the app instead of going back
- Status: KNOWN-RECHECK (fixed on web; Android part NEEDS-PHONE) · Severity: Must-fix if it regresses · Verified: CONFIRMED (web) / CODE (Android)
- Where: finShow pushLayer('fin') www/index.html:7641; popstate 16495 closes via finClose(true); native/extras/MainActivity.java:162 to 245 asks the page `window.cyBack()` first, only calls defaultBack when it returns false.
- Now: With the Fin page open, history back (Playwright goBack) closed the Fin page and stayed in the app (layers [] afterwards, URL unchanged). A second back at the Daily root went to about:blank, i.e. left the app, which is the expected root behaviour. In Android, MainActivity routes Back to cyBack() (true when any layer is open, e.g. Fin), watchdog 1.5 s falls back to normal back. Not exercised on a real phone: predictive-back animation, and Back while Fin is still fading in (opacity transition .6 s, layer is pushed immediately so should be fine).
- Should: nothing for the Fin page. Separate issue A1: onboarding dialog is closed by Back (see A1).
- Shots: shots/E/E2-after-back-phone-day.png

### E3 Onboarding swipe directions say the opposite of what the app does
- Status: KNOWN-RECHECK (fixed in onboarding; still present in the Tips list) · Severity: Must-fix · Verified: CONFIRMED (swipes) + CODE (copy)
- Where: Behaviour: swEnd, www/index.html:13222: dx<0 (left) toggles save, else (right) marks read. Onboarding tip (13725): "Swipe a story right to mark it read, left to save it." (correct). Toast tip TIPQ (12814): same (correct). Tips list TIPLIST (12812, opened from Settings, line 12749): "Swipe a card <b>right to save</b>, <b>left to mark read</b>." (WRONG, opposite).
- Now: Real touch swipes through CDP: swipe right gave read=true and "Marked as read"; swipe left gave saved=true. So onboarding is right but the Tips dialog contradicts it. The swipe overlay label confirms (green "Read" on the left of a right swipe, gold "Save" on a left swipe).
- Should: Fix TIPLIST to "right to mark read, left to save".
- Shots: shots/A/A3-swipe-right-result.png, shots/A/A2-night-phone-ob4.png

### E4 A mid-story "Read more" line makes the cleaner discard the rest of the story
- Status: KNOWN-RECHECK (partly fixed: still present when little follows) · Severity: Must-fix · Verified: CONFIRMED (synthetic, ran tidy() in the live page)
- Where: tidy(), www/index.html:9162 to 9176. The END regex (8988) matches "Read more" at the start of a short block (<240 chars) once more than 35% of the text has passed. 9166 added a guard: if at least two paragraphs of 90+ characters follow and they are more than 25% of the text, only that line is dropped; otherwise everything after it is cut (`kids.slice(cut).forEach(drop)`). Completion check truncReason() (9669) then sees text ending with a period and returns '' ("looks complete"), so no fallback fetch happens (a story under 500 words from the site's own page of 200+ words is also accepted).
- Now (live synthetic stories, 260-char paragraphs): A) "Read more:" after para 6 of 10, 4 long paragraphs follow: 10 of 11 blocks kept, 99% of text (FIXED). B) "Read more:" after para 6, then one 500-char paragraph and a short closing line: the last two blocks were deleted, 74% kept, result still ends with a period so it counts as complete (STILL PRESENT). C) "Read more:" after para 12, then two normal paragraphs (about 15% of text): both deleted, 85% kept (STILL PRESENT). E) bare "Read more" line, then one long paragraph: 73% kept (STILL PRESENT). D) real "Related stories" end: correct cut.
- Should: Treat "Read more"/"Related:" as a single dropped line unless what follows is clearly a list of links (short items or mostly anchors); lower the tail rule to "any paragraph of 90+ characters follows".
- Shots: none (script output only)

### E5 The Daily photo cover never shows its photo
- Status: KNOWN-RECHECK (fixed) · Severity: n/a (Nice-to-have: see note) · Verified: CONFIRMED
- Where: dayCoverHtml, www/index.html:15409; coverTreat 17527; image opacity 0 until `.ok` set by cvJudge (15397); fallback cvArtFail after 9 s.
- Now: Forcing the photo treatment (S.cvt = today, t:'photo', cover Auto) with live stories: the `.dcov.dct-photo` cover contains the lead image (976 px wide), class ok, opacity 1, photo visible behind the headline with a dark wash. Other cover styles from Settings (Clean, Gazette, Magazine, Gallery, Index, Journal, Cinema) all render the photo as well (Cinema screenshot full bleed photo). Note: Settings no longer offers "Full photo" (N1 trimmed to nine covers; saved "photo" migrates to Clean). Notes: (a) Auto only shows the photo one day in three (by day number), otherwise the typographic cover, so a user can still go days without seeing a photo; (b) the photo cover is heavily cropped and dimmed on a phone, and a 976 px source looks soft.
- Should: Consider showing the photo cover whenever the lead has a good image; crop less.
- Shots: shots/E/E5-phone-day.png, shots/E/E5-cinema-phone-day.png, shots/E/E5-gazette-phone-day.png
