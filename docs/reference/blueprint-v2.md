# Pro-Orça — Blueprint Completo v2

> Plataforma open-source de projetos e orçamentos de obras com IA assistida por engenheiro.
> Modelo: Open Core — código aberto, cobrança por valor entregue.
> Última atualização: Abril 2026

---

## 0. Visão e Filosofia

**Missão:** Democratizar o acesso a ferramentas de projeto e orçamento de obras, substituindo o custo de múltiplos profissionais especializados por uma plataforma inteligente que é sempre validada por um engenheiro humano.

**Princípios:**
1. **Código aberto** — Transparência gera confiança. Construtoras podem auditar o que usam.
2. **IA propõe, engenheiro decide** — Nenhuma entrega sai sem validação humana.
3. **Preço justo** — Cobrar uma fração do que a empresa gastaria com profissionais equivalentes.
4. **Duas áreas integradas** — Projetos E orçamentos. Quando integrados, um alimenta o outro automaticamente.

---

## 1. Modelo de Negócio: Open Core

### O que é aberto (gratuito)
- Motor de orçamento básico (composições, cálculo de BDI, planilha)
- Integrações com SINAPI e SICRO (download e parsing)
- Parser de documentos básico (Excel, CSV)
- Módulo de HH (hora-homem)
- API pública
- Documentação e comunidade

### O que é pago (premium)
- **Agentes de IA** (leitor de plantas, estimador paramétrico, compositor inteligente, analisador de editais, auditor)
- **Módulos de projeto** (pré-dimensionamento estrutural, compatibilização, projetos complementares assistidos)
- **Banco de obras comparáveis** (acesso ao banco coletivo anonimizado)
- **Portal de cotação** (workflow com fornecedores)
- **Hosting gerenciado** (para quem não quer hospedar)
- **Suporte, implantação e treinamento**

### Precificação: Baseada no Valor Entregue

**Referência de custo dos profissionais que a plataforma substitui/assiste:**

| Profissional | Salário CLT/mês | Custo total empresa/mês* |
|-------------|----------------|-------------------------|
| Engenheiro Orçamentista Pleno | R$ 11.700 | ~R$ 19.000 |
| Engenheiro Orçamentista Sênior | R$ 15.100 | ~R$ 24.500 |
| Engenheiro Projetista | R$ 9.500 | ~R$ 15.400 |
| Projetista Estrutural (PJ/projeto) | R$ 20-50/m² | variável |
| Projetista Hidráulico (PJ/projeto) | R$ 15-40/m² | variável |
| Projetista Elétrico (PJ/projeto) | R$ 15-40/m² | variável |
| Hora técnica referência CREA | R$ 348/hora | — |

*Custo total ≈ 1.6x salário (encargos, benefícios, infraestrutura)

**Uma construtora média gasta R$ 25.000-60.000/mês** com orçamentistas + projetistas terceirizados.

**Modelo de cobrança sugerido:**

| Tier | Público | Preço | Equivale a... |
|------|---------|-------|---------------|
| **Community** | Autônomos, estudantes | Grátis | Core open source |
| **Professional** | Engenheiros PJ, pequenas construtoras | R$ 2.000-5.000/mês | ~20% do custo de 1 orçamentista |
| **Business** | Construtoras médias (5-50 obras/ano) | R$ 8.000-15.000/mês | ~50% do custo de um orçamentista + projetistas |
| **Enterprise** | Grandes construtoras | Sob medida | Fração do time que substituem |

**Alternativa — cobrança por projeto:**

| Tipo de obra | Preço por projeto | Profissionais equivalentes |
|-------------|-------------------|---------------------------|
| Residência unifamiliar (até 300m²) | R$ 3.000-8.000 | Orçamentista + projetistas |
| Edifício residencial (5.000-20.000m²) | R$ 25.000-80.000 | Time de 3-5 profissionais |
| Hospital (como o da MHA) | R$ 50.000-150.000 | Time multidisciplinar de 5-8 profissionais |
| Infraestrutura viária | R$ 30.000-100.000 | Orçamentista SICRO + projetista rodoviário |

*Esses valores representam 30-50% do que se gastaria com os profissionais diretamente.*

---

## 2. As Duas Áreas Integradas

### Área 1 — PROJETOS (Assistidos por IA, Validados por Engenheiro)

