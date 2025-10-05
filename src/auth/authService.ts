import { Funcionario } from "../classes/models";
import { NivelPermissao } from "../enums";
import { ensureDataDir, loadFile, saveToFile, appendToFile } from "../persistence/fileStorage";
import * as path from 'path';

const USERS_FILE = 'users.txt';

export class AuthService {
  private users: Funcionario[] = [];

  constructor() {
    ensureDataDir();
    this.load();
    this.ensureAdmin();
  }

  private load() {
    const content = loadFile(USERS_FILE);
    if (!content) return;
    const lines = content.split(/\r?\n/).filter(Boolean);
    for (const l of lines) {
      try {
        const obj = JSON.parse(l);
        this.users.push(new Funcionario(obj.id, obj.nome, obj.telefone, obj.endereco, obj.usuario, obj.senha, obj.nivelPermissao));
      } catch (e) {
        // ignore parse errors
      }
    }
  }

  private ensureAdmin() {
    const exists = this.users.find(u => u.usuario === 'admin');
    if (!exists) {
      const admin = new Funcionario('admin', 'Administrador', '-', '-', 'admin', 'admin123', NivelPermissao.ADMINISTRADOR);
      this.users.push(admin);
      appendToFile(USERS_FILE, JSON.stringify(admin));
    }
  }

  // register internal (used for initial admin creation)
  register(user: Funcionario) {
    if (this.users.find(u => u.usuario === user.usuario)) throw new Error('Usuário já existe');
    this.users.push(user);
    this.saveAllUsers();
    try {
      const ts = new Date().toISOString();
      appendToFile('user_audit.txt', `${ts} | action:REGISTER | actor:system | target:${user.id} | usuario:${user.usuario} | nivel:${user.nivelPermissao}`);
    } catch (e) {}
  }

  // register by actor (enforce that only admins can create users)
  registerByActor(user: Funcionario, actorId: string) {
    const actor = this.users.find(u => u.id === actorId);
    if (!actor) throw new Error('Actor não encontrado');
    if (actor.nivelPermissao !== NivelPermissao.ADMINISTRADOR) {
      try { appendToFile('user_audit.txt', `${new Date().toISOString()} | action:REGISTER_DENIED | actor:${actorId} | target:${user.id}`); } catch (e) {}
      throw new Error('Permissão negada: apenas administradores podem cadastrar usuários');
    }
    this.register(user);
    try { appendToFile('user_audit.txt', `${new Date().toISOString()} | action:REGISTER | actor:${actorId} | target:${user.id}`); } catch (e) {}
  }

  authenticate(usuario: string, senha: string): Funcionario | null {
    const u = this.users.find(x => x.usuario === usuario && x.senha === senha);
    return u || null;
  }

  listUsers(): Funcionario[] { return this.users; }

  getUserById(id: string): Funcionario | undefined {
    return this.users.find(u => u.id === id);
  }

  updateUser(updated: Funcionario, actorId?: string) {
    const idx = this.users.findIndex(u => u.id === updated.id);
    if (idx === -1) throw new Error('Usuário não encontrado');
    const actor = actorId ? this.users.find(u => u.id === actorId) : undefined;
    // Permissão: apenas ADMIN pode alterar outro usuário; não-admins só alteram a si mesmos
    if (actor) {
      const isSelf = actor.id === updated.id;
      if (!isSelf && actor.nivelPermissao !== NivelPermissao.ADMINISTRADOR) {
        // auditoria tentativa negada
        try { appendToFile('user_audit.txt', `${new Date().toISOString()} | action:UPDATE_DENIED | actor:${actorId} | target:${updated.id}`); } catch (e) {}
        throw new Error('Permissão negada: apenas administradores podem alterar outros usuários');
      }
    } else {
      // se não houver actorId, negar por segurança
      throw new Error('Actor não informado');
    }
    // se for despromover um ADMIN, garantir que haverá ao menos um admin restante
    const current = this.users[idx];
    if (current.nivelPermissao === NivelPermissao.ADMINISTRADOR && updated.nivelPermissao !== NivelPermissao.ADMINISTRADOR) {
      const numAdmins = this.users.filter(u => u.nivelPermissao === NivelPermissao.ADMINISTRADOR).length;
      if (numAdmins <= 1) throw new Error('Não é permitido despromover o último administrador');
    }
    this.users[idx] = updated;
    this.saveAllUsers();
    try {
      const ts = new Date().toISOString();
      appendToFile('user_audit.txt', `${ts} | action:UPDATE | actor:${actorId||'unknown'} | target:${updated.id} | usuario:${updated.usuario} | nivel:${updated.nivelPermissao}`);
    } catch (e) {}
  }

  deleteUser(id: string, actorId?: string) {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('Usuário não encontrado');
    const actor = actorId ? this.users.find(u => u.id === actorId) : undefined;
    // Permissão: apenas ADMIN pode excluir outro usuário; não-admins só podem excluir a si mesmos
    if (actor) {
      const isSelf = actor.id === id;
      if (!isSelf && actor.nivelPermissao !== NivelPermissao.ADMINISTRADOR) {
        try { appendToFile('user_audit.txt', `${new Date().toISOString()} | action:DELETE_DENIED | actor:${actorId} | target:${id}`); } catch (e) {}
        throw new Error('Permissão negada: apenas administradores podem excluir outros usuários');
      }
    } else {
      throw new Error('Actor não informado');
    }
    const target = this.users[idx];
    if (target.nivelPermissao === NivelPermissao.ADMINISTRADOR) {
      const numAdmins = this.users.filter(u => u.nivelPermissao === NivelPermissao.ADMINISTRADOR).length;
      if (numAdmins <= 1) throw new Error('Não é permitido excluir o último administrador');
    }
    this.users.splice(idx, 1);
    this.saveAllUsers();
    try {
      const ts = new Date().toISOString();
      appendToFile('user_audit.txt', `${ts} | action:DELETE | actor:${actorId||'unknown'} | target:${id} | usuario:${target.usuario} | nivel:${target.nivelPermissao}`);
    } catch (e) {}
  }

  saveAllUsers() {
    const lines = this.users.map(u => JSON.stringify(u));
    saveToFile(USERS_FILE, lines.join('\n'));
  }
}
