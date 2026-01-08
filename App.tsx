import { saveSheetAPI, loadSheetAPI } from './api';
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { SheetData, GridCell, SelectionRange, CellStyle, TableMode, CellMetadata } from './types.ts';
import { MAIN_COLUMNS, TRUCK_COLUMNS } from './constants.tsx';
import Header from './components/Header.tsx';
import Toolbar from './components/Toolbar.tsx';
import PasteModal from './components/PasteModal.tsx';
import SettingsModal from './components/SettingsModal.tsx';
import Login from './components/Login.tsx';
import { evaluateCell, parseAmazonPaste, extractAddressDetails, indexToExcelCol, extractInternalModel, parseTSV } from './utils/formulaEvaluator.ts';

const STORAGE_KEY_MAIN = 'mindego_main_sheet_v1';

const createEmptySheet = (id: string, name: string): SheetData => ({
  id,
  name,
  rows: {},
  columnWidths: {},
  filters: {},
});

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  
  const [mode, setMode] = useState<TableMode>(TableMode.MAIN);

  const [mainSheet, setMainSheet] = useState<SheetData>(() => {
    const defaultSheet = createEmptySheet('main', '亚马逊订单核算');
    const saved = localStorage.getItem(STORAGE_KEY_MAIN);
    if (!saved) return defaultSheet;
    try {
      const parsed = JSON.parse(saved);
      if (!parsed || typeof parsed !== 'object') return defaultSheet;

      const rawFilters = parsed.filters || {};
      const sanitizedFilters: Record<string, string[]> = {};
      Object.entries(rawFilters).forEach(([key, val]) => {
        if (Array.isArray(val)) {
          sanitizedFilters[key] = val;
        }
      });

      return {
        ...defaultSheet,
        ...parsed,
        rows: parsed.rows || {},
        columnWidths: parsed.columnWidths || {},
        filters: sanitizedFilters
      };
    } catch (e) {
      console.error("加载主表数据失败:", e);
      return defaultSheet;
    }
  });
  
  // ... 其他代码

    const [mode, setMode] = useState<TableMode>(TableMode.MAIN);

const [mainSheet, setMainSheet] = useState<SheetData>(() => {
  const defaultSheet = createEmptySheet('main', '亚马逊订单核算');
  const saved = localStorage.getItem(STORAGE_KEY_MAIN);
  if (!saved) return defaultSheet;
  try {
    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== 'object') return defaultSheet;

    const rawFilters = parsed.filters || {};
    const sanitizedFilters: Record<string, string[]> = {};
    Object.entries(rawFilters).forEach(([key, val]) => {
      if (Array.isArray(val)) {
        sanitizedFilters[key] = val;
      }
    });

    return {
      ...defaultSheet,
      ...parsed,
      rows: parsed.rows || {},
      columnWidths: parsed.columnWidths || {},
      filters: sanitizedFilters
    };
  } catch (e) {
    console.error("加载主表数据失败:", e);
    return defaultSheet;
  }
});

const [truckSheet, setTruckSheet] = useState<SheetData>(() => createEmptySheet('truck', '卡派系统转换'));

const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
const [isSettingsOpen, setIsSettingsOpen] = useState(false);
const [selection, setSelection] = useState<SelectionRange | null>(null);
const [editingCell, setEditingCell] = useState<GridCell & { initialValue?: string } | null>(null);
const [history, setHistory] = useState<SheetData[][]>([]);
const [previewImage, setPreviewImage] = useState<string | null>(null);
const [activeFilterCol, setActiveFilterCol] = useState<{col: string, index: number} | null>(null);
const [filterSearch, setFilterSearch] = useState('');

const fileInputRef = useRef<HTMLInputElement>(null);

  const currentSheet = mode === TableMode.MAIN ? mainSheet : truckSheet;
  const currentColumns = mode === TableMode.MAIN ? MAIN_COLUMNS : TRUCK_COLUMNS;

  useEffect(() => {
  if (isLoggedIn) {
    localStorage.setItem(STORAGE_KEY_MAIN, JSON.stringify(mainSheet));
    // 同时保存到后端
    saveSheetAPI(mainSheet).catch(err => console.error('Failed to save to backend:', err));
  }
}, [mainSheet, isLoggedIn]);