#### 2.1.1 Projeto Arquitetônico Assistido
- Geração de layouts a partir de programa de necessidades
- Estudo de viabilidade (coeficiente de aproveitamento, recuos, gabarito)
- Quadro de áreas automático
- IA sugere distribuição de ambientes baseada em tipologias similares
- **Engenheiro/Arquiteto valida e refina**

#### 2.1.2 Projeto Estrutural
- Pré-dimensionamento de vigas, pilares e lajes a partir do modelo arquitetônico
- Cálculo de cargas (permanentes, acidentais, vento)
- Memória de cálculo assistida
- Detalhamento de armaduras (para estruturas simples)
- **Engenheiro estrutural valida, assina ART**

#### 2.1.3 Projeto Hidrossanitário
- Traçado automático de tubulações (água fria, quente, esgoto, águas pluviais)
- Dimensionamento de tubulações e reservatórios
- Lista de materiais e conexões
- **Engenheiro hidráulico valida, assina ART**

#### 2.1.4 Projeto Elétrico
- Distribuição de pontos (tomadas, iluminação, interruptores)
- Dimensionamento de circuitos e disjuntores
- Quadro de cargas
- Diagrama unifilar
- **Engenheiro eletricista valida, assina ART**

#### 2.1.5 Projeto de HVAC (Climatização)
- Cálculo de carga térmica
- Dimensionamento de equipamentos
- Layout de distribuição de dutos/tubulações
- **Engenheiro mecânico valida, assina ART**

#### 2.1.6 Projeto de Prevenção e Combate a Incêndio
- Classificação da edificação conforme legislação estadual
- Dimensionamento de hidrantes, sprinklers, extintores
- Rota de fuga e sinalização
- **Engenheiro de segurança valida**

#### 2.1.7 Compatibilização
- Clash detection entre todas as disciplinas
- Relatório de interferências com priorização
- Sugestões automáticas de resolução
- **Coordenador de projetos valida**

### Área 2 — ORÇAMENTOS (7 Cenários — mantém tudo do Blueprint v1)

- A: Orçamento sobre anteprojeto (caso do hospital MHA)
- B: Orçamento analítico com projeto executivo
- C: Orçamento por HH (hora-homem)
- D: Cotação com terceiros (subempreiteiros/fornecedores)
- E: Licitações públicas (SINAPI/SICRO/TCU)
- F: Aditivos e replanilhamento
- G: Obras de infraestrutura/pesada (SICRO)

**O LINK:** Quando o projeto é feito dentro da plataforma, o orçamento se alimenta automaticamente dos quantitativos. Não existe "importar" — os dados já estão lá.

---

## 3. Áreas Adjacentes

### Camada 1 — Extensão natural (conectada ao orçamento)

**3.1 Planejamento de Obras**
- Cronograma físico-financeiro gerado a partir do orçamento
- PERT/CPM, linha de balanço
- Agente sugere sequenciamento baseado em obras similares
- Curva S (previsto vs. realizado)
- Vinculação orçamento ↔ cronograma bidirecional
- **Engenheiro de planejamento valida sequenciamento e prazos**

**3.2 Gestão de Suprimentos/Compras**
- Do orçamento aprovado → lista de materiais → pedidos de compra
- Cotação do módulo de orçamento vira ordem de compra
- Controle de estoque em obra
- Programação de entregas vinculada ao cronograma
- **Gestor de suprimentos/engenheiro valida compras**

**3.3 Medição e Controle de Obras**
- Boletim de medição mensal (executado vs. orçado)
- Medição física e financeira
- Cálculo de avanço percentual por serviço
- Essencial para obras públicas (medição para faturamento)
- Comparativo acumulado (contratado vs. medido vs. saldo)
- **Engenheiro fiscal / gestor de contrato valida medições**

### Camada 2 — Áreas complementares de alto valor

**3.4 Compatibilização de Projetos**
- Clash detection entre disciplinas (mesmo em 2D com IA)
- Relatório de interferências classificado por severidade
- Sugestões de resolução
- **Coordenador de projetos valida**

**3.5 Fiscalização e Diário de Obra**
- Registros diários (clima, equipe, atividades, ocorrências)
- Controle fotográfico georreferenciado
- Verificação de conformidade: fotos da obra vs. projeto
- Checklist de qualidade por serviço
- Agente compara imagens da execução com o projeto
- **Engenheiro fiscal valida registros**

