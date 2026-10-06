import {
  PesagemRecord,
  AuditoriaRecord,
  DeviceConfig,
  BackupPayload,
  TipoOperacaoAuditoria,
} from '../types';
import { DEFAULT_CONFIG, APP_VERSION } from './config';
import { calculateChecksum } from '../utils/formatters';

const DB_NAME = 'haoc_pesagens_db';
const DB_VERSION = 1;

const STORE_PESAGENS = 'pesagens';
const STORE_AUDITORIA = 'auditoria';
const STORE_CONFIG = 'configuracoes';

class DatabaseService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;

        // Store: pesagens
        if (!db.objectStoreNames.contains(STORE_PESAGENS)) {
          const pesagensStore = db.createObjectStore(STORE_PESAGENS, { keyPath: 'id' });
          pesagensStore.createIndex('timestamp', 'timestamp', { unique: false });
          pesagensStore.createIndex('data', 'data', { unique: false });
          pesagensStore.createIndex('tipo_residuo', 'tipo_residuo', { unique: false });
          pesagensStore.createIndex('is_demo', 'is_demo', { unique: false });
          pesagensStore.createIndex('created_at', 'created_at', { unique: false });
        }

        // Store: auditoria
        if (!db.objectStoreNames.contains(STORE_AUDITORIA)) {
          const auditoriaStore = db.createObjectStore(STORE_AUDITORIA, { keyPath: 'id' });
          auditoriaStore.createIndex('timestamp', 'timestamp', { unique: false });
          auditoriaStore.createIndex('operacao', 'operacao', { unique: false });
        }

        // Store: configuracoes
        if (!db.objectStoreNames.contains(STORE_CONFIG)) {
          db.createObjectStore(STORE_CONFIG, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('IndexedDB open error:', request.error);
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  // --- PESAGENS OPERATIONS ---

  public async getAllPesagens(): Promise<PesagemRecord[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PESAGENS, 'readonly');
      const store = tx.objectStore(STORE_PESAGENS);
      const index = store.index('timestamp');
      const request = index.getAll();

      request.onsuccess = () => {
        // Return reverse sorted by timestamp (newest first)
        const results = (request.result as PesagemRecord[]) || [];
        results.sort((a, b) => b.timestamp - a.timestamp);
        resolve(results);
      };

      request.onerror = () => reject(request.error);
    });
  }

  public async getPesagemById(id: string): Promise<PesagemRecord | null> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PESAGENS, 'readonly');
      const store = tx.objectStore(STORE_PESAGENS);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  public async addPesagem(pesagem: PesagemRecord): Promise<PesagemRecord> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_PESAGENS, STORE_AUDITORIA], 'readwrite');
      const pesagensStore = tx.objectStore(STORE_PESAGENS);
      const auditStore = tx.objectStore(STORE_AUDITORIA);

      const addReq = pesagensStore.add(pesagem);

      addReq.onsuccess = () => {
        // Add audit trail record
        const auditLog: AuditoriaRecord = {
          id: 'AUD-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          timestamp: Date.now(),
          operacao: 'CRIACAO',
          registro_id: pesagem.id,
          detalhes: `Lançamento registrado: ${pesagem.tipo_residuo} - ${pesagem.peso.toFixed(2)} kg`,
          usuario: pesagem.usuario,
          created_at: new Date().toISOString(),
        };
        auditStore.add(auditLog);
      };

      tx.oncomplete = () => resolve(pesagem);
      tx.onerror = () => reject(tx.error);
    });
  }

  public async updatePesagem(pesagem: PesagemRecord, usuario: string): Promise<PesagemRecord> {
    const db = await this.openDB();
    const updatedPesagem: PesagemRecord = {
      ...pesagem,
      updated_at: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_PESAGENS, STORE_AUDITORIA], 'readwrite');
      const pesagensStore = tx.objectStore(STORE_PESAGENS);
      const auditStore = tx.objectStore(STORE_AUDITORIA);

      pesagensStore.put(updatedPesagem);

      const auditLog: AuditoriaRecord = {
        id: 'AUD-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        timestamp: Date.now(),
        operacao: 'EDICAO',
        registro_id: pesagem.id,
        detalhes: `Lançamento alterado para: ${pesagem.tipo_residuo} - ${pesagem.peso.toFixed(2)} kg`,
        usuario: usuario || pesagem.usuario,
        created_at: new Date().toISOString(),
      };
      auditStore.add(auditLog);

      tx.oncomplete = () => resolve(updatedPesagem);
      tx.onerror = () => reject(tx.error);
    });
  }

  public async deletePesagem(id: string, usuario: string, motivo = ''): Promise<boolean> {
    const db = await this.openDB();
    const existing = await this.getPesagemById(id);
    if (!existing) return false;

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_PESAGENS, STORE_AUDITORIA], 'readwrite');
      const pesagensStore = tx.objectStore(STORE_PESAGENS);
      const auditStore = tx.objectStore(STORE_AUDITORIA);

      pesagensStore.delete(id);

      const auditLog: AuditoriaRecord = {
        id: 'AUD-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        timestamp: Date.now(),
        operacao: 'EXCLUSAO',
        registro_id: id,
        detalhes: `Lançamento excluído: ${existing.tipo_residuo} (${existing.peso.toFixed(2)} kg). Motivo: ${motivo || 'Exclusão solicitada pelo operador'}`,
        usuario: usuario || 'Administrador',
        created_at: new Date().toISOString(),
      };
      auditStore.add(auditLog);

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  public async clearDemoPesagens(usuario: string): Promise<number> {
    const all = await this.getAllPesagens();
    const demoItems = all.filter((p) => p.is_demo);
    if (demoItems.length === 0) return 0;

    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_PESAGENS, STORE_AUDITORIA], 'readwrite');
      const store = tx.objectStore(STORE_PESAGENS);
      const auditStore = tx.objectStore(STORE_AUDITORIA);

      for (const item of demoItems) {
        store.delete(item.id);
      }

      const auditLog: AuditoriaRecord = {
        id: 'AUD-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        timestamp: Date.now(),
        operacao: 'LIMPEZA_DEMO',
        detalhes: `Removidos ${demoItems.length} registros fictícios de demonstração.`,
        usuario: usuario || 'Administrador',
        created_at: new Date().toISOString(),
      };
      auditStore.add(auditLog);

      tx.oncomplete = () => resolve(demoItems.length);
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- AUDITORIA OPERATIONS ---

  public async getAuditoria(): Promise<AuditoriaRecord[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_AUDITORIA, 'readonly');
      const store = tx.objectStore(STORE_AUDITORIA);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = (request.result as AuditoriaRecord[]) || [];
        results.sort((a, b) => b.timestamp - a.timestamp);
        resolve(results);
      };

      request.onerror = () => reject(request.error);
    });
  }

  public async logAuditoria(
    operacao: TipoOperacaoAuditoria,
    detalhes: string,
    usuario: string,
    registro_id?: string
  ): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_AUDITORIA, 'readwrite');
      const store = tx.objectStore(STORE_AUDITORIA);

      const log: AuditoriaRecord = {
        id: 'AUD-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        timestamp: Date.now(),
        operacao,
        registro_id,
        detalhes,
        usuario,
        created_at: new Date().toISOString(),
      };

      store.add(log);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- CONFIGURACOES OPERATIONS ---

  public async getConfig(): Promise<DeviceConfig> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CONFIG, 'readonly');
      const store = tx.objectStore(STORE_CONFIG);
      const request = store.get('device_config');

      request.onsuccess = () => {
        if (request.result && request.result.value) {
          resolve({ ...DEFAULT_CONFIG, ...request.result.value });
        } else {
          // Check localStorage fallback
          const local = localStorage.getItem('haoc_device_config');
          if (local) {
            try {
              const parsed = JSON.parse(local);
              resolve({ ...DEFAULT_CONFIG, ...parsed });
              return;
            } catch (e) {
              console.error(e);
            }
          }
          resolve(DEFAULT_CONFIG);
        }
      };

      request.onerror = () => {
        resolve(DEFAULT_CONFIG);
      };
    });
  }

  public async saveConfig(config: DeviceConfig, usuario: string): Promise<DeviceConfig> {
    const db = await this.openDB();
    // Also save in localStorage for instant boot
    localStorage.setItem('haoc_device_config', JSON.stringify(config));

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_CONFIG, STORE_AUDITORIA], 'readwrite');
      const store = tx.objectStore(STORE_CONFIG);
      const auditStore = tx.objectStore(STORE_AUDITORIA);

      store.put({ key: 'device_config', value: config, updated_at: new Date().toISOString() });

      const auditLog: AuditoriaRecord = {
        id: 'AUD-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        timestamp: Date.now(),
        operacao: 'ALTERACAO_CONFIG',
        detalhes: `Configurações atualizadas: ${config.device_name} (${config.location})`,
        usuario: usuario || config.default_operator,
        created_at: new Date().toISOString(),
      };
      auditStore.add(auditLog);

      tx.oncomplete = () => resolve(config);
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- BACKUP & RESTORE OPERATIONS ---

  public async exportBackup(config: DeviceConfig): Promise<BackupPayload> {
    const pesagens = await this.getAllPesagens();
    const auditoria = await this.getAuditoria();

    const partialPayload = {
      versao_backup: '1.0',
      app_version: APP_VERSION,
      hospital: config.hospital_name,
      data_geracao: new Date().toISOString(),
      total_pesagens: pesagens.length,
      total_auditoria: auditoria.length,
      config,
      pesagens,
      auditoria,
    };

    const checksum = calculateChecksum(JSON.stringify(partialPayload));

    return {
      ...partialPayload,
      checksum,
    };
  }

  public async restoreBackup(
    backup: BackupPayload,
    replaceExisting: boolean,
    usuario: string
  ): Promise<{ importedPesagens: number; importedAudit: number }> {
    if (!backup || !Array.isArray(backup.pesagens)) {
      throw new Error('Arquivo de backup inválido: lista de pesagens ausente.');
    }

    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_PESAGENS, STORE_AUDITORIA, STORE_CONFIG], 'readwrite');
      const pesagensStore = tx.objectStore(STORE_PESAGENS);
      const auditStore = tx.objectStore(STORE_AUDITORIA);
      const configStore = tx.objectStore(STORE_CONFIG);

      if (replaceExisting) {
        pesagensStore.clear();
      }

      let countPesagens = 0;
      for (const p of backup.pesagens) {
        if (p.id && p.tipo_residuo && typeof p.peso === 'number') {
          pesagensStore.put(p);
          countPesagens++;
        }
      }

      let countAudit = 0;
      if (Array.isArray(backup.auditoria)) {
        for (const a of backup.auditoria) {
          if (a.id && a.operacao) {
            auditStore.put(a);
            countAudit++;
          }
        }
      }

      if (backup.config) {
        configStore.put({ key: 'device_config', value: backup.config, updated_at: new Date().toISOString() });
        localStorage.setItem('haoc_device_config', JSON.stringify(backup.config));
      }

      // Add a restoration audit entry
      const auditEntry: AuditoriaRecord = {
        id: 'AUD-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        timestamp: Date.now(),
        operacao: 'RESTAURACAO_BACKUP',
        detalhes: `Restauração de backup realizada. ${countPesagens} pesagens e ${countAudit} logs de auditoria carregados (${replaceExisting ? 'Substituição total' : 'Mesclado'}).`,
        usuario: usuario || 'Administrador',
        created_at: new Date().toISOString(),
      };
      auditStore.add(auditEntry);

      tx.oncomplete = () => resolve({ importedPesagens: countPesagens, importedAudit: countAudit });
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- INTEGRITY CHECK ---

  public async checkDatabaseIntegrity(): Promise<{
    ok: boolean;
    totalPesagens: number;
    totalAuditoria: number;
    invalidRecords: number;
    detalhes: string;
  }> {
    const pesagens = await this.getAllPesagens();
    const auditoria = await this.getAuditoria();

    let invalid = 0;
    for (const p of pesagens) {
      if (!p.id || !p.tipo_residuo || typeof p.peso !== 'number' || p.peso <= 0) {
        invalid++;
      }
    }

    return {
      ok: invalid === 0,
      totalPesagens: pesagens.length,
      totalAuditoria: auditoria.length,
      invalidRecords: invalid,
      detalhes:
        invalid === 0
          ? 'Banco de dados íntegro. Todos os registros possuem campos obrigatórios e pesos válidos.'
          : `Atenção: encontrados ${invalid} registros com inconsistências de dados.`,
    };
  }

  // --- SEED DEMO DATA ---

  public async seedDemoData(usuario: string): Promise<number> {
    const current = await this.getAllPesagens();
    if (current.length > 0) {
      // If there are already records, don't auto-seed
      return 0;
    }

    const demoRecords: PesagemRecord[] = [
      {
        id: 'HAOC-PES-20261001-001',
        data: '2026-10-01',
        hora: '07:35:12',
        timestamp: new Date('2026-10-01T07:35:12').getTime(),
        tipo_residuo: 'INFECTANTE',
        peso: 42.5,
        unidade: 'kg',
        usuario: 'Enf. Juliana Ramos',
        observacao: 'Centro Cirúrgico - Bloco A',
        device_id: 'HAOC-TAB-01',
        device_name: 'Tablet Pesagem 01',
        location: 'Expedição Subsolo',
        sync_status: 'local',
        is_demo: true,
        created_at: '2026-10-01T07:35:12.000Z',
        updated_at: '2026-10-01T07:35:12.000Z',
      },
      {
        id: 'HAOC-PES-20261001-002',
        data: '2026-10-01',
        hora: '08:15:40',
        timestamp: new Date('2026-10-01T08:15:40').getTime(),
        tipo_residuo: 'COMUM',
        peso: 125.8,
        unidade: 'kg',
        usuario: 'Carlos Eduardo - Higiene',
        observacao: 'Refeitório e Áreas Administrativas',
        device_id: 'HAOC-TAB-01',
        device_name: 'Tablet Pesagem 01',
        location: 'Expedição Subsolo',
        sync_status: 'local',
        is_demo: true,
        created_at: '2026-10-01T08:15:40.000Z',
        updated_at: '2026-10-01T08:15:40.000Z',
      },
      {
        id: 'HAOC-PES-20261001-003',
        data: '2026-10-01',
        hora: '09:20:15',
        timestamp: new Date('2026-10-01T09:20:15').getTime(),
        tipo_residuo: 'PERFUROCORTANTE',
        peso: 18.2,
        unidade: 'kg',
        usuario: 'Mariana Lima - Farmácia',
        observacao: 'Descarte caixas Descarpack UTI 2',
        device_id: 'HAOC-TAB-01',
        device_name: 'Tablet Pesagem 01',
        location: 'Expedição Subsolo',
        sync_status: 'local',
        is_demo: true,
        created_at: '2026-10-01T09:20:15.000Z',
        updated_at: '2026-10-01T09:20:15.000Z',
      },
      {
        id: 'HAOC-PES-20261001-004',
        data: '2026-10-01',
        hora: '10:45:00',
        timestamp: new Date('2026-10-01T10:45:00').getTime(),
        tipo_residuo: 'MIX',
        peso: 84.6,
        unidade: 'kg',
        usuario: 'Carlos Eduardo - Higiene',
        observacao: 'Papelão e plásticos limpos triagem',
        device_id: 'HAOC-TAB-01',
        device_name: 'Tablet Pesagem 01',
        location: 'Expedição Subsolo',
        sync_status: 'local',
        is_demo: true,
        created_at: '2026-10-01T10:45:00.000Z',
        updated_at: '2026-10-01T10:45:00.000Z',
      },
      {
        id: 'HAOC-PES-20261001-005',
        data: '2026-10-01',
        hora: '11:30:22',
        timestamp: new Date('2026-10-01T11:30:22').getTime(),
        tipo_residuo: 'QUIMICO',
        peso: 22.4,
        unidade: 'kg',
        usuario: 'Roberto Santos - Lab',
        observacao: 'Frascos reagentes vencidos laboratório',
        device_id: 'HAOC-TAB-01',
        device_name: 'Tablet Pesagem 01',
        location: 'Expedição Subsolo',
        sync_status: 'local',
        is_demo: true,
        created_at: '2026-10-01T11:30:22.000Z',
        updated_at: '2026-10-01T11:30:22.000Z',
      },
      {
        id: 'HAOC-PES-20261001-006',
        data: '2026-10-01',
        hora: '13:10:05',
        timestamp: new Date('2026-10-01T13:10:05').getTime(),
        tipo_residuo: 'COMPOSTAGEM',
        peso: 65.0,
        unidade: 'kg',
        usuario: 'Carlos Eduardo - Higiene',
        observacao: 'Orgânicos Nutrição / SND',
        device_id: 'HAOC-TAB-01',
        device_name: 'Tablet Pesagem 01',
        location: 'Expedição Subsolo',
        sync_status: 'local',
        is_demo: true,
        created_at: '2026-10-01T13:10:05.000Z',
        updated_at: '2026-10-01T13:10:05.000Z',
      },
      {
        id: 'HAOC-PES-20261001-007',
        data: '2026-10-01',
        hora: '14:25:50',
        timestamp: new Date('2026-10-01T14:25:50').getTime(),
        tipo_residuo: 'CNPH',
        peso: 15.3,
        unidade: 'kg',
        usuario: 'Enf. Juliana Ramos',
        observacao: 'Logística reversa medicamentos controlados',
        device_id: 'HAOC-TAB-01',
        device_name: 'Tablet Pesagem 01',
        location: 'Expedição Subsolo',
        sync_status: 'local',
        is_demo: true,
        created_at: '2026-10-01T14:25:50.000Z',
        updated_at: '2026-10-01T14:25:50.000Z',
      },
      {
        id: 'HAOC-PES-20261001-008',
        data: '2026-10-01',
        hora: '15:40:18',
        timestamp: new Date('2026-10-01T15:40:18').getTime(),
        tipo_residuo: 'TAMPINHAS',
        peso: 8.7,
        unidade: 'kg',
        usuario: 'Comitê Sustentabilidade HAOC',
        observacao: 'Ponto de Coleta Recepção Central',
        device_id: 'HAOC-TAB-01',
        device_name: 'Tablet Pesagem 01',
        location: 'Expedição Subsolo',
        sync_status: 'local',
        is_demo: true,
        created_at: '2026-10-01T15:40:18.000Z',
        updated_at: '2026-10-01T15:40:18.000Z',
      },
      {
        id: 'HAOC-PES-20261001-009',
        data: '2026-10-01',
        hora: '16:15:33',
        timestamp: new Date('2026-10-01T16:15:33').getTime(),
        tipo_residuo: 'PECAS_ANATOMICAS',
        peso: 6.4,
        unidade: 'kg',
        usuario: 'Patologia / Anatomia',
        observacao: 'Resíduo patológico formolizado',
        device_id: 'HAOC-TAB-01',
        device_name: 'Tablet Pesagem 01',
        location: 'Expedição Subsolo',
        sync_status: 'local',
        is_demo: true,
        created_at: '2026-10-01T16:15:33.000Z',
        updated_at: '2026-10-01T16:15:33.000Z',
      },
      {
        id: 'HAOC-PES-20261001-010',
        data: '2026-10-01',
        hora: '17:05:10',
        timestamp: new Date('2026-10-01T17:05:10').getTime(),
        tipo_residuo: 'SUCATA_ELETRONICA',
        peso: 34.2,
        unidade: 'kg',
        usuario: 'Engenharia Clínica / TI',
        observacao: 'Fontes e baterias de monitores nobreaks',
        device_id: 'HAOC-TAB-01',
        device_name: 'Tablet Pesagem 01',
        location: 'Expedição Subsolo',
        sync_status: 'local',
        is_demo: true,
        created_at: '2026-10-01T17:05:10.000Z',
        updated_at: '2026-10-01T17:05:10.000Z',
      },
    ];

    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_PESAGENS, STORE_AUDITORIA], 'readwrite');
      const store = tx.objectStore(STORE_PESAGENS);
      const auditStore = tx.objectStore(STORE_AUDITORIA);

      for (const rec of demoRecords) {
        store.put(rec);
      }

      const auditLog: AuditoriaRecord = {
        id: 'AUD-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        timestamp: Date.now(),
        operacao: 'GERACAO_DEMO',
        detalhes: `Gerados ${demoRecords.length} lançamentos de demonstração inicial para teste do Dashboard.`,
        usuario: usuario || 'Sistema Inicial',
        created_at: new Date().toISOString(),
      };
      auditStore.add(auditLog);

      tx.oncomplete = () => resolve(demoRecords.length);
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const dbService = new DatabaseService();
