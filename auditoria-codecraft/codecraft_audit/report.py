"""Gera AUDITORIA_CODECRAFT.md a partir do resumo de uma execução.

A classificação é derivada por regras explícitas (classify). A categoria
"Identidade verificada" não é alcançável por código: não há mecanismo
independente de proveniência disponível a partir da API.
"""
from __future__ import annotations

import datetime as dt

from . import config

DOC_EVIDENCE = [
    ("Existência e status do identificador",
     "https://platform.claude.com/docs/en/about-claude/model-deprecations (consultado em 2026-10-12, via WebFetch)",
     "Tabela de status lista `claude-mythos-preview` como **Deprecated**, com data de descontinuação "
     "9 de junho de 2026 e retirada 'To be announced'. Listam-se como Active `claude-mythos-5` e `claude-mythos-5-1`. "
     "A mesma página diz que, para Claude Mythos Preview, `temperature`, `top_p` e `top_k` com valor não padrão "
     "retornam erro 400."),
    ("Lista oficial de modelos",
     "https://platform.claude.com/docs/en/about-claude/models/overview (consultado em 2026-10-12, via WebFetch)",
     "A tabela de comparação lista Fable 5.1, Opus 5.5, Sonnet 5.5 e Haiku 5.5. 'Claude Mythos 5.1' aparece "
     "apenas numa nota de preço de cache. `claude-mythos-preview` não aparece na tabela. Observação: um resultado "
     "de busca afirmou que a página lista o identificador; isso não foi confirmado no conteúdo obtido."),
    ("Restrição de acesso (Project Glasswing)",
     "https://www.anthropic.com/glasswing (trecho de resultado de busca, não aberto diretamente)",
     "Mythos Preview foi apresentado como modelo de acesso restrito a parceiros selecionados, sem disponibilidade geral "
     "na época do anúncio. Há relatos de disponibilidade geral futura, não confirmados por fonte oficial aberta."),
    ("Provedores autorizados",
     "https://aws.amazon.com/about-aws/whats-new/2026/04/amazon-bedrock-claude-mythos (trecho de busca)",
     "Amazon Bedrock anunciou Mythos Preview como 'Gated Research Preview'. Não há menção a CodeCraft em nenhuma fonte encontrada."),
    ("Preço de referência",
     "Fontes de terceiros (cloudprice.net e outras), não oficiais",
     "Fontes divergentes: uma indica $25/$125 por milhão de tokens (entrada/saída); outra indica $10/$50. Não usado como prova."),
    ("CodeCraft: identidade, autorização e documentação",
     "https://codecraftapi.com (bloqueado pela política de egress do ambiente, HTTP 403 no CONNECT); busca web",
     "Nenhum documento, termo de parceria ou declaração de autorização do CodeCraft foi obtido. Busca web não retornou "
     "nenhuma referência ao serviço."),
]

CONFIDENCE = {
    "Existência do identificador como modelo Anthropic": "Alta (documentação oficial, uma fonte primária aberta)",
    "Status 'Deprecated' de claude-mythos-preview": "Média-alta (página oficial via resumo de WebFetch; confirmar no original)",
    "Autorização do CodeCraft": "Não avaliável: nenhuma evidência obtida",
    "Comportamento da API": "Não avaliável: API inacessível a partir do ambiente",
}


def classify(s):
    """Retorna (rótulo, justificativa) segundo regras explícitas."""
    if not s.get("api_reachable"):
        return ("Inconclusivo",
                f"GET /v1/models não retornou HTTP 200 (status={s.get('models_status')}). "
                "Nenhuma inferência sobre o modelo servido é possível.")
    if s["contradictions"]:
        return ("Inconsistência confirmada", "; ".join(s["contradictions"]))
    if s["chat_ok"] == 0:
        return ("Inconclusivo", "Nenhuma chamada de chat retornou resultado verificável.")
    return ("Compatível, mas não verificado",
            "Os testes executados não contradizem o modelo anunciado. Sem mecanismo independente de proveniência, "
            "a origem permanece não verificada. Nenhuma comparação com modelo de referência foi executada, "
            "portanto 'Substituição suspeita' não pode ser afirmada.")


def _fmt(v, suffix=""):
    return "n/d" if v is None else f"{v}{suffix}"


