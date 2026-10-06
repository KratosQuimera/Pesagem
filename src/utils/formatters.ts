import { PesagemRecord, FiltrosPesagem, ResiduoCategoria } from '../types';
import { RESIDUO_MAP } from '../services/config';

/**
 * Format a number to Brazilian currency/weight style (e.g. 1.245,50 kg)
 */
export function formatPeso(valor: number, includeUnit = true): string {
  if (isNaN(valor) || valor === null || valor === undefined) {
    return includeUnit ? '0,00 kg' : '0,00';
  }
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);

  return includeUnit ? `${formatted} kg` : formatted;
}

/**
 * Parses user input that might contain commas or periods into a clean float
 */
export function parsePesoInput(input: string): number {
  if (!input) return 0;
  // Replace comma with dot, remove any non-digit/dot
  const normalized = input.trim().replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : Math.max(0, Number(parsed.toFixed(2)));
}

/**
 * Validates weight value
 */
export function validarPeso(input: string | number): { valido: boolean; mensagem?: string; valor: number } {
  let val = typeof input === 'number' ? input : parsePesoInput(input);
  if (val <= 0) {
    return { valido: false, mensagem: 'O peso deve ser maior que zero (0,00 kg).', valor: 0 };
  }
  if (val > 5000) {
    return { valido: false, mensagem: 'Peso excessivo. Verifique se o valor está em kg.', valor: val };
  }
  return { valido: true, valor: val };
}

/**
 * Format date in PT-BR (DD/MM/YYYY)
 */
