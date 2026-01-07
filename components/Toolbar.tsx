
import React, { useState } from 'react';
import { CellStyle } from '../types';

interface ToolbarProps {
  onFormatChange: (style: Partial<CellStyle>) => void;
  currentStyle: CellStyle;
  onUndo: () => void;
  onRedo: () => void;
  onMerge: () => void;
  onSplit: () => void;
  onUpload: () => void;
  onDelete: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  onFormatChange, 
  currentStyle, 
  onUndo, 
  onRedo,
  onMerge,
  onSplit,
  onUpload,
  onDelete
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const IconButton = ({ onClick, active, children, title, onMouseEnter, variant = 'default' }: any) => (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      title={title}
      className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${active ? 'bg-blue-100 text-blue-600 shadow-inner' : 'text-slate-600'} ${variant === 'danger' ? 'hover:bg-red-50 hover:text-red-600' : ''}`}
    >
      {children}
    </button>
  );

  const colors = ['#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#6366f1', '#a855f7', '#64748b', '#ffffff'];
  const bgColors = ['#ffffff', '#fee2e2', '#ffedd5', '#fef9c3', '#dcfce7', '#dbeafe', '#e0e7ff', '#f3e8ff', '#f1f5f9', '#e2e8f0'];

  return (
    <div className="flex items-center gap-1 p-1 bg-white border-b border-slate-200 z-[100] shadow-sm relative overflow-visible">
      <div className="flex items-center gap-0.5 px-2 border-r border-slate-200">
        <IconButton onClick={onUndo} title="撤销 (Ctrl+Z)">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
        </IconButton>
        <IconButton onClick={onDelete} title="删除选中内容 (Del)" variant="danger">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </IconButton>
      </div>

      <div className="flex items-center gap-0.5 px-2 border-r border-slate-200">
        <IconButton 
          onClick={() => onFormatChange({ bold: !currentStyle.bold })} 
          active={currentStyle.bold} 
          title="加粗 (Ctrl+B)"
        >
          <span className="font-bold text-sm px-1">B</span>
        </IconButton>
        <IconButton 
          onClick={() => onFormatChange({ italic: !currentStyle.italic })} 
          active={currentStyle.italic}
          title="斜体 (Ctrl+I)"
        >
          <span className="italic font-serif text-sm px-1">I</span>
        </IconButton>
        <IconButton 
          onClick={() => onFormatChange({ underline: !currentStyle.underline })} 
          active={currentStyle.underline}
          title="下划线 (Ctrl+U)"
        >
          <span className="underline text-sm px-1">U</span>
        </IconButton>
      </div>

      <div className="flex items-center gap-0.5 px-2 border-r border-slate-200 overflow-visible">
        <div className="relative" onMouseLeave={() => setActiveMenu(null)}>
          <IconButton onMouseEnter={() => setActiveMenu('color')} title="文字颜色">
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold -mb-1">A</span>
              <div className="w-3 h-0.5" style={{ backgroundColor: currentStyle.color || '#000000' }}></div>
            </div>
          </IconButton>
          {activeMenu === 'color' && (
            <div className="grid grid-cols-5 gap-1 absolute top-full left-0 bg-white border border-slate-200 p-2 shadow-2xl z-[110] rounded-xl w-36">
              {colors.map(c => (
                <button 
                  key={c} 
                  onClick={() => { onFormatChange({ color: c }); setActiveMenu(null); }} 
                  className="w-5 h-5 rounded border border-slate-200 hover:scale-125 transition-transform" 
                  style={{ backgroundColor: c }} 
                />
              ))}
            </div>
          )}
        </div>

        <div className="relative" onMouseLeave={() => setActiveMenu(null)}>
          <IconButton onMouseEnter={() => setActiveMenu('bg')} title="填充颜色">
            <div className="flex flex-col items-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 20H5v-2h14v2zM11 11.41V5h2v6.41l2.29-2.29 1.42 1.42L12 16.25l-4.71-4.71 1.42-1.42L11 11.41z"/></svg>
              <div className="w-full h-0.5 mt-0.5" style={{ backgroundColor: currentStyle.backgroundColor || '#ffffff' }}></div>
            </div>
          </IconButton>
          {activeMenu === 'bg' && (
            <div className="grid grid-cols-5 gap-1 absolute top-full left-0 bg-white border border-slate-200 p-2 shadow-2xl z-[110] rounded-xl w-36">
              {bgColors.map(c => (
                <button 
                  key={c} 
                  onClick={() => { onFormatChange({ backgroundColor: c }); setActiveMenu(null); }} 
                  className="w-5 h-5 rounded border border-slate-200 hover:scale-125 transition-transform" 
                  style={{ backgroundColor: c }} 
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-0.5 px-2 border-r border-slate-200">
        <IconButton onClick={() => onFormatChange({ textAlign: 'left' })} active={currentStyle.textAlign === 'left'} title="左对齐">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" /></svg>
        </IconButton>
        <IconButton onClick={() => onFormatChange({ textAlign: 'center' })} active={currentStyle.textAlign === 'center'} title="居中对齐">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" /></svg>
        </IconButton>
      </div>

      <div className="flex items-center gap-0.5 px-2">
        <IconButton onClick={onUpload} title="上传图片到单元格">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </IconButton>
      </div>
    </div>
  );
};

export default Toolbar;
