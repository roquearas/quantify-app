# Pro-Orça — God Mode do Orçamentista
## Blueprint de Conhecimento: Orçamentos, Quantitativos, Levantamentos e Oportunidades

> **Para:** Roque (MPD / Pro-Orça)
> **Data:** 16 de abril de 2026
> **Objetivo:** Mapear o universo COMPLETO do engenheiro orçamentista brasileiro — todas as perguntas que passam pela cabeça dele, da construtora e da incorporadora — para transformar cada ponto em feature, agente ou módulo do Pro-Orça. Este documento é a "base mental" do produto.
> **Cobertura:** Todas as tipologias (residencial, comercial, hospitalar, industrial, infraestrutura, reforma), do paramétrico ao executivo, público e privado.

---

## Sumário

1. [Fundamentos do orçamento brasileiro](#1-fundamentos)
2. [Quantitativos, levantamentos e critérios de medição](#2-quantitativos)
3. [God Mode: as 300+ perguntas do engenheiro](#3-god-mode-perguntas)
4. [Visão da construtora / incorporadora](#4-visao-empresa)
5. [Tipologias e benchmarks R$/m²](#5-tipologias)
6. [Serviços complementares e oportunidades](#6-complementares)
7. [Mapa de features e agentes IA do Pro-Orça](#7-mapa-features)
8. [Pontos cegos — o que você pode estar esquecendo](#8-pontos-cegos)
9. [Bibliografia, normas e fontes](#9-bibliografia)

---

<a id="1-fundamentos"></a>
## 1. Fundamentos do orçamento brasileiro

### 1.1 Tipos / graus de orçamento

O mercado brasileiro trabalha com 5 graus de precisão, organizados por disponibilidade de projeto e finalidade. O grau determina a margem de incerteza aceitável e o tempo de elaboração.

| Grau | Nome | Quando usar | Insumo | Margem de erro típica | Base ideal |
|---|---|---|---|---|---|
| 1 | **Estimativa / Paramétrico** | Viabilidade, lançamento, pitch | Área + tipologia + padrão | ±20-30% | CUB/m², histórico próprio |
| 2 | **Expedito / Preliminar** | Anteprojeto, decisão go/no-go | Anteprojeto + quantitativos macro | ±10-15% | CUB + composições macro |
| 3 | **Sumário / Básico** | Projeto básico (Lei 14.133 art. 6º XXV) | Projeto básico completo | ±5-10% | SINAPI/SICRO + cotações |
| 4 | **Executivo / Analítico** | Licitação, contratação, execução | Projeto executivo + especificações | ±2-5% | Composições analíticas CPU |
| 5 | **Reformulado / As-built** | Pós-obra, atualização de base | Medição real | real | Base histórica própria |

**Fontes:** Orçafascio (6 tipos de orçamento), AltoQi Suporte, Mattos (2006).

### 1.2 Bases de preços referenciais no Brasil

O orçamentista brasileiro trabalha com ~7 bases diferentes, cada uma com viés regional, metodológico e jurídico próprio. Saber qual usar — e SABER QUANDO NÃO USAR — é o cerne da competência técnica.

| Base | Órgão | Escopo | Atualização | Observações |
|---|---|---|---|---|
| **SINAPI** | Caixa + IBGE | Edificações e infra básica | Mensal | Obrigatório obras federais (Decreto 7.983/2013). Versões desonerada e não desonerada |
| **SICRO** | DNIT | Infra de transportes (rodovia, ferrovia, OAE) | Mensal-trimestral | Obrigatório DNIT; supervisionado TCU |
| **SBC (CUB)** | SindusCon estaduais | Custo unitário básico por padrão/tipologia | Mensal | Referência para incorporação (NBR 12721) |
| **TCPO** | PINI/Grupo Sienge | Composições + RUP (Ubiraci Souza) | Anual (livro) | Referência técnica privada mais completa |
| **ORSE** | CEHOP Sergipe | Edificações + urbanismo | Mensal | Usada em vários estados do Nordeste |
| **SEDOP** | Gov. Pará | Edificações Norte | Mensal | Usada no Norte |
| **SUDECAP** | PBH - Belo Horizonte | Edificações BH e MG | Mensal | Uso municipal/estadual |
| **EMOP** | Gov. RJ | Edificações RJ | Mensal | Uso municipal/estadual |
| **AGETOP** | Gov. Goiás | Obras estaduais | Mensal | |
| **CPOS** | Gov. São Paulo | Obras estaduais SP | Mensal | Volume alto de composições |

**Decisão prática:**
- **Obra pública federal** → SINAPI (ou SICRO se transporte)
- **Obra pública estadual/municipal** → base estadual se existir, SINAPI como backup
- **Obra privada com financiamento Caixa** → SINAPI (compliance bancário)
- **Obra privada sem vínculo público** → TCPO + cotação direta + base histórica própria
- **Incorporação** → CUB para memória, composições analíticas para custo real

### 1.3 Composição de Custo Unitário (CPU)

**Fórmula clássica:**
```
CPU = (Σ material × consumo) + (Σ mão-de-obra × RUP × salário encargado) + (Σ equipamento × custo/h × tempo) + auxiliares + transporte
```

**Componentes detalhados:**
- **Material:** quantidade × preço unitário × (1 + % perda)
- **Mão-de-obra:** horas × salário base × (1 + encargos sociais)
- **Equipamento:** horas produtivas × custo hora produtiva + horas improdutivas × custo hora improdutiva (fórmula SICRO)
- **Auxiliares:** pregos, arame, fôrma auxiliar, andaime, EPIs
- **Transporte:** horizontal (caminhão até obra) + vertical (elevador cremalheira, grua)

**Pitfall clássico:** esquecer o transporte vertical em edifícios altos. Acima do 15º pavimento, o custo por m³ de concreto pode dobrar por causa de grua + tempo de bomba.

### 1.4 BDI — Benefícios e Despesas Indiretas

**Fórmula consagrada pelo TCU (Acórdão 2622/2013):**
```
BDI = [ ((1+AC+S+R+G) × (1+DF) × (1+L)) / (1 - I) ] - 1
```

Onde:
- **AC:** Administração Central (custo da sede rateado à obra)
- **S:** Seguros
- **R:** Riscos (imprevistos precificados)
- **G:** Garantias (seguro-garantia, performance bond)
- **DF:** Despesas Financeiras (custo de capital de giro)
- **L:** Lucro (margem de remuneração)
- **I:** Impostos sobre receita (ISS + PIS + COFINS + CPRB quando aplicável)

**Faixas de referência do TCU (Acórdão 2622/2013):**

| Tipo de obra | BDI mínimo | BDI médio | BDI máximo |
|---|---|---|---|
| Construção de edifícios | 20,34% | 22,12% | 25,00% |
| Construção de rodovias e ferrovias | 19,60% | 22,97% | 24,23% |
| Obras hidráulicas | 20,21% | 24,18% | 27,86% |
| Fornecimento de materiais/equipamentos (aquisição) | 11,10% | 14,02% | 16,80% |

**Erros clássicos de BDI:**
- **Colocar IRPJ/CSLL dentro do BDI** (proibido pelo TCU — tributos sobre lucro não entram no BDI)
- **Usar BDI paramétrico sem justificar** os componentes em licitação pública
- **Aplicar mesmo BDI para fornecimento e execução** (fornecimento tem BDI menor)
- **Não ajustar BDI para regime tributário** (lucro real vs. presumido vs. CPRB)

### 1.5 Encargos sociais

A tabela SINAPI publica 4 tabelas (A1 a A4) por região, combinando:
- Desonerado x Não desonerado
- Horista x Mensalista

**Valores de referência (SINAPI jan/2025):**

| Regime | Horista | Mensalista |
|---|---|---|
| Não desonerado | 117,37% | 74,19% |
| Desonerado (CPRB 4,5%) | 93,57% | 59,09% |

**Componentes (grupos):**
- **Grupo A:** INSS (20% ou 0% se desonerado), FGTS 8%, SAT/RAT, salário-educação, Sistema S
- **Grupo B:** Repouso remunerado, feriados, férias, 13º, aviso prévio trabalhado
- **Grupo C:** Depósito FGTS rescisão, multa FGTS, aviso prévio indenizado
- **Grupo D:** Incidência A sobre B (duplo cálculo)

**Encargos complementares** (itens NÃO inclusos nos encargos SINAPI, mas obrigatórios):
- Alimentação / vale-refeição
- Transporte / vale-transporte
- EPIs (capacete, luva, óculos, cinto, bota)
- EPCs (guarda-corpo, tela de proteção)
- Ferramentas manuais
- Exames médicos (ASO)
- Seguro de vida em grupo

### 1.6 Curva ABC

Baseada no Princípio de Pareto, estratifica insumos ou serviços pela participação acumulada no custo.

| Classe | % itens | % custo | Tratamento |
|---|---|---|---|
| A | 20% | 80% | Gestão próxima: cotação mínima de 3 fornecedores, SRP, contrato de fornecimento, monitoramento de preço |
| B | 30% | 15% | Gestão média: cotação padrão, estoque planejado |
| C | 50% | 5% | Gestão leve: kit-compra, fornecedor único, reposição automática |

**Uso estratégico:**
- Curva ABC de **insumos** → onde focar cotação e negociação
- Curva ABC de **serviços** → onde focar engenharia de valor
- Curva ABC **temporal** → onde focar planejamento de caixa (desembolso)

### 1.7 Orçamento público — Lei 14.133/2021

**Pontos que todo orçamentista de obra pública precisa dominar:**

- **Art. 6º XXV:** projeto básico é obrigatório para licitação de obra
- **Art. 23:** valor estimado deve usar SINAPI/SICRO (ou base estadual autorizada) + BDI de referência + encargos
- **Orçamento sigiloso** (art. 24): estimativa pode ser sigilosa até abertura de propostas
- **Matriz de riscos** (art. 22 e art. 103): obrigatória em contratações de grande vulto
- **Regimes de execução** (art. 46):
  - Preço unitário
  - Preço global
  - Empreitada integral (EPC)
  - Contratação integrada (projeto + obra)
  - Contratação semi-integrada
  - Fornecimento e prestação de serviço
- **Valores atualizados 2025 (Decreto 12.343/2024):**
  - Dispensa para obras: até R$ 125.451,15
  - Grande vulto: > R$ 250.902.323,87

**Cuidados TCU:**
- Superfaturamento por preços (art. 25 Lei 8.666 / TCU súmula 262)
- Superfaturamento por quantitativos
- Jogo de planilha (preços baixos em itens que vão ser suprimidos, altos no que vai ser aumentado)
- BDI fora da faixa Acórdão 2622/2013 sem justificativa

### 1.8 Cotação e atualização temporal

**Estratégia de cotação:**
- **Mínimo 3 cotações** para itens classe A
- **Cotação nominal** (CMED para medicamentos, tabelas oficiais)
- **Cotação por fabricante** (peças críticas, catálogos)
- **Cotação via marketplace** (Mercado Eletrônico, Nimbi, Linkana)

**Índices de reajuste:**
- **INCC-M / INCC-DI (FGV):** índice específico da construção civil, usado em contratos privados
- **SINAPI:** índice embutido na atualização mensal (usado em contratos públicos)
- **IGP-M (FGV):** usado em aluguéis e alguns contratos de longo prazo
- **IPCA (IBGE):** índice oficial de inflação
- **Índices setoriais:** INCC-aço, INCC-cimento (FGV publica os subíndices)

**Fórmula paramétrica (Decreto 1.054/1994 para obras públicas):**
```
R = V0 × [(a × M/M0) + (b × H/H0) + (c × E/E0) + ...]
```
onde M, H, E são índices de materiais, mão-de-obra, equipamentos.

---

<a id="2-quantitativos"></a>
## 2. Quantitativos, levantamentos e critérios de medição

### 2.1 Arquitetura de um levantamento

Todo levantamento quantitativo é organizado em 4 camadas:

1. **EAP física** — Estrutura Analítica do Projeto: serviços → subserviços → unidades
2. **Memorial de cálculo** — documento onde cada quantidade é justificada com referência de desenho
3. **Planilha de levantamento** — cálculo iterativo por pavimento, eixo, ambiente
4. **Caderno de especificações** — amarração material↔serviço

**Pergunta-chave que o Pro-Orça responde:** "Se eu mudar a especificação X, qual memorial de cálculo é invalidado?"

### 2.2 Critérios de medição por disciplina

#### 2.2.1 Fundações

| Elemento | Unidade | Critério |
|---|---|---|
| Estaca hélice contínua | m | Metro linear cravado (do N.A. ao topo da estaca) |
| Estaca raiz | m | Idem |
| Estaca pré-moldada | m | Metro cravado; bota-fora de sobra medido à parte |
| Tubulão | m³ | Volume de concreto do fuste + base alargada |
| Brocas | un ou m | Critério varia — explicitar em memorial |
| Sapata isolada | m³ concreto + kg aço + m² forma | 3 insumos compõem o serviço |
| Sapata corrida | m³ + kg + m² | Idem |
| Radier | m³ + kg + m² | + impermeabilização se aplicável |
| Bloco de coroamento | m³ + kg + m² | Geralmente medido por volume |

#### 2.2.2 Estrutura de concreto armado

| Elemento | Unidade | Critério |
|---|---|---|
| Concreto | m³ | Volume geométrico do desenho, SEM descontar passagens < 0,10 m² |
| Armação | kg | Pesos da tabela de ferragem × 1 + % perda (5-15% tipicamente) |
| Forma | m² | Área de contato concreto↔forma; descontar somente aberturas > 2 m² |
| Escoramento | m²xmês ou m² | Depende do regime (locação ou aquisição) |

**Pitfalls:**
- **Desbitolamento de armadura** — trocar Ø10mm por Ø12,5mm altera consumo em kg
- **Perda de aço** na ponta das barras e em estribos < 7cm é real, por volta de 10-15%
- **Forma reaproveitada** — o custo é rateado pelo número de usos (8-15 reusos é típico)

#### 2.2.3 Alvenaria

| Elemento | Unidade | Critério |
|---|---|---|
| Alvenaria de vedação | m² | Área líquida (descontando vãos > 2 m²) |
| Alvenaria estrutural | m² + graute m³ + aço kg | Múltiplos insumos |
| Encunhamento | m | Topo de parede com argamassa expansiva |
| Verga/contraverga | m | Elemento de reforço sobre vão |

**Perdas típicas (Formoso, UFRGS):** blocos 5-17%, argamassa 20-115% (!)

#### 2.2.4 Revestimento

| Serviço | Unidade | Critério |
|---|---|---|
| Chapisco | m² | Área de substrato |
| Emboço | m² | Área, espessura média 2-2,5 cm |
| Reboco | m² | Idem |
| Gesso liso | m² | Idem |
| Gesso acartonado (drywall) | m² | Parede completa (placa + perfil + lã mineral) |
| Cerâmica / porcelanato | m² | Área com descontos de vão de porta |
| Pintura PVA (parede) | m² | Área × número demãos (normalmente 2 ou 3) |
| Pintura acrílica (fachada) | m² | Idem + argamassa pré-pintura |

#### 2.2.5 Cobertura

| Serviço | Unidade | Critério |
|---|---|---|
| Estrutura madeira/metálica | m² projeção | Área projetada em planta |
| Telha cerâmica | m² | Área de telhado (inclinação considerada) |
| Telha metálica/sandwich | m² | Idem |
| Telha shingle | m² | Idem |
| Calhas | m | Metro linear |
| Rufos | m | Metro linear de encontro |
| Impermeabilização laje técnica | m² | Com rodapé ≥ 30 cm |

#### 2.2.6 Esquadrias

| Serviço | Unidade | Critério |
|---|---|---|
| Porta madeira | un (padrão) ou m² | Porta + batente + ferragem + pintura |
| Janela alumínio | m² ou un | Padrão, com vidro e acabamento |
| Fachada cortina | m² | Pele de vidro completa (perfil + vidro + guarnição) |

#### 2.2.7 Instalações hidrossanitárias

| Serviço | Unidade | Critério |
|---|---|---|
| Ramal água fria | m | Por diâmetro |
| Ramal água quente | m | Por diâmetro + isolamento |
| Ramal esgoto | m | Por diâmetro |
| Ramal pluvial | m | Idem |
| Ponto hidráulico | un | "Ponto completo" pré-composto (usado em cond. residencial simples) |
| Louças/metais | un | Inclui flange e vedação |
| Hidrômetro/PEX/manifold | un | Equipamentos específicos |
| Reservatório | un + m³ | PRFV, aço, concreto |
| Bomba pressurização | un | |

#### 2.2.8 Instalações elétricas

| Serviço | Unidade | Critério |
|---|---|---|
| Eletroduto | m | Por diâmetro e tipo (galv./PVC) |
| Cabo | m | Por bitola (2,5 / 4 / 6 / 10 / 16 mm²) |
| Ponto elétrico | un | Composto: eletroduto + cabo + caixa + espelho |
| Quadro de distribuição | un | + disjuntores |
| SPDA | verba | Componente especial |
| Luminária | un | Inclui lâmpada + base |
| Aterramento | un | Haste + cabo |
| Cabeamento estruturado | pt / m | RJ45 + cabo UTP |

#### 2.2.9 Instalações especiais

- **Climatização:** BTU/h ou TR (tonelada de refrigeração), por tipo (split, VRF, chiller)
- **Gases medicinais:** pontos e verbas por centrais (O₂, ar comprimido, vácuo, N₂O)
- **Gás combustível:** pontos + rede
- **Elevadores:** por unidade (modelo) + instalação
- **Gerador:** por kVA + combustível + ATS
- **CFTV / alarme:** por câmera/sensor + central
- **Automação / BMS:** verba técnica (ou por ponto controlado)

#### 2.2.10 Paisagismo, urbanização, pavimentação

- **Pavimento intertravado:** m² (blocos + colchão de areia + contenção)
- **Pavimento asfáltico:** m² ou t (CBUQ, binder, base, sub-base)
- **Meio-fio:** m
- **Sarjeta:** m
- **Drenagem (tubo concreto):** m por diâmetro
- **Terraplenagem:** m³ (corte, aterro, transporte)
- **Grama:** m² (por tipo: esmeralda, São Carlos, pensacola)
- **Muda de árvore:** un (por altura e variedade)

### 2.3 Normas fundamentais

| Norma | Título | Aplicação |
|---|---|---|
| ABNT NBR 12721:2006 | Avaliação de custos unitários / CUB | Incorporação, memorial descritivo |
| ABNT NBR 13531:1995 | Elaboração de projetos de edificações | Terminologia de fases |
| ABNT NBR 13532:1995 | Elaboração de projetos — arquitetura | Etapas de projeto |
| ABNT NBR 15575:2024 | Desempenho de edifícios habitacionais | Requisitos de desempenho |
| ABNT NBR 6118:2014 | Projeto de estruturas de concreto | Cálculo estrutural |
| ABNT NBR 14931:2004 | Execução de estruturas de concreto | Execução |
| ABNT NBR 16636:2017 | Elaboração de projetos de edificações — requisitos | Entregáveis |
| ABNT NBR 15965 | Sistema de classificação da construção | Classificação dos elementos |
| ABNT NBR 14037:2014 | Manual de uso, operação e manutenção | Pós-obra |
| ABNT NBR 5674:2012 | Manutenção de edificações | Pós-obra |
| ABNT NBR 16280:2015 | Reforma em edificações | Sistema de gestão de reformas |
| ABNT NBR 16747:2020 | Inspeção predial | Inspeção técnica periódica |
| ABNT NBR 14653 (várias partes) | Avaliação de bens | Avaliação imobiliária |
| IBRAOP OT-IBR 004/2012 | Projeto básico | Definição técnica |
| IBRAOP OT-IBR 006/2016 | Anteprojeto de engenharia | Definição técnica |
| IBRAOP OT-IBR 009/2024 | Reequilíbrio econômico-financeiro | Aditivos |

### 2.4 BIM para quantitativos (QTO)

**LOD (Level of Development) para quantitativo confiável:**

| LOD | Descrição | Uso em orçamento |
|---|---|---|
| 100 | Símbolo, volume aproximado | Paramétrico |
| 200 | Geometria aproximada, quantidades aproximadas | Expedito / básico |
| 300 | Geometria precisa, especificação genérica | Analítico |
| 350 | + interfaces com outros sistemas | Analítico com compatibilização |
| 400 | + detalhe de fabricação | Executivo para fabricante |
| 500 | As-built | Pós-obra, manutenção |

**Ferramentas de QTO:**
- **Revit** (Autodesk) — schedule + filters + parameters
- **Navisworks Manage** (Autodesk) — modelos federados + Quantification workbook
- **ArchiCAD** (Graphisoft) — Schedules
- **Solibri Model Checker** — validação + QTO
- **Vico Office** — QTO 5D (custo integrado ao tempo)
- **CostX** — QTO 2D e 3D a partir de PDF/DWG/IFC
- **PlanSwift / Bluebeam Revu** — QTO 2D (marcação em PDF)

**IFC 2x3 vs IFC4:**
- IFC 2x3 é o padrão mais usado no Brasil, estável
- IFC4 (4.3) traz melhorias em infraestrutura, mas adoção é lenta

**Problema brasileiro:** a maioria dos projetos arquitetônicos em BIM não tem LOD suficiente para quantitativo direto — o Pro-Orça pode ganhar ao oferecer "enriquecedor de modelo" que complementa o BIM do projetista.

### 2.5 RUP — Razão Unitária de Produção

**Conceito (Ubiraci Souza, EPUSP):**
```
RUP = Homem-hora gasto / Quantidade de serviço
```
Ex.: 0,8 Hh/m² de alvenaria significa que cada m² consome 0,8 horas de um pedreiro.

**Variações:**
- **RUP diária** — dia a dia
- **RUP cumulativa** — média desde o início do serviço
- **RUP cíclica** — de um ciclo completo (ex.: pavimento tipo)
- **RUP potencial** — a melhor observada
- **RUP aceitável** — a meta gerenciável

Os valores TCPO são médias de mercado; RUP próprios são ouro — um dos principais ativos de uma construtora madura.

### 2.6 Perdas e desperdício

**Estudo PCC-EPUSP e UFRGS (Formoso):**

| Material | Perda média | Perda ruim | Observação |
|---|---|---|---|
| Cimento (saco) | 56% | 100%+ | Maior perda relativa |
| Areia | 44% | 75% | |
| Pedra britada | 38% | 60% | |
| Cal hidratada | 36% | 55% | |
| Aço CA-50/CA-60 | 11% | 25% | |
| Blocos cerâmicos | 13% | 30% | |
| Blocos concreto | 14% | 28% | |
| Argamassa industrializada | 17% | 45% | |
| Cerâmica (piso) | 9% | 20% | |
| Tinta | 11% | 25% | |

**Nota crítica:** esses números são de 1999-2003. Obras modernas com gestão enxuta, kits e pré-fabricação operam em <50% dessas perdas.

### 2.7 Levantamento em campo (reforma/retrofit)

**Técnicas:**
- **Trena + planta manual** (ainda predomina em reforma pequena)
- **Trena a laser** (Leica DISTO, Bosch GLM)
- **Disto + app de desenho** (MagicPlan, RoomScan)
- **Laser scanner 3D** (Leica BLK, Faro Focus, NavVis) — gera nuvem de pontos
- **Drone + fotogrametria** (DJI Mavic + Pix4D / DroneDeploy)
- **Photogrammetry mobile** (Polycam, Scaniverse) — para casos pequenos

**Entregáveis do levantamento:**
- Planta cadastral
- Memorial descritivo da condição existente
- Relatório fotográfico
- Laudo de patologia (se aplicável)
- Planta de demolição seletiva
- Planta nova sobreposta

---

<a id="3-god-mode-perguntas"></a>
## 3. God Mode: as 300+ perguntas do engenheiro

Organizadas em 6 estágios do ciclo de vida, com respostas curtas e indicação se vira feature/agente do Pro-Orça.

### 3.1 PRÉ-ORÇAMENTO / Viabilidade (40 perguntas)

1. **O terreno é edificável?** → consulta zoneamento, coeficiente de aproveitamento, recuos. **[Agente Viabilidade + camada GIS]**
2. **Qual o potencial construtivo (ABC)?** → área × coef. aprov. **[Agente Viabilidade]**
3. **Qual tipologia é viável (residencial/comercial/misto)?** → função do zoneamento e demanda local. **[Agente Viabilidade]**
4. **Qual é o padrão-alvo (baixo/médio/alto)?** → função do target de VGV. **[Input de briefing]**
5. **Qual o custo-alvo por m²?** → VGV × (1 - margem - terreno - comercial) / área. **[Agente Viabilidade]**
6. **Qual o prazo-alvo?** → função de velocidade de vendas e exposição de caixa. **[Agente Planejamento]**
7. **Qual a TIR mínima aceitável?** → TMA + prêmio de risco. **[Input ou biblioteca]**
8. **Onde estão os comparáveis (CMA)?** → preços de venda similares em 2 km. **[Agente de Mercado via webscraping]**
9. **Qual a velocidade de vendas esperada?** → VSO regional. **[Dashboard benchmarking]**
10. **Qual a estratégia tributária?** → RET 4%, patrimônio de afetação, lucro presumido. **[Agente Tributário]**
11. **Qual o modelo de financiamento?** → SFH, plano empresário, CRI, próprio. **[Agente Financeiro]**
12. **Qual fornecedor de terreno? Permuta?** → física ou financeira. **[Input]**
13. **Há estudos geotécnicos (SPT)?** → influencia tipo de fundação (impacta 5-15% do custo). **[Checklist]**
14. **Há levantamento topográfico georreferenciado?** → obrigatório para licenciamento. **[Checklist]**
15. **Há consulta prévia prefeitura?** → expede diretriz de uso. **[Checklist]**
16. **Há restrições ambientais?** → APP, APA, bioma, cota de inundação. **[Camada GIS]**
17. **Há restrições patrimônio histórico?** → IPHAN, CONDEPHAAT municipal. **[Camada GIS]**
18. **Qual o coeficiente de permeabilidade exigido?** → impacta piso drenante, jardim. **[Camada normativa]**
19. **Qual a demanda elétrica prevista?** → dispara projeto concessionária (pode atrasar meses). **[Checklist]**
20. **Qual a demanda hidráulica?** → idem para concessionária. **[Checklist]**
21. **Há rede de esgoto pública na testada?** → senão requer fossa + sumidouro ou estação. **[Checklist]**
22. **Qual o tempo de obra previsto?** → impacta mão-de-obra, despesas indiretas, vendas. **[Agente Planejamento]**
23. **Qual o fluxo de caixa esperado (J-curve)?** → mês a mês desembolso vs. vendas. **[Agente Financeiro]**
24. **Qual o pico de exposição de caixa?** → maior saldo negativo acumulado. **[Agente Financeiro]**
25. **Qual o payback?** → tempo até caixa zerar. **[Agente Financeiro]**
26. **Qual a margem líquida esperada?** → lucro / VGV. **[Agente Financeiro]**
27. **Qual a margem bruta esperada?** → (receita - custo direto) / receita. **[Agente Financeiro]**
28. **Qual o cenário pessimista (preço -10%, custo +10%, vendas -30%)?** → Monte Carlo. **[Agente Sensibilidade]**
29. **Qual a alavancagem financeira?** → dívida / patrimônio. **[Agente Financeiro]**
30. **Quem são os sócios / investidores? SCP?** → estrutura societária impacta tributação. **[Input]**
31. **Vai entrar como S.A., Ltda., SPE?** → SPE é padrão em incorporação. **[Agente Tributário]**
32. **Qual o seguro de engenharia necessário?** → RCO, RE, RC, garantia. **[Agente Seguros]**
33. **Qual a ART/RRT do responsável técnico?** → obrigatório desde início. **[Checklist CREA/CAU]**
34. **Qual o plano de segurança?** → PGR, PCMAT, NR-18. **[Checklist segurança]**
35. **Há risco de vizinhança (cautelar)?** → exige vistoria prévia. **[Agente Vistoria]**
36. **Qual o cronograma de aprovações?** → pré-aprovação, alvará, licença ambiental. **[Agente Planejamento]**
37. **Há risco climático?** → chuvas, vento, temperatura. **[Camada meteo]**
38. **Qual a matriz de riscos consolidada?** → probabilidade × impacto × mitigação. **[Agente Risco]**
39. **Quais premissas são críticas?** → lista top-10. **[Input + rastreamento]**
40. **Qual é o plano B se projeto inviabilizar?** → revender terreno, mudar tipologia. **[Input]**

### 3.2 ANÁLISE DE PROJETO (50 perguntas)

1. **Tenho todas as disciplinas (arq, estrutural, hidr, elet, ac, incêndio, paisagismo, impermeabilização)?** **[Checklist]**
2. **O projeto é básico, executivo ou anteprojeto?** → define grau de orçamento. **[Classificador]**
3. **Qual o LOD do BIM?** → se existe. **[Validador BIM]**
4. **Há memorial descritivo assinado?** → RRT/ART. **[Validador]**
5. **Há caderno de especificações com marca/modelo/referência?** → ou "similar"? **[Validador]**
6. **As plantas estão em escala?** → comparar cota x medida. **[Validador IA]**
7. **As cotas fecham (soma de ambientes = externa)?** → validação aritmética. **[Agente Compatibilização]**
8. **Há incompatibilidades entre disciplinas (clash)?** → sprinkler vs. viga, eletroduto vs. hidráulica. **[Agente Clash]**
9. **As fundações fecham com o estudo geotécnico?** → tipo compatível com SPT. **[Agente Compatibilização]**
10. **Há todos os cortes e elevações?** → faltam fachadas = risco. **[Validador]**
11. **Há detalhamentos críticos (pingadeiras, encontros, pontes térmicas)?** **[Checklist]**
12. **Há projeto de impermeabilização de cada área molhada?** **[Checklist]**
13. **Há projeto de formas (para estrutura)?** → sem isso = orçamento com incerteza. **[Checklist]**
14. **Há planilha de ferragem (estrutura)?** → essencial para kg/m³ real. **[Validador]**
15. **Há consumo de concreto por elemento?** → para base SINAPI. **[Validador]**
16. **O projeto hidrossanitário prevê aparelhos/louças/metais?** → catálogo referenciado. **[Validador]**
17. **O projeto elétrico tem quadros dimensionados?** → carga instalada x demanda. **[Validador]**
18. **Há projeto de cabeamento estruturado?** **[Checklist]**
19. **Há projeto de SPDA?** → NBR 5419. **[Checklist]**
20. **Há projeto de gás combustível?** → NBR 13103, 15358. **[Checklist]**
21. **Há projeto de AC?** → carga térmica calculada. **[Validador]**
22. **Há PPCI aprovado?** → projeto bombeiros. **[Checklist]**
23. **Há projeto de acessibilidade?** → NBR 9050. **[Checklist]**
24. **Há projeto acústico (se aplicável)?** → NBR 15575 e 10152. **[Checklist]**
25. **Há projeto luminotécnico?** → NBR ISO 8995-1. **[Checklist]**
26. **Há projeto de fachada (alto padrão/comercial)?** → stopping de vidro, perfis. **[Checklist]**
27. **Há projeto de paisagismo com lista de espécies?** **[Checklist]**
28. **Há projeto de canteiro?** → layout, fluxos, isolamento. **[Agente Canteiro]**
29. **Há planos de remediação ambiental?** **[Checklist]**
30. **Há projeto de demolição (reforma)?** **[Checklist NBR 16280]**
31. **O projeto atende NBR 15575 (desempenho)?** → térmico, acústico, estrutural. **[Validador]**
32. **As especificações são realistas para o padrão-custo?** → porcelanato 80x80 em MCMV = incoerente. **[Agente Coerência]**
33. **Há itens "a definir"?** → lista de pendências. **[Rastreador]**
34. **Há premissas assumidas?** → registrar formalmente. **[Rastreador]**
35. **Qual o nível de assertividade esperada?** → ±5% ou ±10%. **[Input]**
36. **Estou usando planta georreferenciada?** → para licenciamento. **[Validador]**
37. **Há RRT/ART de cada projeto?** **[Validador]**
38. **Há matrícula do imóvel atualizada?** **[Checklist]**
39. **Há certidões negativas do terreno?** **[Checklist]**
40. **Há licença ambiental (se aplicável)?** **[Checklist]**
41. **Há parecer do corpo de bombeiros?** **[Checklist]**
42. **Há anuência da concessionária de energia?** **[Checklist]**
43. **Há manifestação da concessionária de água/esgoto?** **[Checklist]**
44. **Há estudo de impacto de vizinhança (EIV)?** **[Checklist]**
45. **Há alvará de construção?** **[Checklist]**
46. **Qual a versão atual dos projetos (revisão)?** → rastrear. **[Controle de versão]**
47. **Quem é o coordenador de projetos?** → responsável pela compatibilização. **[Input]**
48. **Há Matriz BIM (BIM Execution Plan)?** **[Checklist]**
49. **Os arquivos estão em CDE (Common Data Environment)?** → ISO 19650. **[Input]**
50. **Há termo de aceite formal dos projetos?** **[Workflow]**

### 3.3 ORÇAMENTAÇÃO (60 perguntas)

1. **Qual base de preços vou usar?** → SINAPI/SICRO/TCPO/CUB/privada. **[Selector]**
2. **Desonerado ou onerado?** → função do regime tributário e CPRB. **[Selector com explicação]**
3. **Horista ou mensalista?** → por tipo de serviço. **[Auto-roteador]**
4. **Em qual mês-referência está o preço?** → atualizar ao mês-base. **[Atualizador]**
5. **Preciso atualizar por INCC / IPCA?** → reajuste contratual. **[Atualizador]**
6. **A composição está completa (material+MO+equip)?** → validar unit. **[Validador]**
7. **As perdas estão coerentes com o contexto?** → editar por região/gestão. **[Configurador]**
8. **As produtividades são de mercado ou próprias?** → histórico vs. TCPO. **[Dual-library]**
9. **Os insumos têm marca/modelo compatíveis?** → especificação × base. **[Mapeador]**
10. **Há cotação para itens classe A?** → ≥3 fornecedores. **[Agente Cotação]**
11. **A cotação está dentro da validade?** → data do orçamento. **[Validador]**
12. **Frete está embutido no insumo ou separado?** → evitar duplicação. **[Validador]**
13. **Transporte vertical está precificado?** → grua, elevador de carga, bomba. **[Agente Canteiro]**
14. **Canteiro completo está precificado?** → alojamento, refeitório, vestiário, portaria. **[Agente Canteiro]**
15. **Consumo de água, energia, telefonia provisórios?** **[Checklist]**
16. **Administração local (engenheiro, mestre, apontador)?** → custo direto. **[Validador]**
17. **Equipamentos de segurança coletiva (EPC)?** **[Checklist]**
18. **EPIs por colaborador?** **[Checklist]**
19. **Exames ASO + treinamentos NR?** **[Checklist]**
20. **Tributos sobre materiais (ICMS)?** → depende do regime. **[Agente Tributário]**
21. **Tributos sobre serviços (ISS) no município?** → alíquota local. **[Agente Tributário]**
22. **CPRB (desoneração folha)?** → aplicável? **[Agente Tributário]**
23. **BDI diferenciado por item (fornecimento vs. execução)?** **[Configurador BDI]**
24. **Risco precificado em BDI ou em reserva?** → não duplicar. **[Validador]**
25. **Garantia bancária / seguro-garantia está no BDI?** **[Configurador BDI]**
26. **Contingência / reserva de risco (5-10%)?** **[Configurador]**
27. **Curva ABC de insumos está coerente?** → top 20% = 80%? **[Validador]**
28. **Curva ABC de serviços?** → onde está o $ grande? **[Dashboard]**
29. **Aluguel de formas, andaimes, escoramento?** → locação vs. aquisição. **[Selector]**
30. **Caminhão betoneira / bomba de concreto?** → incluído no m³? **[Validador]**
31. **Grua / equipamento fixo?** → mobilização + aluguel mensal + desmobilização. **[Modelo]**
32. **Betoneira / central de argamassa?** → produção interna ou externa. **[Selector]**
33. **Industrializados (argamassa, gesso acartonado, painéis)?** → vs. produção in-loco. **[Alternativas]**
34. **Mobiliário fixo (armários, bancadas)?** → inclui ou não? **[Escopo]**
35. **Equipamentos de uso (elevador, gerador, ar condicionado)?** → inclui? **[Escopo]**
36. **Serviços de terceiros (fachada, impermeabilização)?** → como subcontratar. **[Template contrato]**
37. **Paisagismo completo ou só áreas comuns?** → escopo. **[Escopo]**
38. **Mobiliário urbano (decoração) e sinalização?** **[Checklist]**
39. **Automação / domótica?** → verba ou detalhado. **[Configurador]**
40. **Itens "verba"?** → lista crítica — maior risco de estouro. **[Rastreador]**
41. **Medição por amostragem está correta?** → evitar extrapolação errada. **[Validador]**
42. **Índice por m² está coerente com o mercado?** → comparar benchmark. **[Validador de sanidade]**
43. **Item por item está coerente com base?** → flag de outliers (>20% variação). **[Validador IA]**
44. **Histórico próprio x base referencial?** → qual prevalece. **[Configurador]**
45. **Há catálogo de decisões tomadas?** → por que escolhi esse insumo? **[Audit trail]**
46. **Quem aprovou cada item?** → workflow de aprovação. **[Workflow]**
47. **Versão atual do orçamento?** → versionamento. **[Controle de versão]**
48. **Diff do orçamento v1 → v2?** → rastreabilidade. **[Diff viewer]**
49. **Memorial descritivo foi gerado junto?** → amarração item↔especificação. **[Gerador]**
50. **Memorial de cálculo foi gerado?** → fórmula + referência de planta. **[Gerador]**
51. **Análise de risco por item?** → volatilidade do preço. **[Agente Risco]**
52. **Análise de sensibilidade está feita?** → +10% aço, -10% concreto. **[Agente Sensibilidade]**
53. **Validação cruzada com CUB?** → ordem de grandeza bate. **[Validador sanidade]**
54. **Validação cruzada com ERP da empresa?** → dados históricos. **[Integrador]**
55. **Comparação com orçamentos passados similares?** → benchmark interno. **[Agente Benchmark]**
56. **Saída em Excel com fórmulas vivas?** → cliente pode simular. **[Exportador]**
57. **Saída em PDF assinado digitalmente?** → ART + ICP-Brasil. **[Exportador + assinatura]**
58. **Saída em BIM 5D (vincular custo a elemento)?** → para clientes avançados. **[Exportador IFC]**
59. **Saída em formato TCU/CGU (licitação)?** → planilha e documentos de praxe. **[Template]**
60. **Existe versão resumida (3 páginas) para executivo?** → one-pager. **[Gerador de resumo IA]**

### 3.4 PLANEJAMENTO E CONTRATAÇÃO (40 perguntas)

1. **Qual a EAP (WBS) do projeto?** → estrutura da obra. **[Agente EAP Automática]**
2. **Qual a rede lógica (CPM)?** → precedências. **[Agente Cronograma]**
3. **Qual o caminho crítico?** → onde atrasos matam. **[Gantt + crítico]**
4. **O cronograma bate com caixa?** → fluxo financeiro. **[Agente Financeiro]**
5. **Há folgas? Quantas?** → buffer de segurança. **[Agente Cronograma]**
6. **Qual o pico de mão-de-obra?** → dimensionar canteiro. **[Gráfico histogram]**
7. **Qual o pico de equipamentos?** → conflitos de grua, bomba. **[Agente Recursos]**
8. **Qual o cronograma de compras?** → lead time + entrega. **[Agente Suprimentos]**
9. **Quais itens vão para contratação de 3º?** → subempreitada. **[Pacotes]**
10. **Qual o regime de cada contrato?** → preço fechado, unitário, administração. **[Template]**
11. **Qual a matriz de risco contratual?** → quem assume cada risco. **[Template]**
12. **Penalidades contratuais coerentes?** → multa, rescisão. **[Template]**
13. **Reajuste previsto no contrato?** → INCC, IPCA, paramétrico. **[Cláusula padrão]**
14. **Reequilíbrio econômico-financeiro previsto?** → clausulação. **[Cláusula padrão]**
15. **Seguros obrigatórios definidos?** → RC, RCO, RE, garantia. **[Agente Seguros]**
16. **Habilitação dos fornecedores?** → certidões, capacidade técnica. **[Agente Habilitação]**
17. **Pré-qualificação dos subempreiteiros?** → cadastro. **[Agente Cadastro]**
18. **Quadro de contratação consolidado?** → visão executiva. **[Dashboard]**
19. **Política de retenção (5-10% de garantia)?** **[Cláusula padrão]**
20. **Política de adiantamento de 30% (fornecimento)?** **[Cláusula padrão]**
21. **Forma de medição e pagamento definida?** → BM mensal. **[Template BM]**
22. **Logística / plano de canteiro?** → layout, fluxos. **[Agente Canteiro]**
23. **Plano de descarte de resíduos (PGRCC)?** **[Gerador PGRCC]**
24. **Plano de gerenciamento de qualidade?** → FVS (Ficha de Verificação de Serviço). **[Biblioteca FVS]**
25. **Plano de gerenciamento de comunicação?** → reuniões semanais, relatórios. **[Template]**
26. **Plano de gerenciamento de riscos?** → Matriz + ações. **[Agente Risco]**
27. **Plano de gerenciamento de interfaces?** → handoffs entre pacotes. **[Matriz RACI]**
28. **SESMT dimensionado?** → obrigatório por NR-04 acima de 20 trabalhadores. **[Calculadora SESMT]**
29. **Brigada de incêndio treinada?** **[Checklist]**
30. **Acidentes — como reportar?** → NR-05 CIPA. **[Template]**
31. **Stakeholders mapeados?** → poder × interesse. **[Matriz stakeholder]**
32. **Plano de gestão de escopo?** → controle de mudança. **[Workflow change request]**
33. **Linha de base orçamentária (baseline)?** → referência congelada. **[Snapshot]**
34. **Linha de base cronograma?** → idem. **[Snapshot]**
35. **Kanban / Last Planner System?** → PPC ≥80%. **[Dashboard Lean]**
36. **Takt time definido?** → ritmo de produção. **[Calculadora Takt]**
37. **Linha de balanço para andar tipo?** → trabalho repetitivo. **[Gráfico LOB]**
38. **Reserva gerencial x reserva de contingência definidas?** **[Configurador]**
39. **Qual a autoridade de aprovação por faixa de valor?** → governança. **[Workflow]**
40. **Plano de mobilização e desmobilização?** → canteiro final. **[Checklist]**

### 3.5 EXECUÇÃO E CONTROLE (60 perguntas)

1. **BM (boletim de medição) mensal fechou com o orçado?** **[Agente Medição]**
2. **Qual o desvio (variance)?** → custo real - custo orçado. **[Dashboard Variance]**
3. **O desvio é de preço (PV) ou quantitativo (QV)?** → diagnóstico. **[Agente Diagnóstico]**
4. **Earned Value Management (CPI, SPI)?** → saúde do projeto. **[Agente EVM]**
5. **Estimativa no término (EAC) está atualizada?** → projeção do custo final. **[Agente EVM]**
6. **Preciso de aditivo de valor?** → novos escopo, reequilíbrio. **[Workflow aditivo]**
7. **Preciso de aditivo de prazo?** → chuva, caso fortuito. **[Workflow aditivo]**
8. **Reequilíbrio econômico-financeiro está documentado?** → cálculo comprovado. **[IBRAOP OT-IBR 009]**
9. **Há registros de todas as alterações de escopo?** → change log. **[Workflow]**
10. **Diário de obra está atualizado?** → jurídico em perícia. **[Agente Diário]**
11. **Há fotos georreferenciadas diárias?** → prova documental. **[App mobile]**
12. **Os quantitativos executados batem com o projeto?** → medição in loco. **[Agente Medição]**
13. **Há controle de FVS (qualidade) por serviço?** → ISO 9001. **[Biblioteca FVS]**
14. **Taxa de retrabalho?** → re-execução. **[Indicador qualidade]**
15. **Não conformidades abertas?** → fluxo de tratamento. **[Workflow NC]**
16. **PPC semanal ≥ 80%?** → Last Planner. **[Dashboard Lean]**
17. **Curva S real x planejada?** → ahead/behind. **[Gráfico]**
18. **Curva ABC atualizada?** → monitorar classe A. **[Dashboard]**
19. **Cronograma replanejado?** → cada atraso dispara. **[Agente Replanejamento]**
20. **Pagamentos em dia?** → fornecedores e funcionários. **[Integração ERP]**
21. **Fluxo de caixa real x projetado?** → hedge cambial se importado. **[Dashboard financeiro]**
22. **Fornecedor crítico tem plano B?** → single-source risk. **[Agente Risco]**
23. **Atestado técnico para portfólio da construtora?** → acervo CREA. **[Gerador]**
24. **Índice de acidentes?** → frequência e gravidade. **[Dashboard SST]**
25. **Treinamentos em dia?** → NR-6 EPI, NR-18 obra, NR-35 altura. **[Rastreador]**
26. **Exames ASO em dia?** → por função. **[Rastreador]**
27. **CIPA constituída?** **[Checklist]**
28. **SESMT ativo?** **[Checklist]**
29. **Resíduos destinados conforme PGRCC?** → MTR (manifesto). **[Agente Resíduos]**
30. **Licenças ambientais cumpridas?** → condicionantes. **[Rastreador]**
31. **Alvará de construção vigente?** → prazo de validade. **[Alerta]**
32. **Vizinhança reclamando?** → sonoro, poeira. **[Agente Atendimento]**
33. **Medições extras de segurança (altura, confinado)?** → NR-35, NR-33. **[PET — Permissão Especial]**
34. **Gestão de contratos: prazo de reajuste / prorrogação?** → alertas. **[Alerta]**
35. **Aquisições especiais aprovadas?** → governança. **[Workflow]**
36. **Assembly / testes funcionais (comissionamento)?** → antes de entrega. **[Checklist]**
37. **Ensaios de concreto, aço, solo estão em dia?** → rastreabilidade. **[Agente Qualidade]**
38. **Ensaios de pressão (hidráulica)?** → 1,5× pressão de serviço. **[Checklist]**
39. **Laudos exigidos (SPDA, elétrica, gás)?** **[Checklist]**
40. **Patente e propriedade industrial (equipamentos)?** → documentação. **[Checklist]**
41. **Garantia dos equipamentos + manuais?** → arquivar. **[Repositório]**
42. **Garantia dos subempreiteiros?** → prazo e objeto. **[Repositório]**
43. **Seguros vigentes?** → não esquecer renovação. **[Alerta]**
44. **Previsão de chuvas?** → reprogramar. **[Integração INMET]**
45. **Velocidade de vento?** → NR-18 para grua. **[Integração]**
46. **Temperatura extrema?** → concretagem, trabalho externo. **[Alerta]**
47. **Vandalismo / furto?** → vigilância. **[Plano]**
48. **Imprevistos geológicos (SPT real ≠ previsto)?** → aditivo. **[Agente Aditivo]**
49. **Descoberta arqueológica?** → IPHAN (suspende obra). **[Protocolo]**
50. **Interferência de concessionária (rede não mapeada)?** → aditivo + prazo. **[Agente Aditivo]**
51. **Greve / paralisação?** → convenção coletiva. **[Agente Trabalhista]**
52. **Ajuste de mão-de-obra (dissídio anual)?** → indexador. **[Alerta]**
53. **Inflação de insumos acima do indexador?** → reequilíbrio. **[Agente Reequilíbrio]**
54. **Situação de caixa do contratante?** → risco de inadimplência. **[Agente Risco]**
55. **Situação de caixa própria?** → capital de giro. **[Dashboard]**
56. **Mapa de cobrança de recebíveis?** → antecipação. **[Agente Financeiro]**
57. **Inadimplência dos compradores (se incorporação)?** → gestão. **[Dashboard]**
58. **Distratos?** → impacto no VGV. **[Dashboard]**
59. **Margem projetada atualizada?** → end-of-project. **[Dashboard]**
60. **Relatórios executivos mensais prontos?** → para board. **[Agente Relatório]**

### 3.6 ENCERRAMENTO E PÓS-OBRA (30 perguntas)

1. **Habite-se emitido?** → com projeto aprovado e vistoria. **[Checklist]**
2. **Averbação da construção?** → registro de imóveis. **[Checklist]**
3. **Individualização de unidades?** → matrículas filhas. **[Checklist]**
4. **Instalação de medidores individualizados?** → água, luz, gás. **[Checklist]**
5. **Certificado do corpo de bombeiros (AVCB)?** **[Checklist]**
6. **Autorização ambiental de operação (se aplicável)?** **[Checklist]**
7. **Inauguração / entrega das chaves agendada?** → contratualmente. **[Workflow]**
8. **Manual do proprietário (NBR 14037) entregue?** → obrigatório. **[Gerador Manual]**
9. **Manual de áreas comuns (NBR 14037)?** **[Gerador Manual]**
10. **Plano de manutenção preventiva (NBR 5674)?** **[Template]**
11. **As-built de cada disciplina entregue?** → atualizado ao real. **[Validador]**
12. **Memória de construção arquivada?** → 5 anos mínimo. **[Repositório]**
13. **Certidões negativas (INSS, FGTS)?** → rescisão contratual limpa. **[Checklist]**
14. **eSocial encerrado?** → todos os eventos. **[Integração]**
15. **Término de todos os contratos?** → distrato formal. **[Workflow]**
16. **Devolução de cauções e garantias?** → após prazos legais. **[Workflow]**
17. **Conciliação final de medições?** → tudo medido e pago. **[Agente]**
18. **Custo real final (as-spent)?** → dado ouro para futuro. **[Snapshot]**
19. **Diferenças por serviço / insumo atualizam base própria?** → learning loop. **[Agente Learning]**
20. **Lições aprendidas documentadas?** → repositório. **[Agente Retrospectiva]**
21. **Pesquisa de satisfação com cliente?** → NPS. **[Agente Survey]**
22. **Pesquisa de satisfação com equipe?** → clima organizacional. **[Agente Survey]**
23. **Pesquisa com fornecedores?** → NPS fornecedor. **[Agente Survey]**
24. **Plano de assistência técnica?** → 5 anos garantia implícita (Art. 618 CC). **[Workflow AT]**
25. **Central de atendimento pós-obra ativa?** → tickets. **[Agente Atendimento]**
26. **Política de visitas técnicas de manutenção?** → 6/12 meses. **[Agenda]**
27. **Relatório financeiro final do empreendimento?** → DRE real. **[Agente DRE]**
28. **Liquidação tributária (RET, ISS, CPRB)?** **[Agente Tributário]**
29. **Distribuição de dividendos?** → incorporação. **[Agente Societário]**
30. **Encerramento da SPE?** → após liquidação. **[Workflow]**

### 3.7 Top-10 perguntas que ninguém faz e custam caro

1. **"E o transporte vertical?"** — esquecido em prédios altos, onera até 8% do custo estrutural
2. **"E o ensaio de compactação?"** — esquecido em aterro, pode custar demolição e refazer
3. **"A concessionária vai ter capacidade?"** — se não, construtora paga reforço de rede (R$ 200k-2MM)
4. **"Há interferência de rede subterrânea?"** — pode exigir desvio ou aditivo geológico
5. **"O SPT representa bem o terreno todo?"** — mudança de perfil geológico onera fundação
6. **"Quem paga o plano B do clima?"** — se chuva passar da média, quem absorve?
7. **"A especificação do cliente é realizável ao custo-alvo?"** — porcelanato 120x120 em MCMV é fantasia
8. **"Tem gerador e no-break para obra?"** — queda de energia para concretagem = peça perdida
9. **"A carga horária das equipes cruza com hora-extra de pico?"** — trabalhar à noite pode ser mais barato que trabalhar no fim
10. **"E a manutenção e operação pós-obra?"** — Life Cycle Cost pode mudar qual especificação é "a mais barata"

---

<a id="4-visao-empresa"></a>
## 4. Visão da construtora / incorporadora

### 4.1 Anatomia de uma incorporação (DRE simplificado)

```
VGV BRUTO (Valor Geral de Vendas)
(-) Distratos e ajustes                       [ ~8-15% ]
= VGV LÍQUIDO
(-) Comissões de venda                        [ 4-6% VGV ]
(-) Marketing e vendas                        [ 2-4% VGV ]
(-) Tributos sobre receita (RET 4% ou SIMPLES/LR)
= RECEITA LÍQUIDA
(-) Custo do terreno                          [ 15-30% VGV ]
(-) Custo de construção (CMO + BDI da obra)   [ 30-50% VGV ]
(-) Custos de incorporação                    [ 3-8% VGV ]
    • Projetos (7-15% do CMO de obra)
    • Taxas de aprovação
    • Registro, averbação
    • Jurídico, societário
(-) Despesas financeiras                      [ 2-6% VGV ]
= LUCRO BRUTO                                 [ 20-35% VGV ]
(-) Impostos sobre o lucro (ou RET já pago)
(-) Despesas administrativas rateadas
= LUCRO LÍQUIDO                               [ 15-25% VGV ]
```

**Exemplo numérico (condomínio residencial SP, padrão médio):**
- Terreno: R$ 15M (15%)
- VGV bruto: R$ 100M
- CMO: R$ 40M (40%)
- Custos incorporação: R$ 6M (6%)
- Comissão + marketing: R$ 8M (8%)
- RET 4%: R$ 4M
- Despesas financeiras: R$ 3M
- **Lucro líquido: R$ 24M = 24%**
- **TIR (36 meses): ~22% a.a.**

### 4.2 Indicadores de viabilidade

| Indicador | Fórmula / conceito | Benchmark |
|---|---|---|
| **VGV** | Σ preços de venda unidades | — |
| **Margem bruta** | (VGV - CMO - terreno) / VGV | >30% |
| **Margem líquida** | Lucro líquido / VGV | 15-25% |
| **TIR** | Taxa interna de retorno | >15% a.a. |
| **TMA** | Taxa mínima de atratividade | CDI + prêmio de risco |
| **VPL** | Valor presente líquido descontado pela TMA | >0 |
| **Payback** | Tempo para caixa acumulado ≥ 0 | < prazo da obra |
| **Exposição máxima** | Maior saldo negativo de caixa | Menor possível |
| **VSO** | Velocidade de vendas sobre oferta (mensal) | >8-12% |
| **Preço/m² vendável** | VGV / área privativa total | Benchmark |
| **Custo/m² construído** | CMO / área total | SINAPI + delta |
| **% vendido no lançamento** | Depende de mercado | >40% ideal |
| **% vendido no habite-se** | Metas de funding | >70% |
| **Distratos** | % cancelamentos | <10% |
| **Inadimplência** | % em atraso | <5% |

### 4.3 Regime Especial de Tributação (RET)

**Lei 10.931/2004 criou o RET para incorporação imobiliária:**
- **Alíquota:** 4% da receita mensal recebida, substituindo IRPJ (1,26%) + CSLL (0,66%) + PIS (0,37%) + COFINS (1,71%)
- **Alíquota reduzida 1%:** para MCMV/PMCMV Faixa Urbano 1
- **Exige patrimônio de afetação:** separação contábil-jurídica da SPE-obra do restante da empresa
- **Opcional mas irretratável** enquanto durar a incorporação
- **Cuidado pós-reforma tributária (LC 214/2025):** RET foi preservado com ajustes — para obras com habite-se após 2027 há mudanças
- **Comparação com Lucro Real/Presumido:** RET ganha em margens >20%; pode perder em margens baixas

### 4.4 Matriz de riscos típica

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Custo acima do orçado | Alta | Alta | Orçamento detalhado + contingência 5-10% |
| Prazo acima do previsto | Alta | Alta | CPM + buffer + Last Planner |
| Vendas abaixo do esperado | Alta | Alta | Ajuste lançamento + promoções |
| Rescisão em massa (distrato) | Média | Alta | Quitação antecipada + campanhas |
| Aumento do custo do terreno | Baixa | Alta | Fechamento prévio |
| Inadimplência compradores | Alta | Média | Score + antecipação recebível |
| Atrasos de aprovação | Alta | Alta | Cronograma realista + relacionamento órgãos |
| Reação da vizinhança | Média | Média | Cautelar + relacionamento |
| Intempéries (chuva, vento) | Alta | Média | Cronograma sazonal + cobertura |
| Patologia estrutural | Baixa | Muito alta | Projeto robusto + ensaios |
| Descoberta arqueológica | Baixa | Alta | EIV + análise prévia |
| Fornecedor quebra | Média | Média | Multi-sourcing |
| Mudança normativa | Baixa | Alta | Monitoramento ABNT/NR/IBAMA |
| Reforma tributária | Alta | Alta | Cenário + hedge jurídico |
| Crédito escasso | Média | Muito alta | Linhas alternativas |
| Cambial (insumos importados) | Média | Alta | Hedge cambial |
| Sindical (greve) | Baixa | Média | Relacionamento + ACT |
| Judicial (ACP de vizinhos) | Baixa | Alta | Due diligence + EIV |

### 4.5 Perguntas-chave do CEO / sócio ao engenheiro

1. "Posso vender esse projeto por quanto?"
2. "Quanto custa construir?"
3. "Em quanto tempo recupero o capital?"
4. "Qual é minha TIR?"
5. "Qual meu lucro líquido?"
6. "O que dá errado?"
7. "Qual é a exposição máxima de caixa?"
8. "Dá para reduzir em 10% o custo sem perder valor?"
9. "Qual é a sensibilidade a +10% de custo?"
10. "E se as vendas caírem 30%?"

### 4.6 Perguntas do diretor financeiro

1. "Quando eu preciso do dinheiro mês a mês?"
2. "Qual a linha de crédito a contratar?"
3. "Qual a estrutura ideal de funding?"
4. "Qual o regime tributário ideal?"
5. "Quais os covenants vou precisar atender?"
6. "Vale antecipação de recebíveis?"
7. "Qual minha alavancagem?"
8. "Preciso hedge cambial / de taxa?"
9. "O CRI é opção?"
10. "Qual o spread do empréstimo à produção?"

### 4.7 Perguntas do banco / funding

1. "Tem plano empresário ou SFH?"
2. "Qual é a matriz de riscos?"
3. "Qual o percentual de pré-venda?"
4. "Qual a garantia real (hipoteca, alienação fiduciária)?"
5. "Qual o rating da construtora?"
6. "Histórico de execução no prazo?"
7. "Patrimônio de afetação está constituído?"
8. "CVCO / CND em dia?"
9. "Aprovação na convenção?"
10. "Seguros contratados?"

### 4.8 Perguntas do comprador pessoa física que viram pressão

1. "Quando entrega?"
2. "Qual o sinal? E as parcelas?"
3. "Vai ter reajuste? Qual índice?"
4. "Vou conseguir financiar?"
5. "Posso mudar acabamento? Quanto custa?"
6. "Posso visitar a obra?"
7. "E se atrasar, tem multa?"
8. "Como vão corrigir se aparecer defeito?"
9. "Qual o IPTU projetado?"
10. "Qual o custo de condomínio?"

---

<a id="5-tipologias"></a>
## 5. Tipologias e benchmarks R$/m²

### 5.1 Tabela síntese (referência jan/2025-abr/2026)

| Tipologia | R$/m² (média BR) | Prazo típico | % Estrutura | % Instalações | % Acabamento |
|---|---|---|---|---|---|
| MCMV (R4-A econômico) | 2.000-2.500 | 18-24m | 20% | 20% | 20% |
| Residencial médio | 3.300-3.900 | 24-30m | 18% | 22% | 25% |
| Residencial alto padrão | 4.800-7.000 | 30-42m | 15% | 25% | 35% |
| Residencial luxo (>R$ 8k/m² VGV) | 7.000-12.000 | 36-48m | 13% | 27% | 40% |
| Casa horizontal médio | 3.500-4.500 | 8-14m | 20% | 22% | 25% |
| Casa alto padrão (500-1000m²) | 6.000-10.000 | 18-30m | 15% | 25% | 40% |
| Escritório corporativo classe A | 6.000-9.000 | 24-36m | 18% | 32% (HVAC) | 25% |
| Escritório classe B | 4.500-6.500 | 18-30m | 18% | 25% | 25% |
| Shopping / varejo | 5.000-8.000 | 18-30m | 18% | 30% | 25% |
| Galpão logístico classe A | 1.250-2.000 | 10-18m | 45% (pré-moldado) | 20% | 10% |
| Galpão industrial | 1.500-2.500 | 10-18m | 40% | 25% | 10% |
| Hospital (médio porte) | 7.000-12.000 | 30-48m | 15% | 45% (gases/HVAC) | 20% |
| Hospital (alto complexidade) | 10.000-18.000 | 36-60m | 14% | 50% | 20% |
| Escola FNDE padrão | 3.000-4.500 | 12-18m | 20% | 20% | 25% |
| Hotel 4★ | 5.500-8.000 | 24-36m | 16% | 30% | 30% |
| Rodovia (pavimento asfáltico) | 800-1.500/m (linear) | 12-36m | — | — | — |
| Estação de Tratamento Água | Verba específica | 18-36m | 25% | 45% | 15% |
| Reforma residencial | 1.500-4.000 | 4-18m | 10% | 25% | 40% |
| Retrofit corporativo | 2.500-5.500 | 6-18m | 8% | 35% | 40% |

**Fontes:** Arquitecasa jan/2025, Sienge Blog 2025, CUB Sinduscon, Creditas Exponencial, benchmarks de mercado Colliers/JLL/Buildings, Senior Consulting hospitais.

### 5.2 Particularidades por tipologia

#### Residencial vertical multifamiliar
**Normas principais:** NBR 15575 (desempenho), NBR 16280 (reforma posterior), NBR 9077 (saída de emergência)
**Insumos críticos classe A (80% do custo):**
1. Concreto estrutural
2. Aço CA-50
3. Blocos de vedação
4. Mão-de-obra (encargos)
5. Elevadores
6. Louças e metais
7. Pisos (cerâmica/porcelanato)
8. Esquadrias de alumínio

**Ponto cego comum:** cobertura + casa de máquinas + reservatório superior + SPDA — representam 6-10% do total e sempre são subestimados.

#### Residencial horizontal
**Particularidade decisiva:** urbanização e infra representam 30-40% do CMO em condomínios fechados. O engenheiro novato subestima isso e projeta com margem negativa.

#### Corporativo classe A / LEED
**Custos extras vs. classe B:**
- VRF ou chiller: +R$ 400-600/m²
- Piso elevado: +R$ 200-350/m²
- Fachada pele de vidro: +R$ 400-800/m²
- Certificação LEED: +2-8% do CMO
- BMS (Building Management System): +R$ 100-250/m²

#### Galpão logístico Classe A
**Especificações críticas:**
- **FF/FL** (Face Felt / Face Level) — índices de planicidade do piso industrial (ABNT NBR 15961 ou ASTM E1155)
- Pé-direito: 12-15 m livres
- Docas niveladoras automáticas
- Sprinkler ESFR (Early Suppression Fast Response) — para racks altos
- Piso: nivelamento laser + fibras de aço ou macro-fibra sintética
- **Observação:** NÃO confundir FF/FL com "Face Felt" (texto errado em alguns blogs BR) — é planicidade/nivelamento

#### Hospitalar
**Normas-chave:**
- **RDC 50/2002 (ANVISA):** regulamento técnico para projeto, avaliação e funcionamento de EAS
- **NBR 7256:2021:** climatização e qualidade do ar em EAS
- **NR-32:** segurança em serviços de saúde
- **NBR 15558:** gases medicinais
- **NBR 13534:** instalações elétricas de baixa tensão em EAS

**Áreas por criticidade ANVISA:**
- **Críticas:** UTI, cirurgia, hemodiálise, oncologia — requisito máximo de qualidade do ar, pressurização
- **Semi-críticas:** pronto socorro, internação, exames
- **Não-críticas:** áreas administrativas, circulação

**Insumos hospitalares não presentes em outras tipologias:**
- Centrais de gases medicinais (O₂, ar comprimido medicinal, vácuo, N₂O, CO₂)
- Portas automáticas radiológicas com blindagem de chumbo
- Salas de imagem (RX, TC, RM) com paredes de chumbo e Faraday
- Sistemas HEPA H13/H14 e ULPA
- Pressurização diferenciada (positiva para limpo, negativa para isolamento)
- Redundância N+1 de cadeias críticas (energia, climatização)
- Helioponto + helipad estrutural

**Caso MPD / MHA (ANTEPROJETO):** o desafio é orçar a partir de anteprojeto — orçamento híbrido. A métrica mais confiável é **paramétrico + expedito** com contingência reforçada (15-20%) e curva ABC macro por sistema.

#### Reforma / retrofit
**NBR 16280:2015** — obriga:
- Plano de reforma aprovado pelo síndico
- Responsável técnico (ART/RRT)
- Comunicação à administradora
- Atualização do manual do proprietário

**Pitfalls de orçar reforma:**
- Imprevistos são a regra (contingência 15-30%)
- Demolição seletiva exige maior cuidado com resíduos
- Conviver com moradores = baixa produtividade (RUP maior)
- Obras noturnas = hora-extra
- Risco patrimonial em edifício existente

---

<a id="6-complementares"></a>
## 6. Serviços complementares e oportunidades

### 6.1 Mapa do ecossistema (ciclo de vida)

```
VIABILIDADE → PROJETO → ORÇAMENTO → PLANEJAMENTO → CONTRATAÇÃO → EXECUÇÃO → MEDIÇÃO → PÓS-OBRA
    │            │           │            │              │             │          │          │
    ▼            ▼           ▼            ▼              ▼             ▼          ▼          ▼
Avaliação  Compatibili-  Cotação   Cronograma   Quadro de    Apontamento  Boletim   Manual 
de       zação BIM   eletrônica  físico-       contratação   de obra     de         do pro-
imóvel                                financeiro                                           medição    prietário
NBR      Clash        Marketplace Last Planner  Seguros/    Drones /     Diário     Inspeção
14653    detection   fornece-       PPC          Performance fotos         de obra    predial
          dores           LOB                                georref.                  NBR 16747
EIV      Simulação   Catálogo    EAP auto-    Habilitação  IoT /         Aditivos   Assistência
         energética  técnico     matizada     fornece-      sensores                   técnica
                               (IA)        dores                                        garantia
Ambiental Check-     Compara-    Matriz de    Minuta de   Relatório    Reequilí-   Avaliação
licen-     list       dor his-    riscos       contrato    executivo     brio eco-    de satis-
ciamento PPCI       tórico                                                nômico      fação (NPS)
```

### 6.2 Oportunidades de monetização além do orçamento

**Nível 1: extensão natural do orçamento (quick wins)**

1. **Planejamento 4D** — conectar orçamento a cronograma (premium)
2. **Fluxo de caixa financeiro** — traduzir cronograma em caixa mensal (premium)
3. **Quadro de contratação** — montar pacotes a partir da curva ABC (premium)
4. **Matriz de riscos automática** — a partir do orçamento (premium)
5. **Memorial descritivo + memorial de cálculo** — geração automática (premium)
6. **Relatório executivo (1 página)** — resumo para board (premium)

**Nível 2: serviços adjacentes (médio prazo)**

7. **Agente de compatibilização BIM** — rodar clash detection
8. **Cotação eletrônica integrada** — marketplace próprio ou integração com Mercado Eletrônico/Nimbi
9. **Agente de viabilidade econômica** — VGV → CMO → DRE → TIR em 1 minuto
10. **Agente PPCI** — checklist por tipologia
11. **Agente tributário** — escolha de regime (RET vs. outros)
12. **Agente de licenciamento** — rastreador de alvarás e prazos
13. **Agente de ESG** — LEED/AQUA/EDGE pré-avaliação
14. **Agente de resíduos** — PGRCC + MTR

**Nível 3: oportunidades não-óbvias (alta margem)**

15. **Benchmarking anônimo entre construtoras** — plataforma de intel coletiva com dados agregados; as construtoras participam cedendo dados pseudoanonimizados em troca de acesso aos benchmarks do setor. Valor altíssimo, nenhum player faz
16. **Base histórica de preços reais** — "SINAPI verdadeiro" — dados reais de construtoras vs. referencial teórico
17. **Due diligence técnica** para fusão/aquisição, venda de estoque a fundos de private equity
18. **Marketplace de orçamentistas assistidos por IA** — plataforma onde engenheiros freelancers atendem construtoras pequenas com velocidade 10×
19. **Assessoria em licitação pública (Lei 14.133)** — agente "TCU-proof" que gera planilhas e documentos com rastreabilidade
20. **Compliance TCU/TCE** — auditoria preventiva de orçamentos públicos
21. **Seguro-garantia cotação automática** — integração com seguradoras
22. **Inspeção predial (NBR 16747)** — mercado de syndic/administradoras
23. **Atualização cadastral imobiliária** — IPTU, ITBI, registro
24. **Avaliações (NBR 14653)** — integrar com CRECI e bancos
25. **Consultoria de pré-qualificação** — capacitação técnica exigida em editais

### 6.3 Benchmark competitivo construtech/proptech Brasil

| Ferramenta | Produto | Diferencial | Gap para Pro-Orça explorar |
|---|---|---|---|
| **Sienge** | ERP completo construtora | 30+ anos, BIM, IA Digital Employee | Fechado, caro, aprox. R$ 3-10k/mês; open-source é diferencial |
| **Orçafascio** | Orçamento + IA | Paramétrico IA, acelera 8x | Foco só em orçamento; integração fraca com projeto |
| **Volare (PINI/Sienge)** | Orçamento detalhado | TCPO oficial | Interface datada; não é cloud-first |
| **AltoQi Builder** | Orçamento + ERP | Integra com AltoQi Eberick (estrutural) | Foco em pequeno/médio |
| **TQS / Eberick** | Cálculo estrutural | Padrão do mercado | Não faz orçamento |
| **Mobuss / Obra Prima** | Gestão de obra | Mobile-first | Não faz orçamento a fundo |
| **Construtivo** | Colaboração | Foco em projeto | Não faz orçamento |
| **Planbox** | Planejamento | Projetos públicos | Não integra a orçamento detalhado |
| **UAU / Mega / Siplan** | ERPs tradicionais | Contabilidade | Obsoleto na UX |
| **Dialog Engenharia** | Consultoria + sistema | Premium | Caro, fechado |
| **Focus no Obra / BrickUp / Planilhas de Obra** | Orçamento simples | Cloud, preço baixo | Não escala |

**Posicionamento sugerido ao Pro-Orça:** "O ÚNICO aberto, moderno e com IA que une PROJETO + ORÇAMENTO + RASTREABILIDADE até o HABITE-SE, com human-in-the-loop e ART do engenheiro."

### 6.4 Priorização Now / Next / Later

**NOW (0-6 meses):** Core do orçamento
- Composições CPU nativas
- Curva ABC automática
- BDI configurável com presets TCU
- Biblioteca SINAPI integrada (leitura — não redistribuir)
- Memorial descritivo e memorial de cálculo gerados
- Export Excel / PDF / IFC
- Agente "Validador de Sanidade" (IA compara com benchmark)

**NEXT (6-12 meses):** Adjacências imediatas
- Agente Viabilidade (DRE em 1 min a partir do orçamento)
- Agente Cronograma Físico-Financeiro
- Agente Compatibilização BIM (clash detection)
- Agente Cotação Eletrônica
- Agente Tributário (RET vs. alternativas)
- Versionamento e diff de orçamentos

**LATER (12+ meses):** Oportunidades estratégicas
- Benchmarking anônimo entre construtoras
- Base histórica de preços reais (SINAPI-verdadeiro)
- Marketplace de orçamentistas freelance
- Agente TCU-proof (compliance licitação)
- Agente de seguros
- Inspeção predial pós-obra

---

<a id="7-mapa-features"></a>
## 7. Mapa de features e agentes IA do Pro-Orça

### 7.1 Agentes IA propostos (25 agentes)

| # | Agente | Função | Estado 🟡🔵🟢 |
|---|---|---|---|
| 1 | **Classificador de grau** | Recebe projeto e sugere tipo de orçamento adequado | Draft → Validated |
| 2 | **Validador de completude** | Checa se todas as disciplinas e peças estão presentes | |
| 3 | **Compatibilizador** | Roda clash detection em modelo BIM | |
| 4 | **Extrator de quantitativos** | Extrai QTO de IFC / Revit / DWG / PDF | |
| 5 | **Mapeador de composições** | Associa item do QTO a CPU SINAPI/TCPO | |
| 6 | **Cotador** | Busca fornecedores e cotações eletrônicas | |
| 7 | **Validador de sanidade** | Compara custo/m² com base histórica e benchmark | |
| 8 | **Analisador de curva ABC** | Prioriza itens críticos + sugere negociação | |
| 9 | **Configurador BDI** | Sugere BDI com base em Acórdão TCU + regime tributário | |
| 10 | **Agente Tributário** | RET vs. lucro real vs. presumido; simulação pós-reforma tributária | |
| 11 | **Agente Viabilidade** | DRE do empreendimento a partir do orçamento + hipóteses de venda | |
| 12 | **Agente Sensibilidade** | Monte Carlo, cenários otimista/realista/pessimista | |
| 13 | **Agente Cronograma** | Gera EAP física + financeira + Gantt + curva S | |
| 14 | **Agente Riscos** | Matriz de risco automática a partir da tipologia + contexto | |
| 15 | **Agente Memorial** | Gera memorial descritivo + memorial de cálculo | |
| 16 | **Agente PPCI** | Checklist de PPCI por tipologia + revisão de projeto | |
| 17 | **Agente Licenças** | Rastreador de alvarás, prazos, órgãos | |
| 18 | **Agente Canteiro** | Propõe layout, fluxos, custos de canteiro | |
| 19 | **Agente Cotação Eletrônica** | Envia RFQ a marketplaces integrados | |
| 20 | **Agente Medição** | Gera BM mensal a partir do diário de obra + fotos | |
| 21 | **Agente Aditivo** | Identifica quando aditivo/reequilíbrio é aplicável + gera documento | |
| 22 | **Agente PGRCC/ESG** | Plano de resíduos + rastreador de certificação | |
| 23 | **Agente Relatório Executivo** | Resume o projeto em 1 página para board | |
| 24 | **Agente Assistência Técnica** | Gera manual do proprietário + fluxo pós-obra | |
| 25 | **Agente Benchmarking** | Compara projeto com base anônima da comunidade | |

**Todos os agentes seguem o padrão 🟡 Draft → 🔵 Review → 🟢 Validated (engenheiro assina ART).**

### 7.2 Módulos premium (paid features)

- **Core orçamento** (free, open-source)
- **Pack Quantitativos BIM** (premium)
- **Pack Viabilidade** (premium — DRE, TIR, sensibilidade)
- **Pack Cronograma 4D** (premium)
- **Pack Contratação** (premium — quadro, seguros, minuta)
- **Pack Medição & Aditivo** (premium)
- **Pack ESG & Sustentabilidade** (premium)
- **Pack Público (Lei 14.133)** (premium)
- **Pack Hospitalar / Industrial / Infraestrutura** (premium por vertical)
- **Pack Benchmarking comunitário** (opt-in com partilha de dados anônimos)

### 7.3 Integrações necessárias

- **SINAPI** (Caixa / IBGE): leitura mensal
- **SICRO** (DNIT): leitura mensal
- **CUB** (SindusCon estaduais)
- **TCPO** (Sienge/PINI): API comercial
- **IFC 2x3 / IFC4** (buildingSMART): importação
- **Autodesk Revit / Navisworks**: add-in
- **Power BI / Looker**: exportação
- **ERPs** (Sienge, TOTVS, SAP, UAU, Mega): conectores via webhook/API
- **Bancos** (Caixa, Itaú, BB): integração de financiamento à produção
- **ICP-Brasil**: assinatura digital de documentos
- **CREA/CAU**: geração de ART/RRT
- **Prefeituras** (APIs de alvará — onde disponível)
- **Marketplaces** (Mercado Eletrônico, Nimbi, Linkana)
- **Cartório** (e-Notariado, registro)
- **Seguradoras** (APIs de cotação)
- **INMET / CPTEC**: meteorologia
- **ABNT**: catálogo de normas

---

<a id="8-pontos-cegos"></a>
## 8. Pontos cegos — o que você (Roque) pode estar esquecendo

### 8.1 Do ponto de vista de produto

1. **Orçamentos são DOCUMENTOS JURÍDICOS em obras públicas** — rastreabilidade, versionamento, assinatura digital ICP-Brasil e ART são tão importantes quanto o cálculo. Se o Pro-Orça não gerar artefato auditável, não serve para o mercado público (60% do TAM).
2. **Dado de cotação é perecível** — um orçamento vale por 30-60 dias. Você precisa de mecanismo de "envelhecimento" + alertas para atualizar.
3. **Curva de aprendizado do orçamentista é alta** — eles SABEM o que estão fazendo e são extremamente resistentes a IA. "Human-in-the-loop com ART" é o correto, mas a UX precisa respeitar o fluxo mental do profissional, não substituí-lo.
4. **Construtora tem dados em silos** — o Pro-Orça precisa de **conectores** fortes com ERPs (Sienge, TOTVS) para não ser "mais um sistema pra preencher".
5. **Diferentes personas com necessidades opostas** — o orçamentista quer precisão; o diretor quer rapidez; o CEO quer síntese. O produto precisa de **3 UIs/visões** para a mesma informação.
6. **Regionalização é crítica** — SP ≠ NE ≠ Norte. Preços, mão-de-obra, logística e cultura variam brutalmente. Sua primeira versão DEVE ter presets regionais.

### 8.2 Do ponto de vista de negócio

7. **Vendas B2B para construtora são longas (6-18 meses)** — PoC, caso de uso, comprovação ROI, negociação contratual, compliance TI. Plano de caixa do Pro-Orça precisa suportar isso.
8. **Concorrência indireta é Excel + planilha + engenheiro sênior** — a construtora B2B não quer "mais uma ferramenta"; quer substituir 3 planilhas por uma experiência.
9. **Ganhar o orçamentista-chave é a estratégia** — ele é o influenciador técnico dentro da empresa. Programa de embaixadores + comunidade é a forma.
10. **Construtoras conservadoras sobrevivem crises** — MRV, Tenda, Cyrela, Eztec... são alvos de Enterprise; Next Level e Direcional são middle; small é a cauda longa. **Open-core cabe na cauda longa e middle — Enterprise não vai adotar open-source sem licença comercial paga**.
11. **Seu "concorrente" é o CTO da construtora que resolveu fazer internamente** — a decisão "build vs. buy" é real. Tenha argumentos.
12. **Agentes IA precisam ser explicáveis** — engenheiro não assina ART em caixa-preta. XAI (Explainable AI) vira feature.
13. **Privacidade de dados é obrigatória** — LGPD + segredo comercial. Orçamento é informação concorrencial sensível. Criptografia em repouso + em trânsito + controle de acesso.
14. **Soberania de dados** — construtora grande vai exigir deployment on-premise ou em nuvem brasileira (Oracle BR, Azure BR, AWS São Paulo). Não pode ficar só em infra EUA.
15. **Patentes de composições privadas** — TCPO é proprietário; SINAPI é público. Cuidado com redistribuição não autorizada.

### 8.3 Do ponto de vista técnico

16. **Parsers BIM são a coisa mais difícil** — IFC é padrão aberto mas cada ferramenta exporta diferente. Um bug de parser = orçamento errado = perda de contrato. Invista pesado.
17. **Reconhecimento de plantas 2D (CAD/PDF)** — IA ainda tem dificuldade com escalas, legendas inconsistentes, convenções. Fluxo humano-assistido é melhor ROI hoje.
18. **Cálculo reverso (pricing)** — dado custo-meta + tipologia, sugerir especificações. "Value engineering" automatizado é diferencial raríssimo.
19. **Histórico fica obsoleto rápido** — um orçamento de 2 anos atrás sem atualização vale pouco. Mecanismo de atualização automática é essencial.
20. **Multiempresa / multi-obra / multi-orçamento** — estrutura de dados precisa permitir comparar entre empresas, obras e versões.

### 8.4 Perguntas que você PRECISA responder para Pro-Orça

1. **Qual é o MVP mínimo indispensável?** (minha sugestão: QTO básico + CPU + BDI + export + validador de sanidade)
2. **Quem é o usuário-zero?** (se for a sócia MPD/MHA → caso hospital)
3. **Qual é o ICP (perfil ideal de cliente)?** (construtora média 20-200 obras/ano, OU incorporadora média, OU orçamentista freelance)
4. **Qual modelo de receita dominante?** (por obra, por seat, por orçamento, por módulo, por agente)
5. **Qual comunidade vai contribuir com composições?** (orçamentistas autônomos via GitHub / fórum dedicado / Telegram)
6. **Quem assina ART das composições "da comunidade"?** (necessário para uso comercial)
7. **Qual é a defensa contra "qualquer um pode copiar o open-source"?** (rede + dados + agentes IA + integração)
8. **Qual o plano para obras públicas?** (feature completo de licitação pública, senão você perde metade do mercado)
9. **Qual o ponto de virada (tipping point)?** (número mínimo de clientes pagantes para sustentar)
10. **Você tem um orçamentista sênior no time fundador?** (imprescindível — não dá pra fingir esse conhecimento)

---

<a id="9-bibliografia"></a>
## 9. Bibliografia, normas e fontes

### 9.1 Livros essenciais

- **MATTOS, A. D.** *Como Preparar Orçamentos de Obras: Dicas para Orçamentistas, Estudos de Caso, Exemplos*. 3ª ed. São Paulo: Oficina de Textos, 2019.
- **MATTOS, A. D.** *Planejamento e Controle de Obras*. São Paulo: Oficina de Textos, 2010.
- **GOLDMAN, P.** *Introdução ao Planejamento e Controle de Custos na Construção Civil Brasileira*. 4ª ed. São Paulo: Pini, 2004.
- **TISAKA, M.** *Orçamento na Construção Civil*. 2ª ed. São Paulo: Pini, 2011.
- **LIMMER, C. V.** *Planejamento, Orçamentação e Controle de Projetos e Obras*. Rio de Janeiro: LTC, 1997.
- **DIAS, P. R. V.** *Engenharia de Custos: uma metodologia de orçamentação para obras civis*. 10ª ed. Rio de Janeiro: COPIARE, 2017.
- **SOUZA, U. E. L. de.** *Como Reduzir Perdas nos Canteiros: Manual de Gestão do Consumo de Materiais na Construção Civil*. São Paulo: Pini, 2005.
- **SOUZA, U. E. L. de.** *Como Aumentar a Eficiência da Mão-de-Obra*. São Paulo: Pini, 2006.
- **FORMOSO, C. T.** (vários artigos NORIE-UFRGS sobre Lean e perdas)
- **CARDOSO, F. F.** (USP-Poli) — Lean construction e gestão
- **MUTTI, C. do N.** *Administração da Construção*. 4ª ed. Florianópolis: UFSC, 2013.
- **MÁLAGA, J.** *Engenharia de Custos*. (múltiplas edições)
- **LIMA JR, J. R.; ROCHA LIMA JR., J. R.** — textos NRE-POLI USP sobre análise de empreendimentos
- **LARA, M. R.** *Incorporação Imobiliária* (diversos)

### 9.2 Normas ABNT essenciais

- NBR 12721:2006 — Avaliação de custos unitários de construção
- NBR 6118:2014 — Projeto de estruturas de concreto
- NBR 9050:2020 — Acessibilidade
- NBR 14037:2014 — Manual de uso, operação e manutenção
- NBR 5674:2012 — Manutenção de edificações
- NBR 16280:2015 — Reforma em edificações
- NBR 16747:2020 — Inspeção predial
- NBR 14653 (partes 1 a 7) — Avaliação de bens
- NBR 15575:2024 — Desempenho de edifícios habitacionais
- NBR 7256:2021 — Climatização em EAS
- NBR 15558:2008 — Gases medicinais
- NBR 13534:2008 — Instalações elétricas em EAS
- NBR 10152:2020 — Acústica
- NBR 9077:2001 — Saídas de emergência
- NBR 5419 (várias partes) — SPDA
- NBR 13103:2020 — Gás combustível

### 9.3 Legislação

- **Lei 10.931/2004** — patrimônio de afetação e RET
- **Lei 14.133/2021** — Nova Lei de Licitações
- **Decreto 7.983/2013** — obrigatoriedade SINAPI
- **Decreto 12.343/2024** — atualização de valores Lei 14.133
- **IN SEGES/MP 5/2017** — terceirização/contratações
- **RDC 50/2002 ANVISA** — EAS
- **CONAMA 307/2002** — resíduos construção civil
- **Lei 8.078/1990 (CDC)** — garantia ao consumidor
- **Art. 618 Código Civil** — garantia quinquenal
- **LC 214/2025** — reforma tributária (impactos no RET e setor)

### 9.4 Orientações IBRAOP

- OT-IBR 001/2006 — Projeto básico para edificação
- OT-IBR 004/2012 — Projeto básico / projeto executivo
- OT-IBR 006/2016 — Anteprojeto de engenharia
- OT-IBR 009/2024 — Reequilíbrio econômico-financeiro

### 9.5 Acórdãos e jurisprudência TCU

- **Acórdão 2622/2013-TCU-Plenário** — BDI de referência
- **Súmula TCU 258** — BDI não pode conter IRPJ/CSLL
- **Súmula TCU 262** — preço unitário acima do referencial
- **Acórdão 1977/2013** — SINAPI e SICRO
- Decisão 348/1999 — CPU analítica

### 9.6 Sites e fontes online

- SINAPI / IBGE: https://www.ibge.gov.br/estatisticas/economicas/precos-e-custos/9270
- Caixa SINAPI: https://www.caixa.gov.br/poder-publico/modernizacao-gestao/sinapi/
- SICRO DNIT: https://www.gov.br/dnit/pt-br/assuntos/planejamento-e-pesquisa/custos-e-pagamentos
- CUB CBIC: http://cub.org.br
- SindusCon-SP: https://sindusconsp.com.br
- CBIC: https://cbic.org.br
- ABRAINC: https://www.abrainc.org.br
- TCU: https://portal.tcu.gov.br
- IBRAOP: https://www.ibraop.org.br
- Secovi-SP: https://www.secovi.com.br
- NRE-POLI USP: https://www.nre.poli.usp.br
- Blog Sienge: https://sienge.com.br/blog
- Blog Orçafascio: https://www.orcafascio.com/papodeengenheiro
- Blog i9 Orçamentos: https://www.i9orcamentos.com.br
- Blog ObraPrima: https://blog.obraprima.eng.br
- Blog AltoQi Suporte: https://suporte.altoqi.com.br

### 9.7 Revistas e publicações

- Revista PINI / Construção Mercado
- Revista Téchne (Pini)
- Revista Construção (Pini)
- Revista AU (Arquitetura e Urbanismo)
- Revista Projeto
- Exame — Construção
- Valor Econômico — Construção
- Colliers, JLL, Buildings (relatórios de mercado corporativo)

### 9.8 Comunidades e grupos

- Grupos LinkedIn de orçamentistas
- ANTAC — Associação Nacional de Tecnologia do Ambiente Construído (SIBRAGEC)
- IGLC — International Group for Lean Construction
- ENEGEP — Encontro Nacional de Engenharia de Produção
- Clube do Engenheiro Civil

---

## Nota final para Roque

Este documento é a "base mental" do Pro-Orça — o que um orçamentista sênior **precisa** dominar, o que a construtora **quer** saber, e onde estão as **oportunidades** que ninguém no Brasil está explorando direito.

A estratégia recomendada:
1. **Comece pelo caso MPD/MHA (hospital anteprojeto)** — ganhe um cliente-âncora com um caso difícil
2. **Open-source o core** — para atrair comunidade de orçamentistas e transparência
3. **Monetize adjacências** — viabilidade, cronograma, cotação, benchmarking
4. **Integre pesado** — SINAPI, SICRO, ERPs, BIM
5. **Privilegie rastreabilidade** — obras públicas são 60% do mercado brasileiro

Todo feature deve passar pelo **teste do orçamentista-zero**: "isso economizaria meu tempo ou aumentaria minha assertividade?". Se não, corta.

---

**Arquivos companheiros:**
- `Pro-Orca_GodMode_Dashboard.html` — dashboard interativo das 300+ perguntas
- `Pro-Orca_Blueprint_v2.md` — blueprint mestre do produto (já existente)
