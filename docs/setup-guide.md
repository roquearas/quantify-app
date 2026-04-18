# Quantify — Guia de Setup Completo

## Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase (já criada: projeto `rrfmfybklhlaoaxmhdyr`)
- Conta na Vercel (para deploy)

---

## Passo 1: Senha do Banco de Dados

1. Acesse o Supabase Dashboard:
   **https://supabase.com/dashboard/project/rrfmfybklhlaoaxmhdyr/settings/database**

2. Na seção "Database Password", clique em **"Reset database password"** (ou copie se já souber)

3. Abra o arquivo `.env` na raiz do projeto e substitua `YOUR_PASSWORD_HERE` pela senha nos dois lugares:

```env
DATABASE_URL="postgresql://postgres.rrfmfybklhlaoaxmhdyr:SUA_SENHA_AQUI@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.rrfmfybklhlaoaxmhdyr:SUA_SENHA_AQUI@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

**IMPORTANTE:** Se sua senha tiver caracteres especiais (`@`, `#`, `%`, etc.), encode-os na URL. Ex: `@` vira `%40`.

---

## Passo 2: Criar as Tabelas no Supabase

1. Acesse o SQL Editor:
   **https://supabase.com/dashboard/project/rrfmfybklhlaoaxmhdyr/sql/new**

2. Abra o arquivo `supabase/migration_001_init.sql` do projeto

3. Copie TODO o conteúdo e cole no SQL Editor

4. Clique em **"Run"** (ou Cmd+Enter)

5. Deve aparecer: `Migração concluída com sucesso!`

Isso cria todas as 15 tabelas, enums, índices, triggers de `updated_at`, políticas RLS de isolamento multi-tenant, e dados iniciais de demonstração.

---

## Passo 3: Configurar Auth no Supabase

1. Acesse **Authentication > URL Configuration**:
   **https://supabase.com/dashboard/project/rrfmfybklhlaoaxmhdyr/auth/url-configuration**

2. Configure:
   - **Site URL:** `http://localhost:3000` (dev) ou sua URL da Vercel (prod)
   - **Redirect URLs:** Adicione:
     - `http://localhost:3000/auth/callback`
     - `https://SEU-DOMINIO.vercel.app/auth/callback`

3. Em **Authentication > Providers**, verifique que **Email** está habilitado (vem por padrão)

---

## Passo 4: Rodar Localmente

```bash
cd pro-orca

# Instalar dependências
npm install

# Gerar o Prisma Client
npx prisma generate

# Rodar em desenvolvimento
npm run dev
```

Acesse **http://localhost:3000** — deve aparecer a tela de login.

Para criar seu primeiro usuário:
1. Clique em "Criar Conta"
2. Use o email que quiser
3. Confirme no email (Supabase envia automaticamente)
4. Depois do primeiro login, vincule o `auth_id` ao usuário na tabela `users`:

```sql
-- Rode no SQL Editor do Supabase após o primeiro login
UPDATE users
SET auth_id = (SELECT id FROM auth.users WHERE email = 'SEU_EMAIL_AQUI')
WHERE email = 'admin@quantify.com.br';
```

Ou atualize o email do usuário seed para o seu email antes de rodar a migração.

---

## Passo 5: Deploy na Vercel

1. Suba o código para um repositório GitHub

2. Na Vercel (**https://vercel.com/new**):
   - Importe o repositório
   - Framework: **Next.js** (detectado automaticamente)
   - Root directory: `pro-orca` (se estiver dentro de uma pasta)

3. Configure as **Environment Variables** na Vercel:
   - `DATABASE_URL` — a mesma URL com porta 6543 e `?pgbouncer=true`
   - `DIRECT_URL` — a mesma URL com porta 5432 (sem pgbouncer)
   - `NEXT_PUBLIC_SUPABASE_URL` — `https://rrfmfybklhlaoaxmhdyr.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — a anon key do `.env`

4. Clique **Deploy**

5. Após deploy, volte ao Supabase e adicione a URL da Vercel nos Redirect URLs (Passo 3)

---

## Estrutura de Arquivos Chave

```
pro-orca/
├── .env                          # Variáveis de ambiente (NÃO commitar!)
├── prisma/
│   └── schema.prisma             # Schema do banco (15 models, 13 enums)
├── prisma.config.ts              # Config do Prisma 7 (URL do banco)
├── supabase/
│   └── migration_001_init.sql    # SQL de criação das tabelas
├── src/
│   ├── middleware.ts              # Proteção de rotas (auth)
│   ├── lib/
│   │   ├── prisma.ts             # Cliente Prisma (singleton)
│   │   └── supabase/
│   │       ├── server.ts         # Supabase para Server Components
│   │       ├── client.ts         # Supabase para Client Components
│   │       └── middleware.ts     # Refresh de sessão
│   ├── app/
│   │   ├── layout.tsx            # Root layout (limpo)
│   │   ├── login/                # Página de login
│   │   ├── signup/               # Página de registro
│   │   ├── auth/                 # Callback e signout
│   │   └── (dashboard)/          # Todas as páginas protegidas
│   │       ├── layout.tsx        # Layout com sidebar + header
│   │       ├── page.tsx          # Dashboard principal
│   │       ├── projetos/         # CRUD de projetos
│   │       ├── orcamentos/       # Orçamentos + Curva ABC + BDI
│   │       ├── cotacoes/         # Cotações do marketplace
│   │       ├── validacoes/       # Validação humana
│   │       ├── parceiros/        # Parceiros/Fornecedores
│   │       ├── documentos/       # Documentos técnicos
│   │       └── configuracoes/    # Configurações da empresa
│   └── components/
│       ├── sidebar.tsx
│       └── header.tsx
```

---

## Próximos Passos (Features)

Após a infra estar rodando, as features pendentes são:

1. **Upload de documentos** — Supabase Storage para PDFs/plantas
2. **Processamento IA** — Extrair dados de plantas/memoriais (OpenAI/Anthropic)
3. **Importação SINAPI** — Parser dos CSVs da Caixa Federal
4. **Notificações** — Email transacional (Resend ou SendGrid)
5. **Pagamentos** — Stripe para planos premium
6. **Exportação** — PDF/Excel dos orçamentos
7. **Marketplace** — Portal do fornecedor para responder cotações
