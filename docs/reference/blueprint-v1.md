# Pro-Orça — Blueprint Completo do Produto B2B

> Documento de referência para desenvolvimento da plataforma de automação de orçamentos de obras.
> Última atualização: Abril 2026

---

## 1. Cenários de Orçamento Suportados

A plataforma deve cobrir **7 cenários distintos** que representam a realidade das construtoras, escritórios de engenharia e órgãos públicos no Brasil.

### Cenário A — Orçamento sobre Anteprojeto

**Quando:** O projeto executivo ainda não existe. Uma empresa de projetos (ex: MHA) entrega um estudo preliminar/anteprojeto.

**Características:**
- Plantas básicas com áreas estimadas e especificações genéricas
- Alta incerteza — muitas variáveis ainda abertas
- Orçamento com base em parâmetros (custo/m², CUB, índices históricos)
- Precisa de margem de contingência declarada

**O que o Pro-Orça faz:**
- Aceita o anteprojeto (PDF, DWG) e extrai o que for possível (áreas, tipologia)
- Usa o Agente Estimador Paramétrico para cruzar com banco de obras similares
- Gera orçamento híbrido: itens paramétricos + itens já detalhados
- Mostra faixa de confiança (ex: "R$ 45M a R$ 52M com 80% de confiança")
- Conforme o projeto evolui, permite substituir itens paramétricos por analíticos

### Cenário B — Orçamento Analítico com Projeto Executivo

**Quando:** O projeto completo está disponível com todas as disciplinas (arquitetura, estrutura, hidráulica, elétrica, HVAC, etc.).

**Características:**
- Levantamento de quantitativos detalhado, item a item
- Composição de custos unitários completa
- Planilha orçamentária analítica com memória de cálculo
- Maior precisão (margem de erro de 5-10%)

**O que o Pro-Orça faz:**
- Importa modelos BIM (IFC/RVT) ou plantas PDF/DWG
- Agente de Quantitativos extrai volumes, áreas, comprimentos automaticamente
- Agente Compositor de Custos monta composições com SINAPI/SICRO/bases próprias
- Gera planilha completa, curva ABC e cronograma físico-financeiro

### Cenário C — Orçamento por HH (Hora-Homem)

**Quando:** Obras industriais, manutenção, paradas de planta, serviços especializados.

**Características:**
- Custo = quantidade de profissionais × horas × valor/hora por categoria
- Categorias: soldador, eletricista, encanador, instrumentista, caldeireiro, etc.
- Considera turnos, periculosidade, insalubridade, mobilização
- Materiais e equipamentos orçados separadamente

**O que o Pro-Orça faz:**
- Módulo de Calculadora HH com cadastro de categorias e encargos
- Cálculo automático de equipes por escopo de serviço
- Templates de produtividade por tipo de serviço industrial
- Separação clara: custo de mão de obra HH + materiais + equipamentos

### Cenário D — Cotação com Terceiros (Subempreiteiros/Fornecedores)

**Quando:** A construtora não executa todos os serviços internamente.

**Características:**
- Envio de escopos/cadernos técnicos a empresas especializadas
- Recebimento de propostas em formatos variados (PDF, Excel, email)
- Mapa de cotação comparativo
- Negociação e escolha

**O que o Pro-Orça faz:**
- Portal de cotação para fornecedores (preenchem planilha padronizada online)
- Agente de Cotação normaliza propostas recebidas por email/PDF
- Mapa de cotação automático com comparativo preço × escopo
- Alertas para valores fora da curva de mercado
- Integração do preço vencedor direto na planilha do orçamento

### Cenário E — Licitações Públicas

**Quando:** Obras financiadas com recursos públicos (federal, estadual, municipal).

**Características:**
- Uso obrigatório de SINAPI (construção civil) ou SICRO (infraestrutura) para verba federal
- BDI regulado pelo TCU (referência: Acórdão 2622/2013)
- Formatação específica: planilha analítica, curva ABC, cronograma
- Critérios de julgamento: menor preço, técnica e preço
- Penalidades por sobrepreço ou superfaturamento

**O que o Pro-Orça faz:**
- Agente Analisador de Editais lê o PDF e extrai regras automaticamente
- Configuração automática: base de preços, fórmula de BDI, formato de saída
- Verificação contra preços de referência (alerta de sobrepreço)
- Geração de toda a documentação exigida pelo edital
- Exportação no formato exigido

### Cenário F — Aditivos e Replanilhamento

**Quando:** Obra em andamento com alterações de escopo, preços ou quantitativos.

