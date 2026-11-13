import math, statistics as st
from fit import model, F
from data import *
def T_ang(kind):
    T = {k: (st.median(v) if kind == 'typ' else max(v)) for k, v in ANG.items()}
    T.update({k: ((lo + hi) / 2 if kind == 'typ' else hi) for k, (lo, hi) in ANG_RANGE.items()})
    return T
def T_tm(kind): return {k: (st.median(v) if kind == 'typ' else max(v)) for k, v in TM.items()}
def err(p, T): return sum(math.log(max(model(p, *k), 1) / v) ** 2 for k, v in T.items())
def fit(T):
    best = None
    for a in range(1500, 2701, 100):
        for b in range(800, 3401, 100):
            for c in range(300, 1501, 100):
                for c0 in [x / 100 for x in range(40, 66, 2)]:
                    for c1 in [x / 100 for x in range(50, 80, 2)]:
                        if c1 < c0: continue
                        e = err((a, b, c, c0, c1), T)
                        if best is None or e < best[0]: best = (e, (a, b, c, c0, c1))
    return best[1]
def mae(p, T): return 100 * sum(abs(model(p, *k) / v - 1) for k, v in T.items()) / len(T)
for kind in ('typ', 'max'):
    A, B = T_ang(kind), T_tm(kind)
    pA, pB = fit(A), fit(B); AB = dict(A); AB.update(B); pAB = fit(AB)
    print(kind, 'fit ANG->test TM: params', pA, 'MAE on TM %.1f%%' % mae(pA, B))
    print(kind, 'fit TM->test ANG: params', pB, 'MAE on ANG %.1f%%' % mae(pB, A))
    print(kind, 'fit both: params', pAB, 'MAE ANG %.1f%% TM %.1f%%' % (mae(pAB, A), mae(pAB, B)))
    for k, v in AB.items(): print('   ', k, 'target %.0f model %.0f %+.1f%%' % (v, model(pAB, *k), (model(pAB, *k) / v - 1) * 100))
