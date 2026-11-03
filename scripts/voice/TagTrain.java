// Trains native/neural/en-pos.bin (CyPress 2026-11-03): UD_English-EWT r2.14 train+dev+test + UD_English-PUD r2.14, PERCEPTRON 300 iterations,
// cutoff 0, features = scripts/voice/tagger.featuregen. Scores before the final all-data run (held out): EWT test 94.31% (old 93.03%), PUD news 95.33% (old 93.75%).
// Run: java -cp opennlp.jar:slf4j.jar TagTrain <dir with .conllu + tagger.featuregen as generator.featuregen> ewt+dev+pud PERCEPTRON 300 0 full
import java.io.*; import java.nio.file.*; import java.util.*;
import opennlp.tools.postag.*; import opennlp.tools.util.*; import opennlp.tools.ml.*;
public class TagTrain {
  static List<POSSample> load(String f, int from, int to) throws Exception {
    List<POSSample> out = new ArrayList<>(); List<String> w = new ArrayList<>(), t = new ArrayList<>(); int n = 0;
    for (String l : Files.readAllLines(Path.of(f))) {
      if (l.isEmpty()) { if (!w.isEmpty()) { if (n >= from && n < to) out.add(new POSSample(w.toArray(new String[0]), t.toArray(new String[0]))); n++; w = new ArrayList<>(); t = new ArrayList<>(); } continue; }
      if (l.startsWith("#")) continue; String[] c = l.split("\t"); if (c[0].contains("-") || c[0].contains(".")) continue;
      w.add(c[1]); t.add(c[4]); }
    return out; }
  static String[] FOCUS = {"read","lead","live","lives","close","wind","winds","export","import","suspects","associate","affect","present","record","content","subject","separate","estimate","estimates","use","used","project","increase","object","protest","produce","conduct","contract","permit","progress"};
  static void eval(POSTaggerME m, List<POSSample> test, String name) {
    long ok = 0, n = 0, vok = 0, vn = 0, fok = 0, fn = 0; Set<String> foc = new HashSet<>(Arrays.asList(FOCUS));
    for (POSSample s : test) { String[] g = m.tag(s.getSentence()); String[] t = s.getTags();
      for (int i = 0; i < g.length; i++) { boolean k = g[i].equals(t[i]); n++; if (k) ok++;
        if (t[i].startsWith("VB")) { vn++; if (k) vok++; }
        if (foc.contains(s.getSentence()[i].toLowerCase())) { fn++; if (k) fok++; } } }
    System.out.printf("%-28s all %.2f%%  verbs %.2f%%  tricky %.2f%% (%d)%n", name, 100.0*ok/n, 100.0*vok/vn, 100.0*fok/fn, fn); }
  public static void main(String[] a) throws Exception {
    String D = a[0]; List<POSSample> test = load(D+"/en_ewt-ud-test.conllu",0,1<<30), pudEval = load(D+"/en_pud-ud-test.conllu",800,1000);
    if (a[1].equals("base")) { POSTaggerME m = new POSTaggerME(new POSModel(new FileInputStream(a[2])), POSTagFormat.CUSTOM); eval(m,test,"current EWT-test"); eval(m,pudEval,"current PUD-news"); return; }
    List<POSSample> tr = new ArrayList<>(load(D+"/en_ewt-ud-train.conllu",0,1<<30));
    boolean full = a.length > 5 && a[5].equals("full");
    if (a[1].contains("dev")) tr.addAll(load(D+"/en_ewt-ud-dev.conllu",0,1<<30));
    if (a[1].contains("pud")) tr.addAll(load(D+"/en_pud-ud-test.conllu",0,full?1000:800));
    if (full) tr.addAll(test);
    TrainingParameters p = new TrainingParameters(); p.put(TrainingParameters.ALGORITHM_PARAM, a[2]); p.put(TrainingParameters.ITERATIONS_PARAM, Integer.parseInt(a[3])); p.put(TrainingParameters.CUTOFF_PARAM, Integer.parseInt(a[4]));
    POSTaggerFactory fac = new POSTaggerFactory(Files.readAllBytes(Path.of(D+"/generator.featuregen")), new HashMap<>(), null);
    POSModel model = POSTaggerME.train("en", new CollectionObjectStream<>(tr), p, fac);
    String out = D+"/m-"+a[1]+"-"+a[2]+"-"+a[3]+"-"+a[4]+(full?"-full":"")+".bin"; try (OutputStream o = new FileOutputStream(out)) { model.serialize(o); }
    POSTaggerME m = new POSTaggerME(model, POSTagFormat.CUSTOM); String nm = a[1]+" "+a[2]+" "+a[3]+"/"+a[4];
    eval(m,test,nm+" EWT-test"); eval(m,pudEval,nm+" PUD-news"); System.out.println(new File(out).length()+" bytes"); } }
