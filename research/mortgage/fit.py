import math, statistics as st, itertools
from data import *
RATE, BUF, YEARS = 5.95, 2.5, 25
def factor(rate=RATE + BUF, years=YEARS):
    r = rate / 100 / 12; n = years * 12
    return (1 - (1 + r) ** -n) / r
F = factor()
def model(p, adults, kids, inc):
    a, b, c, c0, c1 = p
    t = min(1, max(0, (inc - 5000) / 2000))
    cap = c0 + (c1 - c0) * t
    L = a + b * (adults - 1) + c * kids
    return max(0, min(cap * inc, inc - L)) * F / 1000
def targets(kind):
    T = {}
    for k, v in ANG.items(): T[k] = st.median(v) if kind == 'typ' else max(v)
    for k, (lo, hi) in ANG_RANGE.items(): T[k] = (lo + hi) / 2 if kind == 'typ' else hi
    return T
def err(p, T):
    return sum(math.log(model(p, *k) / v) ** 2 for k, v in T.items() if model(p, *k) > 0)
def fit(kind):
    T = targets(kind); best = None
    for a in range(1500, 2601, 100):
        for b in range(1000, 2601, 100):
            for c in range(500, 1501, 100):
                for c0 in [x / 100 for x in range(40, 66, 2)]:
                    for c1 in [x / 100 for x in range(50, 80, 2)]:
                        if c1 < c0: continue
                        e = err((a, b, c, c0, c1), T)
                        if best is None or e < best[0]: best = (e, (a, b, c, c0, c1))
    return best, T
for kind in ('typ', 'max'):
    (e, p), T = fit(kind)
    print('\n==', kind, 'params a,b,c,c0,c1 =', p, 'rmse(log) %.3f' % math.sqrt(e / len(T)))
    print(' fit set (ANG Sept 2026):')
    for k, v in T.items(): m = model(p, *k); print('   %s target %6.0f model %6.0f  %+5.1f%%' % (k, v, m, (m / v - 1) * 100))
    print(' validation (Aug 2026, other source):')
    errs = []
    for k, v in TM.items():
        tv = st.median(v) if kind == 'typ' else max(v); m = model(p, *k); errs.append(abs(m / tv - 1))
        print('   %s actual %6.0f model %6.0f  %+5.1f%%   bank range %.0f..%.0f' % (k, tv, m, (m / tv - 1) * 100, min(v), max(v)))
    print('  mean abs err %.1f%%' % (100 * sum(errs) / len(errs)))
print('\nF', F)