// 登录时从后端加载数据
useEffect(() => {
  if (isLoggedIn) {
    loadSheetAPI().then(result => {
      if (result.data) {
        setMainSheet(result.data);
      }
    }).catch(err => console.error('Failed to load from backend:', err));
  }
}, [isLoggedIn]);

  const updateSheet = useCallback((updater: (prev: SheetData) => SheetData) => {
    if (mode === TableMode.MAIN) setMainSheet(updater);
    else setTruckSheet(updater);
  }, [mode]);

  const saveHistory = useCallback(() => {
    setHistory(prev => [[{...mainSheet}, {...truckSheet}], ...prev.slice(0, 19)]);
  }, [mainSheet, truckSheet]);

  const handleUndo = useCallback(() => {
    if (history.length > 0) {
      const [prevMain, prevTruck] = history[0];
      setMainSheet(prevMain);
      setTruckSheet(prevTruck);
      setHistory(h => h.slice(1));
    }
  }, [history]);

  const handleCellChange = (row: number, colLetter: string, value: string) => {
    saveHistory();
    updateSheet(prev => {
      const newRows = { ...prev.rows };
      if (!newRows[row]) newRows[row] = {};
      const isFormula = value.startsWith('=');
      newRows[row][colLetter] = {
        ...newRows[row][colLetter],
        value: isFormula ? '' : value,
        formula: isFormula ? value : undefined,
      };
      return { ...prev, rows: newRows };
    });
  };

  const deleteSelection = useCallback(() => {
    if (!selection) return;
    saveHistory();
    updateSheet(prev => {
      const newRows = { ...prev.rows };
      const startR = Math.min(selection.start.row, selection.end.row);
      const endR = Math.max(selection.start.row, selection.end.row);
      const startCIdx = Math.min(selection.start.colIndex, selection.end.colIndex);
      const endCIdx = Math.max(selection.start.colIndex, selection.end.colIndex);

      const isWholeRow = startCIdx === 0 && endCIdx === currentColumns.length - 1;
      if (isWholeRow) {
        const deleteCount = endR - startR + 1;
        const resultRows: typeof newRows = {};
        Object.entries(newRows).forEach(([idx, data]) => {
          const r = parseInt(idx);
          if (r < startR) resultRows[r] = data;
          else if (r > endR) resultRows[r - deleteCount] = data;
        });
        return { ...prev, rows: resultRows };
      } else {
        for (let r = startR; r <= endR; r++) {
          if (!newRows[r]) continue;
          for (let c = startCIdx; c <= endCIdx; c++) {
            const letter = indexToExcelCol(c);
            delete newRows[r][letter];
          }
        }
        return { ...prev, rows: newRows };
      }
    });
  }, [selection, currentColumns.length, updateSheet, saveHistory]);

  const handleCopy = useCallback(() => {
    if (!selection) return;
    const startR = Math.min(selection.start.row, selection.end.row);
    const endR = Math.max(selection.start.row, selection.end.row);
    const startC = Math.min(selection.start.colIndex, selection.end.colIndex);
    const endC = Math.max(selection.start.colIndex, selection.end.colIndex);

    let tsvLines = [];
    for (let r = startR; r <= endR; r++) {
      let line = [];
      for (let c = startC; c <= endC; c++) {
        const letter = indexToExcelCol(c);
        const cell = currentSheet.rows[r]?.[letter];
        line.push(cell?.formula || cell?.value || '');
      }
      tsvLines.push(line.join('\t'));
    }
    navigator.clipboard.writeText(tsvLines.join('\n'));
  }, [selection, currentSheet]);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || !selection) return;

    const tsv = e.clipboardData?.getData('text/plain');
    if (!tsv) return;

    e.preventDefault();
    saveHistory();
    const matrix = parseTSV(tsv);
    updateSheet(prev => {
      const newRows = { ...prev.rows };
      const startR = selection.start.row;
      const startCIdx = selection.start.colIndex;

      matrix.forEach((rowData, rOffset) => {
        const targetR = startR + rOffset;
        if (!newRows[targetR]) newRows[targetR] = {};
        rowData.forEach((val, cOffset) => {
          const targetColIdx = startCIdx + cOffset;
          if (targetColIdx < currentColumns.length) {
            const targetCol = indexToExcelCol(targetColIdx);
            const isFormula = String(val).startsWith('=');
            newRows[targetR][targetCol] = { 
              ...newRows[targetR][targetCol], 
              value: isFormula ? '' : val,
              formula: isFormula ? String(val) : undefined
            };
          }
        });
      });
      return { ...prev, rows: newRows };
    });
  }, [selection, currentColumns.length, updateSheet, saveHistory]);

  const handleGlobalKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isLoggedIn || editingCell) return;
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

    if (!selection) return;

    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      handleCopy();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      deleteSelection();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      setEditingCell(selection.start);
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      setEditingCell({ ...selection.start, initialValue: e.key });
    }
  }, [selection, editingCell, deleteSelection, handleCopy, isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    window.addEventListener('paste', handlePaste);
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [handlePaste, handleGlobalKeyDown, isLoggedIn]);

  const filteredRows = useMemo(() => {
    const applySort = (indices: number[]) => {
      if (currentSheet.sort) {
        const { col, direction } = currentSheet.sort;
        return [...indices].sort((a, b) => {
          const valA = evaluateCell(currentSheet.rows[a]?.[col], currentSheet, a);
          const valB = evaluateCell(currentSheet.rows[b]?.[col], currentSheet, b);
          if (valA === valB) return 0;
          const res = (valA ?? '') > (valB ?? '') ? 1 : -1;
          return direction === 'asc' ? res : -res;
        });
      }
      return indices;
    };

    let allRowIndices = Object.keys(currentSheet.rows).map(Number).sort((a, b) => a - b);
    
    if (!currentSheet.filters || Object.keys(currentSheet.filters).length === 0) {
      return applySort(allRowIndices);
    }

    const result = allRowIndices.filter(rIdx => {
      const row = currentSheet.rows[rIdx];
      if (!row) return false;
      return (Object.entries(currentSheet.filters) as [string, string[]][]).every(([col, selectedValues]) => {
        if (!selectedValues || selectedValues.length === 0) return true;
        const cell = row[col];
        let actualCell = cell;
        if (cell?.hidden) {
          let checkIdx = rIdx;
          while (checkIdx >= 0) {
            const p = currentSheet.rows[checkIdx]?.[col];
            if (p && !p.hidden) {
              actualCell = p;
              break;
            }
            checkIdx--;
          }
        }
        const evaluatedValue = String(evaluateCell(actualCell, currentSheet, rIdx) ?? '');
        return selectedValues.includes(evaluatedValue);
      });
    });

    return applySort(result);
  }, [currentSheet.rows, currentSheet.filters, currentSheet.sort]);

  const getUniqueValues = (colLetter: string) => {
    const values = new Set<string>();
    Object.keys(currentSheet.rows).forEach(rIdx => {
      const r = parseInt(rIdx);
      const cell = currentSheet.rows[r][colLetter];
      if (cell && cell.hidden) return;
      values.add(String(evaluateCell(cell, currentSheet, r) ?? ''));
    });
    return Array.from(values).sort();
  };

  const onExport = () => {
    const rowIndices = filteredRows;
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <style>
          table { border-collapse: collapse; }
          td { border: 0.5pt solid #cccccc; vertical-align: middle; padding: 4px; font-family: 'Segoe UI', Arial; font-size: 10pt; }
          .header { background-color: #f3f4f6; font-weight: bold; text-align: center; border: 0.5pt solid #999999; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>${currentColumns.map(c => `<th class="header" style="width:${c.width}pt">${c.label}</th>`).join('')}</tr>
          </thead>
          <tbody>
    `;

    rowIndices.forEach(r => {
      html += '<tr>';
      currentColumns.forEach((col, cIdx) => {
        const letter = indexToExcelCol(cIdx);
        const cell = currentSheet.rows[r]?.[letter];
        if (cell?.hidden) return;

        const formulaAttr = cell?.formula ? ` x:f="${cell.formula}"` : '';
        const rowspanAttr = cell?.rowSpan && cell.rowSpan > 1 ? ` rowspan="${cell.rowSpan}"` : '';
        const colspanAttr = cell?.colSpan && cell.colSpan > 1 ? ` colspan="${cell.colSpan}"` : '';
        
        const style = cell?.style || {};
        const cssStyle = [
          style.bold ? 'font-weight:bold' : '',
          style.italic ? 'font-style:italic' : '',
          style.underline ? 'text-decoration:underline' : '',
          style.color ? `color:${style.color}` : '',
          style.backgroundColor ? `background-color:${style.backgroundColor}` : '',
          style.textAlign ? `text-align:${style.textAlign}` : '',
          style.wrapText ? 'white-space:normal' : 'white-space:nowrap'
        ].filter(Boolean).join(';');

        const val = evaluateCell(cell, currentSheet, r);
        let content = String(val ?? '');
        if (typeof val === 'string' && val.startsWith('data:image')) {
          content = `<img src="${val}" width="80" height="80" style="display:block; margin:auto">`;
        }
        
        html += `<td${rowspanAttr}${colspanAttr}${formulaAttr} style="${cssStyle}">${content}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table></body></html>';

    const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${currentSheet.name}_${new Date().toLocaleDateString()}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
  };

  const handleCellClick = (r: number, colLetter: string, cIdx: number) => {
    if (selection && selection.start.row === r && selection.start.colIndex === cIdx) {
      setEditingCell({ row: r, col: colLetter, colIndex: cIdx });
    } else {
      setSelection({ start: { row: r, col: colLetter, colIndex: cIdx }, end: { row: r, col: colLetter, colIndex: cIdx } });
    }
  };

  const handleImport = (text: string, rowsPerOrder: number) => {
    const data = parseAmazonPaste(text);
    saveHistory();
    setMainSheet(prev => {
      const newRows = { ...prev.rows };
      let startR = 0;
      const existingIndices = Object.keys(newRows).map(Number).sort((a, b) => a - b);
      if (existingIndices.length > 0) startR = Math.max(...existingIndices) + 1;

      let maxSerial = 0;
      Object.values(newRows).forEach(row => {
        const val = parseInt(String(row['A']?.value));
        if (!isNaN(val)) maxSerial = Math.max(maxSerial, val);
      });
      const nextSerial = maxSerial + 1;

      const mergedCols = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','Y','AH','AI','AJ','AK','AL','AV','AY','AZ','BA','BB','BC','BD','BE','BF','BG','BH','BI','BJ','BK','BL','BM','BN','BO','BP','BQ','BR','BS'];
      
      for (let i = 0; i < rowsPerOrder; i++) {
        const r = startR + i;
        const excelR = r + 2; 
        if (!newRows[r]) newRows[r] = {};
        MAIN_COLUMNS.forEach((colDef, cIdx) => {
          const col = indexToExcelCol(cIdx);
          const cell: CellMetadata = { value: '', style: { color: '#000000' } };
          if (mergedCols.includes(col) && i > 0) {
            cell.hidden = true;
          } else {
            if (mergedCols.includes(col) && i === 0) cell.rowSpan = rowsPerOrder;
            if (col === 'A' && i === 0) cell.value = nextSerial;
            if (col === 'B' && i === 0) cell.value = new Date().toLocaleDateString();
            if (col === 'K' && i === 0) cell.value = data.order_id;
            if (col === 'M' && i === 0) cell.value = data.product_name;
            if (col === 'E' && i === 0) cell.value = data.inch_size;
            if (col === 'BJ' && i === 0) cell.value = data.sku;
            if (col === 'BG' && i === 0) cell.value = data.sales_price || '0';
            if (col === 'O' && i === 0) cell.value = '1';
            if (col === 'P' && i === 0) cell.value = data.sales_price || '0';
            if (col === 'AV' && i === 0) { cell.value = data.full_address; cell.style = { wrapText: true }; }
            if (col === 'BK' && i === 0) cell.value = data.ship_date;
            if (col === 'BL' && i === 0) cell.value = data.delivery_date;
            if (i === rowsPerOrder - 1) {
              if (col === 'AW') cell.value = data.fedex_method;
              if (col === 'AX') cell.value = data.tracking_num.join(', ');
            }
            if (col === 'Q') cell.formula = `=O${excelR}*P${excelR}`;
            if (col === 'AG') cell.formula = `=AE${excelR}*AF${excelR}`;
            if (col === 'AL') cell.formula = i === 0 ? `=AG${excelR}+AI${excelR}+AK${excelR}` : `=AG${excelR}`;
            if (col === 'AQ') cell.formula = `=AN${excelR}/2.54`;
            if (col === 'AR') cell.formula = `=AO${excelR}/2.54`;
            if (col === 'AS') cell.formula = `=AP${excelR}/2.54`;
            if (col === 'AT') cell.formula = `=AM${excelR}*2.2046226`;
            if (col === 'AU') cell.formula = `=AQ${excelR}*AR${excelR}*AS${excelR}/6000`;
            if (col === 'BD') cell.formula = `=Q${excelR}+AL${excelR}+BC${excelR}`;
            if (col === 'BE') cell.formula = `=BG${excelR}*0.75-BH${excelR}+BI${excelR}`;
            if (col === 'BF') cell.formula = `=BE${excelR}*7-BD${excelR}`;
          }
          newRows[r][col] = cell;
        });
      }
      return { ...prev, rows: newRows };
    });
    setMode(TableMode.MAIN);
  };

  const convertToTrucking = useCallback(() => {
    saveHistory();
    const today = new Date();
    const formattedDate = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;
    
    setTruckSheet(prev => {
      const newTruckRows: Record<number, Record<string, CellMetadata>> = {}; 
      filteredRows.forEach((r, truckRIdx) => {
        const rowData = mainSheet.rows[r];
        if (rowData && rowData['K']?.value && !rowData['K']?.hidden) {
          if (!newTruckRows[truckRIdx]) newTruckRows[truckRIdx] = {};
          const addr = extractAddressDetails(String(rowData['AV']?.value || ''));
          const internalModel = extractInternalModel(String(rowData['M']?.value || ''));
          TRUCK_COLUMNS.forEach((colDef, cIdx) => {
            const letter = indexToExcelCol(cIdx);
            const cell: CellMetadata = { value: colDef.default || '' };
            switch(colDef.id) {
              case 'pickup_date': cell.value = formattedDate; break;
              case 'order_no': cell.value = internalModel; break;
              case 'ref': cell.value = String(rowData['X']?.value || ''); break;
              case 'receiver_contact': cell.value = addr.name; break;
              case 'receiver_phone': cell.value = addr.phone; break;
              case 'receiver_addr_name': cell.value = addr.name; break;
              case 'receiver_zip': cell.value = addr.zip; break;
              case 'receiver_city': cell.value = addr.city; break;
              case 'receiver_state': cell.value = addr.state; break;
              case 'receiver_line1': cell.value = addr.street; break;
              case 'declared_val': cell.value = evaluateCell(rowData['BG'], mainSheet, r) || '0'; break;
              case 'length': cell.value = evaluateCell(rowData['AQ'], mainSheet, r); break;
              case 'width': cell.value = evaluateCell(rowData['AR'], mainSheet, r); break;
              case 'height': cell.value = evaluateCell(rowData['AS'], mainSheet, r); break;
              case 'weight': cell.value = evaluateCell(rowData['AT'], mainSheet, r); break;
            }
            newTruckRows[truckRIdx][letter] = cell;
          });
        }
      });
      return { ...prev, rows: newTruckRows, filters: {} }; 
    });
    setMode(TableMode.TRUCK);
  }, [mainSheet, filteredRows, saveHistory]);

  const toggleValueFilter = (colLetter: string, value: string) => {
    updateSheet(prev => {
      const currentFilters = prev.filters[colLetter] || [];
      const newFilters = currentFilters.includes(value)
        ? currentFilters.filter(v => v !== value)
        : [...currentFilters, value];
      
      const nextFilters = { ...prev.filters };
      if (newFilters.length === 0) delete nextFilters[colLetter];
      else nextFilters[colLetter] = newFilters;
      
      return { ...prev, filters: nextFilters };
    });
  };

  const selectAllFilter = (colLetter: string, values: string[]) => {
    updateSheet(prev => {
      const nextFilters = { ...prev.filters };
      delete nextFilters[colLetter];
      return { ...prev, filters: nextFilters };
    });
  };

  const clearFilter = (colLetter: string) => {
    updateSheet(prev => {
      const nextFilters = { ...prev.filters };
      delete nextFilters[colLetter];
      return { ...prev, filters: nextFilters };
    });
  };

  const setSort = (colLetter: string, direction: 'asc' | 'desc') => {
    updateSheet(prev => ({ ...prev, sort: { col: colLetter, direction } }));
    setActiveFilterCol(null);
  };

  const selectWholeRow = (r: number) => {
    setSelection({
      start: { row: r, col: 'A', colIndex: 0 },
      end: { row: r, col: indexToExcelCol(currentColumns.length - 1), colIndex: currentColumns.length - 1 }
    });
  };

  const selectWholeColumn = (cIdx: number) => {
    const maxR = filteredRows.length > 0 ? Math.max(...filteredRows) : 100;
    setSelection({
      start: { row: 0, col: indexToExcelCol(cIdx), colIndex: cIdx },
      end: { row: maxR, col: indexToExcelCol(cIdx), colIndex: cIdx }
    });
  };

  const handleImageInput = useCallback((file: File) => {
    if (!selection) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      saveHistory();
      updateSheet(prev => {
        const newRows = { ...prev.rows };
        const { row, col } = selection.start;
        if (!newRows[row]) newRows[row] = {};
        newRows[row][col] = { ...newRows[row][col], value: base64 };
        return { ...prev, rows: newRows };
      });
    };
    reader.readAsDataURL(file);
  }, [selection, updateSheet, saveHistory]);

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Header 
        mode={mode} 
        setMode={setMode} 
        onClear={() => {
          if (confirm("确定要重置当前表格的所有数据吗？主表格数据一旦重置无法直接恢复。")) {
            updateSheet(prev => createEmptySheet(prev.id, prev.name));
          }
        }} 
        onExport={onExport}
        onSettings={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
      />
      
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <Toolbar 
          onFormatChange={(style) => {
            if (!selection) return;
            saveHistory();
            updateSheet(prev => {
              const newRows = { ...prev.rows };
              const sR = Math.min(selection.start.row, selection.end.row);
              const eR = Math.max(selection.start.row, selection.end.row);
              const sC = Math.min(selection.start.colIndex, selection.end.colIndex);
              const eC = Math.max(selection.start.colIndex, selection.end.colIndex);
              for (let r = sR; r <= eR; r++) {
                if (!newRows[r]) newRows[r] = {};
                for (let c = sC; c <= eC; c++) {
                  const letter = indexToExcelCol(c);
                  newRows[r][letter] = { ...newRows[r][letter], style: { ...newRows[r][letter]?.style, ...style } };
                }
              }
              return { ...prev, rows: newRows };
            });
          }}
          currentStyle={selection ? currentSheet.rows[selection.start.row]?.[selection.start.col]?.style || {} : {}}
          onUndo={handleUndo} onRedo={() => {}} onMerge={() => {}} onSplit={() => {}} onUpload={() => fileInputRef.current?.click()} onDelete={deleteSelection}
        />
        <div className="flex gap-2">
          {mode === TableMode.MAIN && (
            <button onClick={convertToTrucking} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
              一键转为卡派表格
            </button>
          )}
          <button onClick={() => setIsPasteModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md">导入亚马逊数据</button>
        </div>
        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageInput(file); }} />
      </div>

      <div className="flex-1 overflow-auto bg-slate-100 p-4 scrollbar-thin">
        <div className="inline-block min-w-full bg-white shadow-xl rounded-xl border border-slate-200 overflow-hidden relative">
          <table className="border-collapse table-fixed w-full text-xs">
            <thead>
              <tr className="bg-slate-50">
                <th className="w-12 border-b border-r border-slate-300 sticky top-0 left-0 z-30 bg-slate-50 text-[10px] text-slate-400">1</th>
                {currentColumns.map((col, idx) => {
                  const letter = indexToExcelCol(idx);
                  const isFiltered = !!(currentSheet.filters && currentSheet.filters[letter]);
                  const isSorted = currentSheet.sort?.col === letter;

                  return (
                    <th key={col.id} style={{ width: col.width }} className="border-b border-r border-slate-200 p-2 font-bold text-slate-600 sticky top-0 z-20 bg-slate-50 group">
                      <div className="flex flex-col">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] text-blue-500 cursor-pointer hover:underline" onClick={() => selectWholeColumn(idx)}>{letter}</span>
                          <button 
                            onClick={() => {
                              if (activeFilterCol?.col === letter) setActiveFilterCol(null);
                              else {
                                setActiveFilterCol({ col: letter, index: idx });
                                setFilterSearch('');
                              }
                            }} 
                            className={`p-0.5 rounded transition-colors ${isFiltered ? 'text-blue-600 bg-blue-50' : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100'}`}
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"/>
                            </svg>
                          </button>
                        </div>
                        <div className="flex items-center gap-1 truncate">
                          <span className="truncate">{col.label}</span>
                          {isSorted && (
                            <span className="text-blue-500">
                              {currentSheet.sort?.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>

                        {activeFilterCol?.col === letter && (
                          <div className="absolute top-full left-0 w-64 bg-white shadow-2xl border border-slate-200 z-[100] rounded-xl mt-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            {/* 排序区域 */}
                            <div className="p-2 border-b bg-slate-50 flex gap-1">
                              <button onClick={() => setSort(letter, 'asc')} className="flex-1 py-1.5 text-[10px] bg-white border border-slate-200 rounded hover:bg-blue-50 hover:text-blue-600 font-bold flex items-center justify-center gap-1 transition-colors">
                                升序 A-Z
                              </button>
                              <button onClick={() => setSort(letter, 'desc')} className="flex-1 py-1.5 text-[10px] bg-white border border-slate-200 rounded hover:bg-blue-50 hover:text-blue-600 font-bold flex items-center justify-center gap-1 transition-colors">
                                降序 Z-A
                              </button>
                            </div>

                            {/* 搜索框 */}
                            <div className="p-2 border-b">
                              <div className="relative">
                                <input 
                                  autoFocus 
                                  className="w-full pl-7 pr-2 py-1.5 border border-slate-200 rounded-lg text-[11px] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                                  placeholder="搜索筛选值..."
                                  value={filterSearch}
                                  onChange={(e) => setFilterSearch(e.target.value)}
                                />
                                <svg className="w-3 h-3 absolute left-2.5 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                              </div>
                            </div>

                            {/* 值列表 */}
                            <div className="max-h-56 overflow-y-auto p-2 space-y-0.5 scrollbar-thin">
                              <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer transition-colors group">
                                <input 
                                  type="checkbox" 
                                  className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                  checked={!currentSheet.filters || !currentSheet.filters[letter]}
                                  onChange={() => selectAllFilter(letter, getUniqueValues(letter))}
                                />
                                <span className="text-[11px] font-bold text-slate-700 group-hover:text-blue-600 transition-colors">(全选)</span>
                              </label>
                              {getUniqueValues(letter)
                                .filter(v => v.toLowerCase().includes(filterSearch.toLowerCase()))
                                .map((val, vIdx) => (
                                  <label key={vIdx} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer transition-colors group">
                                    <input 
                                      type="checkbox" 
                                      className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                      checked={!currentSheet.filters || !currentSheet.filters[letter] || currentSheet.filters[letter].includes(val)}
                                      onChange={() => toggleValueFilter(letter, val)}
                                    />
                                    <span className="text-[11px] text-slate-600 group-hover:text-slate-900 truncate" title={val}>{val || '(空白)'}</span>
                                  </label>
                                ))}
                            </div>

                            {/* 底部操作 */}
                            <div className="p-2 border-t bg-slate-50 flex justify-between items-center">
                              <button onClick={() => clearFilter(letter)} className="text-[10px] text-red-500 hover:text-red-600 font-bold px-2 py-1 rounded transition-colors">清除全部</button>
                              <button onClick={() => setActiveFilterCol(null)} className="bg-blue-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-lg shadow-sm hover:bg-blue-700 transition-all active:scale-95">确定</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => (
                <tr key={r} className="group hover:bg-slate-50/50">
                  <td onClick={() => selectWholeRow(r)} className="bg-slate-50 border-b border-r border-slate-300 text-center font-bold text-slate-400 sticky left-0 z-10 text-[10px] cursor-pointer hover:bg-blue-50 hover:text-blue-600">{r + 2}</td>
                  {currentColumns.map((col, cIdx) => {
                    const colLetter = indexToExcelCol(cIdx);
                    const cell = currentSheet.rows[r]?.[colLetter];
                    if (cell?.hidden) return null;
                    const val = evaluateCell(cell, currentSheet, r);
                    const isSelected = selection && r >= Math.min(selection.start.row, selection.end.row) && r <= Math.max(selection.start.row, selection.end.row) && cIdx >= Math.min(selection.start.colIndex, selection.end.colIndex) && cIdx <= Math.max(selection.start.colIndex, selection.end.colIndex);
                    const isEditing = editingCell?.row === r && editingCell?.col === colLetter;
                    
                    const cellStyle = cell?.style || {};
                    const inlineStyle: React.CSSProperties = {
                      fontWeight: cellStyle.bold ? 'bold' : 'normal',
                      fontStyle: cellStyle.italic ? 'italic' : 'normal',
                      textDecoration: cellStyle.underline ? 'underline' : 'none',
                      color: cellStyle.color,
                      backgroundColor: isSelected ? '#eff6ff' : (cellStyle.backgroundColor || 'transparent'),
                      textAlign: cellStyle.textAlign || (col.type === 'number' ? 'right' : 'left'),
                      whiteSpace: cellStyle.wrapText ? 'normal' : 'nowrap',
                      fontSize: cellStyle.fontSize ? `${cellStyle.fontSize}px` : undefined,
                    };

                    return (
                      <td
                        key={cIdx}
                        rowSpan={cell?.rowSpan || 1}
                        colSpan={cell?.colSpan || 1}
                        onMouseDown={() => handleCellClick(r, colLetter, cIdx)}
                        onDoubleClick={() => setEditingCell({ row: r, col: colLetter, colIndex: cIdx })}
                        style={inlineStyle}
                        className={`border-b border-r border-slate-200 p-1.5 h-10 relative cursor-cell ${isSelected ? 'ring-2 ring-blue-500 ring-inset z-10' : ''}`}
                      >
                        {isEditing ? (
                          <input 
                            autoFocus 
                            className="absolute inset-0 w-full h-full p-1.5 outline-none z-40 border-2 border-blue-600 bg-white text-slate-900" 
                            defaultValue={editingCell.initialValue !== undefined ? editingCell.initialValue : (cell?.formula || (cell?.value !== undefined ? String(cell.value) : ''))} 
                            onBlur={(e) => { handleCellChange(r, colLetter, e.target.value); setEditingCell(null); }} 
                            onKeyDown={(e) => { if (e.key === 'Enter') { handleCellChange(r, colLetter, e.currentTarget.value); setEditingCell(null); } }} 
                          />
                        ) : (
                          <div className={`flex items-center h-full overflow-hidden`}>
                            {typeof val === 'string' && val.startsWith('data:image') ? <img src={val} alt="" className="h-full w-auto object-contain mx-auto" onClick={() => setPreviewImage(val)} /> : <span className="w-full text-slate-700 truncate">{val}</span>}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {filteredRows.length < 20 && Array.from({ length: 20 - filteredRows.length }).map((_, i) => (
                <tr key={`empty-${i}`}>
                   <td className="bg-slate-50 border-b border-r border-slate-300 text-center font-bold text-slate-400 sticky left-0 z-10 text-[10px]">-</td>
                   {currentColumns.map((col, cIdx) => (
                     <td key={cIdx} className="border-b border-r border-slate-200 p-1.5 h-10"></td>
                   ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {previewImage && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 cursor-pointer" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} className="max-w-full max-h-full rounded shadow-2xl" />
        </div>
      )}
      <PasteModal isOpen={isPasteModalOpen} onClose={() => setIsPasteModalOpen(false)} onPaste={handleImport} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default App;
