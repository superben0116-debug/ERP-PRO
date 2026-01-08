// API 服务层 - 处理所有后端 API 调用
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://erp-pro-api.preview.tencent-zeabur.cn';

// 登录接口
export const loginAPI = async (username: string, password: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) throw new Error('登录失败');
    return response.json();
  } catch (err) {
    console.error('Login error:', err);
    throw err;
  }
};
