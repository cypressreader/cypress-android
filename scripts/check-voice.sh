#!/bin/sh
# Runs scripts/voice/tricky-sentences.tsv through the Natural voice's word-to-sound code (native/neural/CyG2p.java) on a desktop JVM.
# Run before every change to CyG2p, misaki-het.txt or cmu-extra.txt. Downloads (cached): OpenNLP, slf4j, the pinned Kokoro word list.
set -e
R=$(cd "$(dirname "$0")/.." && pwd); C=${XDG_CACHE_HOME:-$HOME/.cache}/cypress-voice; mkdir -p "$C"
get() { [ -s "$C/$1" ] || curl -fsSL --retry 4 -o "$C/$1" "$2"; }
get opennlp.jar https://repo1.maven.org/maven2/org/apache/opennlp/opennlp-tools/2.5.12/opennlp-tools-2.5.12.jar
get slf4j.jar https://repo1.maven.org/maven2/org/slf4j/slf4j-api/2.0.16/slf4j-api-2.0.16.jar
get lexicon-us-en.txt https://huggingface.co/csukuangfj/kokoro-multi-lang-v1_0/resolve/f7b96bb6bef5c5da4d3aa4f4e0498fbbf62dc78b/lexicon-us-en.txt
CP="$C/opennlp.jar:$C/slf4j.jar"; rm -rf "$C/out"
javac -nowarn -cp "$CP" -d "$C/out" "$R/native/neural/CyG2p.java" "$R/native/extras/CyText.java" "$R/scripts/voice/G2pCheck.java" 2>&1 | grep -v '^Note\|JAVA_TOOL' || true
java -Dstdout.encoding=UTF-8 -cp "$C/out:$CP" com.cypress.reader.G2pCheck "$R/native/neural" "$R/scripts/voice/tricky-sentences.tsv" "$C/lexicon-us-en.txt" 2>&1 | grep -v 'JAVA_TOOL\|SLF4J'
