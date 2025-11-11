import inquirer from 'inquirer';
import { AuthService } from './auth/authService';
import { ProductionService } from './services/productionService';
import { Aeronave, Peca, Etapa, Teste } from './classes/models';
import { TipoAeronave, TipoPeca, StatusPeca, StatusEtapa, TipoTeste, ResultadoTeste, NivelPermissao } from './enums';

const auth = new AuthService();
const prod = new ProductionService();
let currentUser: any = null;

async function menuLogin() {
  const answers = await inquirer.prompt([
    { name: 'usuario', message: 'Usuário:', type: 'input', validate: (v: any) => v ? true : 'Informe o usuário' },
    { name: 'senha', message: 'Senha:', type: 'password', mask: '*', validate: (v: any) => v ? true : 'Informe a senha' }
  ] as any);
  const u = auth.authenticate(answers.usuario, answers.senha);
  if (!u) { console.log('Credenciais inválidas'); return; }
  currentUser = u;
  console.log(`Logado como ${u.nome} (${u.nivelPermissao})`);
}

async function menuCadastrarAeronave() {
  if (!currentUser) { console.log('Autentique-se primeiro'); return; }
  if (![NivelPermissao.ADMINISTRADOR, NivelPermissao.ENGENHEIRO].includes(currentUser.nivelPermissao)) { console.log('Permissão negada'); return; }
  const answers = await inquirer.prompt([
  { name: 'codigo', message: 'Código único:', type: 'input', validate: (v: any) => v ? true : 'Informe código' },
  { name: 'modelo', message: 'Modelo:', type: 'input', validate: (v: any) => v ? true : 'Informe modelo' },
    { name: 'tipo', message: 'Tipo:', type: 'list', choices: Object.values(TipoAeronave) },
    { name: 'capacidade', message: 'Capacidade (número):', type: 'input', validate: (v: any) => !isNaN(parseInt(v)) || 'Informe número' },
    { name: 'alcance', message: 'Alcance (km):', type: 'input', validate: (v: any) => !isNaN(parseFloat(v)) || 'Informe número' }
  ] as any);
  const a = new Aeronave(answers.codigo, answers.modelo, answers.tipo as any, parseInt(answers.capacidade), parseFloat(answers.alcance));
  prod.cadastrarAeronave(a);
  console.log('Aeronave cadastrada.');
}

async function menuListarEtapas() {
  const { codigo } = await inquirer.prompt([{ name: 'codigo', message: 'Código aeronave:', type: 'input', validate: (v: any) => v ? true : 'Informe código' }] as any);
  const a = prod.listAeronaves().find(x => x.codigo === codigo);
  if (!a) { console.log('Não encontrada'); return; }
  console.log('Etapas:');
  a.etapas.forEach((e: any, i: number) => console.log(`${i}: ${e.nome} | ${e.status} | Funcionários: ${e.funcionarios.join(',')}`));
}

async function menuAtualizarStatus() {
  if (!currentUser) { console.log('Autentique-se primeiro'); return; }
  const { codigo } = await inquirer.prompt([{ name: 'codigo', message: 'Código aeronave:', type: 'input', validate: (v: any) => v ? true : 'Informe código' }] as any);
  const { tipo } = await inquirer.prompt([{ name: 'tipo', message: 'Atualizar:', type: 'list', choices: ['peca','etapa','teste'] }]);
  if (tipo === 'peca') {
    const a = prod.listAeronaves().find(x => x.codigo === codigo);
    if (!a) { console.log('Aeronave não encontrada'); return; }
    if (a.pecas.length === 0) { console.log('Nenhuma peça cadastrada'); return; }
    const { idx, status } = await inquirer.prompt([
      { name: 'idx', message: 'Índice peça:', type: 'list', choices: a.pecas.map((p: any, i: number) => ({ name: `${i}: ${p.nome} | ${p.status}`, value: i })) },
      { name: 'status', message: 'Novo status:', type: 'list', choices: Object.values(StatusPeca) }
    ] as any);
    prod.atualizarStatusPeca(codigo, idx, status as any);
    console.log('Status da peça atualizado');
  } else if (tipo === 'etapa') {
    const a = prod.listAeronaves().find(x => x.codigo === codigo);
    if (!a) { console.log('Aeronave não encontrada'); return; }
    if (a.etapas.length === 0) { console.log('Nenhuma etapa cadastrada'); return; }
    const { idx, action } = await inquirer.prompt([
      { name: 'idx', message: 'Índice etapa:', type: 'list', choices: a.etapas.map((e: any, i: number) => ({ name: `${i}: ${e.nome} | ${e.status}`, value: i })) },
      { name: 'action', message: 'Ação:', type: 'list', choices: ['avancar','concluir','associar'] }
    ] as any);
  if (action === 'avancar') { prod.avancarEtapa(codigo, idx); console.log('Etapa avançada para ANDAMENTO'); }
  else if (action === 'concluir') { prod.concluirEtapa(codigo, idx); console.log('Etapa concluída'); }
  else if (action === 'associar') { const { fid } = await inquirer.prompt([{ name: 'fid', message: 'ID funcionário:', type: 'input', validate: (v:any)=>v?true:'Informe ID' }] as any); prod.associarFuncionarioEtapa(codigo, idx, fid); console.log('Funcionário associado'); }
  } else if (tipo === 'teste') {
    const { tipoTeste, resultado } = await inquirer.prompt([
      { name: 'tipoTeste', message: 'Tipo teste:', type: 'list', choices: Object.values(TipoTeste) },
      { name: 'resultado', message: 'Resultado:', type: 'list', choices: Object.values(ResultadoTeste) }
    ] as any);
    const test = new Teste(tipoTeste as any, resultado as any);
    prod.registrarTeste(codigo, test);
    console.log('Teste registrado');
  }
}

