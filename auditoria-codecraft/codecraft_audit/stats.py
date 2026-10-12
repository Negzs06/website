"""Métricas: taxas com IC de Wilson, latência (mediana, p90, p95), IC bootstrap,
similaridade entre repetições e sinais de integridade.

Com amostras pequenas (poucas repetições por prompt), os intervalos são largos;
o relatório deve declarar isso explicitamente.
"""
from __future__ import annotations

import difflib
import math
import random
import statistics

from . import config


def wilson(k, n, z=1.96):
    if n == 0:
        return None, None
    p = k / n
    denom = 1 + z * z / n
    centre = (p + z * z / (2 * n)) / denom
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / denom
    return round(max(0.0, centre - half), 4), round(min(1.0, centre + half), 4)


def percentile(values, p):
    if not values:
        return None
    s = sorted(values)
    k = (len(s) - 1) * p / 100
    f, c = math.floor(k), math.ceil(k)
    return round(s[f] if f == c else s[f] + (s[c] - s[f]) * (k - f), 1)


def bootstrap_ci(values, stat=statistics.fmean, n=2000, alpha=0.05, seed=42):
    if len(values) < 2:
        return None, None
    rng = random.Random(seed)
    boots = sorted(stat([rng.choice(values) for _ in values]) for _ in range(n))
    return round(boots[int(n * alpha / 2)], 1), round(boots[int(n * (1 - alpha / 2)) - 1], 1)


def similarity(a, b):
    return difflib.SequenceMatcher(None, a or "", b or "", autojunk=False).ratio()


def request_id(headers):
    for key, value in (headers or {}).items():
        if "request" in key.lower() and "id" in key.lower():
            return value
    return None


def summarize(rows, records, models_status, model_ids, budget):
    chat_records = [r for r in records if r.kind != "models"]
    latencies = [r.latency_ms for r in chat_records if r.status is not None]

    per_category = {}
    for cat in sorted({r["category"] for r in rows}):
        scored = [r for r in rows if r["category"] == cat and r["ok"] is not None]
        ok = sum(1 for r in scored if r["ok"])
        lo, hi = wilson(ok, len(scored))
        per_category[cat] = {"n": len(scored), "ok": ok,
                             "rate": round(ok / len(scored), 4) if scored else None, "ci95": [lo, hi]}

    tool_rows = [r for r in rows if r["prompt_id"] == "C-tool-weather"]
    tool_ok = sum(1 for r in tool_rows if r["ok"])

    consistency_rows = [r for r in rows if r["prompt_id"] == "B-consistency-mutex" and r["response_text"]]
    texts = [r["response_text"] for r in consistency_rows]
    pair_sims = [similarity(texts[i], texts[j]) for i in range(len(texts)) for j in range(i + 1, len(texts))]
    prompt_tokens = sorted({r["prompt_tokens"] for r in consistency_rows if r["prompt_tokens"] is not None})

    echo_mismatch = [
        {"prompt_id": r["prompt_id"], "rep": r["rep"], "model_echo": r["model_echo"]}
        for r in rows if r["model_echo"] is not None and r["model_echo"] != config.TARGET_MODEL
    ]
    missing_usage = sum(1 for r in rows if r["status"] == 200 and r["prompt_id"] != "C-stream-count" and r["total_tokens"] is None)
    fingerprints = sorted({r["system_fingerprint"] for r in rows if r["system_fingerprint"]})
    stream_row = next((r for r in rows if r["prompt_id"] == "C-stream-count"), None)

    claims = [
        {"prompt_id": r["prompt_id"], "status": r["status"], "ok": r["ok"], "detail": r["detail"]}
        for r in rows if r["category"] == "D"
    ]
    target_listed = config.TARGET_MODEL in model_ids

    contradictions = []
    if models_status == 200 and not target_listed:
        contradictions.append(f"'{config.TARGET_MODEL}' não aparece em GET /v1/models (anunciado pelo fornecedor)")
    for e in echo_mismatch:
        contradictions.append(f"{e['prompt_id']} rep {e['rep']}: campo model retornou {e['model_echo']!r}")
    for c in claims:
        if c["ok"] is False:
            contradictions.append(f"alegação documental contrariada em {c['prompt_id']}: {c['detail']}")

    chat_ok = sum(1 for r in rows if r["ok"] is True)
    return {
        "models_status": models_status,
        "model_ids": model_ids,
        "target_listed": target_listed,
        "api_reachable": models_status == 200,
        "chat_ok": chat_ok,
        "chat_calls": len(rows),
        "calls_total": budget.used_requests,
        "tokens_total": budget.used_tokens,
        "per_category": per_category,
        "latency_ms": {
            "n": len(latencies),
            "median": percentile(latencies, 50),
            "p90": percentile(latencies, 90),
            "p95": percentile(latencies, 95),
            "mean": round(statistics.fmean(latencies), 1) if latencies else None,
            "mean_ci95": list(bootstrap_ci(latencies)),
        },
        "ttft_ms_median": percentile([r.ttft_ms for r in chat_records if r.ttft_ms is not None], 50),
        "tool_valid": {"n": len(tool_rows), "ok": tool_ok,
                       "rate": round(tool_ok / len(tool_rows), 4) if tool_rows else None},
        "consistency": {
            "n_responses": len(texts),
            "mean_pair_similarity": round(statistics.fmean(pair_sims), 4) if pair_sims else None,
            "min_pair_similarity": round(min(pair_sims), 4) if pair_sims else None,
            "distinct_prompt_token_counts": prompt_tokens,
        },
        "signals": {
            "model_echo_mismatch": echo_mismatch,
            "missing_usage_rows": missing_usage,
            "system_fingerprints": fingerprints,
            "stream_ok": stream_row["ok"] if stream_row else None,
            "request_ids_seen": sum(1 for r in records if request_id(r.headers)),
            "http_statuses": sorted({r.status for r in records if r.status is not None}),
        },
        "claims": claims,
        "contradictions": contradictions,
    }
