
import React, { useState } from 'react';

interface PasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaste: (text: string, rowsPerOrder: number) => void;
}

const PasteModal: React.FC<PasteModalProps> = ({ isOpen, onClose, onPaste }) => {
  const [text, setText] = useState('');
  const [rowsPerOrder, setRowsPerOrder] = useState(1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200">
        <div className="px-8 py-5 border-b flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800">智能订单导入引擎</h2>
              <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Smart Logistics Data Importer</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all hover:rotate-90">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-8 space-y-6">
          {/* HIGH VISIBILITY SPLIT CONFIG */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-2xl border-2 border-blue-400 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm border border-white/30">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
              </div>
              <div>
                <label className="text-lg font-black text-white block">单笔订单拆分行数 (必选配置)</label>
                <p className="text-sm text-blue-100 font-medium">指定包裹数量，系统将自动合并共有字段并分拆明细行</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/10 p-2 rounded-xl border border-white/20">
              <input 
                type="number" 
                min="1" 
                max="50"
                value={rowsPerOrder}
                onChange={(e) => setRowsPerOrder(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 px-2 py-3 bg-white rounded-lg text-2xl font-black text-blue-800 outline-none text-center shadow-inner"
              />
              <span className="text-lg font-bold text-white pr-2">行/单</span>
            </div>
          </div>

          <div className="relative">
            <textarea
              autoFocus
              className="w-full h-80 p-6 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-300 outline-none text-sm font-medium text-slate-700 placeholder:text-slate-300 transition-all resize-none shadow-inner leading-relaxed"
              placeholder="在此处粘贴亚马逊后台订单详情页面的全部内容 (Ctrl+V)..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
        </div>

        <div className="px-8 py-5 bg-slate-50 border-t flex justify-end items-center gap-6">
          <button onClick={onClose} className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">取消</button>
          <button
            onClick={() => { if (text.trim()) { onPaste(text, rowsPerOrder); setText(''); onClose(); } }}
            disabled={!text.trim()}
            className="px-10 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-black rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-2"
          >
            立即解析并生成 {text.trim() ? rowsPerOrder : 0} 条数据
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasteModal;