async function menuGerarRelatorio() {
  const { codigo } = await inquirer.prompt([{ name: 'codigo', message: 'Código aeronave:', type: 'input', validate: (v:any) => v ? true : 'Informe código' }] as any);
  const file = prod.gerarRelatorio(codigo);
  console.log('Relatório gerado em', file);
}

async function menuCadastrarPeca() {
  if (!currentUser) { console.log('Autentique-se primeiro'); return; }
  if (![NivelPermissao.ADMINISTRADOR, NivelPermissao.ENGENHEIRO].includes(currentUser.nivelPermissao)) { console.log('Apenas ADMIN/ENGENHEIRO podem cadastrar peças'); return; }
  const answers = await inquirer.prompt([
    { name: 'codigo', message: 'Código aeronave (associar a peça):', type: 'input', validate: (v:any) => v?true:'Informe código' },
    { name: 'nome', message: 'Nome da peça:', type: 'input', validate: (v:any) => v?true:'Informe nome' },
    { name: 'tipo', message: 'Tipo da peça:', type: 'list', choices: Object.values(TipoPeca) },
    { name: 'fornecedor', message: 'Fornecedor:', type: 'input' }
  ] as any);
  const p = new (await import('./classes/models')).Peca(answers.nome, answers.tipo as any, answers.fornecedor, undefined as any);
  // default status será EM_PRODUCAO
  p.status = (await import('./enums')).StatusPeca.EM_PRODUCAO;
  try { prod.adicionarPeca(answers.codigo, p); console.log('✅ Peça adicionada com sucesso.'); }
  catch (e:any) { console.log('Erro ao adicionar peça:', e.message || e); }
}

async function menuCadastrarEtapa() {
  if (!currentUser) { console.log('Autentique-se primeiro'); return; }
  if (![NivelPermissao.ADMINISTRADOR, NivelPermissao.ENGENHEIRO].includes(currentUser.nivelPermissao)) { console.log('Apenas ADMIN/ENGENHEIRO podem cadastrar etapas'); return; }
  const answers = await inquirer.prompt([
    { name: 'codigo', message: 'Código aeronave (associar a etapa):', type: 'input', validate: (v:any) => v?true:'Informe código' },
    { name: 'nome', message: 'Nome da etapa:', type: 'input', validate: (v:any) => v?true:'Informe nome' },
    { name: 'prazo', message: 'Prazo (dias):', type: 'input', validate: (v:any) => !isNaN(parseInt(v)) || 'Informe número' }
  ] as any);
  const e = new (await import('./classes/models')).Etapa(answers.nome, parseInt(answers.prazo), undefined as any);
  try { prod.adicionarEtapa(answers.codigo, e); console.log('✅ Etapa adicionada com sucesso.'); }
  catch (e:any) { console.log('Erro ao adicionar etapa:', e.message || e); }
}

async function menuRegistrarTeste() {
  if (!currentUser) { console.log('Autentique-se primeiro'); return; }
  if (![NivelPermissao.ADMINISTRADOR, NivelPermissao.ENGENHEIRO, NivelPermissao.OPERADOR].includes(currentUser.nivelPermissao)) { console.log('Permissão negada para registrar testes'); return; }
  const answers = await inquirer.prompt([
    { name: 'codigo', message: 'Código aeronave:', type: 'input', validate: (v:any) => v?true:'Informe código' },
    { name: 'tipoTeste', message: 'Tipo teste:', type: 'list', choices: Object.values(TipoTeste) },
    { name: 'resultado', message: 'Resultado:', type: 'list', choices: Object.values(ResultadoTeste) }
  ] as any);
  const t = new (await import('./classes/models')).Teste(answers.tipoTeste as any, answers.resultado as any);
  try { prod.registrarTeste(answers.codigo, t); console.log('✅ Teste registrado com sucesso.'); }
  catch (e:any) { console.log('Erro ao registrar teste:', e.message || e); }
}

