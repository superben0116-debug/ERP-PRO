
import React from 'react';
import { TableMode } from '../types';

interface HeaderProps {
  mode: TableMode;
  setMode: (mode: TableMode) => void;
  onClear: () => void;
  onExport: () => void;
  onSettings: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ mode, setMode, onClear, onExport, onSettings, onLogout }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">MINDEGO 专属系统</h1>
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
          className="px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-100"
        >
          重置数据
        </button>
        <button
          onClick={onExport}
          className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition-all flex items-center gap-2"
        >
          导出 Excel
        </button>
        
        <div className="h-6 w-px bg-slate-200 mx-1"></div>

        <button 
          onClick={onSettings}
          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
          title="账号设置"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <button 
          onClick={onLogout}
          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
          title="退出登录"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;
