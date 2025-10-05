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

  cadastrarAeronave(a: Aeronave) {
    if (this.aeronaves.find(x => x.codigo === a.codigo)) throw new Error('Código já existe');
    this.aeronaves.push(a);
    appendToFile(AERO_FILE, JSON.stringify(a));
  }

  adicionarPeca(codigo: string, p: Peca) {
    const a = this.findAeronave(codigo);
    a.pecas.push(p);
    this.persistAll();
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

  registrarTeste(codigo: string, teste: Teste) {
    const a = this.findAeronave(codigo);
    a.testes.push(teste);
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
