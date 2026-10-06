export type TipoResiduoId =
  | 'COMUM'
  | 'MIX'
  | 'COMPOSTAGEM'
  | 'QUIMICO'
  | 'INFECTANTE'
  | 'PERFUROCORTANTE'
  | 'CNPH'
  | 'TAMPINHAS'
  | 'PECAS_ANATOMICAS'
  | 'SUCATA_ELETRONICA';

export interface ResiduoCategoria {
  id: TipoResiduoId;
  nome: string;
  subtitulo: string;
  grupoAnvisa: 'Grupo A' | 'Grupo B' | 'Grupo D' | 'Grupo E' | 'Reciclável' | 'Especial';
  corHex: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  badgeBgClass: string;
  icone: string;
  ordem: number;
}

export interface PesagemRecord {
  id: string;
  data: string; // YYYY-MM-DD
  hora: string; // HH:mm:ss
  timestamp: number;
  tipo_residuo: TipoResiduoId;
  peso: number; // in kg
  unidade: 'kg';
  usuario: string;
  observacao?: string;
  device_id?: string;
  device_name?: string;
  location?: string;
  sync_status: 'local' | 'synced' | 'pending';
  is_demo?: boolean;
  created_at: string;
  updated_at: string;
}

export type TipoOperacaoAuditoria =
  | 'CRIACAO'
  | 'EDICAO'
  | 'EXCLUSAO'
  | 'RESTAURACAO_BACKUP'
  | 'GERACAO_DEMO'
  | 'LIMPEZA_DEMO'
  | 'ALTERACAO_CONFIG';

export interface AuditoriaRecord {
  id: string;
  timestamp: number;
  operacao: TipoOperacaoAuditoria;
  registro_id?: string;
  detalhes: string;
  usuario: string;
  created_at: string;
}

export interface DeviceConfig {
  device_id: string;
  device_name: string;
  location: string;
  hospital_name: string;
  unidade_hospitalar: string;
  default_operator: string;
  matricula_operador: string;
  totem_pin: string;
  totem_mode: boolean;
  theme: 'light' | 'dark' | 'system';
  auto_reset_seconds: number;
  setup_completed: boolean;
  app_version: string;
}

export interface BackupPayload {
  versao_backup: string;
  app_version: string;
  hospital: string;
  data_geracao: string;
  total_pesagens: number;
  total_auditoria: number;
  checksum: string;
  config: DeviceConfig;
  pesagens: PesagemRecord[];
  auditoria: AuditoriaRecord[];
}

export type FiltroPeriodo =
  | 'hoje'
  | 'ontem'
  | 'ultimos_7_dias'
  | 'ultimos_30_dias'
  | 'este_mes'
  | 'personalizado';

export interface FiltrosPesagem {
  periodo: FiltroPeriodo;
  dataInicio?: string;
  dataFim?: string;
  tipoResiduo: 'TODOS' | TipoResiduoId;
  termoBusca?: string;
}
