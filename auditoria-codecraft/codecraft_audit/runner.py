"""CLI da auditoria.

  python -m codecraft_audit.runner dry-run        # plano e teto de custo, sem rede
  python -m codecraft_audit.runner probe          # uma chamada GET /v1/models
  python -m codecraft_audit.runner run [--long-context]
  python -m codecraft_audit.runner report RUN_DIR # regenera o relatório a partir de uma execução

A chave vem somente de CODECRAFT_API_KEY e nunca é gravada.
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import os
import sys
from dataclasses import asdict

from . import checks as C
from . import config
from . import prompts as P
from . import report as R
from . import stats as S
from .client import Budget, BudgetExceeded, CodeCraftClient, redact

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_FIELDS = ["prompt_id", "category", "rep", "status", "latency_ms", "ttft_ms", "ok", "detail", "error",
              "model_echo", "system_fingerprint", "finish_reason", "prompt_tokens", "completion_tokens",
              "total_tokens", "request_id"]


def _client(budget=None):
    key = os.environ.get(config.API_KEY_ENV, "")
    return CodeCraftClient(key, budget=budget)


def _run_dir():
    stamp = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = os.path.join(config.RESULTS_DIR, stamp)
    os.makedirs(path, exist_ok=True)
    return path


def _write(path, text, secret):
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(redact(text, secret))


def _model_ids(parsed):
    if isinstance(parsed, dict) and isinstance(parsed.get("data"), list):
        return [m.get("id") for m in parsed["data"] if isinstance(m, dict) and m.get("id")]
    return []


def run_one(client, prompt, rep):
    rec = client.chat(
        prompt.messages, model=prompt.model or config.TARGET_MODEL, max_tokens=prompt.max_tokens,
        temperature=prompt.temperature, tools=prompt.tools, stream=prompt.stream, kind=prompt.id)
    ok, detail = (None, "")
    if prompt.check is not None:
        try:
            ok, detail = prompt.check(rec)
        except Exception as exc:  # um verificador quebrado não deve derrubar a bateria
            ok, detail = False, f"erro no verificador: {type(exc).__name__}"
    parsed = rec.parsed if isinstance(rec.parsed, dict) else {}
    usage = parsed.get("usage") or {}
    return {
        "prompt_id": prompt.id, "category": prompt.category, "rep": rep,
        "status": rec.status, "latency_ms": rec.latency_ms, "ttft_ms": rec.ttft_ms,
        "ok": ok, "detail": detail, "error": rec.error,
        "model_echo": parsed.get("model"), "system_fingerprint": parsed.get("system_fingerprint"),
        "finish_reason": C.finish_reason(parsed), "prompt_tokens": usage.get("prompt_tokens"),
        "completion_tokens": usage.get("completion_tokens"), "total_tokens": usage.get("total_tokens"),
        "request_id": S.request_id(rec.headers), "response_text": C.message_text(parsed),
    }


def cmd_dry_run(args):
    items = P.battery(long_context=args.long_context)
    print(f"Modelo-alvo: {config.TARGET_MODEL}")
    print(f"Endpoint: {config.BASE_URL}")
    print(f"Prompts planejados: {len(items)} (opcionais incluídos: {args.long_context})")
    print(f"Chamadas no pior caso sem retentativas: {P.planned_calls(items)}")
    print(f"Teto rígido: {config.MAX_REQUESTS} requisições, {config.MAX_TOTAL_TOKENS} tokens somados")
    print(f"max_tokens por chamada: {config.MAX_OUTPUT_TOKENS}")
    for p in items:
        print(f"  {p.id:<26} reps={p.repetitions} cat={p.category} {p.description}")


def cmd_probe(args):
    client = _client()
    rec = client.list_models()
    print(f"GET /v1/models: status={rec.status} latência_ms={rec.latency_ms} erro={rec.error}")
    if rec.status is None:
        print(redact(rec.error or "", client.secret))
    ids = _model_ids(rec.parsed)
    print(f"modelos listados: {len(ids)}; alvo listado: {config.TARGET_MODEL in ids}")
    out = _run_dir()
    _write(os.path.join(out, "probe.json"), json.dumps(asdict(rec), ensure_ascii=False, indent=2, default=str),
           client.secret)
    print(f"registro salvo em {out}")


def cmd_run(args):
    run_dir = _run_dir()
    budget = Budget(config.MAX_REQUESTS, config.MAX_TOTAL_TOKENS)
    client = _client(budget)
    items = P.battery(long_context=args.long_context)

    models = client.list_models()
    model_ids = _model_ids(models.parsed)
    rows, stopped = [], None
    if models.status == 200:
        try:
            for prompt in items:
                for rep in range(prompt.repetitions):
                    rows.append(run_one(client, prompt, rep))
        except BudgetExceeded as exc:
            stopped = str(exc)

    summary = S.summarize(rows, client.records, models.status, model_ids, budget)
    summary["run_dir"] = run_dir
    summary["stopped_by_budget"] = stopped
    summary["started_utc"] = dt.datetime.now(dt.timezone.utc).isoformat()

    _write(os.path.join(run_dir, "raw.jsonl"),
           "\n".join(json.dumps(asdict(r), ensure_ascii=False, default=str) for r in client.records) + "\n",
           client.secret)
    _write(os.path.join(run_dir, "results.json"), json.dumps(rows, ensure_ascii=False, indent=2), client.secret)
    _write(os.path.join(run_dir, "summary.json"), json.dumps(summary, ensure_ascii=False, indent=2, default=str),
           client.secret)
    with open(os.path.join(run_dir, "results.csv"), "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=CSV_FIELDS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)

    _publish_report(summary, run_dir, rows, client.secret)
    print(f"execução salva em {run_dir}; chamadas={budget.used_requests} tokens={budget.used_tokens}")


def _publish_report(summary, run_dir, rows, secret):
    text = R.build(summary, run_dir, rows)
    _write(os.path.join(ROOT, "AUDITORIA_CODECRAFT.md"), text, secret)
    _write(os.path.join(run_dir, "AUDITORIA_CODECRAFT.md"), text, secret)
    print(f"relatório: {os.path.join(ROOT, 'AUDITORIA_CODECRAFT.md')}")


def cmd_report(args):
    with open(os.path.join(args.run_dir, "summary.json"), encoding="utf-8") as fh:
        summary = json.load(fh)
    with open(os.path.join(args.run_dir, "results.json"), encoding="utf-8") as fh:
        rows = json.load(fh)
    _publish_report(summary, args.run_dir, rows, os.environ.get(config.API_KEY_ENV))


def main(argv=None):
    parser = argparse.ArgumentParser(prog="codecraft_audit")
    sub = parser.add_subparsers(dest="cmd", required=True)
    p_dry = sub.add_parser("dry-run", help="mostra o plano e o teto de custo, sem rede")
    p_dry.add_argument("--long-context", action="store_true")
    sub.add_parser("probe", help="uma chamada GET /v1/models")
    p_run = sub.add_parser("run", help="executa a bateria completa")
    p_run.add_argument("--long-context", action="store_true", help="inclui teste de contexto longo (custo maior)")
    p_rep = sub.add_parser("report", help="regenera o relatório de uma execução")
    p_rep.add_argument("run_dir")
    args = parser.parse_args(argv)
    handlers = {"dry-run": cmd_dry_run, "probe": cmd_probe, "run": cmd_run, "report": cmd_report}
    try:
        handlers[args.cmd](args)
    except ValueError as exc:  # chave ausente
        print(f"erro: {exc}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