**3.6 Laudos e Perícias Técnicas**
- Laudos de avaliação de imóveis (NBR 14653)
- Inspeção predial
- Perícias judiciais assistidas
- Templates inteligentes com cálculos e referências normativas
- **Engenheiro perito assina e valida**

### Camada 3 — Especialidades regulatórias

**3.7 Segurança do Trabalho (PCMAT/PGR)**
- Gerado a partir do tipo de obra e atividades do cronograma
- Identificação de riscos por fase da obra
- EPIs e EPCs necessários
- **Engenheiro de segurança do trabalho valida**

**3.8 Licenciamento Ambiental**
- Templates para EIA/RIMA, RCA, PCA
- Checklist de exigências por órgão ambiental
- Documentação assistida
- **Engenheiro ambiental valida**

**3.9 Regularização e Aprovação em Órgãos**
- Projeto para aprovação em prefeitura (código de obras municipal)
- Corpo de Bombeiros (PPCI/PSCIP)
- Vigilância Sanitária (para hospitais como o da MHA)
- Checklist automático de exigências por município/estado
- **Engenheiro/Arquiteto responsável valida**

### Camada 4 — Pós-obra

**3.10 As-built e Comissionamento**
- Documentação final da obra como executada
- Testes de sistemas (elétrico, hidráulico, HVAC, incêndio)
- Manual de operação e manutenção
- Entrega formal ao cliente
- **Engenheiro responsável valida e assina**

---

## 4. Fluxo Human-in-the-Loop

### Filosofia: IA Propõe, Engenheiro Decide

A IA é uma assistente poderosa, mas **nunca é a responsável técnica**. A responsabilidade (ART/RRT) é sempre do engenheiro/arquiteto humano.

### Os 3 Estados de Cada Entrega

```
🟡 RASCUNHO IA     → Gerado pela IA, aguardando revisão humana
🔵 EM REVISÃO      → Engenheiro está analisando e ajustando
🟢 VALIDADO        → Engenheiro aprovou e assinou
🔴 REJEITADO       → Engenheiro rejeitou, IA precisa refazer com feedback
```

### Fluxo Detalhado

```
ENTRADA                  PROCESSAMENTO IA              REVISÃO HUMANA              SAÍDA
────────                 ────────────────              ──────────────              ─────
Documentos               Agente processa               Engenheiro revisa           Entrega
(plantas, BIM,     →     e gera resultado    →         na interface,       →       validada
memoriais, editais)      com % de confiança            corrige se preciso          e assinada
                         por item                       
                                                       ┌─ Aprova ──→ 🟢 Validado
                                                       ├─ Corrige ──→ IA aprende + 🟢
                                                       └─ Rejeita ──→ 🔴 IA refaz
```

### Indicadores de Confiança

Cada item gerado pela IA vem com um nível de confiança:

| Nível | Visual | Significado | Ação do engenheiro |
|-------|--------|-------------|-------------------|
| Alta (>90%) | 🟢 | IA tem alta certeza (composição exata encontrada, quantitativo preciso) | Revisão rápida, aprovar |
| Média (70-90%) | 🟡 | IA encontrou match aproximado ou fez estimativa razoável | Verificar com atenção, ajustar se necessário |
| Baixa (<70%) | 🔴 | IA não tem certeza (anteprojeto sem detalhe, serviço incomum) | Obrigatório revisar, complementar dados |

### Exemplos Concretos

**Caso 1: Hospital com anteprojeto (MHA)**
1. Upload do anteprojeto PDF → Agente Leitor extrai: área total 8.500m², 6 pavimentos, programa de necessidades
2. Agente Estimador Paramétrico: "Hospitais similares: R$ 4.800-6.200/m². Estimativa: R$ 47M ± 12%"
   - Estrutura: 🟡 28% (R$ 13.2M) — baseado em hospitais similares
   - Instalações: 🔴 35% (R$ 16.5M) — alta incerteza, hospital tem complexidade especial
   - Acabamentos: 🟡 22% (R$ 10.3M)
3. Engenheira da MPD revisa: "Instalações de gases medicinais estão subesti­madas. Ajusto para R$ 18M"
4. Sistema registra a correção e aprende: hospitais com gases medicinais têm 15% a mais em instalações
5. Orçamento sai como 🟢 Validado, com carimbo "Validado por [Nome], CREA-XX nº XXXX"

