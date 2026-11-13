import difflib, hashlib, json, gzip, base64, re, sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
a = open(sys.argv[1], encoding='utf8').read()
b = open(os.path.join(ROOT, 'dist', 'poland-wp.html'), encoding='utf8').read()
print('base', hashlib.sha256(a.encode()).hexdigest())
tok = lambda s: re.findall(r'[^;{},()]*[;{},()]|[^;{},()]+$', s)
ta, tb = tok(a), tok(b)
sm = difflib.SequenceMatcher(None, ta, tb, autojunk=False)
u16 = lambda s: len(s.encode('utf-16-le')) // 2
off = [0]
for t in ta: off.append(off[-1] + u16(t))
patch = [[off[i1], off[i2], ''.join(tb[j1:j2])] for tag, i1, i2, j1, j2 in sm.get_opcodes() if tag != 'equal']
x = a.encode('utf-16-le')
for s0, e0, n in reversed(patch): x = x[:s0 * 2] + n.encode('utf-16-le') + x[e0 * 2:]
print('apply ok', x.decode('utf-16-le') == b, 'ops', len(patch))
z = base64.b64encode(gzip.compress(json.dumps(patch, ensure_ascii=False).encode(), 9)).decode()
open(os.path.join(ROOT, 'dist', 'patch.b64'), 'w').write(z)
print('b64', len(z), 'new', hashlib.sha256(b.encode()).hexdigest())
