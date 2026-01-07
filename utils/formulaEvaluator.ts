
import { CellMetadata, SheetData } from '../types';

export const indexToExcelCol = (index: number): string => {
  let colName = '';
  let n = index;
  while (n >= 0) {
    colName = String.fromCharCode((n % 26) + 65) + colName;
    n = Math.floor(n / 26) - 1;
  }
  return colName;
};

export const excelColToIndex = (col: string): number => {
  let index = 0;
  for (let i = 0; i < col.length; i++) {
    index = index * 26 + col.charCodeAt(i) - 64;
  }
  return index - 1;
};

export const evaluateCell = (
  cell: CellMetadata | undefined,
  sheet: SheetData,
  rowIdx: number,
  visited = new Set<string>()
): string | number => {
  if (!cell) return '';
  const formula = cell.formula;
  if (!formula || !formula.startsWith('=')) {
    return cell.value !== undefined && cell.value !== null ? cell.value : '';
  }

  let expr = formula.substring(1).toUpperCase();
  
  if (expr === 'ROW()') {
    return rowIdx + 1;
  }

  const cellRefRegex = /([A-Z]+)(\d+)/g;
  
  const processedExpr = expr.replace(cellRefRegex, (match, col, rStr) => {
    const rIdx = parseInt(rStr) - 1;
    const targetCell = sheet.rows[rIdx]?.[col];
    if (!targetCell) return '0';
    const refKey = `${col}${rIdx}`;
    if (visited.has(refKey)) return '0';
    visited.add(refKey);
    const val = evaluateCell(targetCell, sheet, rIdx, visited);
    const num = Number(val);
    return isNaN(num) ? '0' : String(num);
  });

  try {
    if (!/^[0-9\s\+\-\*\/\(\)\.]+$/.test(processedExpr)) return '#VALUE!';
    const result = new Function(`return ${processedExpr}`)();
    return typeof result === 'number' && !isNaN(result) ? Math.round(result * 100) / 100 : result;
  } catch (e) {
    return '#ERROR!';
  }
};

const normalizeDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const datePattern = /(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/;
  const match = dateStr.match(datePattern);
  if (match) {
    return `${match[1]}/${match[2].padStart(2, '0')}/${match[3].padStart(2, '0')}`;
  }
  return dateStr;
};

export interface AmazonParsedData {
  order_id: string;
  sku: string;
  inch_size: string;
  outbound_date: string;
  ship_date: string;
  delivery_date: string;
  sales_price: string;
  fedex_method: string;
  full_address: string;
  tracking_num: string[];
  product_name: string;
}

export const parseAmazonPaste = (text: string): AmazonParsedData => {
  const data: AmazonParsedData = {
    order_id: '',
    sku: '',
    inch_size: '',
    outbound_date: '',
    ship_date: '',
    delivery_date: '',
    sales_price: '',
    fedex_method: '',
    full_address: '',
    tracking_num: [],
    product_name: ''
  };

  const lines = text.split(/\r?\n/).filter(l => l.trim());
  const orderIdMatch = text.match(/订单编号：#\s*([\s\S]+?)(?=\s*您的卖家订单编号：|$)/);
  if (orderIdMatch) data.order_id = orderIdMatch[1].trim();

  const skuMatch = text.match(/SKU:\s*([\s\S]+?)(?=\s*状况:|$)/i);
  if (skuMatch) data.sku = skuMatch[1].trim();

  const productNameMatch = text.match(/已发货\s*([\s\S]+?)(?=\s*ASIN|$)/);
  if (productNameMatch) {
    data.product_name = productNameMatch[1].trim();
    const inchMatch = data.product_name.match(/(\d+(?:\.\d+)?)\s*IN/i);
    if (inchMatch) data.inch_size = inchMatch[1];
  }

  const buyDateMatch = text.match(/购买日期:\s*([^\n\r]+)/);
  if (buyDateMatch) data.outbound_date = normalizeDate(buyDateMatch[1]);

  const overviewIdx = text.indexOf('订单一览');
  const shipPart = overviewIdx !== -1 ? text.substring(overviewIdx) : text;
  const shipDateMatch = shipPart.match(/发货日期:\s*([^\n\r]+)/);
  if (shipDateMatch) data.ship_date = normalizeDate(shipDateMatch[1]);

  const deliveryDateMatch = text.match(/送达日期:\s*([^\n\r]+)/);
  if (deliveryDateMatch) data.delivery_date = normalizeDate(deliveryDateMatch[1]);

  const priceMatch = text.match(/US\$\s*([\d,.]+)(?=\s*商品小计:|$)/);
  if (priceMatch) data.sales_price = priceMatch[1].replace(/,/g, '');

  const trackingBlock = text.match(/追踪编码\s*[\n\r]+\s*([\s\S]+?)(?=\s*(?:配送服务|承运人)|$)/);
  if (trackingBlock) {
    data.tracking_num = trackingBlock[1].trim().split(/[\n\r]+/).map(s => s.trim()).filter(Boolean);
  }

  if (lines.length > 0) {
    data.fedex_method = lines[lines.length - 1].trim();
  }

  const addressMatch = text.match(/配送地址\s*([\s\S]+?电话:\s*[\d\s+-]+)/);
  if (addressMatch) data.full_address = addressMatch[1].trim();

  return data;
};

export const extractAddressDetails = (address: string) => {
  const details = {
    name: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    type: 'Residential'
  };

  const phoneMatch = address.match(/(?:电话|Phone|Tel)[:：]?\s*([\d\s+-]+)/i);
  if (phoneMatch) {
    // 清洗电话格式，尝试保留核心数字，如 951 377-0023
    details.phone = phoneMatch[1].trim().replace(/^\+1\s*/, '');
  }

  const zipMatch = address.match(/\b\d{5}(?:-\d{4})?\b/);
  if (zipMatch) details.zip = zipMatch[0].substring(0, 5);

  const stateMatch = address.match(/\b([A-Z]{2})\b/);
  if (stateMatch) details.state = stateMatch[1];

  const cityMatch = address.match(/([^,\n\r]+),\s*[A-Z]{2}\s*\d{5}/);
  if (cityMatch) details.city = cityMatch[1].trim();

  if (address.includes('住宅') || address.includes('Residential')) details.type = 'Residential';
  else if (address.includes('商业') || address.includes('Business')) details.type = 'Business with dock';

  const lines = address.split(/[\n\r]+/).map(l => l.trim()).filter(Boolean);
  let nameLine = lines[0] || '';
  if (nameLine.includes('配送地址')) nameLine = nameLine.replace('配送地址', '').trim();
  details.name = nameLine;

  if (lines.length > 1) {
    let streetLine = lines[1];
    if (details.city) {
      const cityIdx = streetLine.indexOf(details.city);
      if (cityIdx !== -1) {
        streetLine = streetLine.substring(0, cityIdx).trim();
      }
    }
    details.street = streetLine.replace(/,$/, '').trim();
  }

  return details;
};

export const extractInternalModel = (productName: string): string => {
  const match = productName.match(/[A-Z0-9-]{5,}(?:\s[A-Z0-9-]{2,})?/);
  return match ? match[0] : productName;
};

export const parseTSV = (text: string): string[][] => {
  if (!text) return [];
  // WPS/Excel 导出的 TSV 处理引号包裹及换行符
  const rows = text.split(/\r?\n/).filter(line => line.length > 0);
  return rows.map(line => {
    const cells = line.split('\t');
    return cells.map(cell => cell.replace(/^"|"$/g, '').replace(/""/g, '"'));
  });
};
