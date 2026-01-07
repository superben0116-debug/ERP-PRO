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

// 获取所有收款记录
export const getPaymentsAPI = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/payments`);
    if (!response.ok) throw new Error('获取收款记录失败');
    return response.json();
  } catch (err) {
    console.error('Get payments error:', err);
    return [];
  }
};

// 添加收款记录
export const addPaymentAPI = async (date: string, customerId: string, customerName: string, amount: number) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, customerId, customerName, amount }),
    });
    if (!response.ok) throw new Error('添加收款记录失败');
    return response.json();
  } catch (err) {
    console.error('Add payment error:', err);
    throw err;
  }
};

// 更新收款记录
export const updatePaymentAPI = async (
  id: string,
  date: string,
  customerId: string,
  customerName: string,
  amount: number,
  status: string,
  businessDate?: string,
  remarks?: string
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/payments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, customerId, customerName, amount, status, businessDate, remarks }),
    });
    if (!response.ok) throw new Error('更新收款记录失败');
    return response.json();
  } catch (err) {
    console.error('Update payment error:', err);
    throw err;
  }
};

// 删除收款记录
export const deletePaymentAPI = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/payments/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('删除收款记录失败');
    return response.json();
  } catch (err) {
    console.error('Delete payment error:', err);
    throw err;
  }
};
