"""Verificadores determinísticos.

Cada verificador recebe um CallRecord e devolve (ok, detalhe).
ok é True/False, ou None quando o teste é apenas observacional (não entra nas taxas de sucesso).
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import tempfile

from .client import CallRecord


# --- extração de campos (nunca assume que existem) ---------------------------

def message_text(parsed):
    try:
        content = parsed["choices"][0]["message"]["content"]
    except (TypeError, KeyError, IndexError):
        return None
    return content if isinstance(content, str) else None


def tool_calls(parsed):
    try:
        return parsed["choices"][0]["message"].get("tool_calls") or []
    except (TypeError, KeyError, IndexError, AttributeError):
        return []


def finish_reason(parsed):
    try:
        return parsed["choices"][0].get("finish_reason")
    except (TypeError, KeyError, IndexError, AttributeError):
        return None


def code_block(text):
    match = re.search(r"```[A-Za-z]*\s*\n(.*?)```", text, re.S)
    return match.group(1) if match else text


def strip_fences(text):
    return code_block(text).strip() if "```" in text else text.strip()


def last_integer(text):
    numbers = re.findall(r"-?\d+", text or "")
    return int(numbers[-1]) if numbers else None


def parse_sse(lines):
    """Retorna (texto_acumulado, viu_DONE, numero_de_eventos_de_dados)."""
    text, done, events = "", False, 0
    for line in lines or []:
        if not line.startswith("data:"):
            continue
        payload = line[5:].strip()
        if payload == "[DONE]":
            done = True
            continue
        try:
            obj = json.loads(payload)
        except ValueError:
            continue
        events += 1
        try:
            text += obj["choices"][0].get("delta", {}).get("content") or ""
        except (KeyError, IndexError, TypeError, AttributeError):
            pass
    return text, done, events


# --- execução local de código gerado (somente em ambiente descartável) --------

def _exec_check(code, timeout=10):
    with tempfile.TemporaryDirectory() as workdir:
        path = os.path.join(workdir, "candidate.py")
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(code)
        try:
            proc = subprocess.run([sys.executable, "-I", path], cwd=workdir,
                                  capture_output=True, text=True, timeout=timeout)
        except subprocess.TimeoutExpired:
            return False, "timeout"
    lines = (proc.stdout + proc.stderr).strip().splitlines()
    tail = lines[-1][:200] if lines else f"rc={proc.returncode}"
    return proc.returncode == 0, tail


# --- fábricas de verificadores ------------------------------------------------

def check_last_int(expected):
    def run(rec: CallRecord):
        got = last_integer(message_text(rec.parsed))
        return got == expected, f"esperado={expected} obtido={got}"
    return run


def check_exact_word(expected):
    def run(rec: CallRecord):
        text = (message_text(rec.parsed) or "").strip().strip(".").strip().lower()
        return text == expected, f"obtido={text[:60]!r}"
    return run


def check_code_asserts(asserts):
    def run(rec: CallRecord):
        text = message_text(rec.parsed)
        if not text:
            return False, "sem texto na resposta"
        return _exec_check(code_block(text) + "\n" + "\n".join(asserts) + "\nprint('OK')\n")
    return run


def check_test_suite(reference_code):
    """Executa os test_* gerados contra a implementação de referência."""
    runner = (
        "\nimport sys\n_ran = 0\n_failed = 0\n"
        "for _name, _fn in list(globals().items()):\n"
        "    if _name.startswith('test_') and callable(_fn):\n"
        "        _ran += 1\n"
        "        try:\n            _fn()\n"
        "        except Exception:\n            _failed += 1\n"
        "print('RAN', _ran, 'FAILED', _failed)\n"
        "sys.exit(0 if _ran and not _failed else 1)\n"
    )

    def run(rec: CallRecord):
        text = message_text(rec.parsed)
        if not text:
            return False, "sem texto na resposta"
        return _exec_check(reference_code + "\n" + code_block(text) + runner)
    return run


def check_tool_call(name, required_args):
    def run(rec: CallRecord):
        calls = tool_calls(rec.parsed)
        if not calls:
            return False, "sem tool_calls"
        fn = calls[0].get("function", {})
        if fn.get("name") != name:
            return False, f"nome={fn.get('name')!r}"
        try:
            args = json.loads(fn.get("arguments") or "{}")
        except ValueError:
            return False, "argumentos não são JSON válido"
        for key, predicate in required_args.items():
            if key not in args or not predicate(args[key]):
                return False, f"argumento inválido {key}={args.get(key)!r}"
        return True, "ok"
    return run


def check_json_fields(expected):
    def run(rec: CallRecord):
        text = strip_fences(message_text(rec.parsed) or "")
        try:
            data = json.loads(text)
        except ValueError:
            return False, "JSON inválido"
        if not isinstance(data, dict):
            return False, "JSON não é objeto"
        bad = {k: data.get(k) for k, v in expected.items() if data.get(k) != v}
        return not bad, ("ok" if not bad else f"divergências={bad}")
    return run


def check_three_words(rec: CallRecord):
    text = (message_text(rec.parsed) or "").strip()
    return bool(re.fullmatch(r"\w+, \w+, \w+", text)), repr(text[:80])


def check_stream(rec: CallRecord):
    text, done, events = parse_sse(rec.stream_lines)
    ok = "1 2 3 4 5" in re.sub(r"\s+", " ", text) and done
    return ok, f"eventos={events} done={done} texto={text[:60]!r}"


def check_status(expected):
    def run(rec: CallRecord):
        return rec.status == expected, f"status={rec.status} esperado={expected}"
    return run


def check_error_shape(rec: CallRecord):
    ok = rec.status is not None and rec.status >= 400 and isinstance(rec.parsed, dict) and "error" in rec.parsed
    return ok, f"status={rec.status} corpo_com_error={isinstance(rec.parsed, dict) and 'error' in rec.parsed}"


def check_contains(needle):
    def run(rec: CallRecord):
        text = message_text(rec.parsed) or ""
        return needle in text, f"procurado={needle!r}"
    return run


def observe_clarification(rec: CallRecord):
    """Observacional: a resposta pede esclarecimento ou declara premissas?"""
    text = message_text(rec.parsed) or ""
    asks = bool(re.search(r"(esclar|preciso saber|qual .* voc|sobre o que|assum|depende|contexto)", text, re.I))
    return None, f"pede_esclarecimento_ou_premissas={asks} tamanho={len(text)}"
