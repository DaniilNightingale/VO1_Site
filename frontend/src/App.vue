<template>
  <view id="app">
    <router-view v-slot="{ Component }">
      <component :is="Component" />
    </router-view>
  </view>
</template>

<script>
export default {
  name: 'App',
  onLaunch() {
    console.log('Запуск калькулятора объема 3D-модели');
  },
  onShow() {
    console.log('Приложение показано');
  },
  onHide() {
    console.log('Приложение скрыто');
  }
};
</script>

<style>
page {
  --primary-color: #5D4037;
  --secondary-color: #FFFBF0;
  --accent-color: #FFD700;
  --text-primary: #2C2C2C;
  --text-secondary: #757575;
  --border-color: #E0E0E0;
  --shadow-light: rgba(93, 64, 55, 0.1);
  --shadow-medium: rgba(93, 64, 55, 0.15);
  background-color: var(--secondary-color);
  color: var(--text-primary);
  font-size: 28rpx;
  line-height: 1.6;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

#app {
  width: 100%;
  min-height: 100vh;
}

view, text, image, input, button, scroll-view {
  box-sizing: border-box;
}

button::after {
  border: none;
}

.container {
  min-height: 100vh;
  padding: 40rpx;
}

.navbar {
  background: var(--primary-color);
  color: var(--secondary-color);
  padding: 30rpx 40rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4rpx 12rpx var(--shadow-light);
}

.btn-primary {
  background: var(--accent-color);
  color: var(--primary-color);
  padding: 20rpx 40rpx;
  border-radius: 12rpx;
  font-weight: 600;
  font-size: 28rpx;
  border: none;
  box-shadow: 0 4rpx 12rpx var(--shadow-medium);
  transition: all 0.3s ease;
}

.btn-secondary {
  background: var(--secondary-color);
  color: var(--primary-color);
  padding: 20rpx 40rpx;
  border-radius: 12rpx;
  border: 2rpx solid var(--primary-color);
  font-size: 28rpx;
  transition: all 0.3s ease;
}

.card {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx var(--shadow-light);
}

.input-group {
  margin-bottom: 30rpx;
}

.input-label {
  display: block;
  color: var(--text-secondary);
  font-size: 26rpx;
  margin-bottom: 12rpx;
}

.input-field {
  width: 100%;
  padding: 24rpx 30rpx;
  border: 2rpx solid var(--border-color);
  border-radius: 12rpx;
  font-size: 28rpx;
  background: var(--secondary-color);
  box-sizing: border-box;
}

.result-box {
  background: linear-gradient(135deg, var(--primary-color) 0%, #795548 100%);
  color: var(--secondary-color);
  padding: 40rpx;
  border-radius: 16rpx;
  text-align: center;
  margin: 30rpx 0;
}

.result-value {
  font-size: 56rpx;
  font-weight: 700;
  color: var(--accent-color);
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid var(--border-color);
}

.icon-gold {
  color: var(--accent-color);
}

uni-input {
  height: auto !important;
  min-height: 0 !important;
  line-height: normal !important;
}
</style>