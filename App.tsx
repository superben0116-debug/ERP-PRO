import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { SheetData, GridCell, SelectionRange, CellStyle, TableMode, CellMetadata } from './types';
import { MAIN_COLUMNS, TRUCK_COLUMNS } from './constants';
import Header from './components/Header';
import Toolbar from './components/Toolbar';
import PasteModal from './components/PasteModal';
import { evaluateCell, parseAmazonPaste, extractAddressDetails, indexToExcelCol, excelColToIndex, extractInternalModel, parseTSV } from './utils/formulaEvaluator';

const createEmptySheet = (id: string, name: string): SheetData => ({
  id,
  name,
  rows: {},
  columnWidths: {},
  filters: {},
});

const App: React.FC = () => {
  const [mode, setMode] = useState<TableMode>(TableMode.MAIN);
  const [mainSheet, setMainSheet] = useState<SheetData>(() => createEmptySheet('main', '亚马逊订单核算'));
  const [truckSheet, setTruckSheet] = useState<SheetData>(() => createEmptySheet('truck', '卡派系统转换'));
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [selection, setSelection] = useState<SelectionRange | null>(null);
  const [editingCell, setEditingCell] = useState<GridCell | null>(null);
  const [history, setHistory] = useState<SheetData[][]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isDraggingFill, setIsDraggingFill] = useState(false);
  const [fillRange, setFillRange] = useState<SelectionRange | null>(null);
  const [activeFilterCol, setActiveFilterCol] = useState<{col: string, index: number} | null>(null);
  const [filterSearch, setFilterSearch] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentSheet = mode === TableMode.MAIN ? mainSheet : truckSheet;
  const currentColumns = mode === TableMode.MAIN ? MAIN_COLUMNS : TRUCK_COLUMNS;

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

  const handleFormatChange = (style: Partial<CellStyle>) => {
    if (!selection) return;
    saveHistory();
    updateSheet(prev => {
      const newRows = { ...prev.rows };
      const startRow = Math.min(selection.start.row, selection.end.row);
      const endRow = Math.max(selection.start.row, selection.end.row);
      const startColIdx = Math.min(selection.start.colIndex, selection.end.colIndex);
      const endColIdx = Math.max(selection.start.colIndex, selection.end.colIndex);

      for (let r = startRow; r <= endRow; r++) {
        if (!newRows[r]) newRows[r] = {};
        for (let c = startColIdx; c <= endColIdx; c++) {
          const colLetter = indexToExcelCol(c);
          newRows[r][colLetter] = {
            ...newRows[r][colLetter],
            style: { ...newRows[r][colLetter]?.style, ...style }
          };
        }
      }
      return { ...prev, rows: newRows };
    });
  };

  // 批量删除行
  const deleteSelectedRows = useCallback(() => {
    if (!selection) return;
    saveHistory();
    updateSheet(prev => {
      const startR = Math.min(selection.start.row, selection.end.row);
      const endR = Math.max(selection.start.row, selection.end.row);
      const count = endR - startR + 1;
      const newRows: Record<number, Record<string, CellMetadata>> = {};
      
      // Fix: Cast rowData to fix 'unknown' type error in Record mapping
      Object.entries(prev.rows).forEach(([rStr, rowData]) => {
        const r = parseInt(rStr);
        const typedRowData = rowData as Record<string, CellMetadata>;
        if (r < startR) {
          newRows[r] = typedRowData;
        } else if (r > endR) {
          newRows[r - count] = typedRowData;
        }
      });
      return { ...prev, rows: newRows };
    });
    setSelection(null);
  }, [selection, saveHistory, updateSheet]);

  const deleteSelection = useCallback(() => {
    if (!selection) return;
    // 如果是选择了整行，则执行删除行逻辑
    if (selection.start.colIndex === 0 && selection.end.colIndex === currentColumns.length - 1) {
      deleteSelectedRows();
      return;
    }

    saveHistory();
    updateSheet(prev => {
      const newRows = { ...prev.rows };
      const startR = Math.min(selection.start.row, selection.end.row);
      const endR = Math.max(selection.start.row, selection.end.row);
      const startC = Math.min(selection.start.colIndex, selection.end.colIndex);
      const endC = Math.max(selection.start.colIndex, selection.end.colIndex);

      for (let r = startR; r <= endR; r++) {
        if (!newRows[r]) continue;
        for (let c = startC; c <= endC; c++) {
          const colLetter = indexToExcelCol(c);
          delete newRows[r][colLetter];
        }
        if (Object.keys(newRows[r]).length === 0) delete newRows[r];
      }
      return { ...prev, rows: newRows };
    });
  }, [selection, currentColumns.length, saveHistory, updateSheet, deleteSelectedRows]);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const max = 1000;
          if (width > max || height > max) {
            if (width > height) {
              height = (height / width) * max;
              width = max;
            } else {
              width = (width / height) * max;
              height = max;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
      };
    });
  };

  const handleImageInput = async (file: File) => {
    if (!selection) return;
    const base64 = await compressImage(file);
    handleCellChange(selection.start.row, selection.start.col, base64);
  };

  const handleAutoFill = () => {
    if (!selection || !fillRange) return;
    saveHistory();
    updateSheet(prev => {
      const newRows = { ...prev.rows };
      const startR = Math.min(selection.start.row, selection.end.row);
      const endR = Math.max(selection.start.row, selection.end.row);
      const startC = Math.min(selection.start.colIndex, selection.end.colIndex);
      const endC = Math.max(selection.start.colIndex, selection.end.colIndex);
      const fillStartR = fillRange.start.row;
      const fillEndR = fillRange.end.row;
      for (let cIdx = startC; cIdx <= endC; cIdx++) {
        const colLetter = indexToExcelCol(cIdx);
        const values = [];
        for (let r = startR; r <= endR; r++) {
          values.push(newRows[r]?.[colLetter]);
        }
        const isNumeric = values.every(v => v?.value !== undefined && v?.value !== '' && !isNaN(Number(v.value)));
        let step = 0;
        if (isNumeric && values.length >= 2) {
          step = Number(values[1].value) - Number(values[0].value);
        } else if (isNumeric && values.length === 1) {
          step = 1;
        }
        for (let r = fillStartR; r <= fillEndR; r++) {
          if (r >= startR && r <= endR) continue;
          if (!newRows[r]) newRows[r] = {};
          const sourceIdx = (r - startR) % values.length;
          const sourceCell = values[sourceIdx < 0 ? sourceIdx + values.length : sourceIdx];
          if (isNumeric && sourceCell?.value !== undefined) {
            const baseVal = Number(values[values.length - 1]?.value || 0);
            const dist = r > endR ? (r - endR) : (r - startR);
            const newVal = r > endR ? baseVal + (step * dist) : Number(values[0].value) + (step * (r - startR));
            newRows[r][colLetter] = { ...sourceCell, value: newVal };
          } else if (sourceCell) {
            newRows[r][colLetter] = { ...sourceCell };
          }
        }
      }
      return { ...prev, rows: newRows };
    });
    setSelection(fillRange);
    setFillRange(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingCell || isPasteModalOpen || activeFilterCol) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!selection) return;
        deleteSelection();
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && selection) {
        setEditingCell({ ...selection.start });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingCell, selection, deleteSelection, isPasteModalOpen, activeFilterCol]);

  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || editingCell || !selection) return;
      
      const tsvData = e.clipboardData?.getData('text');
      
      // 优先处理文本，防止文字被识别为图片
      if (tsvData && (tsvData.includes('\t') || tsvData.includes('\n') || tsvData.trim().length > 0)) {
        // 如果剪切板中有 TSV 格式数据，优先进行单元格填充
        if (tsvData.includes('\t') || tsvData.includes('\n')) {
          e.preventDefault();
          saveHistory();
          const matrix = parseTSV(tsvData);
          if (matrix.length > 0) {
            updateSheet(prev => {
              const newRows = { ...prev.rows };
              const startR = selection.start.row;
              const startColIdx = selection.start.colIndex;
              matrix.forEach((row, ri) => {
                const targetR = startR + ri;
                if (!newRows[targetR]) newRows[targetR] = {};
                row.forEach((val, ci) => {
                  const targetCol = indexToExcelCol(startColIdx + ci);
                  newRows[targetR][targetCol] = { ...newRows[targetR][targetCol], value: val.trim() };
                });
              });
              return { ...prev, rows: newRows };
            });
          }
          return;
        }
      }

      // 如果没有文字或文字很短，检查是否为图片
      const items = e.clipboardData?.items;
      if (items) {
        for (const item of Array.from(items)) {
          if (item.type.indexOf('image') !== -1) {
            e.preventDefault();
            const file = item.getAsFile();
            if (file) {
              const base64 = await compressImage(file);
              handleCellChange(selection.start.row, selection.start.col, base64);
              return;
            }
          }
        }
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [selection, editingCell, saveHistory, updateSheet]);

  const handleImport = (text: string, rowsPerOrder: number) => {
    const data = parseAmazonPaste(text);
    saveHistory();
    setMainSheet(prev => {
      const newRows = { ...prev.rows };
      let startR = 0;
      // 精准寻找第一个完全空闲的可用行开始导入，解决“导入不显示”或被覆盖问题
      const rowIndices = Object.keys(newRows).map(Number).sort((a,b) => a-b);
      if (rowIndices.length > 0) {
        startR = Math.max(...rowIndices) + 1;
      }
      
      let maxSerial = 0;
      Object.values(newRows).forEach(row => {
        const val = parseInt(String(row['A']?.value));
        if (!isNaN(val)) maxSerial = Math.max(maxSerial, val);
      });
      const nextSerial = maxSerial + 1;
      const mergedCols = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','Y','AH','AI','AJ','AK','AL','AV','AY','AZ','BA','BB','BC','BD','BE','BF','BG','BH','BI','BJ','BK','BL','BM','BN','BO','BP','BQ','BR','BS'];
      
      for (let i = 0; i < rowsPerOrder; i++) {
        const r = startR + i;
        const excelR = r + 1;
        if (!newRows[r]) newRows[r] = {};
        MAIN_COLUMNS.forEach((colDef, cIdx) => {
          const col = indexToExcelCol(cIdx);
          const cell: CellMetadata = { value: '', style: { color: '#000000' } };
          const isMerged = mergedCols.includes(col);
          if (isMerged && i > 0) {
            cell.hidden = true;
          } else {
            if (isMerged && i === 0) cell.rowSpan = rowsPerOrder;
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
            if (col === 'AL') {
              cell.formula = i === 0 ? `=AG${excelR}+AI${excelR}+AK${excelR}` : `=AG${excelR}`;
            }
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
    // 导入后清空筛选，确保新导入数据立即可见
    updateSheet(prev => ({ ...prev, filters: {} }));
  };

  const convertToTrucking = useCallback(() => {
    saveHistory();
    setTruckSheet(prev => {
      const newTruckRows = { ...prev.rows };
      Object.entries(mainSheet.rows).forEach(([rStr, rowData]) => {
        const r = parseInt(rStr);
        if (rowData['K']?.value && !rowData['K']?.hidden) {
          if (!newTruckRows[r]) newTruckRows[r] = {};
          const addr = extractAddressDetails(String(rowData['AV']?.value || ''));
          const internalModel = extractInternalModel(String(rowData['M']?.value || ''));
          const rowSpan = rowData['K']?.rowSpan || 1;
          let allTracking = "";
          for(let k=0; k<rowSpan; k++) {
            const tr = mainSheet.rows[r+k]?.['AX']?.value;
            if(tr) allTracking += (allTracking ? ", " : "") + tr;
          }
          TRUCK_COLUMNS.forEach((colDef, cIdx) => {
            const letter = indexToExcelCol(cIdx);
            const cell: CellMetadata = { value: colDef.default || '' };
            switch(colDef.id) {
              case 'order_no': cell.value = internalModel; break;
              case 'ref': cell.value = allTracking || String(rowData['K']?.value || ''); break;
              case 'receiver_zip': cell.value = addr.zip; break;
              case 'receiver_city': cell.value = addr.city; break;
              case 'receiver_state': cell.value = addr.state; break;
              case 'receiver_contact': cell.value = addr.name; break;
              case 'receiver_phone': cell.value = addr.phone; break;
              case 'receiver_line1': cell.value = addr.street; break;
              case 'receiver_addr_type': cell.value = addr.type; break;
              case 'declared_val': 
                const cost = evaluateCell(rowData['BD'], mainSheet, r);
                const price = evaluateCell(rowData['BG'], mainSheet, r);
                cell.value = cost || price || '0'; 
                break;
              case 'length': cell.value = evaluateCell(rowData['AQ'], mainSheet, r) || ''; break;
              case 'width': cell.value = evaluateCell(rowData['AR'], mainSheet, r) || ''; break;
              case 'height': cell.value = evaluateCell(rowData['AS'], mainSheet, r) || ''; break;
              case 'weight': cell.value = evaluateCell(rowData['AT'], mainSheet, r) || ''; break;
            }
            newTruckRows[r][letter] = cell;
          });
        }
      });
      return { ...prev, rows: newTruckRows };
    });
    setMode(TableMode.TRUCK);
  }, [mainSheet, saveHistory]);

  const onExport = () => {
    const headers = currentColumns.map(c => c.label).join(',');
    const csvRows: string[] = [];
    const rowIndices = Object.keys(currentSheet.rows).map(Number);
    const maxRow = rowIndices.length > 0 ? Math.max(...rowIndices) : 20;

    for (let r = 0; r <= maxRow; r++) {
      const rowData = currentColumns.map((_, cIdx) => {
        const letter = indexToExcelCol(cIdx);
        const cell = currentSheet.rows[r]?.[letter];
        const val = evaluateCell(cell, currentSheet, r);
        const safeVal = String(val ?? '').replace(/"/g, '""');
        return `"${safeVal}"`;
      });
      csvRows.push(rowData.join(','));
    }

    const csvContent = '\uFEFF' + headers + '\n' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${currentSheet.name}_${new Date().toLocaleDateString()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 筛选逻辑
  const filteredRows = useMemo(() => {
    const filters = currentSheet.filters;
    const allRowIndices = Object.keys(currentSheet.rows).map(Number).sort((a,b) => a-b);
    if (Object.keys(filters).length === 0) return allRowIndices;

    return allRowIndices.filter(rIdx => {
      const row = currentSheet.rows[rIdx];
      return Object.entries(filters).every(([col, filterVal]) => {
        if (!filterVal) return true;
        const cell = row[col];
        let actualCell = cell;
        if (cell?.hidden) {
          let checkIdx = rIdx;
          while (checkIdx >= 0) {
            const potential = currentSheet.rows[checkIdx]?.[col];
            if (potential && !potential.hidden) {
              actualCell = potential;
              break;
            }
            checkIdx--;
          }
        }
        const val = String(evaluateCell(actualCell, currentSheet, rIdx) || "").toLowerCase();
        const selectedValues = (filterVal as string).split('|||');
        return selectedValues.some(sv => val.includes(sv.toLowerCase()));
      });
    });
  }, [currentSheet.rows, currentSheet.filters]);

  const getRowRange = () => {
    const allRows = Object.keys(currentSheet.rows).map(Number);
    const max = allRows.length > 0 ? Math.max(...allRows) : 100;
    return Math.max(max + 50, 200);
  };

  const handleToggleFilterValue = (colLetter: string, value: string) => {
    updateSheet(prev => {
      const currentFilter = prev.filters[colLetter] || "";
      const selected = currentFilter ? currentFilter.split('|||') : [];
      let nextSelected;
      if (selected.includes(value)) {
        nextSelected = selected.filter(v => v !== value);
      } else {
        nextSelected = [...selected, value];
      }
      return {
        ...prev,
        filters: { ...prev.filters, [colLetter]: nextSelected.join('|||') }
      };
    });
  };

  const clearFilter = (colLetter: string) => {
    updateSheet(prev => {
      const newFilters = { ...prev.filters };
      delete newFilters[colLetter];
      return { ...prev, filters: newFilters };
    });
  };

  const selectWholeRow = (r: number) => {
    setSelection({
      start: { row: r, col: indexToExcelCol(0), colIndex: 0 },
      end: { row: r, col: indexToExcelCol(currentColumns.length - 1), colIndex: currentColumns.length - 1 }
    });
  };

  const selectWholeColumn = (cIdx: number) => {
    const maxR = getRowRange();
    setSelection({
      start: { row: 0, col: indexToExcelCol(cIdx), colIndex: cIdx },
      end: { row: maxR - 1, col: indexToExcelCol(cIdx), colIndex: cIdx }
    });
  };

  // Fix: Implement getUniqueValues function for the filtering popover
  const getUniqueValues = useCallback((colLetter: string) => {
    const values = new Set<string>();
    Object.entries(currentSheet.rows).forEach(([rStr, row]) => {
      const rIdx = parseInt(rStr);
      let cell = row[colLetter];
      if (cell?.hidden) {
        let checkIdx = rIdx;
        while (checkIdx >= 0) {
          const potential = currentSheet.rows[checkIdx]?.[colLetter];
          if (potential && !potential.hidden) {
            cell = potential;
            break;
          }
          checkIdx--;
        }
      }
      const val = String(evaluateCell(cell, currentSheet, rIdx) || "");
      if (val) values.add(val);
    });
    return Array.from(values).sort();
  }, [currentSheet]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Header 
        mode={mode} 
        setMode={setMode} 
        onClear={() => updateSheet(prev => createEmptySheet(prev.id, prev.name))} 
        onExport={onExport}
      />
      
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Toolbar 
            onFormatChange={handleFormatChange}
            currentStyle={selection ? currentSheet.rows[selection.start.row]?.[selection.start.col]?.style || {} : {}}
            onUndo={handleUndo} 
            onRedo={() => {}}
            onMerge={() => {}}
            onSplit={() => {}}
            onUpload={() => fileInputRef.current?.click()}
            onDelete={deleteSelection}
          />
          {mode === TableMode.MAIN && (
            <button 
              onClick={convertToTrucking}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md flex items-center gap-2 transition-all active:scale-95 ml-2"
            >
              一键转为卡派表格
            </button>
          )}
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          hidden 
          accept="image/*" 
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageInput(file);
          }} 
        />
        <button 
          onClick={() => setIsPasteModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md flex items-center gap-2 transition-all active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          导入亚马逊数据
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-slate-100 p-4 scrollbar-thin scrollbar-thumb-slate-300">
        <div className="inline-block min-w-full bg-white shadow-xl rounded-xl border border-slate-200 overflow-hidden relative">
          <table className="border-collapse table-fixed w-full text-xs">
            <thead>
              <tr className="bg-slate-50">
                <th className="w-12 border-b border-r border-slate-300 sticky top-0 left-0 z-30 bg-slate-50 text-[10px] text-slate-400 cursor-pointer hover:bg-slate-200">#</th>
                {currentColumns.map((col, idx) => {
                  const colLetter = indexToExcelCol(idx);
                  const isFiltered = !!currentSheet.filters[colLetter];
                  return (
                    <th 
                      key={col.id} 
                      style={{ width: col.width }} 
                      onClick={() => selectWholeColumn(idx)}
                      className={`border-b border-r border-slate-200 p-2 font-bold text-slate-600 sticky top-0 z-20 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)] group hover:bg-slate-100 cursor-pointer transition-colors`}
                    >
                      <div className="flex flex-col items-center relative">
                        <div className="flex items-center justify-center w-full gap-1">
                          <span className="text-[9px] text-blue-500 uppercase tracking-tighter opacity-70">{colLetter}</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFilterCol(activeFilterCol?.col === colLetter ? null : {col: colLetter, index: idx});
                              setFilterSearch("");
                            }}
                            className={`p-1 rounded hover:bg-blue-100 transition-colors ${isFiltered ? 'text-blue-600' : 'text-slate-400 opacity-0 group-hover:opacity-100'}`}
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                        <span className="truncate w-full text-center px-1">{col.label}</span>

                        {activeFilterCol?.col === colLetter && (
                          <div onClick={e => e.stopPropagation()} className="absolute top-full mt-1 left-0 w-48 bg-white border border-slate-200 shadow-2xl rounded-lg z-[100] p-2 text-left animate-in fade-in slide-in-from-top-1 duration-200">
                            <div className="flex flex-col gap-2">
                              <input 
                                autoFocus
                                type="text" 
                                placeholder="搜索值..." 
                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded outline-none focus:border-blue-500"
                                value={filterSearch}
                                onChange={(e) => setFilterSearch(e.target.value)}
                              />
                              <div className="max-h-48 overflow-auto flex flex-col gap-1 py-1 border-t border-b border-slate-100">
                                {getUniqueValues(colLetter)
                                  .filter(val => val.toLowerCase().includes(filterSearch.toLowerCase()))
                                  .map(val => {
                                    const isSelected = (currentSheet.filters[colLetter] || "").split('|||').includes(val);
                                    return (
                                      <label key={val} className="flex items-center gap-2 hover:bg-slate-50 p-1 rounded cursor-pointer transition-colors">
                                        <input 
                                          type="checkbox" 
                                          checked={isSelected} 
                                          onChange={() => handleToggleFilterValue(colLetter, val)}
                                          className="rounded text-blue-600 focus:ring-blue-500 h-3 w-3"
                                        />
                                        <span className="text-xs text-slate-700 truncate">{val}</span>
                                      </label>
                                    );
                                  })}
                              </div>
                              <div className="flex justify-between items-center px-1 mt-1">
                                <button onClick={() => clearFilter(colLetter)} className="text-[10px] text-blue-600 font-bold hover:underline">清空筛选</button>
                                <button onClick={() => setActiveFilterCol(null)} className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 font-bold">确定</button>
                              </div>
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
              {(filteredRows.length > 0 ? filteredRows : Array.from({ length: getRowRange() }).map((_,i)=>i)).map((r) => (
                <tr key={r} className="group hover:bg-slate-50/50">
                  <td 
                    onClick={() => selectWholeRow(r)}
                    className="bg-slate-50 border-b border-r border-slate-300 text-center font-bold text-slate-400 sticky left-0 z-10 text-[10px] cursor-pointer hover:bg-slate-200 hover:text-blue-600 transition-colors"
                  >
                    {r + 1}
                  </td>
                  {currentColumns.map((col, cIdx) => {
                    const colLetter = indexToExcelCol(cIdx);
                    const cell = currentSheet.rows[r]?.[colLetter];
                    if (cell?.hidden) return null;

                    const val = evaluateCell(cell, currentSheet, r);
                    const isSelected = selection && 
                      r >= Math.min(selection.start.row, selection.end.row) &&
                      r <= Math.max(selection.start.row, selection.end.row) &&
                      cIdx >= Math.min(selection.start.colIndex, selection.end.colIndex) &&
                      cIdx <= Math.max(selection.start.colIndex, selection.end.colIndex);
                    
                    const isFilling = fillRange &&
                      r >= Math.min(fillRange.start.row, fillRange.end.row) &&
                      r <= Math.max(fillRange.start.row, fillRange.end.row) &&
                      cIdx >= Math.min(fillRange.start.colIndex, fillRange.end.colIndex) &&
                      cIdx <= Math.max(fillRange.start.colIndex, fillRange.end.colIndex);

                    const isEditing = editingCell?.row === r && editingCell?.col === colLetter;
                    const isImageColumn = col.type === 'image';
                    const isDataImage = typeof val === 'string' && val.startsWith('data:image');

                    const isBottomRight = selection && r === Math.max(selection.start.row, selection.end.row) && cIdx === Math.max(selection.start.colIndex, selection.end.colIndex);

                    return (
                      <td
                        key={`${r}-${colLetter}`}
                        rowSpan={cell?.rowSpan || 1}
                        colSpan={cell?.colSpan || 1}
                        onMouseDown={(e) => {
                          if (e.shiftKey && selection) {
                            setSelection({ ...selection, end: { row: r, col: colLetter, colIndex: cIdx } });
                          } else {
                            setSelection({ start: { row: r, col: colLetter, colIndex: cIdx }, end: { row: r, col: colLetter, colIndex: cIdx } });
                          }
                        }}
                        onMouseMove={(e) => {
                          if (e.buttons === 1 && selection && !isDraggingFill) {
                            setSelection({ ...selection, end: { row: r, col: colLetter, colIndex: cIdx } });
                          } else if (e.buttons === 1 && selection && isDraggingFill) {
                            setFillRange({
                              start: { row: selection.start.row, col: selection.start.col, colIndex: selection.start.colIndex },
                              end: { row: r, col: selection.end.col, colIndex: selection.end.colIndex }
                            });
                          }
                        }}
                        onMouseUp={() => {
                          if (isDraggingFill) {
                            handleAutoFill();
                            setIsDraggingFill(false);
                          }
                        }}
                        onDoubleClick={() => setEditingCell({ row: r, col: colLetter, colIndex: cIdx })}
                        style={{
                          ...cell?.style,
                          backgroundColor: isSelected ? '#eff6ff' : (isFilling ? '#f0fdf4' : cell?.style?.backgroundColor),
                          textAlign: cell?.style?.textAlign || (col.type === 'number' ? 'right' : 'left'),
                        }}
                        className={`border-b border-r border-slate-200 p-1.5 h-10 relative cursor-cell transition-colors duration-75 ${isSelected ? 'ring-2 ring-blue-500 ring-inset z-10 bg-blue-50/30' : ''} ${isFilling ? 'ring-2 ring-emerald-500 ring-inset z-10' : ''}`}
                      >
                        {isEditing ? (
                          <input
                            autoFocus
                            className="absolute inset-0 w-full h-full p-1.5 outline-none z-40 shadow-2xl border-2 border-blue-600 bg-white font-medium"
                            defaultValue={cell?.formula || (cell?.value !== undefined ? String(cell.value) : '')}
                            onBlur={(e) => {
                              handleCellChange(r, colLetter, e.target.value);
                              setEditingCell(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleCellChange(r, colLetter, e.currentTarget.value);
                                setEditingCell(null);
                              }
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                          />
                        ) : (
                          <div className={`flex items-center h-full overflow-hidden ${cell?.style?.wrapText ? 'whitespace-normal' : 'whitespace-nowrap'}`}>
                            {isDataImage || (isImageColumn && val && String(val).startsWith('data:')) ? (
                              <img 
                                src={String(val)} 
                                alt="" 
                                onClick={(e) => { e.stopPropagation(); setPreviewImage(String(val)); }}
                                className="h-full w-auto object-contain mx-auto hover:scale-125 transition-transform cursor-zoom-in" 
                              />
                            ) : (
                              <span className="w-full text-slate-700 font-medium truncate">{val}</span>
                            )}
                          </div>
                        )}
                        {isBottomRight && !isEditing && (
                          <div 
                            onMouseDown={(e) => { e.stopPropagation(); setIsDraggingFill(true); }}
                            className="absolute bottom-[-4px] right-[-4px] w-2 h-2 bg-blue-600 border border-white cursor-crosshair z-30 shadow-sm" 
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {previewImage && (
        <div 
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-6 cursor-zoom-out animate-in fade-in duration-300"
          onClick={() => setPreviewImage(null)}
        >
          <img src={previewImage} alt="Preview" className="max-w-full max-h-full rounded-lg shadow-2xl ring-4 ring-white/10 animate-in zoom-in-75 duration-300" />
          <div className="absolute top-6 right-6 text-white bg-black/50 p-2 rounded-full hover:bg-black/70 transition-colors">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </div>
        </div>
      )}

      <div className="bg-white border-t border-slate-200 px-6 py-2 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-white z-50">
        <div className="flex items-center gap-4">
          <span className="bg-slate-100 px-2 py-0.5 rounded text-blue-600">
            LOC: {selection ? `${selection.start.col}${selection.start.row + 1}` : 'NONE'}
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> SYSTEM ONLINE
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">ROWS: {filteredRows.length} / {Object.keys(currentSheet.rows).length}</span>
        </div>
        <div className="flex items-center gap-6">
            <span className="text-slate-600 font-bold">SHEET: <span className="text-blue-600">{currentSheet.name}</span></span>
            <span className="text-blue-500">MODE: {mode}</span>
        </div>
      </div>

      <PasteModal 
        isOpen={isPasteModalOpen} 
        onClose={() => setIsPasteModalOpen(false)} 
        onPaste={handleImport}
      />
    </div>
  );
};

export default App;