**Caso 2: Projeto estrutural de edifício residencial**
1. Modelo BIM importado → Agente extrai geometria
2. Agente de Pré-dimensionamento:
   - Pilares térreo: 30x60cm (🟢 alta confiança — dentro das tabelas de pré-dimensionamento)
   - Vigas do 3º pav: 20x50cm (🟡 média — vão grande, precisa confirmar)
   - Laje cobertura: h=12cm (🔴 baixa — sobrecarga de equipamentos não informada)
3. Engenheiro estrutural: aprova pilares, confirma vigas, corrige laje para h=15cm (reservatório superior)
4. Memória de cálculo gerada, validada, ART emitida

**Caso 3: Cotação para serviço de fundações**
1. Orçamento definiu: estacas hélice contínua Ø40cm, 850 metros
2. Agente de Cotação envia escopo para 5 empresas cadastradas
3. Recebe propostas → normaliza:
   - Empresa A: R$ 185/m (🟢 dentro da faixa)
   - Empresa B: R$ 142/m (🔴 alerta: muito abaixo — pode ter escopo incompleto)
   - Empresa C: R$ 198/m (🟡 acima da média mas inclui mobilização)
4. Engenheiro revisa: "Empresa B não incluiu concreto de preenchimento. Custo real seria ~R$ 190/m. Aprovar Empresa A."

### Assinatura e Rastreabilidade

Toda validação é registrada com:
- Nome do profissional
- Número do CREA/CAU
- Data e hora
- IP e dispositivo
- Hash do documento no momento da validação
- Comentários/justificativas do engenheiro

Isso cria uma trilha de auditoria completa — essencial para obras públicas, licitações e eventuais disputas.

---

## 5. Agentes de IA — Versão Expandida (Projetos + Orçamentos)

### Agentes de Projeto

| Agente | Input | Output | Disciplina |
|--------|-------|--------|-----------|
| Gerador de Layout | Programa de necessidades + terreno | Estudo preliminar de implantação e plantas | Arquitetura |
| Pré-dimensionador Estrutural | Modelo arquitetônico + cargas | Seções de vigas, pilares, lajes + memória | Estrutura |
| Traçador Hidrossanitário | Planta baixa + pontos de consumo | Layout de tubulações + dimensionamento | Hidráulica |
| Dimensionador Elétrico | Planta baixa + cargas | Circuitos, quadro de cargas, diagrama unifilar | Elétrica |
| Calculador de Carga Térmica | Planta + orientação + uso | Carga térmica por ambiente + equipamentos | HVAC |
| Classificador de Incêndio | Tipo + área + altura + ocupação | Classificação + sistemas necessários | Incêndio |
| Detector de Clash | Modelos de todas disciplinas | Relatório de interferências | Compatibilização |

### Agentes de Orçamento (mantém os 7 do Blueprint v1)

| Agente | Função |
|--------|--------|
| Leitor de Plantas | Vision AI para extrair quantitativos de PDFs |
| Quantitativos BIM | Parser IFC para extrair volumes, áreas, quantidades |
| Estimador Paramétrico | Orçamento rápido para anteprojetos |
| Compositor de Custos | Match de serviços com composições SINAPI/SICRO |
| Analisador de Editais | Leitura de editais e configuração de regras |
| Cotação Inteligente | Normalização de propostas de fornecedores |
| Revisor / Auditor | Verificação de inconsistências antes de enviar |

### Agentes de Áreas Adjacentes

| Agente | Área | Função |
|--------|------|--------|
| Planejador | Planejamento | Gera cronograma a partir do orçamento |
| Medidor | Controle | Processa boletins de medição |
| Fiscal Visual | Fiscalização | Compara fotos da obra com projeto |
| Gerador de PCMAT | Segurança | Gera programa de segurança a partir do cronograma |
| Checklist Regulatório | Aprovação | Verifica exigências por município/órgão |

---

## 6. Tipos de Documentos — Matriz Completa

### Documentos de Entrada (que o sistema recebe e processa)

