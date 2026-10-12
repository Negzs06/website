# Auditoria CodeCraft API: relatório

Gerado em 2026-10-12 02:58 UTC. Modelo-alvo: `claude-mythos-preview`. Endpoint: `https://codecraftapi.com/v1`.
Execução: `results/20261012T025321Z`. A chave de API não aparece neste relatório.

## 1. Resumo executivo

**Conclusão: Inconsistência confirmada.** alegação documental contrariada em D-claim-temp-0.0: status=200 esperado=400; alegação documental contrariada em D-claim-temp-0.7: status=200 esperado=400. A contradição é com a documentação oficial; não prova que o modelo servido seja outro.

## 2. Evidências documentais

| Tema | Fonte | Achado |
|---|---|---|
| Existência e status do identificador | https://platform.claude.com/docs/en/about-claude/model-deprecations (consultado em 2026-10-12, via WebFetch) | Tabela de status lista `claude-mythos-preview` como **Deprecated**, com data de descontinuação 9 de junho de 2026 e retirada 'To be announced'. Listam-se como Active `claude-mythos-5` e `claude-mythos-5-1`. A mesma página diz que, para Claude Mythos Preview, `temperature`, `top_p` e `top_k` com valor não padrão retornam erro 400. |
| Lista oficial de modelos | https://platform.claude.com/docs/en/about-claude/models/overview (consultado em 2026-10-12, via WebFetch) | A tabela de comparação lista Fable 5.1, Opus 5.5, Sonnet 5.5 e Haiku 5.5. 'Claude Mythos 5.1' aparece apenas numa nota de preço de cache. `claude-mythos-preview` não aparece na tabela. Observação: um resultado de busca afirmou que a página lista o identificador; isso não foi confirmado no conteúdo obtido. |
| Restrição de acesso (Project Glasswing) | https://www.anthropic.com/glasswing (trecho de resultado de busca, não aberto diretamente) | Mythos Preview foi apresentado como modelo de acesso restrito a parceiros selecionados, sem disponibilidade geral na época do anúncio. Há relatos de disponibilidade geral futura, não confirmados por fonte oficial aberta. |
| Provedores autorizados | https://aws.amazon.com/about-aws/whats-new/2026/04/amazon-bedrock-claude-mythos (trecho de busca) | Amazon Bedrock anunciou Mythos Preview como 'Gated Research Preview'. Não há menção a CodeCraft em nenhuma fonte encontrada. |
| Preço de referência | Fontes de terceiros (cloudprice.net e outras), não oficiais | Fontes divergentes: uma indica $25/$125 por milhão de tokens (entrada/saída); outra indica $10/$50. Não usado como prova. |
| CodeCraft: identidade, autorização e documentação | https://codecraftapi.com (bloqueado pela política de egress do ambiente, HTTP 403 no CONNECT); busca web | Nenhum documento, termo de parceria ou declaração de autorização do CodeCraft foi obtido. Busca web não retornou nenhuma referência ao serviço. |

**Fatos comprovados (fontes oficiais):** o identificador `claude-mythos-preview` existe na documentação oficial de descontinuação, com status Deprecated, e a documentação oficial descreve restrições de temperature para esse modelo.

**Alegações não comprovadas:** qualquer afirmação de que o CodeCraft tem autorização, roteia para a Anthropic ou serve o modelo original. Nenhuma fonte independente foi encontrada.

**Pontos que dependem de confirmação:** preço e disponibilidade de terceiros, e a divergência entre fontes sobre a presença do identificador na tabela oficial de modelos.

## 3. Resultados dos testes de API

- GET /v1/models: status=200; modelos listados=33; alvo listado=True.
- Chamadas de chat registradas: 20; com sucesso verificado: 13.
- Requisições totais (incluindo retentativas): 21; tokens somados: 18041.
- Códigos HTTP observados: [200, 404].
- Streaming (SSE) funcionou: True.
- Chamada de ferramenta válida: 1/1.
- Identificadores de requisição recebidos: 0.
- Fingerprints recebidos: nenhum (controlados pelo fornecedor; não são prova).

## 4. Resultados dos benchmarks

| Categoria | n | acertos | taxa | IC 95% (Wilson) |
|---|---|---|---|---|
| A | 8 | 7 | 0.875 | [0.5291, 0.9776] |
| B | 0 | 0 | n/d | n/d |
| C | 5 | 5 | 1.0 | [0.5655, 1.0] |
| D | 3 | 1 | 0.3333 | [0.0615, 0.7923] |

