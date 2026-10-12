"""Coleção de prompts da bateria.

Cada item tem categoria (A raciocínio/código, B comportamento, C capacidades,
D alegações documentais), prompt idêntico em todas as repetições e um verificador objetivo.
Prompts de custo maior (contexto longo) são opcionais e só rodam com --long-context.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from . import checks as C
from . import config

SLUGIFY_REFERENCE = '''import re
import unicodedata

def slugify(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")
'''

BUGGY_SECOND_LARGEST = "def second_largest(xs):\n    return sorted(xs)[-2]\n"

WEATHER_TOOL = {
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "Obtém a previsão do tempo atual para uma cidade",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {"type": "string"},
                "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},
            },
            "required": ["city", "unit"],
        },
    },
}


@dataclass(frozen=True)
class Prompt:
    id: str
    category: str
    description: str
    messages: list
    check: object = None
    repetitions: int = 1
    tools: list | None = None
    stream: bool = False
    temperature: float | None = None
    model: str | None = None
    max_tokens: int = config.MAX_OUTPUT_TOKENS
    optional: bool = False


def _user(text):
    return [{"role": "user", "content": text}]


def battery(long_context=False):
    items = [
        # A. Raciocínio e programação -----------------------------------------
        Prompt(
            "A-logic-count", "A", "Contagem com inclusão-exclusão (resposta única verificável)",
            _user("Quantos inteiros de 1 a 1000 são divisíveis por 3 ou por 5, mas não por 15? "
                  "Faça o cálculo e termine com o número final sozinho na última linha."),
            C.check_last_int(401), repetitions=3),
        Prompt(
            "A-logic-house", "A", "Problema lógico inédito com solução única",
            _user("Ana, Bruno e Carla têm, cada um, uma profissão diferente: médica, engenheira e advogada. "
                  "Ana não é médica. Bruno não é engenheiro. A engenheira é mais velha que Carla. "
                  "Carla é mais velha que a advogada. Quem é a médica? Responda apenas com o primeiro nome."),
            C.check_exact_word("carla"), repetitions=3),
        Prompt(
            "A-debug-second-largest", "A", "Depuração: corrigir função e validar com asserts executados",
            _user("Este código deveria retornar o segundo maior VALOR DISTINTO de uma lista, ou None se não "
                  "existir, mas falha quando há repetições. Corrija-o mantendo o nome da função. "
                  "Responda somente com o código Python final em um bloco ```python.\n\n" + BUGGY_SECOND_LARGEST),
            C.check_code_asserts([
                "assert second_largest([5, 5, 3]) == 3",
                "assert second_largest([1, 2, 3]) == 2",
                "assert second_largest([7, 7]) is None",
                "assert second_largest([1]) is None",
                "assert second_largest([-1, -5, -1, -2]) == -2",
            ])),
        Prompt(
            "A-testgen-slugify", "A", "Geração de testes unitários executados contra referência",
            _user("Escreva testes unitários com funções test_* usando apenas assert e a biblioteca padrão "
                  "(sem pytest) para a função slugify já existente no módulo. Cubra acentos, espaços repetidos, "
                  "pontuação nas pontas e string vazia. Responda somente com o código dos testes em um bloco "
                  "```python, sem reimplementar slugify.\n\nassinatura: def slugify(s: str) -> str"),
            C.check_test_suite(SLUGIFY_REFERENCE)),
        # C. Capacidades --------------------------------------------------------
        Prompt(
            "C-tool-weather", "C", "Chamada de ferramenta: nome e argumentos válidos",
            _user("Qual a previsão do tempo em Recife, em celsius? Use a ferramenta disponível."),
            C.check_tool_call("get_weather", {
                "city": lambda v: "recife" in str(v).lower(),
                "unit": lambda v: str(v).lower() in ("celsius", "c"),
            }), tools=[WEATHER_TOOL]),
        Prompt(
            "C-json-struct", "C", "JSON estruturado com campos e tipos verificáveis",
            _user('Maria tem 31 anos. Retorne somente um objeto JSON válido com as chaves "nome" (string) '
                  'e "idade" (inteiro), sem texto adicional.'),
            C.check_json_fields({"nome": "Maria", "idade": 31})),
        Prompt(
            "C-instruction-format", "C", "Seguimento de instrução de formato restrito",
            _user("Responda exatamente com três palavras separadas por vírgula, sem pontuação final, "
                  "sem explicação: frutas vermelhas."),
            C.check_three_words),
        Prompt(
            "C-stream-count", "C", "Streaming SSE: eventos, término [DONE] e conteúdo",
            _user("Conte de 1 a 5, separando os números por espaço, sem mais nada."),
            C.check_stream, stream=True),
        Prompt(
            "C-error-model", "C", "Tratamento de erro: identificador inexistente deve gerar erro estruturado",
            _user("Diga olá."), C.check_error_shape, model="modelo-inexistente-codecraft-audit"),
        # B. Comportamento ----------------------------------------------------
        Prompt(
            "B-ambiguity", "B", "Ambiguidade: observacional (pedir esclarecimento ou declarar premissas)",
            _user("Qual é o melhor?"), C.observe_clarification),
        Prompt(
            "B-consistency-mutex", "B", "Consistência entre execuções em temperatura zero",
            _user("Explique em uma frase o que é um mutex."), None, repetitions=3, temperature=0.0),
        # D. Alegações documentais (platform.claude.com, consultado em 2026-10-12)
        Prompt(
            "D-claim-temp-0.0", "D", "Doc: temperature não padrão retorna 400 em Mythos Preview",
            _user("Responda apenas: ok."), C.check_status(400), temperature=0.0),
        Prompt(
            "D-claim-temp-0.7", "D", "Doc: temperature 0.7 retorna 400 em Mythos Preview",
            _user("Responda apenas: ok."), C.check_status(400), temperature=0.7),
        Prompt(
            "D-claim-temp-1.0", "D", "Doc: temperature 1.0 (padrão) é aceito",
            _user("Responda apenas: ok."), C.check_status(200), temperature=1.0),
    ]
    if long_context:
        needle = "O código secreto é 7391-XK."
        filler = " ".join(f"Linha de preenchimento número {i} sem informação relevante." for i in range(1500))
        items.append(Prompt(
            "C-long-context", "C", "Contexto longo: recuperação de agulha (opcional, custo maior)",
            _user(filler[: len(filler) // 2] + "\n" + needle + "\n" + filler[len(filler) // 2:]
                  + "\n\nQual é o código secreto? Responda somente com o código."),
            C.check_contains("7391-XK"), max_tokens=64, optional=True))
    return items


def planned_calls(items):
    """Pior caso sem retentativas: uma chamada por repetição, mais a listagem de modelos."""
    return 1 + sum(p.repetitions for p in items)
