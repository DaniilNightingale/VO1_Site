<template>
  <view class="viewer-wrap">
    <view v-if="loading" class="state-layer">
      <view class="spinner"></view>
      <text class="state-text">Загрузка модели...</text>
    </view>

    <view v-else-if="error" class="state-layer">
      <text class="state-text err">{{ error }}</text>
      <button class="cu-btn bg-brown sm" @click="retry">Повторить</button>
    </view>

    <view v-else-if="modelLoaded" class="canvas-wrap">
      <canvas
        id="mv-canvas"
        canvas-id="mv-canvas"
        class="mv-canvas"
      ></canvas>
      <view class="badge-ok">
        <text class="text-green">✓ Модель отображена</text>
      </view>
    </view>

    <view v-else class="state-layer placeholder">
      <image
        class="placeholder-img"
        src="https://hpi-hub.tos-cn-beijing.volces.com/static/key_2d/castle_bend_W_1756179544281-1673.png"
        mode="aspectFit"
      />
      <text class="state-text">Загрузите STL / OBJ файл</text>
    </view>
  </view>
</template>

<script>
const PADDING = 32;

export default {
  name: 'ModelViewer',
  props: {
    modelData: { type: Object, default: null },
    scale: { type: Object, default: () => ({ x: 1, y: 1, z: 1 }) }
  },
  data() {
    return { loading: false, error: '', modelLoaded: false, W: 0, H: 0 };
  },
  watch: {
    modelData: {
      deep: true,
      handler(val) {
        if (val && val.geometry) this.render(val.geometry);
      }
    }
  },
  mounted() {
    this.$nextTick(() => this.initSize());
  },
  methods: {
    retry() {
      this.error = '';
      if (this.modelData && this.modelData.geometry) this.render(this.modelData.geometry);
    },

    initSize() {
      uni.createSelectorQuery().in(this).select('.viewer-wrap').boundingClientRect(r => {
        if (!r) return;
        this.W = r.width || 320;
        this.H = r.height || 280;
      }).exec();
    },

    render(geometry) {
      if (!geometry || !geometry.attributes || !geometry.attributes.position) {
        this.error = 'Неверные данные геометрии';
        return;
      }
      this.loading = true;
      this.error = '';
      this.modelLoaded = false;

      this.$nextTick(() => {
        try {
          this.drawCanvas(geometry);
          this.loading = false;
          this.modelLoaded = true;
        } catch (e) {
          this.loading = false;
          this.error = 'Ошибка рендера: ' + e.message;
        }
      });
    },

    drawCanvas(geometry) {
      const pos = geometry.attributes.position.array;
      const idx = geometry.index ? geometry.index.array : null;
      const W = this.W || 320;
      const H = this.H || 280;

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (let i = 0; i < pos.length; i += 3) {
        if (pos[i] < minX) minX = pos[i];
        if (pos[i] > maxX) maxX = pos[i];
        if (pos[i + 1] < minY) minY = pos[i + 1];
        if (pos[i + 1] > maxY) maxY = pos[i + 1];
      }

      const rX = maxX - minX || 1;
      const rY = maxY - minY || 1;
      const sc = Math.min((W - PADDING * 2) / rX, (H - PADDING * 2) / rY);

      const toX = v => (v - minX) * sc + PADDING;
      const toY = v => H - ((v - minY) * sc + PADDING);

      const drawTriangle = (ctx, i0, i1, i2) => {
        ctx.beginPath();
        ctx.moveTo(toX(pos[i0]), toY(pos[i0 + 1]));
        ctx.lineTo(toX(pos[i1]), toY(pos[i1 + 1]));
        ctx.lineTo(toX(pos[i2]), toY(pos[i2 + 1]));
        ctx.closePath();
        ctx.stroke();
      };

      const limit = idx ? Math.min(idx.length, 6000) : Math.min(pos.length, 18000);

      // #ifdef H5
      const el = document.getElementById('mv-canvas');
      if (!el) throw new Error('canvas not found');
      el.width = W;
      el.height = H;
      const ctx = el.getContext('2d');
      ctx.fillStyle = '#FFFBF0';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#5D4037';
      ctx.lineWidth = 0.8;

      if (idx) {
        for (let i = 0; i < limit; i += 3) drawTriangle(ctx, idx[i] * 3, idx[i + 1] * 3, idx[i + 2] * 3);
      } else {
        for (let i = 0; i < limit; i += 9) drawTriangle(ctx, i, i + 3, i + 6);
      }

      ctx.fillStyle = '#5D4037';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('2D превью', 10, 18);
      // #endif

      // #ifndef H5
      const ctx2 = uni.createCanvasContext('mv-canvas', this);
      ctx2.setFillStyle('#FFFBF0');
      ctx2.fillRect(0, 0, W, H);
      ctx2.setStrokeStyle('#5D4037');
      ctx2.setLineWidth(0.8);
      ctx2.setLineCap('round');

      if (idx) {
        for (let i = 0; i < limit; i += 3) {
          const i0 = idx[i] * 3, i1 = idx[i + 1] * 3, i2 = idx[i + 2] * 3;
          ctx2.beginPath();
          ctx2.moveTo(toX(pos[i0]), toY(pos[i0 + 1]));
          ctx2.lineTo(toX(pos[i1]), toY(pos[i1 + 1]));
          ctx2.lineTo(toX(pos[i2]), toY(pos[i2 + 1]));
          ctx2.closePath();
          ctx2.stroke();
        }
      } else {
        for (let i = 0; i < limit; i += 9) {
          ctx2.beginPath();
          ctx2.moveTo(toX(pos[i]), toY(pos[i + 1]));
          ctx2.lineTo(toX(pos[i + 3]), toY(pos[i + 4]));
          ctx2.lineTo(toX(pos[i + 6]), toY(pos[i + 7]));
          ctx2.closePath();
          ctx2.stroke();
        }
      }

      ctx2.setFillStyle('#5D4037');
      ctx2.setFontSize(13);
      ctx2.fillText('2D превью', 10, 18);
      ctx2.draw();
      // #endif
    }
  }
};
</script>

<style scoped>
.viewer-wrap {
  position: relative;
  width: 100%;
  height: 560rpx;
  background: #FFFBF0;
  border-radius: 16rpx;
  overflow: hidden;
}

.canvas-wrap {
  width: 100%;
  height: 100%;
  position: relative;
}

.mv-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.badge-ok {
  position: absolute;
  bottom: 16rpx;
  right: 20rpx;
  background: rgba(255,251,240,0.85);
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
}

.state-layer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 24rpx;
}

.placeholder-img {
  width: 200rpx;
  height: 200rpx;
  opacity: 0.55;
}

.state-text {
  font-size: 28rpx;
  color: #757575;
  text-align: center;
  padding: 0 40rpx;
}

.state-text.err {
  color: #e53935;
}

.spinner {
  width: 72rpx;
  height: 72rpx;
  border: 6rpx solid #E0E0E0;
  border-top-color: #FFD700;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>