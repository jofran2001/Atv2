import { TipoAeronave, TipoPeca, StatusPeca, StatusEtapa, NivelPermissao, TipoTeste, ResultadoTeste } from "../enums";

export class Peca {
  constructor(
    public nome: string,
    public tipo: TipoPeca,
    public fornecedor: string,
    public status: StatusPeca = StatusPeca.EM_PRODUCAO
  ) {}
}

export class Teste {
  constructor(
    public tipo: TipoTeste,
    public resultado: ResultadoTeste
  ) {}
}

export class Funcionario {
  constructor(
    public id: string,
    public nome: string,
    public telefone: string,
    public endereco: string,
    public usuario: string,
    public senha: string,
    public nivelPermissao: NivelPermissao
  ) {}
}

export class Etapa {
  public funcionarios: string[] = [] // ids
  constructor(
    public nome: string,
    public prazoDias: number,
    public status: StatusEtapa = StatusEtapa.PENDENTE
  ) {}
}

export class Aeronave {
  public pecas: Peca[] = [];
  public etapas: Etapa[] = [];
  public testes: Teste[] = [];

  constructor(
    public codigo: string,
    public modelo: string,
    public tipo: TipoAeronave,
    public capacidade: number,
    public alcanceKm: number
  ) {}
}

export class Relatorio {
  constructor(public aeronave: Aeronave) {}

  gerarRelatorio(): string {
    const a = this.aeronave;
    const lines: string[] = [];
    lines.push(`Aeronave: ${a.codigo} - ${a.modelo} (${a.tipo})`);
    lines.push(`Capacidade: ${a.capacidade} - Alcance: ${a.alcanceKm} km`);
    lines.push('');
    lines.push('Peças:');
    a.pecas.forEach(p => lines.push(` - ${p.nome} | ${p.tipo} | ${p.fornecedor} | ${p.status}`));
    lines.push('');
    lines.push('Etapas:');
    a.etapas.forEach(e => lines.push(` - ${e.nome} | Prazo: ${e.prazoDias} dias | ${e.status} | Funcionários: ${e.funcionarios.join(',')}`));
    lines.push('');
    lines.push('Testes:');
    a.testes.forEach(t => lines.push(` - ${t.tipo} : ${t.resultado}`));
    return lines.join('\n');
  }
}
