"""Configuração central da auditoria.

Todos os limites de custo e de volume ficam aqui, para que a execução
respeite o orçamento autorizado independentemente do código de teste.
"""
import os

BASE_URL = os.environ.get("CODECRAFT_BASE_URL", "https://codecraftapi.com/v1").rstrip("/")
API_KEY_ENV = "CODECRAFT_API_KEY"
TARGET_MODEL = "claude-mythos-preview"

TIMEOUT_S = 90
MAX_RETRIES = 2                 # apenas para erros de rede, 429 e 5xx
BACKOFF_S = (2, 4)
RETRY_STATUS = {429, 500, 502, 503, 504}

# Orçamento: teto rígido por execução. Cada tentativa (inclusive retentativas) conta.
MAX_REQUESTS = 60
MAX_TOTAL_TOKENS = 60_000
MAX_OUTPUT_TOKENS = 512         # max_tokens padrão nos testes curtos

RESULTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "results")
