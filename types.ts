
export type CellValue = string | number;

export type DataFormat = 'text' | 'number' | 'date' | 'phone';

export interface CellMetadata {
  value: CellValue;
  formula?: string;
  style?: CellStyle;
  rowSpan?: number;
  colSpan?: number;
  hidden?: boolean;
  imageData?: string; // 存储 Base64 图片
  comment?: string; // 单元格批注
  format?: DataFormat;
}

export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontSize?: number;
  wrapText?: boolean;
}

export interface ColumnDefinition {
  id: string;
  label: string;
  width: number;
  type?: 'text' | 'number' | 'image' | 'formula';
  default?: string | number;
}

export interface SheetData {
  id: string;
  name: string;
  rows: Record<number, Record<string, CellMetadata>>;
  columnWidths: Record<string, number>;
  filters: Record<string, string>; // 存储每列的过滤关键词
}

export interface GridCell {
  row: number;
  col: string;
  colIndex: number;
}

export interface SelectionRange {
  start: GridCell;
  end: GridCell;
}

export enum TableMode {
  MAIN = 'MAIN',
  TRUCK = 'TRUCK'
}