async function menuGerenciarFuncionarios() {
  if (!currentUser) { console.log('Autentique-se primeiro'); return; }
  if (currentUser.nivelPermissao !== NivelPermissao.ADMINISTRADOR) { console.log('Apenas administradores podem gerenciar funcionários'); return; }
  while (true) {
    const { action } = await inquirer.prompt([{ name: 'action', message: 'Funcionários - escolha:', type: 'list', choices: [
      { name: 'Listar todos', value: 'listar' },
      { name: 'Cadastrar novo', value: 'cadastrar' },
      { name: 'Editar existente', value: 'editar' },
      { name: 'Excluir', value: 'excluir' },
      { name: 'Voltar', value: 'voltar' }
    ] }]);
    if (action === 'voltar') break;
    try {
      if (action === 'listar') {
        const users = auth.listUsers();
        console.log('Usuários:');
        users.forEach(u => console.log(`${u.id} | ${u.nome} | ${u.usuario} | ${u.nivelPermissao}`));
      } else if (action === 'cadastrar') {
        if (!currentUser) { console.log('Autentique-se primeiro'); continue; }
        if (currentUser.nivelPermissao !== NivelPermissao.ADMINISTRADOR) { console.log('Apenas administradores podem cadastrar novos funcionários.'); continue; }
        const answers = await inquirer.prompt([
          { name: 'id', message: 'ID (único):', type: 'input', validate: (v: any) => v?true:'Informe ID' },
          { name: 'nome', message: 'Nome:', type: 'input', validate: (v: any) => v?true:'Informe nome' },
          { name: 'telefone', message: 'Telefone:', type: 'input' },
          { name: 'endereco', message: 'Endereço:', type: 'input' },
          { name: 'usuario', message: 'Usuário:', type: 'input', validate: (v: any) => v?true:'Informe usuário' },
          { name: 'senha', message: 'Senha:', type: 'password', mask: '*', validate: (v: any) => v?true:'Informe senha' },
          { name: 'nivelPermissao', message: 'Nível:', type: 'list', choices: Object.values(NivelPermissao) }
        ] as any);
        const f = new (await import('./classes/models')).Funcionario(answers.id, answers.nome, answers.telefone, answers.endereco, answers.usuario, answers.senha, answers.nivelPermissao);
        try { auth.registerByActor(f, currentUser.id); console.log('✅ Funcionário cadastrado com sucesso.'); }
        catch (e:any) { console.log('Permissão negada ou erro:', e.message || e); }
      } else if (action === 'editar') {
        const users = auth.listUsers();
        const { id } = await inquirer.prompt([{ name: 'id', message: 'Escolha ID:', type: 'list', choices: users.map(u=>({ name: `${u.id} | ${u.nome}`, value: u.id })) }]);
        const u = auth.getUserById(id);
  if (!u) { console.log('Usuário não encontrado'); continue; }
        const answers = await inquirer.prompt([
          { name: 'nome', message: 'Nome:', type: 'input', default: u.nome },
          { name: 'telefone', message: 'Telefone:', type: 'input', default: u.telefone },
          { name: 'endereco', message: 'Endereço:', type: 'input', default: u.endereco },
          { name: 'usuario', message: 'Usuário:', type: 'input', default: u.usuario },
          { name: 'senha', message: 'Senha (deixe vazio para manter):', type: 'password', mask: '*' },
          { name: 'nivelPermissao', message: 'Nível:', type: 'list', choices: Object.values(NivelPermissao), default: u.nivelPermissao }
        ] as any);
        const novaSenha = answers.senha && answers.senha.length>0 ? answers.senha : u.senha;
        const willDemoteAdmin = u.nivelPermissao === NivelPermissao.ADMINISTRADOR && answers.nivelPermissao !== NivelPermissao.ADMINISTRADOR;
        if (willDemoteAdmin) {
          const { confirm } = await inquirer.prompt([{ name: 'confirm', message: `Atenção: você está prestes a despromover o administrador ${u.id}. Digite "CONFIRMAR" para continuar:`, type: 'input' }]);
          if (confirm !== 'CONFIRMAR') { console.log('Ação cancelada pelo usuário. Nenhuma alteração feita.'); continue; }
        }
        const updated = new (await import('./classes/models')).Funcionario(u.id, answers.nome, answers.telefone, answers.endereco, answers.usuario, novaSenha, answers.nivelPermissao);
        try { auth.updateUser(updated, currentUser?.id); console.log('✅ Usuário atualizado com sucesso.'); }
        catch (e:any) { console.log('Permissão negada ou erro:', e.message || e); }
      } else if (action === 'excluir') {
        const users = auth.listUsers();
        const { id } = await inquirer.prompt([{ name: 'id', message: 'Escolha ID para excluir:', type: 'list', choices: users.map(u=>({ name: `${u.id} | ${u.nome}`, value: u.id })) }]);
        const alvo = auth.getUserById(id);
        if (!alvo) { console.log('Usuário não encontrado'); continue; }
        if (alvo.nivelPermissao === NivelPermissao.ADMINISTRADOR) {
          const { confirm } = await inquirer.prompt([{ name: 'confirm', message: `Atenção: você está prestes a excluir o administrador ${alvo.id}. Digite "CONFIRMAR" para continuar:`, type: 'input' }]);
          if (confirm !== 'CONFIRMAR') { console.log('Ação cancelada pelo usuário. Nenhuma alteração feita.'); continue; }
        }
        try { auth.deleteUser(id, currentUser?.id); console.log('✅ Usuário excluído com sucesso.'); }
        catch (e:any) { console.log('Permissão negada ou erro:', e.message || e); }
      }
    } catch (e:any) { console.log('Erro:', e.message || e); }
  }
}

