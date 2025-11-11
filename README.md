# Aerocode - Sistema de Produção de Aeronaves

Sistema completo para gerenciamento da produção de aeronaves com interface CLI e GUI web.

## Visão Geral

O projeto possui duas interfaces:
- **CLI**: Interface de linha de comando original
- **GUI Web**: Interface web moderna com React, TypeScript e Vite

## Instalação
### Clone o repositório
```bash
git clone https://github.com/jofran2001/Atv2.git
cd Atv2
```

### Instalar dependências

Backend (raiz do projeto):
```bash
npm install
```

Frontend (dentro da pasta `frontend`):
```bash
cd frontend
npm install
```

## Execução

### Modo Web (GUI)

Para usar a interface web:

1. **Terminal 1** - Inicie o servidor backend (na raiz do projeto):
```bash
npm run server
```

2. **Terminal 2** - Inicie o frontend:
```bash
cd frontend
npm i
npm run dev
```

3. Acesse no navegador: `http://localhost:5173`

### Login Inicial

- **Usuário:** `admin`
- **Senha:** `admin123`

Este usuário é criado automaticamente na primeira execução.

## Funcionalidades

### Dashboard
- Visão geral de todas as aeronaves
- Estatísticas: total de aeronaves, concluídas, em andamento, testes realizados

### Gerenciamento de Aeronaves
- Listagem de todas as aeronaves cadastradas
- Cadastro de novas aeronaves (apenas ADMIN e ENGENHEIRO)
- Detalhamento: peças, etapas, testes

### Gerenciamento de Peças
- Visualização de peças por aeronave
- Cadastro de peças (Nacional/Importada)
- Atualização de status (Em Produção, Em Transporte, Pronta)

### Gerenciamento de Etapas
- Visualização de etapas de produção
- Cadastro de novas etapas
- Avanço de etapas (só avança se a anterior estiver concluída)
- Conclusão de etapas
- Associação de funcionários às etapas

### Gerenciamento de Testes
- Registro de testes (Elétrico, Hidráulico, Aerodinâmico)
- Resultados (Aprovado/Reprovado)


### Gerenciamento de Usuários (apenas ADMIN)
- Listagem de todos os usuários
- Cadastro de novos usuários
- Edição de usuários existentes
- Exclusão de usuários
- Alteração de permissões

## Permissões

### ADMINISTRADOR
- Acesso total ao sistema
- Gerenciar usuários
- Cadastrar aeronaves, peças, etapas
- Registrar testes
- Gerar relatórios

### ENGENHEIRO
- Cadastrar aeronaves, peças, etapas
- Registrar testes
- Gerar relatórios

### OPERADOR
- Registrar testes
- Visualizar informações

## Persistência e Auditoria

### Armazenamento
- **Usuários:** `data/users.txt` (JSON por linha)
- **Aeronaves:** `data/aeronaves.txt` (JSON por linha)
- **Relatórios:** `relatorios/relatorio_<codigo>.txt`
- **Auditoria:** `data/user_audit.txt`

### Formato de Auditoria
```
TIMESTAMP | action:ACTION | actor:ACTOR_ID | target:TARGET_ID | usuario:USERNAME | nivel:ROLE
```

## Segurança

- Senhas atualmente em texto plano (para desenvolvimento)
- Autenticação via sessão
- Controle de acesso por nível de permissão
- Prevenção de exclusão/despromoção do último administrador

## Tecnologias

### Backend
- Node.js
- TypeScript
- Express
- Inquirer (CLI)

### Frontend
- React
- TypeScript
- Vite
- CSS3 Moderno

## Estrutura do Projeto

```
Atv2/
├── backend/                  # Backend (antes era src/)
│   ├── auth/                 # Serviço de autenticação
│   ├── classes/              # Modelos de dados
│   ├── enums/                # Enumerações
│   ├── persistence/          # Persistência em arquivo
│   ├── services/             # Serviços de negócio
│   ├── main.ts               # Entry point CLI
│   └── server.ts             # Servidor Express (API)
├── frontend/                 # Frontend Web
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   ├── context/          # Contextos React
│   │   ├── services/         # Cliente API
│   │   └── types.ts          # Tipos TypeScript
│   └── ...
├── data/                     # Dados (gerado automaticamente)
└── relatorios/               # Relatórios (gerado automaticamente)
```

## Exemplo de Uso Rápido

### Via Web (GUI)

1. Inicie o servidor (raiz): `npm run server`
2. Inicie o frontend: `cd frontend && npm run dev`
3. Acesse: `http://localhost:5173`
4. Faça login com `admin / admin123`
5. Explore o dashboard e cadastre uma aeronave

### Via CLI

1. Execute (raiz): `npm run dev`
2. Selecione "Login" e entre com `admin / admin123`
3. Navegue pelo menu interativo

## Desenvolvimento

### Compilar Backend
```bash
npm run build
```

### Compilar Frontend
```bash
cd frontend
npm run build
```

### Preview Frontend
```bash
cd frontend
npm run preview
```

## Documentação de Userflows

O projeto inclui documentação completa dos fluxos de usuário:

- **USERFLOWS.md** - Userflows detalhados de cada tipo de usuário com passos completos
- **USERFLOWS_VISUAL.md** - Diagramas visuais e fluxogramas de processos
- **GUIA_RAPIDO.md** - Referência rápida e checklists

**Userflows disponíveis:**

### ADMINISTRADOR
1. Cadastrar Novo Funcionário
2. Editar Funcionário Existente
3. Cadastrar Nova Aeronave
4. Adicionar Peça a uma Aeronave
5. Criar e Gerenciar Etapas de Produção
6. Registrar Teste
7. Excluir Usuário

### ENGENHEIRO
1. Visualizar Dashboard
2. Cadastrar Nova Aeronave
3. Adicionar Peça e Atualizar Status
4. Configurar Etapas de Produção
5. Registrar Testes

### OPERADOR
1. Acesso Limitado ao Sistema
2. Registrar Teste de Aeronave
3. Visualizar Dashboard Somente Leitura

Ver arquivos de documentação para detalhes completos de cada fluxo.