| Documento | Formatos | Agente responsável | Área |
|-----------|----------|-------------------|------|
| Plantas baixas e cortes | PDF, DWG, DXF | Leitor de Plantas | Projeto/Orçamento |
| Modelo BIM | IFC, RVT | Quantitativos BIM | Projeto/Orçamento |
| Memorial descritivo | PDF, DOCX | NLP / Compositor | Projeto/Orçamento |
| Edital de licitação | PDF | Analisador de Editais | Orçamento |
| Planilhas existentes | XLSX, CSV | Parser estruturado | Orçamento |
| Propostas de fornecedores | PDF, XLSX, email | Cotação Inteligente | Orçamento |
| Cronograma | XLSX, MPP | Planejador | Planejamento |
| Sondagem / laudo de solo | PDF | Estimador Paramétrico | Projeto estrutural |
| Fotos de campo | JPG, PNG | Fiscal Visual | Fiscalização |
| Legislação municipal | PDF | Checklist Regulatório | Aprovação |
| Tabelas SINAPI/SICRO | XLSX | Parser automático | Orçamento |
| CUB regional | Web scraping | Estimador Paramétrico | Orçamento |

### Documentos de Saída (que o sistema gera)

| Documento | Formato | Área |
|-----------|---------|------|
| Orçamento analítico | PDF, XLSX | Orçamento |
| Orçamento paramétrico | PDF, XLSX | Orçamento |
| Curva ABC (insumos, serviços, mão de obra) | PDF, XLSX | Orçamento |
| Proposta comercial | PDF | Orçamento |
| Cronograma físico-financeiro | PDF, XLSX, MPP | Planejamento |
| Boletim de medição | PDF, XLSX | Controle |
| Mapa de cotação | PDF, XLSX | Orçamento |
| Memória de cálculo (estrutural, etc.) | PDF | Projeto |
| Projeto com dimensionamento | DWG, PDF | Projeto |
| Relatório de compatibilização | PDF | Projeto |
| PCMAT / PGR | PDF, DOCX | Segurança |
| Diário de obra | PDF | Fiscalização |
| Laudo técnico | PDF | Perícia |
| Planilha para edital (formato TCU) | XLSX | Licitação |
| Comparativo de aditivo | PDF, XLSX | Aditivos |

---

## 7. Modelo de Dados Expandido

```
PLATAFORMA (multi-tenant)
│
├── Empresa (tenant)
│   ├── Usuários (admin, engenheiro, orçamentista, viewer)
│   │   └── Credenciais profissionais (CREA, CAU, número, validade)
│   ├── Bases de Preço Próprias
│   ├── Banco de Fornecedores
│   ├── Histórico de Obras (alimenta banco comparável)
│   └── Configurações (BDI padrão, encargos, regiões)
│
├── Projeto / Obra
│   ├── Dados: nome, tipo, localização, cliente, área, padrão
│   ├── Status: estudo | anteprojeto | executivo | em obra | concluído
│   │
│   ├── PROJETOS (disciplinas)
│   │   ├── Arquitetônico
│   │   ├── Estrutural
│   │   ├── Hidrossanitário
│   │   ├── Elétrico
│   │   ├── HVAC
│   │   ├── Incêndio
│   │   └── Cada um com: arquivos, versões, status de validação
│   │
│   ├── ORÇAMENTOS (versionados)
│   │   ├── Tipo: paramétrico | analítico | HH | híbrido
│   │   ├── Base de preços + data-base
│   │   ├── BDI configurado
│   │   ├── Itens (com confiança: alta/média/baixa)
│   │   ├── Cotações vinculadas
│   │   └── Status de validação por engenheiro
│   │
│   ├── PLANEJAMENTO
│   │   ├── Cronograma (vinculado ao orçamento)
│   │   ├── Curva S
│   │   └── Linha de balanço
│   │
│   ├── CONTROLE DE OBRA
│   │   ├── Medições mensais
│   │   ├── Diário de obra
│   │   └── Acompanhamento fotográfico
│   │
│   ├── SUPRIMENTOS
│   │   ├── Pedidos de compra (gerados do orçamento)
│   │   ├── Entregas programadas
│   │   └── Controle de estoque
│   │
│   └── DOCUMENTAÇÃO REGULATÓRIA
│       ├── PCMAT / PGR
│       ├── Licenças ambientais
│       ├── Aprovações (prefeitura, bombeiros)
│       └── ARTs / RRTs emitidas
│
└── BANCO COLETIVO (anonimizado, opt-in)
    ├── Obras comparáveis (tipologia, área, custo/m², região)
    ├── Indicadores de mercado
    └── Composições validadas pela comunidade
```

---

## 8. Integrações