**Características:**
- Manter desconto global contratado (exigência legal)
- Justificativa técnica para cada alteração
- Comparativo: contratado vs. aditado
- Limite legal: aditivos de até 25% (ou 50% para reformas)

**O que o Pro-Orça faz:**
- Versiona o orçamento original (nunca altera a base contratada)
- Gera planilha comparativa automática (antes × depois)
- Recalcula desconto global automaticamente
- Gera memória justificativa
- Rastreabilidade completa: quem alterou, quando, por quê

### Cenário G — Obras de Infraestrutura/Pesada

**Quando:** Rodovias, pontes, saneamento, barragens, portos.

**Características:**
- Usa SICRO ao invés de SINAPI
- Composições com equipamentos pesados (produtividade por hora)
- DMT (Distância Média de Transporte) como variável-chave
- Volumes de terra movimentados, concreto estrutural em larga escala

**O que o Pro-Orça faz:**
- Módulo SICRO completo com composições de equipamentos e produtividades
- Calculadora de DMT integrada
- Composições de terraplanagem, pavimentação, drenagem
- Suporte a planilhas do DNIT

---

## 2. Módulos da Plataforma

### Módulo 1 — Importação Inteligente de Documentos

| Formato | Uso | Processamento |
|---------|-----|---------------|
| PDF (plantas 2D) | Plantas baixas, cortes, elevações | Vision AI + OCR → extração de áreas, cotas, ambientes |
| DWG/DXF | Projetos AutoCAD | Parser de layers → quantitativos geométricos |
| IFC | Modelo BIM aberto | Traversal do modelo → quantitativos completos |
| RVT | Modelo Revit | Conversão → IFC ou API direta |
| XLSX | Planilhas de orçamento, SINAPI, cotações | Parsing estruturado → importação de dados |
| DOCX/PDF | Memoriais descritivos, editais | NLP → extração de especificações e regras |
| JPG/PNG | Fotos de campo, croquis | Vision AI → levantamento estimado |
| MPP/XLSX | Cronogramas | Parser → sequenciamento de atividades |

### Módulo 2 — Motor de Quantitativos

**Para projeto executivo (BIM/DWG):**
- Extração automática por disciplina (arquitetura, estrutura, instalações)
- Geração de lista de serviços com quantidades
- Vinculação automática a composições (matching inteligente)

**Para anteprojeto (paramétrico):**
- Cálculo por indicadores: custo/m², custo/leito (hospitais), custo/vaga (estacionamentos)
- Banco de obras comparáveis com filtros (tipologia, região, padrão, área)
- Faixas de confiança baseadas em distribuição estatística

**Para HH:**
- Cálculo de equipes: tipo de serviço → composição de equipe → horas necessárias
- Fatores de produtividade por região e condição de trabalho

### Módulo 3 — Banco de Composições e Preços

- **SINAPI**: Atualização mensal automática (download + parsing)
  - Composições analíticas e sintéticas
  - Preços de insumos por estado (medianos e não desonerados / desonerados)
- **SICRO**: Para obras de infraestrutura
  - Composições de equipamentos com produtividade
  - Custos horários produtivos e improdutivos
- **TCPO**: Referência Pini (se licenciado)
- **Bases próprias**: Cada empresa cria e mantém suas composições
  - Composições customizadas com seus coeficientes reais
  - Preços negociados com fornecedores habituais
- **Histórico**: Preços praticados em obras anteriores da empresa

### Módulo 4 — Calculadora de HH

