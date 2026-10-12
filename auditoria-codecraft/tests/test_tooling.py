"""Testes da FERRAMENTA de auditoria, contra um servidor HTTP local.

Estes testes validam o código (redação de chave, orçamento, retentativas,
verificadores, estatística, regras de classificação). NÃO são evidência sobre
o serviço CodeCraft e não devem ser citados como resultado da auditoria.
"""
import json
import os
import sys
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
os.environ["NO_PROXY"] = os.environ["no_proxy"] = "127.0.0.1,localhost"

from codecraft_audit import checks as C  # noqa: E402
from codecraft_audit import config  # noqa: E402
from codecraft_audit import prompts as P  # noqa: E402
from codecraft_audit import report as R  # noqa: E402
from codecraft_audit import stats as S  # noqa: E402
from codecraft_audit.client import Budget, BudgetExceeded, CodeCraftClient, redact  # noqa: E402

FAKE_KEY = "cc_TESTKEY123456789"


class MockState:
    fail_next = []          # códigos HTTP a devolver nas próximas chamadas de chat
    chat_bodies = []


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def _json(self, status, obj, headers=None):
        data = json.dumps(obj).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path == "/v1/models":
            return self._json(200, {"data": [{"id": "claude-opus-5-5"}]}, {"X-Request-Id": "req_models"})
        self._json(404, {"error": "not found"})

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
        MockState.chat_bodies.append(body)
        if MockState.fail_next:
            return self._json(MockState.fail_next.pop(0), {"error": "instável"})
        if body.get("model", "").startswith("modelo-inexistente"):
            return self._json(404, {"error": {"message": "modelo não encontrado"}})
        # Ecoa o cabeçalho de autorização de propósito, para testar a redação.
        content = "vazamento " + self.headers.get("Authorization", "")
        self._json(200, {
            "model": body["model"],
            "system_fingerprint": "fp_mock",
            "choices": [{"message": {"role": "assistant", "content": content}, "finish_reason": "stop"}],
            "usage": {"prompt_tokens": 5, "completion_tokens": 2, "total_tokens": 7},
        }, {"X-Request-Id": "req_chat"})


class ClientTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        cls.base = f"http://127.0.0.1:{cls.server.server_address[1]}/v1"
        threading.Thread(target=cls.server.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()

    def setUp(self):
        MockState.fail_next = []
        MockState.chat_bodies = []
        self._backoff = config.BACKOFF_S
        config.BACKOFF_S = (0, 0)

    def tearDown(self):
        config.BACKOFF_S = self._backoff

    def test_redact_removes_key_and_key_pattern(self):
        text = f"Bearer {FAKE_KEY} e outra cc_ABCDEFGH"
        out = redact(text, FAKE_KEY)
        self.assertNotIn(FAKE_KEY, out)
        self.assertNotIn("cc_ABCDEFGH", out)

    def test_models_listing_and_chat_usage(self):
        client = CodeCraftClient(FAKE_KEY, base_url=self.base)
        models = client.list_models()
        self.assertEqual(models.status, 200)
        self.assertEqual(models.headers.get("X-Request-Id"), "req_models")
        rec = client.chat([{"role": "user", "content": "oi"}], model=config.TARGET_MODEL)
        self.assertEqual(rec.status, 200)
        # models não traz usage; apenas o chat soma 7 tokens
        self.assertEqual(client.budget.used_tokens, 7)

    def test_key_never_appears_in_serialized_records(self):
        client = CodeCraftClient(FAKE_KEY, base_url=self.base)
        client.chat([{"role": "user", "content": "oi"}])
        raw = json.dumps([r.__dict__ for r in client.records], default=str)
        # O corpo ecoa a chave; a redação precisa ser aplicada na gravação (runner._write).
        self.assertIn(FAKE_KEY, raw)
        self.assertNotIn(FAKE_KEY, redact(raw, FAKE_KEY))

    def test_retry_on_503_then_success(self):
        MockState.fail_next = [503]
        client = CodeCraftClient(FAKE_KEY, base_url=self.base)
        rec = client.chat([{"role": "user", "content": "oi"}])
        self.assertEqual(rec.status, 200)
        self.assertEqual(rec.attempt, 2)
        self.assertEqual(client.budget.used_requests, 2)

    def test_http_400_is_recorded_not_raised(self):
        client = CodeCraftClient(FAKE_KEY, base_url=self.base)
        rec = client.chat([{"role": "user", "content": "oi"}], model="modelo-inexistente-x")
        self.assertEqual(rec.status, 404)
        self.assertEqual(rec.error, "HTTP 404")
        self.assertIn("error", rec.parsed)

    def test_budget_stops_execution(self):
        client = CodeCraftClient(FAKE_KEY, base_url=self.base, budget=Budget(max_requests=1))
        client.chat([{"role": "user", "content": "a"}])
        with self.assertRaises(BudgetExceeded):
            client.chat([{"role": "user", "content": "b"}])

    def test_missing_key_is_rejected(self):
        with self.assertRaises(ValueError):
            CodeCraftClient("")

    def test_policy_denial_is_not_retried(self):
        from unittest import mock
        import urllib.error
        denied = urllib.error.URLError("Tunnel connection failed: 403 Forbidden")
        with mock.patch("urllib.request.urlopen", side_effect=denied) as opened:
            client = CodeCraftClient(FAKE_KEY, base_url=self.base)
            rec = client.list_models()
        self.assertEqual(opened.call_count, 1)
        self.assertTrue(rec.policy_denied)
        self.assertEqual(client.budget.used_requests, 1)

    def test_connection_error_is_recorded(self):
        client = CodeCraftClient(FAKE_KEY, base_url="http://127.0.0.1:1/v1")
        rec = client.list_models()
        self.assertIsNone(rec.status)
        self.assertIsNotNone(rec.error)
        self.assertNotIn(FAKE_KEY, rec.error)


class CheckTests(unittest.TestCase):
    @staticmethod
    def rec(content=None, tool_calls=None, lines=None, status=200):
        from codecraft_audit.client import CallRecord
        parsed = None
        if content is not None or tool_calls is not None:
            msg = {"role": "assistant", "content": content}
            if tool_calls is not None:
                msg["tool_calls"] = tool_calls
            parsed = {"choices": [{"message": msg, "finish_reason": "stop"}]}
        return CallRecord("k", "POST", "/chat/completions", status, 1.0, parsed=parsed, stream_lines=lines)

    def test_last_integer(self):
        self.assertEqual(C.check_last_int(401)(self.rec("pensando... 401"))[0], True)
        self.assertEqual(C.check_last_int(401)(self.rec("401 e depois 400"))[0], False)

    def test_exact_word(self):
        self.assertTrue(C.check_exact_word("carla")(self.rec("Carla."))[0])

    def test_code_asserts_pass_and_fail(self):
        asserts = ["assert second_largest([5, 5, 3]) == 3", "assert second_largest([7, 7]) is None"]
        good = self.rec("```python\ndef second_largest(xs):\n    d = sorted(set(xs))\n    return d[-2] if len(d) > 1 else None\n```")
        bad = self.rec("```python\ndef second_largest(xs):\n    return sorted(xs)[-2]\n```")
        self.assertTrue(C.check_code_asserts(asserts)(good)[0])
        self.assertFalse(C.check_code_asserts(asserts)(bad)[0])

    def test_test_suite_runs_generated_tests(self):
        ref = P.SLUGIFY_REFERENCE
        good = self.rec("```python\ndef test_basic():\n    assert slugify('Olá Mundo') == 'ola-mundo'\n```")
        none = self.rec("```python\nx = 1\n```")
        self.assertTrue(C.check_test_suite(ref)(good)[0])
        self.assertFalse(C.check_test_suite(ref)(none)[0])

    def test_tool_call_validation(self):
        calls = [{"function": {"name": "get_weather", "arguments": json.dumps({"city": "Recife", "unit": "celsius"})}}]
        check = C.check_tool_call("get_weather", {"city": lambda v: "recife" in v.lower(),
                                                  "unit": lambda v: v in ("celsius", "c")})
        self.assertTrue(check(self.rec(tool_calls=calls))[0])
        self.assertFalse(check(self.rec(content="sem ferramenta"))[0])

    def test_json_fields_with_fences(self):
        r = self.rec('```json\n{"nome": "Maria", "idade": 31}\n```')
        self.assertTrue(C.check_json_fields({"nome": "Maria", "idade": 31})(r)[0])

    def test_three_words(self):
        self.assertTrue(C.check_three_words(self.rec("morango, framboesa, cereja"))[0])
        self.assertFalse(C.check_three_words(self.rec("morango, framboesa, cereja."))[0])

    def test_sse_parsing(self):
        lines = ['data: {"choices":[{"delta":{"content":"1 2 "}}]}',
                 'data: {"choices":[{"delta":{"content":"3 4 5"}}]}', "data: [DONE]"]
        self.assertTrue(C.check_stream(self.rec(lines=lines))[0])
        self.assertFalse(C.check_stream(self.rec(lines=lines[:1]))[0])

    def test_status_and_error_shape(self):
        self.assertTrue(C.check_status(400)(self.rec(status=400))[0])
        self.assertFalse(C.check_status(400)(self.rec(status=200))[0])
        from codecraft_audit.client import CallRecord
        err = CallRecord("k", "POST", "/x", 404, 1.0, parsed={"error": {"message": "x"}})
        self.assertTrue(C.check_error_shape(err)[0])


class StatsAndReportTests(unittest.TestCase):
    def test_wilson_bounds(self):
        lo, hi = S.wilson(0, 10)
        self.assertEqual(lo, 0.0)
        self.assertLess(hi, 0.35)
        lo, hi = S.wilson(10, 10)
        self.assertGreater(lo, 0.65)
        self.assertEqual(hi, 1.0)

    def test_percentile(self):
        self.assertEqual(S.percentile([1, 2, 3, 4], 50), 2.5)
        self.assertIsNone(S.percentile([], 50))

    def test_classify_unreachable_is_inconclusive(self):
        label, _ = R.classify({"api_reachable": False, "models_status": None, "contradictions": [], "chat_ok": 0})
        self.assertEqual(label, "Inconclusivo")

    def test_classify_contradiction(self):
        s = {"api_reachable": True, "models_status": 200, "contradictions": ["x"], "chat_ok": 3}
        self.assertEqual(R.classify(s)[0], "Inconsistência confirmada")

    def test_classify_never_claims_identity_verified(self):
        s = {"api_reachable": True, "models_status": 200, "contradictions": [], "chat_ok": 5}
        label, _ = R.classify(s)
        self.assertEqual(label, "Compatível, mas não verificado")

    def test_battery_is_well_formed(self):
        items = P.battery()
        ids = [p.id for p in items]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertLessEqual(P.planned_calls(items), config.MAX_REQUESTS)
        self.assertTrue(all(p.repetitions >= 1 for p in items))


if __name__ == "__main__":
    unittest.main()
