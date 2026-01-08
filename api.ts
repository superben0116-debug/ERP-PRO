// API 服务层 - 处理所有后端 API 调用
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

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

// 保存表格数据
export const saveSheetAPI = async (sheetData: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sheet/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetData }),
    });
    if (!response.ok) throw new Error('保存失败');
    return response.json();
  } catch (err) {
    console.error('Save sheet error:', err);
    throw err;
  }
};

// 加载表格数据
export const loadSheetAPI = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sheet/load`);
    if (!response.ok) throw new Error('加载失败');
    return response.json();
  } catch (err) {
    console.error('Load sheet error:', err);
    return { data: null };
  }
};
