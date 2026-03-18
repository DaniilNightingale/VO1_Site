const STORAGE_KEY = 'model_measurement_history';

export const storage = {
  getHistory() {
    try {
      const data = uni.getStorageSync(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('读取历史记录失败:', e);
      return [];
    }
  },

  saveRecord(record) {
    try {
      const history = this.getHistory();
      const newRecord = {
        id: Date.now(),
        modelName: record.modelName || '未命名模型',
        originalVolume: record.originalVolume || 0,
        currentVolume: record.currentVolume || 0,
        originalSize: record.originalSize || { x: 0, y: 0, z: 0 },
        currentSize: record.currentSize || { x: 0, y: 0, z: 0 },
        wallThickness: record.wallThickness || 0,
        date: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
      };
      history.unshift(newRecord);
      if (history.length > 50) {
        history.pop();
      }
      uni.setStorageSync(STORAGE_KEY, JSON.stringify(history));
      return true;
    } catch (e) {
      console.error('保存历史记录失败:', e);
      return false;
    }
  },

  clearHistory() {
    try {
      uni.removeStorageSync(STORAGE_KEY);
      return true;
    } catch (e) {
      console.error('清空历史记录失败:', e);
      return false;
    }
  },

  deleteRecord(id) {
    try {
      const history = this.getHistory();
      const filtered = history.filter(item => item.id !== id);
      uni.setStorageSync(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (e) {
      console.error('删除历史记录失败:', e);
      return false;
    }
  }
};