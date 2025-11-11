import { Aeronave, Peca, Etapa, Teste, Funcionario, Relatorio } from "../classes/models";
import { StatusEtapa, StatusPeca, TipoTeste, ResultadoTeste } from "../enums";
import { ensureDataDir, loadFile, appendToFile, saveToFile } from "../persistence/fileStorage";
import * as fs from 'fs';
import * as path from 'path';

const AERO_FILE = 'aeronaves.txt';

export class ProductionService {
  private aeronaves: Aeronave[] = [];

  constructor() {
    ensureDataDir();
    this.load();
  }

  private load() {
    const content = loadFile(AERO_FILE);
    if (!content) return;
    const lines = content.split(/\r?\n/).filter(Boolean);
    for (const l of lines) {
      try {
        const obj = JSON.parse(l);
        const a = new Aeronave(obj.codigo, obj.modelo, obj.tipo, obj.capacidade, obj.alcanceKm);
        a.pecas = obj.pecas || [];
        a.etapas = obj.etapas || [];
        a.testes = obj.testes || [];
        this.aeronaves.push(a);
      } catch (e) {}
    }
  }

  private persistAll() {
    const lines = this.aeronaves.map(a => JSON.stringify(a));
    saveToFile(AERO_FILE, lines.join('\n'));
  }

  listAeronaves(): Aeronave[] { return this.aeronaves; }

  getAeronave(codigo: string): Aeronave {
    return this.findAeronave(codigo);
  }

  cadastrarAeronave(a: Aeronave) {
    if (this.aeronaves.find(x => x.codigo === a.codigo)) throw new Error('Código já existe');
    this.aeronaves.push(a);
    appendToFile(AERO_FILE, JSON.stringify(a));
  }

  atualizarAeronave(codigo: string, updates: Partial<Pick<Aeronave, 'modelo' | 'tipo' | 'capacidade' | 'alcanceKm'>>): void {
    const a = this.findAeronave(codigo);
    if (updates.modelo !== undefined) a.modelo = updates.modelo as any;
    if (updates.tipo !== undefined) a.tipo = updates.tipo as any;
    if (updates.capacidade !== undefined) a.capacidade = updates.capacidade as any;
    if (updates.alcanceKm !== undefined) a.alcanceKm = updates.alcanceKm as any;
    this.persistAll();
  }

  excluirAeronave(codigo: string): void {
    const idx = this.aeronaves.findIndex(x => x.codigo === codigo);
    if (idx === -1) throw new Error('Aeronave não encontrada');
    this.aeronaves.splice(idx, 1);
    this.persistAll();
  }

  adicionarPeca(codigo: string, p: Peca) {
    const a = this.findAeronave(codigo);
    a.pecas.push(p);
    this.persistAll();
  }

  listarPecas(codigo: string): Peca[] {
    const a = this.findAeronave(codigo);
    return a.pecas;
  }

  obterPeca(codigo: string, pecaIndex: number): Peca {
    const a = this.findAeronave(codigo);
    const p = a.pecas[pecaIndex];
    if (!p) throw new Error('Peça inválida');
    return p;
  }

  adicionarEtapa(codigo: string, e: Etapa) {
    const a = this.findAeronave(codigo);
    a.etapas.push(e);
    this.persistAll();
  }

  associarFuncionarioEtapa(codigo: string, etapaIndex: number, funcionarioId: string) {
    const a = this.findAeronave(codigo);
    if (!a.etapas[etapaIndex]) throw new Error('Etapa inválida');
    const etapa = a.etapas[etapaIndex];
    if (!etapa.funcionarios.includes(funcionarioId)) etapa.funcionarios.push(funcionarioId);
    this.persistAll();
  }

  avancarEtapa(codigo: string, etapaIndex: number) {
    const a = this.findAeronave(codigo);
    if (etapaIndex === 0) {
      a.etapas[0].status = StatusEtapa.ANDAMENTO;
      this.persistAll();
      return;
    }
    const prev = a.etapas[etapaIndex - 1];
    if (prev.status !== StatusEtapa.CONCLUIDA) throw new Error('Etapa anterior não concluída');
    a.etapas[etapaIndex].status = StatusEtapa.ANDAMENTO;
    this.persistAll();
  }