- Latência (ms): mediana=12733.5, p90=14170.5, p95=14453.5, média=10760.1, IC95 bootstrap da média=[8772.7, 12429.1].
- Consistência (mutex, temperatura 0): 3 respostas; similaridade média entre pares=0.9009; contagens de tokens de prompt distintas=[297].
- Nota: com 1 a 3 repetições por prompt, os intervalos são largos e não permitem diferenciar modelos.

**Comparação com modelos de referência (categoria D do plano):** não executada. Não há credenciais autorizadas para Claude oficial, Qwen ou DeepSeek neste ambiente.

## 5. Possíveis sinais de substituição

- Nenhum campo `model` divergente foi observado (ou nenhum dado foi coletado).
- Uma resposta que ecoa o nome correto não é prova de identidade; é apenas uma alegação do próprio serviço.

## 6. Inconsistências identificadas

- alegação documental contrariada em D-claim-temp-0.0: status=200 esperado=400
- alegação documental contrariada em D-claim-temp-0.7: status=200 esperado=400
- Divergência documental: fontes de terceiros divergem sobre o preço e a presença do identificador na tabela oficial (ver seção 2).
- Reprodução independente das chamadas de temperature: `repro_temperature_20261012T025822Z/repro.json`.

## 7. Limitações metodológicas

- **Chave de API:** lida somente de `CODECRAFT_API_KEY`, usada nas chamadas e nunca gravada. Headers de autorização não são registrados e a chave é redigida em todos os arquivos. Ela foi colada em texto de conversa, por isso deve ser rotacionada.
- **Dados de API limitados:** uma execução completa e duas reproduções, com 1 a 3 repetições por prompt.
- **Categoria B sem pontuação:** os testes de ambiguidade e consistência são observacionais ou não têm verificador objetivo; a consistência é medida só por similaridade de texto.
- **Amostras pequenas:** 1 a 3 repetições por prompt. Não há base estatística para julgar identidade.
- **Sem referência:** nenhum modelo oficial foi executado com os mesmos prompts, então não há comparação.
- **Sem prova de proveniência:** headers, nomes de modelo e fingerprints são controlados pelo fornecedor.
- **Fontes:** páginas oficiais foram lidas por WebFetch (resumo gerado por modelo); buscas web são trechos. Ambas devem ser conferidas nos originais.
- **Execução de código gerado:** os testes de código rodam localmente em subprocesso isolado, com timeout. Devem ser executados apenas em ambiente descartável.

## 8. Hipóteses alternativas

- O serviço pode usar um modelo diferente sem alterar o nome (substituição silenciosa). Testes de API não resolveriam isso sem referência e sem proveniência.
- O serviço pode usar um gateway legítimo da Anthropic (ex.: via parceiro) com nome de modelo idêntico. Isso é compatível com o que os testes mostrarão, sem ser prova.
- O serviço pode ser legítimo e estar indisponível para este ambiente por política de rede, sem relação com a qualidade do modelo.
- O identificador pode estar em transição (Deprecated), então um serviço pode manter o nome por inércia de configuração.

## 9. Nível de confiança de cada conclusão

| Conclusão | Confiança |
|---|---|
| Existência do identificador como modelo Anthropic | Alta (documentação oficial, uma fonte primária aberta) |
| Status 'Deprecated' de claude-mythos-preview | Média-alta (página oficial via resumo de WebFetch; confirmar no original) |
| Autorização do CodeCraft | Não avaliável: nenhuma evidência obtida |
| Comportamento da API | Média: uma execução completa, 20 chamadas de chat; sem referência para comparação |
| Contradição de temperature (categoria D) | Média-alta: observada em 2 chamadas da execução principal e reproduzida em 4 chamadas numa reprodução separada; depende de a alegação documental se aplicar a este serviço |
| Classificação final: Inconsistência confirmada | Média: depende da alegação documental e da proveniência não verificada |

## 10. Recomendações para verificações adicionais

1. Confirmar a alegação de temperature no original da documentação oficial (a análise usou resumo de WebFetch) e verificar se ela vale para o identificador anunciado pelo CodeCraft.
2. Pedir ao CodeCraft documentação de roteamento, contrato de parceria ou comprovação de autorização da Anthropic, e verificar essas evidências diretamente com a Anthropic.
3. Para comparação, obter credenciais autorizadas da API oficial da Anthropic e, se aplicável, de Qwen e DeepSeek, e executar a mesma bateria com o mesmo orçamento.
4. Rever o teste de geração de testes (`A-testgen-slugify`): o modelo importou `slugify` como pacote externo em vez de usar a função do módulo. Isso pode ser falha do modelo ou ambiguidade do prompt.
5. Rotacionar a chave CodeCraft, já que ela foi colada em texto de conversa durante esta auditoria.
