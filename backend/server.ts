import express, { Request, Response } from 'express';
import cors from 'cors';
import { AuthService } from './auth/authService';
import { ProductionService } from './services/productionService';
import { Aeronave, Peca, Etapa, Teste, Funcionario } from './classes/models';
import { NivelPermissao, TipoAeronave, TipoPeca, StatusPeca, StatusEtapa, TipoTeste, ResultadoTeste } from './enums';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const authService = new AuthService();
const prodService = new ProductionService();

const sessions: { [key: string]: Funcionario } = {};

app.post('/api/login', (req: Request, res: Response) => {
  const { usuario, senha } = req.body;
  const user = authService.authenticate(usuario, senha);
  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }
  const sessionId = Math.random().toString(36).substring(7);
  sessions[sessionId] = user;
  res.json({ sessionId, user: { ...user, senha: undefined } });
});

function requireAuth(req: Request, res: Response, next: () => void) {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  if (!sessionId || !sessions[sessionId]) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  (req as any).user = sessions[sessionId];
  next();
}

app.post('/api/logout', requireAuth, (req: Request, res: Response) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  if (sessionId) {
    delete sessions[sessionId];
  }
  res.json({ success: true });
});

// Listar aeronaves
app.get('/api/aeronaves', requireAuth, (req: Request, res: Response) => {
  res.json(prodService.listAeronaves());
});

// Obter aeronave por código
app.get('/api/aeronaves/:codigo', requireAuth, (req: Request, res: Response) => {
  const { codigo } = req.params;
  try {
    const a = prodService.getAeronave(codigo);
    res.json(a);
  } catch (e: any) {
    res.status(404).json({ error: e.message });
  }
});

