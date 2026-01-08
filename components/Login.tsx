
import React, { useState, useEffect } from 'react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // 默认凭据更新为用户要求的 dayou / Dayou123?
  const DEFAULT_USER = 'dayou';
  const DEFAULT_PWD = 'Dayou123?';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 从本地存储获取，如果没有则使用硬编码的默认值
    const storedUsername = localStorage.getItem('userName') || DEFAULT_USER;
    const storedPassword = localStorage.getItem('userPassword') || DEFAULT_PWD;
    
    if (username.trim() === storedUsername && password === storedPassword) {
      localStorage.setItem('isLoggedIn', 'true');
      onLogin();
    } else {
      setError('账号或密码不正确，请确认后重试。');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full max-w-md border border-slate-100 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-10">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-3xl text-white mb-6 shadow-xl rotate-3">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">MINDEGO ERP</h2>
          <p className="text-slate-400 text-sm font-medium mt-2">亚马逊全链路管理系统</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">管理员账号</label>
            <input
              type="text"
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-slate-800 font-semibold placeholder:text-slate-300"
              placeholder="请输入登录账号"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">安全访问密码</label>
            <input
              type="password"
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-slate-800 font-semibold placeholder:text-slate-300"
              placeholder="请输入访问密码"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 animate-bounce">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-red-600 text-xs font-bold leading-tight">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black text-sm shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:shadow-[0_15px_40px_rgba(37,99,235,0.4)] transition-all active:scale-[0.98] flex justify-center items-center gap-3 group"
          >
            <span>进入管理后台</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </form>
        
        <div className="mt-12 pt-8 border-t border-slate-50 text-center">
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">© 2025 MINDEGO Logistics Solutions</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
