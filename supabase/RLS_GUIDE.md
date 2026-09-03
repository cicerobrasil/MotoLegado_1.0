# 🛡️ Auditoria & Revisão de Políticas RLS (Supabase) - MotoLegado SaaS

Este documento detalha todas as políticas de **Row Level Security (RLS)** criadas e revisadas no arquivo `supabase/schema.sql`.

---

## 🔍 Principais Vulnerabilidades Corrigidas

1. **Eliminação de Recursão Infinita em `club_members`**:
   - *Antes*: A política consultava a própria tabela `club_members` de forma recursiva, gerando erro de banco `42P17: infinite recursion detected`.
   - *Correção*: Criada a função `public.is_club_admin()` com tag `SECURITY DEFINER`, que executa fora do contexto de RLS da tabela.

2. **Permissão de Moderação Centralizada (Admin Bypass)**:
   - *Antes*: Somente o autor do registro podia editar ou excluir itens (`auth.uid() = author_id`). Isso impedia a Central de Comando (Admin) de aprovar ou rejeitar roteiros, eventos e moto clubes.
   - *Correção*: Implementada a função `public.is_admin()` e `public.is_moderator()`, concedendo poderes de moderação sobre todas as tabelas aos administradores autenticados.

3. **Compatibilidade Dual de IDs no Diário de Bordo (`user_id` e `pilot_id`)**:
   - Criado trigger `handle_logbook_sync()` que preenche automaticamente qualquer uma das duas colunas para nunca quebrar consultas do frontend.

4. **Sincronização Automática com Supabase Auth**:
   - Trigger `handle_new_user()` cria automaticamente a linha do perfil em `public.profiles` sempre que um usuário se cadastra por e-mail ou Google, promovendo o e-mail administrador imediatamente a `role = 'admin'`.

5. **Proteção de Storage (Bucket `motolegado-media`)**:
   - Acesso público para visualização de fotos de motos, comprovantes e logotipos;
   - Apenas usuários logados podem fazer upload de novos arquivos;
   - Somente o proprietário ou administradores podem excluir mídias.

---

## 📋 Como Aplicar no seu Projeto Supabase (Passo a Passo)

1. Acesse seu painel no [Supabase](https://supabase.com/dashboard).
2. Selecione seu projeto **MotoLegado**.
3. No menu lateral esquerdo, clique no ícone **SQL Editor** (`>_`).
4. Clique em **"New query"** (Nova consulta).
5. Copie todo o código do arquivo `supabase/schema.sql` e cole no editor.
6. Clique no botão verde **"Run"** (ou aperte `Ctrl + Enter` / `Cmd + Enter`).

> 💡 **Nota de Segurança**: O script é **idempotente** (utiliza `IF NOT EXISTS` e `DROP POLICY IF EXISTS`), portanto você pode executá-lo a qualquer momento sem risco de apagar dados existentes.

---

## 📊 Matriz de Permissões RLS por Tabela

| Tabela | SELECT (Leitura) | INSERT (Criação) | UPDATE (Edição) | DELETE (Exclusão) |
| :--- | :--- | :--- | :--- | :--- |
| **`profiles`** | Público (Todos) | Próprio Usuário ou Admin | Próprio Usuário ou Admin | Próprio Usuário ou Admin |
| **`logbook_trips`** | Dono do Diário ou Admin | Dono do Diário | Dono do Diário ou Admin | Dono do Diário ou Admin |
| **`routes`** | Aprovados (Público) / Pendentes (Autor/Admin) | Usuário Autenticado | Autor ou Admin | Autor ou Admin |
| **`events`** | Aprovados (Público) / Pendentes (Criador/Admin) | Usuário Autenticado | Criador ou Admin | Criador ou Admin |
| **`event_checkins`** | Público (Todos) | Usuário Autenticado | — | Próprio Usuário ou Admin |
| **`moto_clubs`** | Aprovados (Público) / Pendentes (Fundador/Admin) | Usuário Autenticado | Fundador/Diretoria ou Admin | Fundador ou Admin |
| **`club_members`** | Público (Todos) | Usuário (Solicitação) ou Diretoria | Próprio Usuário ou Diretoria | Próprio Usuário ou Diretoria |
| **`club_mural_posts`** | Membros Ativos do Clube ou Admin | Membros Ativos do Clube | Autor ou Diretoria | Autor ou Diretoria |
| **`partners`** | Aprovados (Público) / Pendentes (Dono/Admin) | Usuário Autenticado | Dono ou Admin | Dono ou Admin |
| **`community_posts`** | Aprovados (Público) / Pendentes (Autor/Admin) | Usuário Autenticado | Autor ou Admin | Autor ou Admin |
| **`community_reports`** | Relator ou Moderadores/Admin | Usuário Autenticado | Moderadores/Admin | Admin |
| **`storage.objects`** | Público (Mídias abertas) | Usuários Autenticados | Dono do Arquivo ou Admin | Dono do Arquivo ou Admin |
