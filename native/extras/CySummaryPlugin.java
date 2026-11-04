package com.cypress.reader;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.common.util.concurrent.ListenableFuture;
import com.google.mlkit.genai.common.DownloadCallback;
import com.google.mlkit.genai.common.FeatureStatus;
import com.google.mlkit.genai.common.GenAiException;
import com.google.mlkit.genai.summarization.Summarization;
import com.google.mlkit.genai.summarization.SummarizationRequest;
import com.google.mlkit.genai.summarization.Summarizer;
import com.google.mlkit.genai.summarization.SummarizerOptions;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * On-device story summaries (Google ML Kit GenAI on Gemini Nano), exposed to the web app as "CySummary".
 * Runs only on phones with Google's built-in AI; the story text never leaves the phone.
 * Every method catches everything and rejects with a message; nothing here may crash the app.
 */
@CapacitorPlugin(name = "CySummary")
public class CySummaryPlugin extends Plugin {
    private final ExecutorService ex = Executors.newSingleThreadExecutor();
    private Summarizer sum;

    private static String msg(Throwable t) {
        String m = t.getMessage();
        return t.getClass().getSimpleName() + (m == null ? "" : ": " + m);
    }

    private synchronized Summarizer get() {
        if (sum == null) {
            SummarizerOptions o = SummarizerOptions.builder(getContext())
                .setInputType(SummarizerOptions.InputType.ARTICLE)
                .setOutputType(SummarizerOptions.OutputType.THREE_BULLETS)
                .setLanguage(SummarizerOptions.Language.ENGLISH)
                .setLongInputAutoTruncationEnabled(true)
                .build();
            sum = Summarization.getClient(o);
        }
        return sum;
    }

    /** Resolves {st: "available" | "downloadable" | "downloading" | "unavailable"}. */
    @PluginMethod
    public void status(final PluginCall call) {
        try {
            final ListenableFuture<Integer> f = get().checkFeatureStatus();
            f.addListener(() -> {
                try {
                    int s = f.get();
                    JSObject r = new JSObject();
                    r.put("st", s == FeatureStatus.AVAILABLE ? "available" : s == FeatureStatus.DOWNLOADABLE ? "downloadable" : s == FeatureStatus.DOWNLOADING ? "downloading" : "unavailable");
                    call.resolve(r);
                } catch (Throwable t) {
                    JSObject r = new JSObject();
                    r.put("st", "unavailable");
                    r.put("why", msg(t));
                    call.resolve(r);
                }
            }, ex);
        } catch (Throwable t) {
            JSObject r = new JSObject();
            r.put("st", "unavailable");
            r.put("why", msg(t));
            call.resolve(r);
        }
    }

    /** Asks the phone to fetch the summary feature (Google manages the download). Resolves at once. */
    @PluginMethod
    public void prepare(final PluginCall call) {
        try {
            get().downloadFeature(new DownloadCallback() {
                @Override public void onDownloadStarted(long b) { }
                @Override public void onDownloadProgress(long b) { }
                @Override public void onDownloadCompleted() { }
                @Override public void onDownloadFailed(GenAiException e) { }
            });
            call.resolve();
        } catch (Throwable t) {
            call.reject("prepare failed: " + msg(t));
        }
    }

    /** Summarizes {text}. Resolves {summary: "bullet\nbullet\nbullet"}. */
    @PluginMethod
    public void summarize(final PluginCall call) {
        try {
            String text = call.getString("text", "");
            if (text.trim().isEmpty()) {
                call.reject("no text");
                return;
            }
            final ListenableFuture<com.google.mlkit.genai.summarization.SummarizationResult> f =
                get().runInference(SummarizationRequest.builder(text).build());
            f.addListener(() -> {
                try {
                    JSObject r = new JSObject();
                    r.put("summary", f.get().getSummary());
                    call.resolve(r);
                } catch (Throwable t) {
                    call.reject("summarize failed: " + msg(t));
                }
            }, ex);
        } catch (Throwable t) {
            call.reject("summarize failed: " + msg(t));
        }
    }

    @Override
    protected void handleOnDestroy() {
        try { if (sum != null) sum.close(); } catch (Throwable ignore) { }
        ex.shutdown();
    }
}
