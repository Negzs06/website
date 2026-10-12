# Auditoria CodeCraft API

Ferramenta reprodutível para investigar se o modelo anunciado como `claude-mythos-preview`
pelo CodeCraft (`https://codecraftapi.com/v1`) corresponde a um modelo Claude verificável.
O resultado consolidado está em [`AUDITORIA_CODECRAFT.md`](AUDITORIA_CODECRAFT.md).

> **Estado atual:** a execução real da API ainda não foi feita. O ambiente de execução
> bloqueia `codecraftapi.com:443` pela política de egress (HTTP 403 no CONNECT). O relatório
> atual é documental e está classificado como **Inconclusivo**.

## Requisitos

- Python 3.10+ (somente biblioteca padrão; nenhuma dependência externa)

## Uso

```bash
cd auditoria-codecraft
export CODECRAFT_API_KEY=...            # nunca grave a chave em arquivo do projeto

python3 -m codecraft_audit.runner dry-run        # plano, teto de custo; sem rede
python3 -m codecraft_audit.runner probe          # uma chamada GET /v1/models
python3 -m codecraft_audit.runner run            # bateria completa (~21 chamadas)
python3 -m codecraft_audit.runner run --long-context   # inclui contexto longo (custo maior)
python3 -m codecraft_audit.runner report results/<RUN>  # regenera o relatório
```

Testes da ferramenta (contra servidor HTTP local, **não são evidência sobre o CodeCraft**):

```bash
python3 -m unittest tests/test_tooling.py
```

## Controles de custo e segurança

- Teto rígido em `codecraft_audit/config.py`: 60 requisições e 60 000 tokens somados por execução.
  Retentativas contam como requisições. A execução para ao atingir o teto.
- `max_tokens` de 512 por chamada, exceto no teste de contexto longo.
- Retentativas apenas para erros transitórios (429, 5xx e falhas de rede). Negações de política
  (403/407) não são retentadas.
- A chave só é lida de `CODECRAFT_API_KEY`. Ela é redigida em todo texto gravado (`raw.jsonl`,
  `results.json`, `summary.json`, relatório). Nenhum header de autorização é registrado.
- Os verificadores de código executam o código gerado pelo modelo em subprocesso isolado
  (`python -I`) com timeout de 10 s. Execute a auditoria somente em ambiente descartável.

## Saídas

Cada execução cria `results/<UTC>/` com:

| Arquivo | Conteúdo |
|---|---|
| `raw.jsonl` | Respostas brutas (uma linha por chamada), com chave redigida |
| `results.json` / `results.csv` | Uma linha por repetição de cada prompt, com verificação e métricas |
| `summary.json` | Taxas com IC 95% (Wilson), latência, consistência, sinais de integridade, contradições |
| `AUDITORIA_CODECRAFT.md` | Relatório com a conclusão classificada por regras explícitas |

## Estrutura

```
codecraft_audit/
  config.py     limites, endpoint, modelo-alvo
  client.py     cliente HTTP (stdlib), orçamento, redação, retentativas
  prompts.py    bateria: categorias A (raciocínio/código), B (comportamento),
                C (capacidades), D (alegações documentais da Anthropic)
  checks.py     verificadores determinísticos (sem julgamento subjetivo)
  stats.py      Wilson, percentis, bootstrap, similaridade, sinais de integridade
  report.py     evidências documentais, classificação e relatório Markdown
  runner.py     CLI
tests/test_tooling.py   testes da ferramenta
results/                execuções (saídas)
```

## O que ainda falta

1. **Acesso à API:** liberar `codecraftapi.com:443` na política de rede do ambiente, depois `probe` e `run`.
2. **Comparação com referência (categoria D do plano):** não implementada. Exige credenciais
   autorizadas da API oficial da Anthropic e, se aplicável, de Qwen e DeepSeek. Sem isso, a
   classificação "Substituição suspeita" não pode ser afirmada pelo código.
3. **Proveniência:** não há mecanismo independente disponível pela API. Por isso o código nunca
   emite "Identidade verificada".
