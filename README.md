# Aerocode CLI

Sistema para gerenciamento da produção de aeronaves.

Instalação

1. Instale dependências:

   npm install

2. Para desenvolvimento direto (requer ts-node):

   npm run dev

3. Para compilar e executar:

   npm run build
   npm start

Visão geral do CLI

O CLI usa um menu interativo construído dinamicamente:

- Se você não estiver logado: as opções exibidas são `Login` e `Sair`.
- Após login: você verá `Logout (usuario)`, `Cadastrar Aeronave`, `Listar Etapas`, `Atualizar Status`, `Gerar Relatório` e `Sair`.
- A opção `Gerenciar Funcionários` aparece apenas para usuários com papel `ADMINISTRADOR`.

Usuário inicial (criado automaticamente na primeira execução)

- usuário: `admin`
- senha: `admin123`

Comandos / fluxos principais

- Login: autentica o usuário no sistema.
- Gerenciar Funcionários (apenas ADMIN): submenu com opções para Listar, Cadastrar, Editar e Excluir funcionários.
  - Ao cadastrar um funcionário, apenas administradores podem executar essa ação.
  - Ao editar/excluir um usuário que seja ADMIN, o sistema pede confirmação explícita (digite `CONFIRMAR`).
- Cadastrar Aeronave: cria uma nova aeronave (somente ADMIN e ENGENHEIRO podem cadastrar).
- Listar Etapas: exibe o progresso das etapas de uma aeronave.
- Atualizar Status: permite atualizar peças, etapas ou registrar testes.
- Gerar Relatório: gera um arquivo texto em `relatorios/relatorio_<codigo>.txt`.

Persistência e auditoria

- Dados de usuários: `data/users.txt` (JSON por linha).
- Dados de aeronaves: `data/aeronaves.txt` (JSON por linha).
- Auditoria de alterações em usuários: `data/user_audit.txt` (texto por linha) com formato:
  TIMESTAMP | action:ACTION | actor:ACTOR_ID | target:TARGET_ID | usuario:USERNAME | nivel:ROLE

Segurança e permissões

- Senhas atualmente armazenadas em texto simples.
- Apenas administradores podem criar novos funcionários e alterar/excluir outros usuários.
- Funcionários não-admins podem alterar apenas seus próprios dados.
- O sistema previne automaticamente a exclusão ou despromoção do último administrador.

Exemplo de uso rápido

1. Inicie o CLI:

   npm run dev

2. Selecione `Login` e entre com o usuário `admin` / `admin123`.
3. Selecione `Gerenciar Funcionários` (apenas visível para admins) e escolha `Cadastrar novo`.


