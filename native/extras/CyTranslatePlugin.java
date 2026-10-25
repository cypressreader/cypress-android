package com.cypress.reader;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.mlkit.common.model.DownloadConditions;
import com.google.mlkit.nl.languageid.LanguageIdentification;
import com.google.mlkit.nl.translate.TranslateLanguage;
import com.google.mlkit.nl.translate.Translation;
import com.google.mlkit.nl.translate.Translator;
import com.google.mlkit.nl.translate.TranslatorOptions;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONArray;

/**
 * On-device story translation (Google ML Kit), exposed to the web app as the "CyTranslate" plugin.
 * The story text never leaves the phone; only the first use of a language downloads a small language pack.
 * Every method catches everything and rejects with a message; nothing here may crash the app.
 */
@CapacitorPlugin(name = "CyTranslate")
public class CyTranslatePlugin extends Plugin {

    private static String msg(Throwable t) {
        String m = t.getMessage();
        return t.getClass().getSimpleName() + (m == null ? "" : ": " + m);
    }

    /** Which language is this text? Resolves {lang: "de"} ("und" when unsure). */
    @PluginMethod
    public void detect(final PluginCall call) {
        try {
            String text = call.getString("text", "");
            LanguageIdentification.getClient().identifyLanguage(text)
                .addOnSuccessListener(tag -> {
                    JSObject r = new JSObject();
                    r.put("lang", tag == null ? "und" : tag);
                    call.resolve(r);
                })
                .addOnFailureListener(e -> call.reject("detect failed: " + msg(e)));
        } catch (Throwable t) {
            call.reject("detect failed: " + msg(t));
        }
    }

    /** Translates a list of paragraphs. Resolves {texts: [...]} in the same order. */
    @PluginMethod
    public void translate(final PluginCall call) {
        try {
            String srcTag = call.getString("src", "");
            String tgtTag = call.getString("tgt", "");
            String src = TranslateLanguage.fromLanguageTag(srcTag);
            String tgt = TranslateLanguage.fromLanguageTag(tgtTag);
            if (src == null || tgt == null) {
                call.reject("unsupported language");
                return;
            }
            JSONArray in = call.getArray("texts");
            if (in == null) {
                call.reject("no text");
                return;
            }
            final List<String> texts = new ArrayList<>();
            for (int i = 0; i < in.length(); i++) texts.add(in.optString(i, ""));

            TranslatorOptions opts = new TranslatorOptions.Builder()
                .setSourceLanguage(src)
                .setTargetLanguage(tgt)
                .build();
            final Translator tr = Translation.getClient(opts);
            tr.downloadModelIfNeeded(new DownloadConditions.Builder().build())
                .addOnSuccessListener(v -> next(tr, texts, new ArrayList<String>(), call))
                .addOnFailureListener(e -> {
                    tr.close();
                    call.reject("language pack: " + msg(e));
                });
        } catch (Throwable t) {
            call.reject("translate failed: " + msg(t));
        }
    }

    private void next(final Translator tr, final List<String> texts, final List<String> out, final PluginCall call) {
        try {
            if (out.size() >= texts.size()) {
                JSArray arr = new JSArray();
                for (String s : out) arr.put(s);
                JSObject r = new JSObject();
                r.put("texts", arr);
                tr.close();
                call.resolve(r);
                return;
            }
            final String one = texts.get(out.size());
            if (one.trim().isEmpty()) {
                out.add(one);
                next(tr, texts, out, call);
                return;
            }
            tr.translate(one)
                .addOnSuccessListener(s -> {
                    out.add(s == null ? one : s);
                    next(tr, texts, out, call);
                })
                .addOnFailureListener(e -> {
                    out.add(one);
                    next(tr, texts, out, call);
                });
        } catch (Throwable t) {
            try { tr.close(); } catch (Throwable ignore) { }
            call.reject("translate failed: " + msg(t));
        }
    }
}
