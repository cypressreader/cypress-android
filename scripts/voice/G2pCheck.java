package com.cypress.reader; // desktop check of CyG2p (native/neural): scripts/check-voice.sh
import java.io.*;
public class G2pCheck {
  public static void main(String[] a) throws Exception {
    String d = a[0];
    CyG2p g = new CyG2p(new File(a[2])); try (InputStream in = new FileInputStream(d + "/cmu-extra.txt")) { g.addMissing(in); }
    try (InputStream in = new FileInputStream(d + "/misaki-het.txt")) { g.addHet(in); }
    try (InputStream in = new FileInputStream(d + "/en-pos.bin")) { g.setTagger(in); }
    BufferedReader r = new BufferedReader(new InputStreamReader(new FileInputStream(a[1]), "UTF-8"));
    int bad = 0, n = 0;
    for (String l; (l = r.readLine()) != null; ) {
      if (l.isBlank() || l.startsWith("#")) continue;
      String[] f = l.split("\t"); // sentence <tab> word <tab> expected sound fragment
      String out = g.phonemes(f[0]); n++;
      boolean ok = out.contains(f[2]);
      if (!ok) bad++;
      System.out.println((ok ? "ok   " : "FAIL ") + f[0] + "  [" + f[1] + " -> want " + f[2] + "]" + (ok ? "" : "\n     " + out));
    }
    System.out.println(bad + " of " + n + " wrong");
    System.exit(bad > 0 ? 1 : 0);
  }
}
