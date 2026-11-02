# Neural voices plan (2026-11-02, session dn9q8h). Status: NOT started, waiting on David's go.

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
