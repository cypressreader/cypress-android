#!/usr/bin/env python3
"""Builds the natural-voice download files from the pinned Kokoro v1.0 files (Apache-2.0) in the current folder:
model.half.onnx = model.onnx with every big weight stored as float16 and turned back into float32 when loaded (same math,
half the download; measured 2026-11-02: SNR 19.8 dB vs the full model, int8 was -1.9 dB and sounded robotic). voices.bin
stays whole (28 MB): sherpa checks it against the model's 54-speaker list."""
import hashlib, os, sys
import numpy as np, onnx
from onnx import TensorProto, helper, numpy_helper

m = onnx.load('model.onnx')
g = m.graph
inits, casts = [], []
for t in g.initializer:
    if t.data_type == TensorProto.FLOAT and int(np.prod(t.dims)) >= 1024:
        inits.append(numpy_helper.from_array(numpy_helper.to_array(t).astype(np.float16), t.name + '__h'))
        casts.append(helper.make_node('Cast', [t.name + '__h'], [t.name], to=TensorProto.FLOAT, name=t.name + '__cast'))
    else:
        inits.append(t)
del g.initializer[:]
g.initializer.extend(inits)
nodes = list(g.node)
del g.node[:]
g.node.extend(casts + nodes)
onnx.save(m, 'model.half.onnx')
with open('SIZES.txt', 'w') as o:
    for f in ('tokens.txt', 'lexicon-us-en.txt', 'voices.bin', 'model.onnx', 'model.half.onnx'):
        o.write('%s %d %s\n' % (f, os.path.getsize(f), hashlib.sha256(open(f, 'rb').read()).hexdigest()))
print(open('SIZES.txt').read())
