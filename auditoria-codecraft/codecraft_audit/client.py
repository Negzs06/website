"""Cliente HTTP mínimo (somente biblioteca padrão) para a API CodeCraft.

Princípios:
- Nenhum campo retornado (nome do modelo, headers, fingerprint) é tratado como prova.
  Tudo é registrado bruto, com a chave redigida, para análise posterior.
- Toda tentativa consome orçamento, inclusive retentativas.
- A chave nunca é impressa nem gravada: é redigida em todo texto que sai do cliente.
"""
from __future__ import annotations

import http.client
import json
import re
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field

from . import config

KEY_PATTERN = re.compile(r"cc_[A-Za-z0-9]{6,}")
POLICY_DENIAL = re.compile(r"\b40[37]\b")
KEEP_HEADER = re.compile(r"request|req-id|fingerprint|model|route|server|via|cf-ray|date|age|vary|retry|ratelimit|rate-limit|x-", re.I)
DROP_HEADER = re.compile(r"auth|cookie|api-key|token|secret", re.I)


class BudgetExceeded(RuntimeError):
    """Teto de requisições ou de tokens atingido; a execução para."""


def redact(text, secret=None):
    """Remove a chave informada e qualquer padrão de chave CodeCraft de um texto."""
    if not text:
        return text
    if secret:
        text = text.replace(secret, "[REDACTED]")
    return KEY_PATTERN.sub("[REDACTED_KEY]", text)


@dataclass
class Budget:
    max_requests: int = config.MAX_REQUESTS
    max_tokens: int = config.MAX_TOTAL_TOKENS
    used_requests: int = 0
    used_tokens: int = 0

    def reserve(self):
        if self.used_requests >= self.max_requests:
            raise BudgetExceeded(f"limite de requisições atingido ({self.max_requests})")
        if self.used_tokens >= self.max_tokens:
            raise BudgetExceeded(f"limite de tokens atingido ({self.max_tokens})")
        self.used_requests += 1

    def add_usage(self, usage):
        if isinstance(usage, dict):
            self.used_tokens += int(usage.get("total_tokens") or 0)


@dataclass
class CallRecord:
    kind: str
    method: str
    path: str
    status: int | None
    latency_ms: float
    error: str | None = None
    headers: dict = field(default_factory=dict)
    body: str | None = None
    parsed: object | None = None
    stream_lines: list | None = None
    ttft_ms: float | None = None
    attempt: int = 1
    policy_denied: bool = False


class CodeCraftClient:
    def __init__(self, api_key, base_url=config.BASE_URL, budget=None):
        if not api_key:
            raise ValueError(f"defina a variável de ambiente {config.API_KEY_ENV}")
        self._key = api_key
        self.base_url = base_url.rstrip("/")
        self.budget = budget or Budget()
        self.records: list[CallRecord] = []

    @property
    def secret(self):
        """Usado apenas para redação; não deve ser impresso."""
        return self._key

    def _headers(self):
        return {
            "Authorization": f"Bearer {self._key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "codecraft-audit/1.0",
        }

    def _send(self, method, path, body=None, kind="other", stream=False):
        data = json.dumps(body).encode("utf-8") if body is not None else None
        attempt = 0
        while True:
            self.budget.reserve()
            attempt += 1
            req = urllib.request.Request(self.base_url + path, data=data, method=method, headers=self._headers())
            t0 = time.perf_counter()
            try:
                with urllib.request.urlopen(req, timeout=config.TIMEOUT_S) as resp:
                    rec = self._read(resp, resp.status, kind, method, path, t0, stream)
            except urllib.error.HTTPError as exc:
                rec = self._read(exc, exc.code, kind, method, path, t0, False)
            except (urllib.error.URLError, OSError, http.client.HTTPException) as exc:
                elapsed = round((time.perf_counter() - t0) * 1000, 1)
                rec = CallRecord(kind, method, path, None, elapsed,
                                 error=redact(f"{type(exc).__name__}: {exc}", self._key))
                # Negação de política (403/407 no CONNECT) não é transitória: não retentar.
                rec.policy_denied = bool(POLICY_DENIAL.search(str(exc)))
            rec.attempt = attempt
            self.records.append(rec)
            retryable = rec.status in config.RETRY_STATUS or (
                rec.status is None and not rec.policy_denied and attempt <= config.MAX_RETRIES)
            if retryable and attempt <= config.MAX_RETRIES:
                time.sleep(config.BACKOFF_S[min(attempt - 1, len(config.BACKOFF_S) - 1)])
                continue
            return rec

    def _read(self, resp, status, kind, method, path, t0, stream):
        headers = {k: v for k, v in resp.headers.items() if KEEP_HEADER.search(k) and not DROP_HEADER.search(k)}
        lines, ttft, body, parsed = None, None, None, None
        if stream:
            lines = []
            for raw in resp:
                line = raw.decode("utf-8", "replace").rstrip("\r\n")
                if not line:
                    continue
                if ttft is None:
                    ttft = round((time.perf_counter() - t0) * 1000, 1)
                lines.append(line)
                if line.startswith("data:") and "[DONE]" not in line:
                    try:
                        chunk = json.loads(line[5:])
                    except ValueError:
                        continue
                    if isinstance(chunk, dict) and chunk.get("usage"):
                        self.budget.add_usage(chunk["usage"])
            body = "\n".join(lines)
        else:
            body = resp.read().decode("utf-8", "replace")
            try:
                parsed = json.loads(body)
            except ValueError:
                parsed = None
            if isinstance(parsed, dict):
                self.budget.add_usage(parsed.get("usage"))
        latency = round((time.perf_counter() - t0) * 1000, 1)
        error = None if 200 <= status < 300 else f"HTTP {status}"
        return CallRecord(kind, method, path, status, latency, error=error, headers=headers,
                          body=body, parsed=parsed, stream_lines=lines, ttft_ms=ttft)

    # --- endpoints -----------------------------------------------------------

    def list_models(self):
        return self._send("GET", "/models", kind="models")

    def chat(self, messages, *, model=config.TARGET_MODEL, max_tokens=config.MAX_OUTPUT_TOKENS,
             temperature=None, tools=None, tool_choice=None, stream=False, kind="chat"):
        body = {"model": model, "messages": messages, "max_tokens": max_tokens}
        if temperature is not None:
            body["temperature"] = temperature
        if tools:
            body["tools"] = tools
        if tool_choice is not None:
            body["tool_choice"] = tool_choice
        if stream:
            body["stream"] = True
        return self._send("POST", "/chat/completions", body, kind=kind, stream=stream)