  concluirEtapa(codigo: string, etapaIndex: number) {
    const a = this.findAeronave(codigo);
    const etapa = a.etapas[etapaIndex];
    if (!etapa) throw new Error('Etapa inválida');

    const isLastEtapa = etapaIndex === a.etapas.length - 1;
    if (isLastEtapa) {
      const lastResultByType = new Map<TipoTeste, ResultadoTeste>();
      for (const t of a.testes) {
        lastResultByType.set(t.tipo, t.resultado);
      }

      for (const [tipo, resultado] of lastResultByType.entries()) {
        if (resultado === ResultadoTeste.REPROVADO) {
          throw new Error('Existem testes reprovados pendentes. Realize um novo teste aprovado antes de concluir a aeronave.');
        }
      }
    }
    etapa.status = StatusEtapa.CONCLUIDA;
    this.persistAll();
  }

  atualizarStatusPeca(codigo: string, pecaIndex: number, status: StatusPeca) {
    const a = this.findAeronave(codigo);
    const p = a.pecas[pecaIndex];
    if (!p) throw new Error('Peça inválida');
    p.status = status;
    this.persistAll();
  }

  atualizarPeca(
    codigo: string,
    pecaIndex: number,
    updates: Partial<Pick<Peca, 'nome' | 'tipo' | 'fornecedor' | 'status'>>
  ) {
    const a = this.findAeronave(codigo);
    const p = a.pecas[pecaIndex];
    if (!p) throw new Error('Peça inválida');
    if (updates.nome !== undefined) p.nome = updates.nome;
    if (updates.tipo !== undefined) p.tipo = updates.tipo as any;
    if (updates.fornecedor !== undefined) p.fornecedor = updates.fornecedor;
    if (updates.status !== undefined) p.status = updates.status as any;
    this.persistAll();
  }

  excluirPeca(codigo: string, pecaIndex: number) {
    const a = this.findAeronave(codigo);
    if (!a.pecas[pecaIndex]) throw new Error('Peça inválida');
    a.pecas.splice(pecaIndex, 1);
    this.persistAll();
  }

  registrarTeste(codigo: string, teste: Teste) {
    const a = this.findAeronave(codigo);
    a.testes.push(teste);
    this.persistAll();
  }

  listarTestes(codigo: string): Teste[] {
    const a = this.findAeronave(codigo);
    return a.testes;
  }

  obterTeste(codigo: string, idx: number): Teste {
    const a = this.findAeronave(codigo);
    const t = a.testes[idx];
    if (!t) throw new Error('Teste inválido');
    return t;
  }

  atualizarTeste(
    codigo: string,
    idx: number,
    updates: Partial<Pick<Teste, 'tipo' | 'resultado'>>
  ) {
    const a = this.findAeronave(codigo);
    const t = a.testes[idx];
    if (!t) throw new Error('Teste inválido');
    if (updates.tipo !== undefined) t.tipo = updates.tipo as any;
    if (updates.resultado !== undefined) t.resultado = updates.resultado as any;
    this.persistAll();
  }

  excluirTeste(codigo: string, idx: number) {
    const a = this.findAeronave(codigo);
    if (!a.testes[idx]) throw new Error('Teste inválido');
    a.testes.splice(idx, 1);
    this.persistAll();
  }

  gerarRelatorio(codigo: string): string {
    const a = this.findAeronave(codigo);
    const r = new Relatorio(a);
    const txt = r.gerarRelatorio();
    // salvar arquivo em relatorios/
    const REL_DIR = path.resolve(process.cwd(), 'relatorios');
    if (!fs.existsSync(REL_DIR)) fs.mkdirSync(REL_DIR, { recursive: true });
    const fileName = path.join(REL_DIR, `relatorio_${a.codigo}.txt`);
    fs.writeFileSync(fileName, txt, { encoding: 'utf8' });
    return fileName;
  }

  private findAeronave(codigo: string): Aeronave {
    const a = this.aeronaves.find(x => x.codigo === codigo);
    if (!a) throw new Error('Aeronave não encontrada');
    return a;
  }
}
