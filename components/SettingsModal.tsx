
import React, { useState } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [currentPwd, setCurrentPwd] = useState('');
  const [newUsername, setNewUsername] = useState(localStorage.getItem('userName') || 'dayou');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  if (!isOpen) return null;

  const handleUpdateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 默认值需与 Login.tsx 保持绝对同步
    const storedPassword = localStorage.getItem('userPassword') || 'Dayou123?';
    
    if (currentPwd !== storedPassword) {
      setMessage({ text: '当前验证密码不正确', type: 'error' });
      return;
    }

    if (newPwd && newPwd !== confirmPwd) {
      setMessage({ text: '两次输入的新密码不一致', type: 'error' });
      return;
    }

    if (newPwd && newPwd.length < 6) {
      setMessage({ text: '安全密码长度建议至少为 6 位', type: 'error' });
      return;
    }

    // 更新凭据
    localStorage.setItem('userName', newUsername.trim());
    if (newPwd) {
      localStorage.setItem('userPassword', newPwd);
    }

    setMessage({ text: '账号信息更新成功！系统将在 1.5 秒后跳转登录页', type: 'success' });
    
    setTimeout(() => {
      localStorage.removeItem('isLoggedIn');
      window.location.reload();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
        <div className="px-10 py-6 border-b flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-800">系统账号安全中心</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Account & Security Settings</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white hover:shadow-md rounded-full text-slate-400 transition-all hover:rotate-90">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-10">
          <form onSubmit={handleUpdateAccount} className="space-y-6">
            <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 mb-2">
              <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 px-1">当前环境安全验证</label>
              <input
                type="password"
                className="w-full px-5 py-3.5 bg-white border border-blue-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold placeholder:text-blue-200"
                placeholder="请输入当前生效的访问密码"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                required
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">修改管理员账号</label>
                <input
                  type="text"
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-semibold"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">设置新访问密码</label>
                  <input
                    type="password"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-semibold"
                    placeholder="不修改请留空"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">再次输入新密码</label>
                  <input
                    type="password"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-semibold"
                    placeholder="确认新密码"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {message.text && (
              <div className={`p-4 rounded-2xl border ${message.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-600'} transition-all`}>
                <p className="text-xs font-black text-center">
                  {message.text}
                </p>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-3xl font-black text-sm transition-all shadow-2xl active:scale-[0.98] flex justify-center items-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              保存账户变更并重新登录
            </button>
            <p className="text-[9px] text-slate-400 text-center font-medium">注意：更改账号或密码后，当前所有会话将立即失效并需要重新验证身份。</p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