// Cadastrar aeronave
app.post('/api/aeronaves', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (![NivelPermissao.ADMINISTRADOR, NivelPermissao.ENGENHEIRO].includes(user.nivelPermissao)) {
    return res.status(403).json({ error: 'Permissão negada' });
  }
  const { codigo, modelo, tipo, capacidade, alcanceKm } = req.body;
  const a = new Aeronave(codigo, modelo, tipo, capacidade, alcanceKm);
  try {
    prodService.cadastrarAeronave(a);
    res.json({ success: true, message: 'Aeronave cadastrada' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Atualizar aeronave
app.put('/api/aeronaves/:codigo', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (![NivelPermissao.ADMINISTRADOR, NivelPermissao.ENGENHEIRO].includes(user.nivelPermissao)) {
    return res.status(403).json({ error: 'Permissão negada' });
  }
  const { codigo } = req.params;
  const { modelo, tipo, capacidade, alcanceKm } = req.body;
  try {
    prodService.atualizarAeronave(codigo, { modelo, tipo, capacidade, alcanceKm });
    res.json({ success: true, message: 'Aeronave atualizada' });
  } catch (e: any) {
    const status = e.message.includes('não encontrada') ? 404 : 400;
    res.status(status).json({ error: e.message });
  }
});

// Excluir aeronave
app.delete('/api/aeronaves/:codigo', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user.nivelPermissao !== NivelPermissao.ADMINISTRADOR) {
    return res.status(403).json({ error: 'Permissão negada' });
  }
  const { codigo } = req.params;
  try {
    prodService.excluirAeronave(codigo);
    res.json({ success: true, message: 'Aeronave excluída' });
  } catch (e: any) {
    const status = e.message.includes('não encontrada') ? 404 : 400;
    res.status(status).json({ error: e.message });
  }
});

// Adicionar peça
app.post('/api/aeronaves/:codigo/pecas', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (![NivelPermissao.ADMINISTRADOR, NivelPermissao.ENGENHEIRO].includes(user.nivelPermissao)) {
    return res.status(403).json({ error: 'Permissão negada' });
  }
  const { codigo } = req.params;
  const { nome, tipo, fornecedor } = req.body;
  const p = new Peca(nome, tipo, fornecedor);
  p.status = StatusPeca.EM_PRODUCAO;
  try {
    prodService.adicionarPeca(codigo, p);
    res.json({ success: true, message: 'Peça adicionada' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Listar peças
app.get('/api/aeronaves/:codigo/pecas', requireAuth, (req: Request, res: Response) => {
  const { codigo } = req.params;
  try {
    const pecas = prodService.listarPecas(codigo);
    res.json(pecas);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Obter peça específica
app.get('/api/aeronaves/:codigo/pecas/:idx', requireAuth, (req: Request, res: Response) => {
  const { codigo, idx } = req.params;
  try {
    const peca = prodService.obterPeca(codigo, parseInt(idx));
    res.json(peca);
  } catch (e: any) {
    const status = e.message.includes('Peça inválida') ? 404 : 400;
    res.status(status).json({ error: e.message });
  }
});

// Adicionar etapa
app.post('/api/aeronaves/:codigo/etapas', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (![NivelPermissao.ADMINISTRADOR, NivelPermissao.ENGENHEIRO].includes(user.nivelPermissao)) {
    return res.status(403).json({ error: 'Permissão negada' });
  }
  const { codigo } = req.params;
  const { nome, prazoDias } = req.body;
  const e = new Etapa(nome, prazoDias);
  try {
    prodService.adicionarEtapa(codigo, e);
    res.json({ success: true, message: 'Etapa adicionada' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Registrar teste
app.post('/api/aeronaves/:codigo/testes', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (![NivelPermissao.ADMINISTRADOR, NivelPermissao.ENGENHEIRO, NivelPermissao.OPERADOR].includes(user.nivelPermissao)) {
    return res.status(403).json({ error: 'Permissão negada' });
  }
  const { codigo } = req.params;
  const { tipo, resultado } = req.body;
  const t = new Teste(tipo, resultado);
  try {
    prodService.registrarTeste(codigo, t);
    res.json({ success: true, message: 'Teste registrado' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Listar testes da aeronave
app.get('/api/aeronaves/:codigo/testes', requireAuth, (req: Request, res: Response) => {
  const { codigo } = req.params;
  try {
    const testes = prodService.listarTestes(codigo);
    res.json(testes);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Obter teste específico
app.get('/api/aeronaves/:codigo/testes/:idx', requireAuth, (req: Request, res: Response) => {
  const { codigo, idx } = req.params;
  try {
    const teste = prodService.obterTeste(codigo, parseInt(idx));
    res.json(teste);
  } catch (e: any) {
    const status = e.message.includes('invalido') || e.message.includes('inválido') ? 404 : 400;
    res.status(status).json({ error: e.message });
  }
});

// Atualizar teste
app.put('/api/aeronaves/:codigo/testes/:idx', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (![NivelPermissao.ADMINISTRADOR, NivelPermissao.ENGENHEIRO].includes(user.nivelPermissao)) {
    return res.status(403).json({ error: 'Permissão negada' });
  }
  const { codigo, idx } = req.params;
  const { tipo, resultado } = req.body;
  try {
    prodService.atualizarTeste(codigo, parseInt(idx), { tipo, resultado });
    res.json({ success: true, message: 'Teste atualizado' });
  } catch (e: any) {
    const status = e.message.includes('inválido') ? 404 : 400;
    res.status(status).json({ error: e.message });
  }
});

// Excluir teste
app.delete('/api/aeronaves/:codigo/testes/:idx', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (![NivelPermissao.ADMINISTRADOR, NivelPermissao.ENGENHEIRO].includes(user.nivelPermissao)) {
    return res.status(403).json({ error: 'Permissão negada' });
  }
  const { codigo, idx } = req.params;
  try {
    prodService.excluirTeste(codigo, parseInt(idx));
    res.json({ success: true, message: 'Teste excluído' });
  } catch (e: any) {
    const status = e.message.includes('inválido') ? 404 : 400;
    res.status(status).json({ error: e.message });
  }
});

// Atualizar status peça
app.put('/api/aeronaves/:codigo/pecas/:idx/status', requireAuth, (req: Request, res: Response) => {
  const { codigo, idx } = req.params;
  const { status } = req.body;
  try {
    prodService.atualizarStatusPeca(codigo, parseInt(idx), status);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Atualizar peça (campos gerais)
app.put('/api/aeronaves/:codigo/pecas/:idx', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (![NivelPermissao.ADMINISTRADOR, NivelPermissao.ENGENHEIRO].includes(user.nivelPermissao)) {
    return res.status(403).json({ error: 'Permissão negada' });
  }
  const { codigo, idx } = req.params;
  const { nome, tipo, fornecedor, status } = req.body;
  try {
    prodService.atualizarPeca(codigo, parseInt(idx), { nome, tipo, fornecedor, status });
    res.json({ success: true, message: 'Peça atualizada' });
  } catch (e: any) {
    const statusCode = e.message.includes('Peça inválida') ? 404 : 400;
    res.status(statusCode).json({ error: e.message });
  }
});

// Excluir peça
app.delete('/api/aeronaves/:codigo/pecas/:idx', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (![NivelPermissao.ADMINISTRADOR, NivelPermissao.ENGENHEIRO].includes(user.nivelPermissao)) {
    return res.status(403).json({ error: 'Permissão negada' });
  }
  const { codigo, idx } = req.params;
  try {
    prodService.excluirPeca(codigo, parseInt(idx));
    res.json({ success: true, message: 'Peça excluída' });
  } catch (e: any) {
    const statusCode = e.message.includes('Peça inválida') ? 404 : 400;
    res.status(statusCode).json({ error: e.message });
  }
});

// Avançar etapa
app.post('/api/aeronaves/:codigo/etapas/:idx/avancar', requireAuth, (req: Request, res: Response) => {
  const { codigo, idx } = req.params;
  try {
    prodService.avancarEtapa(codigo, parseInt(idx));
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Concluir etapa
app.post('/api/aeronaves/:codigo/etapas/:idx/concluir', requireAuth, (req: Request, res: Response) => {
  const { codigo, idx } = req.params;
  try {
    prodService.concluirEtapa(codigo, parseInt(idx));
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Associar funcionário à etapa
app.post('/api/aeronaves/:codigo/etapas/:idx/funcionario', requireAuth, (req: Request, res: Response) => {
  const { codigo, idx } = req.params;
  const { funcionarioId } = req.body;
  try {
    prodService.associarFuncionarioEtapa(codigo, parseInt(idx), funcionarioId);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Gerar relatório
app.post('/api/aeronaves/:codigo/relatorio', requireAuth, (req: Request, res: Response) => {
  const { codigo } = req.params;
  try {
    const file = prodService.gerarRelatorio(codigo);
    res.json({ success: true, file });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Listar usuários
app.get('/api/users', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user.nivelPermissao !== NivelPermissao.ADMINISTRADOR) {
    return res.status(403).json({ error: 'Permissão negada' });
  }
  const users = authService.listUsers();
  res.json(users.map(u => ({ ...u, senha: undefined })));
});

// Cadastrar usuário
app.post('/api/users', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user.nivelPermissao !== NivelPermissao.ADMINISTRADOR) {
    return res.status(403).json({ error: 'Permissão negada' });
  }
  const { id, nome, telefone, endereco, usuario, senha, nivelPermissao } = req.body;
  const f = new Funcionario(id, nome, telefone, endereco, usuario, senha, nivelPermissao);
  try {
    authService.registerByActor(f, user.id);
    res.json({ success: true, message: 'Usuário cadastrado' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Atualizar usuário
app.put('/api/users/:id', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  const existing = authService.getUserById(id);
  if (!existing) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  const { nome, telefone, endereco, usuario, senha, nivelPermissao } = req.body;
  const novaSenha = senha && senha.length > 0 ? senha : existing.senha;
  const updated = new Funcionario(id, nome, telefone, endereco, usuario, novaSenha, nivelPermissao);
  try {
    authService.updateUser(updated, user.id);
    res.json({ success: true, message: 'Usuário atualizado' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Excluir usuário
app.delete('/api/users/:id', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  try {
    authService.deleteUser(id, user.id);
    res.json({ success: true, message: 'Usuário excluído' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