### Essenciais (MVP)
- **SINAPI / SICRO** — download e parsing mensal automático
- **CUB** — web scraping dos SINDUSCONs
- **Email** — envio/recebimento de cotações
- **PDF/DWG/IFC** — parsers de documentos

### Fase 2
- **ERPs** — Sienge, UAU, TOTVS (troca de dados)
- **WhatsApp Business API** — cotações e notificações
- **Portais de licitação** — ComprasNet, BLL
- **CREA Online** — verificação de habilitação profissional

### Fase 3
- **Revit / ArchiCAD** — plugin direto (além de IFC)
- **Power BI / Metabase** — dashboards customizados
- **Marketplaces** — conexão com fornecedores de materiais
- **Certificação digital** — assinatura eletrônica de ARTs/documentos

---

## 9. Stack Tecnológico

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Frontend | Next.js + React + Tailwind | SSR, performance, ecossistema |
| Backend API | Python (FastAPI) | Melhor ecossistema para IA e engenharia |
| Banco de dados | PostgreSQL + pgvector | Relacional + busca vetorial |
| Fila | Redis + Celery | Processamento assíncrono de documentos |
| Storage | S3 / Cloudflare R2 | Armazenamento de arquivos |
| IA Vision | Claude Vision / GPT-4V | Leitura de plantas e documentos |
| IA NLP | Claude / GPT-4 + fine-tuning | Análise, composição, revisão |
| IA BIM | IfcOpenShell (Python) | Parser IFC open source |
| IA Estrutural | OpenSees + modelos custom | Cálculo estrutural assistido |
| Hosting | Self-hosted ou Cloud (opção do cliente) | Open core = flexibilidade |
| Auth | Keycloak (open source) | Multi-tenant, SSO, coerente com modelo aberto |

---

## 10. Roadmap Atualizado

### Fase 1 — MVP Interno na MPD (Meses 1-3)
- Core de orçamento: SINAPI, composições, BDI
- Import de planilhas Excel
- Cálculo de HH básico
- Geração de planilha e curva ABC
- Fluxo de validação humana (3 estados)
- Teste com 2-3 obras reais da MPD

### Fase 2 — Projetos + Orçamento Integrado (Meses 4-8)
- Agente Leitor de Plantas (PDF → quantitativos)
- Agente Estimador Paramétrico (anteprojetos)
- Módulo de cotação com fornecedores
- Módulo de licitações (formatação TCU)
- Pré-dimensionamento estrutural assistido
- Módulo de aditivos e versionamento
- Publicação do core no GitHub (open source)

### Fase 3 — Áreas Adjacentes + Primeiros Clientes (Meses 9-14)
- Planejamento de obras (cronograma vinculado)
- Medição e controle
- Compatibilização de projetos
- Projetos complementares (hidráulica, elétrica)
- Banco de obras comparáveis
- 10-20 clientes piloto pagantes

### Fase 4 — Escala + Ecossistema (Ano 2+)
- Fiscalização e diário de obra com IA visual
- Gestão de suprimentos
- Segurança do trabalho (PCMAT)
- Regularização / aprovação em órgãos
- Marketplace de fornecedores
- Comunidade open source ativa
- Expansão LATAM

---

## 11. Proposta de Valor por Persona

| Persona | Dor | Como o Pro-Orça resolve | Economia |
|---------|-----|------------------------|----------|
| **Engenheira orçamentista (como a da MPD)** | Gasta semanas em orçamentos manuais, risco de erro | IA faz 70% do trabalho, ela valida e refina | 60-80% do tempo |
| **Dono de construtora PME** | Paga caro por projetistas + orçamentistas terceirizados | Plataforma substitui parte dos terceirizados | 30-50% do custo |
| **Engenheiro autônomo** | Ferramentas caras, trabalha com Excel | Core gratuito, paga só pelos agentes de IA que usar | Acesso a ferramentas premium por fração do preço |
| **Empresa de projetos (como MHA)** | Projetos demoram, retrabalho com compatibilização | IA assiste pré-dimensionamento, clash detection automático | 40-60% do tempo de projeto |
| **Órgão público** | Edital exige formatação rígida, risco de sobrepreço | Conformidade automática, verificação de preços | Redução de risco legal |

---

*Blueprint v2 — Atualizado em Abril 2026*
*Modelo: Open Core | IA + Engenheiro | Projetos + Orçamentos + Adjacentes*