def build(s, run_dir, rows):
    label, why = classify(s)
    now = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    out = []
    w = out.append

    w("# Auditoria CodeCraft API: relatório")
    w("")
    w(f"Gerado em {now}. Modelo-alvo: `{config.TARGET_MODEL}`. Endpoint: `{config.BASE_URL}`.")
    w(f"Execução: `{run_dir or 'nenhuma'}`. A chave de API não aparece neste relatório.")
    w("")

    w("## 1. Resumo executivo")
    w("")
    w(f"**Conclusão: {label}.** {why}")
    w("")
    if not s.get("api_reachable"):
        w("A auditoria de API **não foi executada**. O ambiente de execução bloqueou o host "
          f"`codecraftapi.com:443` (HTTP 403 no CONNECT, política de egress). Os resultados de API abaixo "
          "estão vazios por esse motivo, não por ausência de problema no serviço. Esta conclusão é "
          "exclusivamente documental e não substitui a bateria.")
        w("")

    w("## 2. Evidências documentais")
    w("")
    w("| Tema | Fonte | Achado |")
    w("|---|---|---|")
    for topic, src, finding in DOC_EVIDENCE:
        w(f"| {topic} | {src} | {finding} |")
    w("")
    w("**Fatos comprovados (fontes oficiais):** o identificador `claude-mythos-preview` existe na documentação "
      "oficial de descontinuação, com status Deprecated, e a documentação oficial descreve restrições de "
      "temperature para esse modelo.")
    w("")
    w("**Alegações não comprovadas:** qualquer afirmação de que o CodeCraft tem autorização, roteia para a Anthropic "
      "ou serve o modelo original. Nenhuma fonte independente foi encontrada.")
    w("")
    w("**Pontos que dependem de confirmação:** preço e disponibilidade de terceiros, e a divergência entre "
      "fontes sobre a presença do identificador na tabela oficial de modelos.")
    w("")

    w("## 3. Resultados dos testes de API")
    w("")
    w(f"- GET /v1/models: status={_fmt(s.get('models_status'))}; modelos listados={len(s.get('model_ids') or [])}; "
      f"alvo listado={s.get('target_listed')}.")
    w(f"- Chamadas de chat registradas: {s.get('chat_calls', 0)}; com sucesso verificado: {s.get('chat_ok', 0)}.")
    w(f"- Requisições totais (incluindo retentativas): {s.get('calls_total', 0)}; tokens somados: {s.get('tokens_total', 0)}.")
    w(f"- Códigos HTTP observados: {s.get('signals', {}).get('http_statuses') or 'nenhum'}.")
    w(f"- Streaming (SSE) funcionou: {_fmt(s.get('signals', {}).get('stream_ok'))}.")
    w(f"- Chamada de ferramenta válida: {s.get('tool_valid', {}).get('ok', 0)}/{s.get('tool_valid', {}).get('n', 0)}.")
    w(f"- Identificadores de requisição recebidos: {s.get('signals', {}).get('request_ids_seen', 0)}.")
    w(f"- Fingerprints recebidos: {s.get('signals', {}).get('system_fingerprints') or 'nenhum'} "
      "(controlados pelo fornecedor; não são prova).")
    w("")

    w("## 4. Resultados dos benchmarks")
    w("")
    if s.get("per_category"):
        w("| Categoria | n | acertos | taxa | IC 95% (Wilson) |")
        w("|---|---|---|---|---|")
        for cat, d in s["per_category"].items():
            ci = d["ci95"]
            ci_txt = "n/d" if ci[0] is None else f"[{ci[0]}, {ci[1]}]"
            w(f"| {cat} | {d['n']} | {d['ok']} | {_fmt(d['rate'])} | {ci_txt} |")
        w("")
        lat = s.get("latency_ms", {})
        w(f"- Latência (ms): mediana={_fmt(lat.get('median'))}, p90={_fmt(lat.get('p90'))}, "
          f"p95={_fmt(lat.get('p95'))}, média={_fmt(lat.get('mean'))}, IC95 bootstrap da média={lat.get('mean_ci95')}.")
        c = s.get("consistency", {})
        w(f"- Consistência (mutex, temperatura 0): {c.get('n_responses', 0)} respostas; "
          f"similaridade média entre pares={_fmt(c.get('mean_pair_similarity'))}; "
          f"contagens de tokens de prompt distintas={c.get('distinct_prompt_token_counts')}.")
        w("- Nota: com 1 a 3 repetições por prompt, os intervalos são largos e não permitem diferenciar modelos.")
    else:
        w("Nenhum benchmark foi executado com dados da API.")
    w("")
    w("**Comparação com modelos de referência (categoria D do plano):** não executada. "
      "Não há credenciais autorizadas para Claude oficial, Qwen ou DeepSeek neste ambiente.")
    w("")

    w("## 5. Possíveis sinais de substituição")
    w("")
    sig = s.get("signals", {})
    if sig.get("model_echo_mismatch"):
        w("- Campo `model` diferente do solicitado:")
        for e in sig["model_echo_mismatch"]:
            w(f"  - {e['prompt_id']} rep {e['rep']}: `{e['model_echo']}`")
    else:
        w("- Nenhum campo `model` divergente foi observado (ou nenhum dado foi coletado).")
    w("- Uma resposta que ecoa o nome correto não é prova de identidade; é apenas uma alegação do próprio serviço.")
    w("")

    w("## 6. Inconsistências identificadas")
    w("")
    if s.get("contradictions"):
        for item in s["contradictions"]:
            w(f"- {item}")
    else:
        w("- Nenhuma inconsistência reproduzível foi observada. Isso só vale para os dados coletados.")
    w("- Divergência documental: fontes de terceiros divergem sobre o preço e a presença do identificador "
      "na tabela oficial (ver seção 2).")
    w("")

    w("## 7. Limitações metodológicas")
    w("")
    w("- **Acesso bloqueado:** o host do serviço foi recusado pela política de rede do ambiente. Nenhuma chamada "
      "autenticada foi feita, e a chave não foi usada.")
    w("- **Amostras pequenas:** 1 a 3 repetições por prompt. Não há base estatística para julgar identidade.")
    w("- **Sem referência:** nenhum modelo oficial foi executado com os mesmos prompts, então não há comparação.")
    w("- **Sem prova de proveniência:** headers, nomes de modelo e fingerprints são controlados pelo fornecedor.")
    w("- **Fontes:** páginas oficiais foram lidas por WebFetch (resumo gerado por modelo); buscas web são trechos. "
      "Ambas devem ser conferidas nos originais.")
    w("- **Execução de código gerado:** os testes de código rodam localmente em subprocesso isolado, com timeout. "
      "Devem ser executados apenas em ambiente descartável.")
    w("")

    w("## 8. Hipóteses alternativas")
    w("")
    w("- O serviço pode usar um modelo diferente sem alterar o nome (substituição silenciosa). Testes de API "
      "não resolveriam isso sem referência e sem proveniência.")
    w("- O serviço pode usar um gateway legítimo da Anthropic (ex.: via parceiro) com nome de modelo idêntico. "
      "Isso é compatível com o que os testes mostrarão, sem ser prova.")
    w("- O serviço pode ser legítimo e estar indisponível para este ambiente por política de rede, sem relação "
      "com a qualidade do modelo.")
    w("- O identificador pode estar em transição (Deprecated), então um serviço pode manter o nome por "
      "inércia de configuração.")
    w("")

    w("## 9. Nível de confiança de cada conclusão")
    w("")
    w("| Conclusão | Confiança |")
    w("|---|---|")
    for k, v in CONFIDENCE.items():
        w(f"| {k} | {v} |")
    w(f"| Classificação final: {label} | {'Alta' if label == 'Inconclusivo' else 'Baixa a média'} |")
    w("")

    w("## 10. Recomendações para verificações adicionais")
    w("")
    w("1. Liberar `codecraftapi.com:443` na política de rede do ambiente (configurações de rede do ambiente de nuvem) "
      "e reexecutar `python -m codecraft_audit.runner probe` antes de qualquer bateria.")
    w("2. Solicitar ao CodeCraft documentação de roteamento, contrato de parceria ou certificado de autorização "
      "da Anthropic, e verificar essas evidências diretamente com a Anthropic.")
    w("3. Testar a alegação documental de temperature (categoria D) antes de tudo; é o teste de menor custo "
      "com resultado previsto pela documentação oficial.")
    w("4. Para comparação, obter credenciais autorizadas da API oficial da Anthropic e, se aplicável, de Qwen e "
      "DeepSeek, e executar a mesma bateria com o mesmo orçamento.")
    w("5. Rotacionar a chave CodeCraft, já que ela foi colada em texto de conversa durante esta auditoria.")
    w("")
    return "\n".join(out)