async function mainMenu() {
  console.log('\nAerocode - Sistema de Produção de Aeronaves (CLI)');
  while (true) {
    // construir menu dinamicamente baseado em currentUser
    const choices: Array<any> = [];
    if (!currentUser) {
      choices.push({ name: 'Login', value: 'login' });
      choices.push({ name: 'Sair', value: 'sair' });
    } else {
      choices.push({ name: `Logout (${currentUser.usuario})`, value: 'logout' });
      // mostrar gerenciamento de funcionários apenas para admins
      if (currentUser.nivelPermissao === NivelPermissao.ADMINISTRADOR) {
        choices.push({ name: 'Gerenciar Funcionários', value: 'gerenciar-funcionarios' });
      }
      // Cadastrar peça/etapa visível para ADMIN/ENGENHEIRO
      if ([NivelPermissao.ADMINISTRADOR, NivelPermissao.ENGENHEIRO].includes(currentUser.nivelPermissao)) {
        choices.push({ name: 'Cadastrar Peça', value: 'cadastrar-peca' });
        choices.push({ name: 'Cadastrar Etapa', value: 'cadastrar-etapa' });
      }
      // Registrar teste visível para ADMIN/ENGENHEIRO/OPERADOR
      if ([NivelPermissao.ADMINISTRADOR, NivelPermissao.ENGENHEIRO, NivelPermissao.OPERADOR].includes(currentUser.nivelPermissao)) {
        choices.push({ name: 'Registrar Teste', value: 'registrar-teste' });
      }
      choices.push({ name: 'Cadastrar Aeronave', value: 'cadastrar-aeronave' });
      choices.push({ name: 'Listar Etapas', value: 'listar-etapas' });
      choices.push({ name: 'Atualizar Status (peça/etapa/teste)', value: 'atualizar-status' });
      choices.push({ name: 'Gerar Relatório', value: 'gerar-relatorio' });
      choices.push({ name: 'Sair', value: 'sair' });
    }

    const { cmd } = await inquirer.prompt([{ name: 'cmd', message: 'Selecione uma ação:', type: 'list', choices }]);
    try {
      if (cmd === 'login') await menuLogin();
      else if (cmd === 'logout') { currentUser = null; console.log('Você saiu da sessão.'); }
  else if (cmd === 'gerenciar-funcionarios') await menuGerenciarFuncionarios();
  else if (cmd === 'cadastrar-peca') await menuCadastrarPeca();
  else if (cmd === 'cadastrar-etapa') await menuCadastrarEtapa();
  else if (cmd === 'registrar-teste') await menuRegistrarTeste();
  else if (cmd === 'cadastrar-aeronave') await menuCadastrarAeronave();
  else if (cmd === 'listar-etapas') await menuListarEtapas();
  else if (cmd === 'atualizar-status') await menuAtualizarStatus();
  else if (cmd === 'gerar-relatorio') await menuGerarRelatorio();
      else if (cmd === 'sair') { console.log('Encerrando...'); break; }
    } catch (e: any) { console.log('Erro:', e.message || e); }
  }
}

mainMenu();
