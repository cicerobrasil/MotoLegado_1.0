# 🚀 Guia de Configuração do Supabase & Google OAuth no MotoLegado

Este guia orienta a conexão da sua aplicação **MotoLegado** ao seu próprio projeto **Supabase** com autenticação completa (E-mail/Senha e Google OAuth) e banco relacional PostgreSQL.

---

## 📋 Passo 1: Criar o Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com) e faça login ou crie uma conta gratuita.
2. Clique em **"New project"**.
3. Escolha uma organização, defina o nome do projeto (ex: `motolegado-saas`) e gere uma senha de banco segura.
4. Escolha a região mais próxima (ex: `South America (São Paulo)`).
5. Clique em **"Create new project"** e aguarde a inicialização (~1 minuto).

---

## 🗄️ Passo 2: Executar o Script de Tabelas (SQL Schema)
1. No painel do seu projeto Supabase, acesse a aba **SQL Editor** (ícone `>_` no menu lateral).
2. Clique em **"New query"**.
3. Copie todo o conteúdo do arquivo `supabase/schema.sql` deste projeto e cole no editor.
4. Clique no botão **"Run"** (ou aperte `Ctrl + Enter` / `Cmd + Enter`).
5. Todas as tabelas (`profiles`, `logbook_trips`, `routes`, `moto_clubs`, `events`, `partners`, etc.) e políticas RLS de segurança serão criadas instantaneamente.

---

## 🔑 Passo 3: Configurar as Variáveis de Ambiente
1. No painel do Supabase, clique no ícone de engrenagem **Project Settings** (canto inferior esquerdo).
2. Acesse a aba **API**.
3. Copie os dois valores:
   - **Project URL** (ex: `https://xyzcompany.supabase.co`)
   - **Project API keys -> `anon` / `public`** (chave JWT longa)
4. No arquivo `.env` da aplicação (ou nas Configurações de Segredos), preencha:
```env
VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
VITE_SUPABASE_ANON_KEY="sua-chave-anonima-publica"
```

---

## 🌐 Passo 4: Ativar o Login com Google (Google OAuth)

### 4.1. Criar Credenciais no Google Cloud Console
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. Em **APIs & Services > Credentials**, clique em **Create Credentials > OAuth Client ID**.
3. Escolha o tipo **Web application**.
4. Em **Authorized redirect URIs**, adicione a URL de callback do seu Supabase:
   ```
   https://<SEU-PROJECT-ID>.supabase.co/auth/v1/callback
   ```
5. Copie o **Client ID** e o **Client Secret** gerados.

### 4.2. Habilitar o Provedor Google no Supabase
1. No painel do Supabase, vá em **Authentication > Providers**.
2. Clique em **Google** e marque como **Enabled**.
3. Cole o **Client ID** e o **Client Secret** obtidos no Google Cloud.
4. Em **Authentication > URL Configuration**, certifique-se de que a **Site URL** ou **Redirect URLs** contenha a URL do seu aplicativo MotoLegado.
5. Salve as alterações.

---

## ✅ Pronto!
Agora os pilotos podem:
- Criar conta e logar com e-mail e senha no Supabase;
- Fazer login com um clique via **Google OAuth**;
- Ter o perfil (`profiles`) criado e sincronizado automaticamente na nuvem.
