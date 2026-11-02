# Neural voices plan (2026-11-02, session dn9q8h). Status: step 1 (spike) BUILT 2026-11-02, session mnmjdx, David's go (English only). Waiting on Fold measurements.

## Decision so far
- Engine: sherpa-onnx (k2-fsa) >= 2.0.0, Android AAR. 2.0.0 removed GPL eSpeak-NG (issue #3731): lexicon-only, Apache-2.0.
  Before shipping: confirm no espeak code in the AAR .so files and no espeak-ng-data in any voice we offer.
- Voices download on demand (Wi-Fi only, app-private storage, progress/retry/delete). Nothing bundled in the APK.
- System voice stays the default; neural is opt-in; any failure falls back to the system voice silently.

## Where it plugs in
- native/extras/CyTts.java (598 lines): Job/Piece queue, sentence pieces, pauses (playSilentUtterance), voices list, volume.
  Add an engine switch INSIDE CyTts: same Job/Piece in, same progress events out. Neural path: OfflineTts.generate(piece)
  -> PCM -> AudioTrack, synthesize piece N+1 while N plays.
- native/extras/CyMediaService.java: foreground service + controls, unchanged (it just needs audio focus kept).
- www/index.html: voice picker in Settings > Listen (s-tts), download manager UI, privacy.html entry for the download host.

## Known limits
- Word-by-word highlight: system TTS reports word ranges; neural engines do not. Neural = sentence highlight (or estimated words).
- Pitch: not supported by Kokoro/Piper in sherpa-onnx (speed only). Section pauses + speed per section: fine.
- Languages: lexicon-only means only voices that ship a pronunciation list. Kokoro multi-lang has en + zh lexicons;
  others (fr/es/de/it/pt/ja) must be checked against the 2.0+ tts-models release at build time.
- APK grows by the engine (~10-30 MB; arm64-only keeps it lower). Voice files ~80-330 MB (Kokoro) / 20-75 MB (Piper-style).
- Speed on budget phones: Kokoro may be slower than real time; Piper-style VITS voices much faster. Measure on the Fold.

## Steps
1. Spike branch preview/neural-tts: AAR in the CI Android build, one English voice downloaded by hand-coded URL,
   play one story through CyTts with fallback. Debug APK from CI. David measures on the Fold (start delay, smoothness, battery).
2. If good: voice catalog read from the release, picker grouped by language, download manager, language-aware default.
3. Section prosody (headline/byline/body pauses + speed), unload model on stop, privacy.html disclosure, license notes file.
4. Ship only on David's `build`.

## Spike as built (2026-11-02)
- Engine sherpa-onnx 2.0.1 AAR (sha256 pinned in .github/workflows/spike-tts.yml). Checked: no eSpeak code in the .so files (only
  "no longer used" warning strings); the workflow fails if eSpeak files/symbols appear in the APK. Piper/VITS voices need eSpeak-style
  phonemes in 2.0 (external phonemizer), so they are OUT; Kokoro + lexicon is the English path.
- Voice: Kokoro int8 multi-lang v1.0 from Hugging Face, pinned revision 57adb37f; 4 files only (model.int8.onnx 114 MB, voices.bin 28 MB,
  lexicon-us-en.txt 6 MB, tokens.txt), size-checked. espeak-ng-data folder never fetched. Speaker 3 = af_heart.
- Code: native/neural/CyNeural.java (copied only when NEURAL=1); CyTts.Neural interface, found by Class.forName, so main builds don't
  need it. Voice id "neural:kokoro-en" shows in the existing voice picker (q 0, so "Best available" never picks it). Synthesis thread
  stays up to 3 clips (~220 chars each) ahead of a float AudioTrack. Sentence highlight via ttsBoundary.
- Test app: com.cypress.reader.tts "CyPress Voices test", arm64 only, signed with the real key, updates off, pre-release `voices-test`
  (the app's update check reads releases/latest, which skips pre-releases).
- Download (fix 2026-11-02): resumes .part files with Range, 6 tries per file with backoff, wake + Wi-Fi locks, failure toast shows the error.
- Known spike gaps: quotes in a second system voice would overlap; words not in the lexicon may be skipped (check names/numbers);
  huggingface.co must go on docs/privacy.html before anything ships; no UI for delete/progress (toasts only).