export function formatDateBR(dateStrOrTs: string | number | Date): string {
  if (!dateStrOrTs) return '-';
  const d = dateStrOrTs instanceof Date ? dateStrOrTs : new Date(dateStrOrTs);
  if (isNaN(d.getTime())) return String(dateStrOrTs);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format time in PT-BR (HH:mm:ss)
 */
export function formatTimeBR(dateStrOrTs: string | number | Date): string {
  if (!dateStrOrTs) return '-';
  const d = dateStrOrTs instanceof Date ? dateStrOrTs : new Date(dateStrOrTs);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Format datetime in PT-BR
 */
export function formatDateTimeBR(dateStrOrTs: string | number | Date): string {
  if (!dateStrOrTs) return '-';
  const d = dateStrOrTs instanceof Date ? dateStrOrTs : new Date(dateStrOrTs);
  if (isNaN(d.getTime())) return '-';
  return `${formatDateBR(d)} ${formatTimeBR(d)}`;
}

/**
 * Get start and end dates based on filter
 */
export function getDateRangeFromFilter(filtro: FiltrosPesagem): { start: Date; end: Date } {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (filtro.periodo) {
    case 'hoje':
      return { start: todayStart, end: todayEnd };

    case 'ontem': {
      const ontemStart = new Date(todayStart);
      ontemStart.setDate(ontemStart.getDate() - 1);
      const ontemEnd = new Date(todayEnd);
      ontemEnd.setDate(ontemEnd.getDate() - 1);
      return { start: ontemStart, end: ontemEnd };
    }

    case 'ultimos_7_dias': {
      const past7 = new Date(todayStart);
      past7.setDate(past7.getDate() - 6);
      return { start: past7, end: todayEnd };
    }

    case 'ultimos_30_dias': {
      const past30 = new Date(todayStart);
      past30.setDate(past30.getDate() - 29);
      return { start: past30, end: todayEnd };
    }

    case 'este_mes': {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return { start: monthStart, end: todayEnd };
    }

    case 'personalizado': {
      const start = filtro.dataInicio ? new Date(`${filtro.dataInicio}T00:00:00`) : new Date(0);
      const end = filtro.dataFim ? new Date(`${filtro.dataFim}T23:59:59`) : new Date();
      return { start, end };
    }

    default:
      return { start: new Date(0), end: todayEnd };
  }
}

/**
 * Filter pesagens according to criteria
 */
export function filtrarPesagens(pesagens: PesagemRecord[], filtros: FiltrosPesagem): PesagemRecord[] {
  const { start, end } = getDateRangeFromFilter(filtros);

  return pesagens.filter((p) => {
    // Check date
    const pDate = new Date(p.timestamp);
    if (pDate < start || pDate > end) return false;

    // Check waste type
    if (filtros.tipoResiduo !== 'TODOS' && p.tipo_residuo !== filtros.tipoResiduo) {
      return false;
    }

    // Check search term
    if (filtros.termoBusca && filtros.termoBusca.trim() !== '') {
      const term = filtros.termoBusca.toLowerCase().trim();
      const cat = RESIDUO_MAP[p.tipo_residuo];
      const matchText = [
        p.id,
        p.tipo_residuo,
        cat ? cat.nome : '',
        p.usuario,
        p.observacao || '',
        p.device_name || '',
        p.location || '',
        formatPeso(p.peso),
      ]
        .join(' ')
        .toLowerCase();

      if (!matchText.includes(term)) return false;
    }

    return true;
  });
}

/**
 * Generate CSV compatible with Excel Brazil (semicolon delimiter, UTF-8 with BOM)
 */
export function exportToCSV(pesagens: PesagemRecord[], filename = 'pesagens_haoc.csv'): void {
  const headers = [
    'ID',
    'Data',
    'Hora',
    'Tipo de Resíduo',
    'Classificação ANVISA',
    'Peso (kg)',
    'Unidade',
    'Operador',
    'Dispositivo',
    'Local',
    'Observação',
    'Data de Registro',
  ];

  const escapeCSV = (str: unknown) => {
    if (str === null || str === undefined) return '""';
    const stringVal = String(str).replace(/"/g, '""');
    return `"${stringVal}"`;
  };

  const rows = pesagens.map((p) => {
    const cat = RESIDUO_MAP[p.tipo_residuo];
    return [
      escapeCSV(p.id),
      escapeCSV(p.data),
      escapeCSV(p.hora),
      escapeCSV(cat ? cat.nome : p.tipo_residuo),
      escapeCSV(cat ? cat.grupoAnvisa : '-'),
      escapeCSV(formatPeso(p.peso, false)), // Decimal string for Excel
      escapeCSV(p.unidade),
      escapeCSV(p.usuario),
      escapeCSV(p.device_name || '-'),
      escapeCSV(p.location || '-'),
      escapeCSV(p.observacao || ''),
      escapeCSV(p.created_at),
    ].join(';');
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

/**
 * Generate Excel XML Workbook (.xls) that opens natively in Microsoft Excel with styling and totals
 */
export function exportToExcel(pesagens: PesagemRecord[], filename = 'pesagens_haoc.xls'): void {
  const totalPeso = pesagens.reduce((acc, p) => acc + p.peso, 0);

  const rowsXml = pesagens
    .map((p) => {
      const cat = RESIDUO_MAP[p.tipo_residuo];
      return `
      <Row>
        <Cell><Data ss:Type="String">${escapeXml(p.id)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(p.data)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(p.hora)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(cat ? cat.nome : p.tipo_residuo)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(cat ? cat.grupoAnvisa : '-')}</Data></Cell>
        <Cell ss:StyleID="DecimalStyle"><Data ss:Type="Number">${p.peso.toFixed(2)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(p.unidade)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(p.usuario)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(p.device_name || '-')}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(p.location || '-')}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(p.observacao || '')}</Data></Cell>
      </Row>`;
    })
    .join('');

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#003366" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center"/>
  </Style>
  <Style ss:ID="DecimalStyle">
   <NumberFormat ss:Format="#,##0.00"/>
   <Alignment ss:Horizontal="Right"/>
  </Style>
  <Style ss:ID="TotalStyle">
   <Font ss:Bold="1" ss:Color="#003366"/>
   <Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Pesagens HAOC">
  <Table>
   <Column ss:Width="160"/>
   <Column ss:Width="80"/>
   <Column ss:Width="70"/>
   <Column ss:Width="140"/>
   <Column ss:Width="110"/>
   <Column ss:Width="90"/>
   <Column ss:Width="60"/>
   <Column ss:Width="160"/>
   <Column ss:Width="120"/>
   <Column ss:Width="160"/>
   <Column ss:Width="200"/>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">ID do Registro</Data></Cell>
    <Cell><Data ss:Type="String">Data</Data></Cell>
    <Cell><Data ss:Type="String">Hora</Data></Cell>
    <Cell><Data ss:Type="String">Tipo de Resíduo</Data></Cell>
    <Cell><Data ss:Type="String">Grupo ANVISA</Data></Cell>
    <Cell><Data ss:Type="String">Peso (kg)</Data></Cell>
    <Cell><Data ss:Type="String">Unidade</Data></Cell>
    <Cell><Data ss:Type="String">Operador</Data></Cell>
    <Cell><Data ss:Type="String">Dispositivo</Data></Cell>
    <Cell><Data ss:Type="String">Localização</Data></Cell>
    <Cell><Data ss:Type="String">Observações</Data></Cell>
   </Row>
   ${rowsXml}
   <Row ss:StyleID="TotalStyle">
    <Cell><Data ss:Type="String">TOTAL GERAL</Data></Cell>
    <Cell><Data ss:Type="String"></Data></Cell>
    <Cell><Data ss:Type="String"></Data></Cell>
    <Cell><Data ss:Type="String"></Data></Cell>
    <Cell><Data ss:Type="String">${pesagens.length} lançamentos</Data></Cell>
    <Cell ss:StyleID="TotalStyle"><Data ss:Type="Number">${totalPeso.toFixed(2)}</Data></Cell>
    <Cell><Data ss:Type="String">kg</Data></Cell>
    <Cell><Data ss:Type="String"></Data></Cell>
    <Cell><Data ss:Type="String"></Data></Cell>
    <Cell><Data ss:Type="String"></Data></Cell>
    <Cell><Data ss:Type="String"></Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
  downloadBlob(blob, filename);
}

function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Calculates simple checksum for backup integrity verification
 */
export function calculateChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}