- Cadastro de categorias profissionais com valor/hora
- Encargos sociais e trabalhistas por categoria
- Adicional de periculosidade, insalubridade, hora extra, turno noturno
- Mobilização e desmobilização de equipes
- Templates de equipe-tipo por serviço (ex: "Montagem de tubulação 6" = 1 encanador + 1 ajudante + 0.5 soldador × 8h")

### Módulo 5 — Gestor de Cotações

- Criação de cadernos de escopo a partir de itens do orçamento
- Portal do fornecedor (link para preenchimento padronizado)
- Recebimento de propostas por email com parsing automático (Agente de Cotação)
- Mapa de cotação com comparativo:
  - Preço unitário por item
  - Preço global
  - Condições de pagamento
  - Prazo de execução
- Alertas: preço muito alto, muito baixo (risco), itens faltantes
- Aprovação e integração ao orçamento com um clique

### Módulo 6 — Gerador de BDI

**Para obras privadas:**
- BDI livre com componentes customizáveis
- Templates por tipo de obra

**Para obras públicas (TCU):**
- Fórmula padrão: BDI = [(1+AC+S+R+G) × (1+DF) × (1+L) / (1-I)] - 1
- Componentes: Administração Central, Seguro, Riscos, Garantias, Despesas Financeiras, Lucro, Impostos
- Faixas de referência do TCU por tipo de obra
- Discriminação obrigatória de cada componente

### Módulo 7 — Proposta Comercial e Relatórios

- Planilha orçamentária analítica ou resumida
- Curva ABC: de insumos, de serviços, de mão de obra
- Cronograma físico-financeiro (vinculado ao orçamento)
- Memória de cálculo
- Proposta comercial formatada (capa, escopo, preço, condições, validade)
- Exportação: PDF, Excel, formato de edital
- Templates personalizáveis por empresa

### Módulo 8 — Aditivos e Controle de Versões

- Versionamento completo de cada orçamento
- Comparativo lado a lado (original vs. revisão)
- Recálculo automático de desconto global
- Geração de justificativa técnica
- Audit trail: quem, quando, o quê, por quê
- Limites de aditivo com alertas (25% / 50%)

---

## 3. Agentes de IA

### 3.1 Agente Leitor de Plantas (Vision AI)

**Input:** PDF de plantas baixas, cortes, elevações
**Output:** Dados estruturados (áreas por ambiente, cotas, especificações)

**Tecnologia:** Computer Vision (modelos tipo GPT-4V, Claude Vision) + OCR especializado
**Capacidades:**
- Identificar ambientes e suas áreas
- Ler quadro de áreas e legendas
- Extrair cotas e dimensões
- Reconhecer hachuras (tipos de piso, revestimento)
- Interpretar símbolos (pontos elétricos, hidráulicos)

### 3.2 Agente de Quantitativos BIM

**Input:** Arquivos IFC ou RVT
**Output:** Lista completa de quantitativos por disciplina

**Tecnologia:** Parser IFC (IfcOpenShell / xBIM) + lógica de engenharia
**Capacidades:**
- Percorrer modelo 3D e extrair: volumes de concreto, áreas de forma, peso de aço, metros de tubulação, quantidade de pontos elétricos, áreas de revestimento, etc.
- Classificar automaticamente por disciplina (estrutura, hidráulica, elétrica, HVAC)
- Gerar planilha de quantitativos organizada
- Referência: ferramentas como Civils.ai e Togal.AI extraem 150-800 itens automaticamente

### 3.3 Agente Estimador Paramétrico

**Input:** Tipologia da obra, área, localização, padrão de acabamento
**Output:** Estimativa orçamentária com faixa de confiança

**Tecnologia:** ML sobre banco de obras históricas + indicadores públicos (CUB, SINAPI)
**Capacidades:**
- Buscar obras comparáveis no banco de dados
- Calcular custo/m² ajustado por: tipo de obra, região, padrão, complexidade
- Para hospitais: custo/leito, custo/m² por setor (UTI, centro cirúrgico, internação)
- Para escolas: custo/aluno, custo/m² por bloco
- Gerar breakdown por disciplina (estrutura X%, instalações Y%, acabamentos Z%)
- Mostrar faixa de confiança estatística

### 3.4 Agente Compositor de Custos

**Input:** Lista de serviços com quantidades
**Output:** Composições de custo unitário vinculadas

**Tecnologia:** NLP + matching semântico contra banco de composições
**Capacidades:**
- Receber descrição do serviço (ex: "alvenaria de bloco cerâmico 14cm com argamassa")
- Buscar composição mais adequada em SINAPI, SICRO, TCPO, base própria
- Ajustar coeficientes de produtividade por condição da obra
- Sugerir composições alternativas quando houver ambiguidade
- Calcular custo unitário com preços atualizados

### 3.5 Agente Analisador de Editais

**Input:** PDF do edital de licitação
**Output:** Regras configuradas no sistema

**Tecnologia:** NLP + extração estruturada de documentos
**Capacidades:**
- Identificar: base de preços obrigatória (SINAPI, SICRO, outra)
- Extrair: data-base de preços, regime de desoneração, critério de julgamento
- Detectar: exigências especiais (certificações, visita técnica, garantias)
- Configurar: formato de planilha, BDI permitido, documentação exigida
- Alertar: prazos, riscos, cláusulas incomuns

### 3.6 Agente de Cotação Inteligente

**Input:** Propostas de fornecedores (PDF, XLSX, email)
**Output:** Dados normalizados para mapa de cotação

**Tecnologia:** NLP + parsing de documentos + email integration
**Capacidades:**
- Ler propostas em formatos variados e extrair preços unitários
- Normalizar para a estrutura do orçamento (matching de itens)
- Identificar condições comerciais (prazo, pagamento, validade)
- Alertar sobre valores fora da média de mercado
- Sugerir fornecedores do banco com base no escopo

### 3.7 Agente Revisor / Auditor

**Input:** Orçamento completo do projeto
**Output:** Relatório de inconsistências e sugestões

**Tecnologia:** Regras de negócio + ML para detecção de anomalias
**Capacidades:**
- Verificar quantitativos vs. projeto (ex: área orçada ≠ área da planta)
- Comparar preços com referências de mercado (sobrepreço / subpreço)
- Identificar itens faltantes comparando com escopo
- Verificar coerência do BDI
- Validar curva ABC (distribuição esperada)
- Checar formatação para licitação
- Gerar relatório com classificação: erro crítico, alerta, sugestão

---

## 4. Modelo de Dados Principal

```
Empresa (tenant B2B)
├── Usuários (com permissões: admin, orçamentista, visualizador)
├── Bases de Preço Próprias
│   └── Composições customizadas
├── Banco de Fornecedores
├── Histórico de Obras (alimenta o estimador paramétrico)
│
└── Projetos / Obras
    ├── Dados básicos: nome, tipo, localização, cliente, área
    ├── Documentos importados (plantas, BIM, memoriais)
    │
    └── Orçamentos (versionados)
        ├── Tipo: paramétrico | analítico | HH | híbrido
        ├── Status: rascunho | em cotação | revisão | finalizado | enviado
        ├── Base de preços: SINAPI | SICRO | TCPO | própria | mista
        ├── Data-base de preços
        ├── Configuração de BDI
        │
        ├── Itens do Orçamento
        │   ├── Código, descrição, unidade, quantidade
        │   ├── Composição vinculada (ou preço direto de cotação)
        │   ├── Preço unitário, preço total
        │   ├── Origem: automático (IA) | manual | cotação
        │   └── Confiança: alta | média | baixa (para paramétricos)
        │
        ├── Cotações
        │   ├── Fornecedor, data, validade
        │   ├── Itens cotados com preços
        │   └── Status: solicitada | recebida | aprovada | rejeitada
        │
        ├── Cronograma físico-financeiro
        │
        ├── Relatórios gerados
        │   ├── Planilha orçamentária
        │   ├── Curva ABC
        │   ├── Proposta comercial
        │   └── Memória de cálculo
        │
        └── Histórico de versões (audit trail)
            ├── Versão, data, autor
            ├── Tipo: criação | edição | aditivo | replanilhamento
            └── Detalhes da alteração
```

---

## 5. Integrações

### Bases de Preço Oficiais
- **SINAPI (CAIXA/IBGE)**: Download mensal automático, parsing de planilhas Excel
- **SICRO (DNIT)**: Download e parsing de composições de infraestrutura
- **CUB (SINDUSCONs)**: Web scraping ou API dos sindicatos estaduais
- **Índices**: INCC, IGPM, IPCA para reajustes contratuais

### Softwares de Projeto
- **Revit/ArchiCAD**: Via IFC (formato aberto) — prioridade para MVP
- **AutoCAD**: Leitura de DWG/DXF para extração de geometrias
- **SketchUp**: Importação via IFC para projetos mais simples

### ERPs de Construção
- **Sienge**: API para troca de orçamentos, medições, pedidos de compra
- **UAU/TOTVS**: Integração via arquivo ou API
- **Mega Construção**: Exportação de dados compatível

### Comunicação
- **Email**: Envio/recebimento de cotações, parsing de propostas anexas
- **WhatsApp Business API**: Notificações e envio de escopos para cotação
- **Portal do Fornecedor**: Interface web para preenchimento de propostas

### Licitações
- **ComprasNet/Gov.br**: Monitoramento de editais por palavras-chave
- **BLL/Licitanet**: Download automático de documentos de edital
- **Portal de Transparência**: Consulta de preços praticados em contratos públicos

---

## 6. Funcionalidades Diferenciais

### 6.1 Orçamento Híbrido Inteligente
No cenário do hospital com anteprojeto da MHA, o sistema permite que parte do orçamento seja paramétrica e parte analítica no mesmo projeto. Conforme o projeto evolui e mais detalhes são definidos, os itens paramétricos são substituídos por analíticos — e o sistema mostra em tempo real como o orçamento vai convergindo (reduzindo a faixa de incerteza).

### 6.2 Banco de Obras Comparáveis
Cada orçamento finalizado alimenta um banco de dados anonimizado (se o cliente permitir). Quando alguém começa um hospital novo, o sistema mostra: "Hospitais de 5.000-10.000m² na região Sudeste, padrão médio, custaram entre R$ 4.200 e R$ 5.800/m², com distribuição: estrutura 25%, instalações 30%, acabamentos 20%, infraestrutura 10%, outros 15%".

### 6.3 Cotação Digitalizada
Portal onde fornecedores recebem um link, veem o escopo detalhado, e preenchem seus preços numa planilha padronizada online. Elimina o vai-e-vem de emails e a necessidade de normalizar propostas em formatos diferentes.

### 6.4 Alertas de Inconsistência
O Agente Revisor verifica automaticamente antes de enviar qualquer proposta:
- "Área de piso orçada: 500m² — Área na planta: 480m²"
- "Preço de cimento 30% acima da mediana SINAPI"
- "Impermeabilização de cobertura não encontrada no orçamento"
- "BDI de 32% acima da faixa de referência do TCU para este tipo de obra"

### 6.5 Versionamento com Rastreabilidade Total
Toda mudança é registrada: quem alterou, quando, por quê. Funcionalidade crítica para aditivos em obras públicas, onde o TCU pode auditar a qualquer momento. Diff visual entre versões, como um "git diff" para orçamentos.

### 6.6 Templates por Tipologia
Templates prontos para acelerar: hospital, escola, residencial, comercial, industrial, infraestrutura viária, saneamento. Cada template já vem com a estrutura de itens típica e composições sugeridas.

---

## 7. Roadmap de Desenvolvimento

### Fase 1 — MVP Interno na MPD (Meses 1-3)
- Orçamento analítico básico com SINAPI
- Import de planilhas Excel existentes
- Cálculo de BDI automático
- Geração de planilha e curva ABC
- 1-2 obras reais como teste

### Fase 2 — Expansão de Cenários (Meses 4-6)
- Módulo de HH (hora-homem)
- Import de BIM (IFC)
- Gestor de cotações básico
- Módulo de licitações (SINAPI + formatação TCU)
- Dashboard de projetos

### Fase 3 — IA e Automação (Meses 7-12)
- Agente Leitor de Plantas (PDF → quantitativos)
- Agente Estimador Paramétrico (anteprojetos)
- Agente Compositor de Custos (matching inteligente)
- Módulo de aditivos e versionamento
- 5-10 clientes piloto B2B

### Fase 4 — Escala e Diferenciação (Ano 2+)
- Agente Analisador de Editais
- Agente Revisor/Auditor
- Banco de obras comparáveis
- Portal do fornecedor
- SICRO para infraestrutura
- Integrações com ERPs (Sienge, UAU)
- API pública
- Expansão LATAM

---

## 8. Stack Tecnológico Sugerido

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Frontend | Next.js + React + Tailwind | SSR, performance, ecossistema rico |
| Backend API | Node.js (NestJS) ou Python (FastAPI) | FastAPI ideal para integrações com IA |
| Banco de dados | PostgreSQL + pgvector | Relacional + busca vetorial para matching de composições |
| Fila de processamento | Redis + Bull ou Celery | Processamento assíncrono de documentos pesados |
| Storage | S3/R2 (Cloudflare) | Armazenamento de plantas, BIMs, relatórios |
| IA - Vision | GPT-4V / Claude Vision / modelos open source | Leitura de plantas e documentos |
| IA - NLP | Claude / GPT-4 / modelos fine-tuned | Análise de editais, composição, revisão |
| IA - BIM | IfcOpenShell (Python) | Parser de modelos IFC open source |
| Hospedagem | Vercel (front) + Railway/AWS (back) | Escalável, custo acessível no início |
| Auth | Clerk ou Auth0 | Multi-tenant B2B pronto |
| Pagamentos | Stripe | Planos SaaS com trial |

---

## 9. Modelo de Negócio B2B

| Plano | Target | Preço Sugerido | Limites |
|-------|--------|---------------|---------|
| **Starter** (Freemium) | Profissionais autônomos | Grátis | 3 orçamentos/mês, SINAPI básico, 1 usuário |
| **Pro** | Construtoras PME | R$ 497-997/mês | Ilimitado, SINAPI+SICRO, BIM, cotações, 10 usuários |
| **Enterprise** | Grandes construtoras | Sob medida | Tudo + IA avançada + API + bases custom + SSO + SLA |

**Receita adicional:**
- Marketplace de insumos (comissão sobre compras via plataforma)
- Treinamento e consultoria de implantação
- Integrações customizadas com ERPs

---

*Documento gerado como referência para o desenvolvimento do Pro-Orça. Deve ser atualizado conforme o produto evolui.*
