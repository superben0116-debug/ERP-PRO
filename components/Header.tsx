
import React from 'react';
import { TableMode } from '../types';

interface HeaderProps {
  mode: TableMode;
  setMode: (mode: TableMode) => void;
  onClear: () => void;
  onExport: () => void;
}

const Header: React.FC<HeaderProps> = ({ mode, setMode, onClear, onExport }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">亚马逊订单成本核算与卡派转换系统</h1>
          <p className="text-xs text-slate-500 font-medium">Amazon Order Accounting & Trucking Conversion</p>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
        <button
          onClick={() => setMode(TableMode.MAIN)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            mode === TableMode.MAIN ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          主表格 (成本核算)
        </button>
        <button
          onClick={() => setMode(TableMode.TRUCK)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            mode === TableMode.TRUCK ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          卡派表格 (物流转换)
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onClear}
          className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-100"
        >
          重置数据
        </button>
        <button
          onClick={onExport}
          className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          导出 Excel
        </button>
      </div>
    </header>
  );
};

export default Header;
