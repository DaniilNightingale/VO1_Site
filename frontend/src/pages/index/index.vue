<template>
  <view class="page-container">
    <view class="navbar">
      <button class="btn-upload" @click="uploadModel">
        <text class="icon">📁</text>
        <text>Загрузить модель</text>
      </button>
    </view>

    <scroll-view scroll-y class="content-wrapper" :style="{ height: contentHeight }">
      <view class="main-content">
        <view class="viewer-section card">
          <view v-if="currentModel" class="model-preview">
            <view class="model-info-header">
              <text class="model-name">📦 {{ modelName }}</text>
              <text class="model-format">{{ currentModel.fileExtension.toUpperCase() }}</text>
            </view>
            <view class="model-visual">
              <view v-if="modelUrl" class="model-viewer-container">
                <model-viewer
                  :src="modelUrl"
                  camera-controls
                  auto-rotate
                  shadow-intensity="1"
                  class="model-3d-viewer"
                >
                </model-viewer>
              </view>
              <canvas 
                v-else
                canvas-id="preview2d" 
                id="preview2d" 
                class="preview-canvas"
                :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
              ></canvas>
            </view>
            <view class="model-stats">
              <view class="stat-item">
                <text class="stat-label">Вершины:</text>
                <text class="stat-value">{{ modelStats.vertices || 'N/A' }}</text>
              </view>
              <view class="stat-item">
                <text class="stat-label">Грани:</text>
                <text class="stat-value">{{ modelStats.faces || 'N/A' }}</text>
              </view>
              <view class="stat-item">
                <text class="stat-label">Размер:</text>
                <text class="stat-value">{{ formatFileSize(currentModel.fileSize) }}</text>
              </view>
            </view>
          </view>
          <view v-else class="placeholder-viewer">
            <image 
              class="placeholder-img" 
              src="https://hpi-hub.tos-cn-beijing.volces.com/static/gif/22-53-12-54_512.gif"
              mode="aspectFit"
            />
            <text class="placeholder-text">Загрузите 3D-модель в формате STL/OBJ/FBX</text>
          </view>
        </view>

        <view class="controls-section card">
          <view class="section-title">
            <text class="icon-gold">📐</text>
            <text>Настройки размеров</text>
          </view>

          <view class="size-info" v-if="originalSize.x > 0">
            <text class="info-label">Исходные размеры:</text>
            <text class="info-value">{{ (originalSize.x / 1000).toFixed(3) }} × {{ (originalSize.y / 1000).toFixed(3) }} × {{ (originalSize.z / 1000).toFixed(3) }} мм</text>
          </view>

          <view class="input-row">
            <view class="input-group">
              <text class="input-label">Длина (мм)</text>
              <input 
                class="input-field" 
                type="digit"
                v-model="currentSize.x"
                @input="onSizeChange"
                placeholder="Длина"
              />
            </view>
            <view class="input-group">
              <text class="input-label">Ширина (мм)</text>
              <input 
                class="input-field" 
                type="digit"
                v-model="currentSize.y"
                @input="onSizeChange"
                placeholder="Ширина"
              />
            </view>
            <view class="input-group">
              <text class="input-label">Высота (мм)</text>
              <input 
                class="input-field" 
                type="digit"
                v-model="currentSize.z"
                @input="onSizeChange"
                placeholder="Высота"
              />
            </view>
          </view>

          <view class="switch-row">
            <text class="switch-label">Пропорциональное масштабирование</text>
            <switch 
              :checked="proportionalScale" 
              @change="toggleProportional"
              color="#FFD700"
            />
          </view>

          <view class="input-group wall-thickness-group">
            <view class="input-label-with-info">
              <text class="input-label">Толщина стенок (мм)</text>
              <view class="info-badge">опционально</view>
            </view>
            <text class="input-description">Укажите толщину стенок для расчета объема полой модели. Будет вычтен внутренний объем.</text>
            <input 
              class="input-field" 
              type="digit"
              v-model="wallThickness"
              @input="onWallThicknessChange"
              placeholder="Например: 2 (оставьте пустым для сплошной модели)"
            />
          </view>

          <button class="btn-calculate" @click="calculateVolume">
            <text class="icon">🧮</text>
            <text>Рассчитать объем</text>
          </button>
        </view>

        <view v-if="calculatedVolume > 0" class="result-section">
          <view class="result-box">
            <text class="result-label">Рассчитанный объем</text>
            <text class="result-value">{{ formatVolume(calculatedVolume) }}</text>
            
            <view v-if="wallThickness > 0" class="volume-details">
              <view class="volume-detail-item">
                <text class="detail-icon">📊</text>
                <view class="detail-content">
                  <text class="detail-label">Объем стенок (полая модель)</text>
                  <text class="detail-value">{{ formatVolume(calculatedVolume) }}</text>
                </view>
              </view>
              <view class="volume-detail-item">
                <text class="detail-icon">📦</text>
                <view class="detail-content">
                  <text class="detail-label">Полный объем (сплошная)</text>
                  <text class="detail-value">{{ formatSolidVolume(originalVolume * getScaleVolumeFactor()) }}</text>
                </view>
              </view>
              <view class="volume-detail-item">
                <text class="detail-icon">⚙️</text>
                <view class="detail-content">
                  <text class="detail-label">Толщина стенок</text>
                  <text class="detail-value">{{ wallThickness }} мм</text>
                </view>
              </view>
            </view>
            <text class="result-desc" v-else>Сплошная модель (без полости)</text>
          </view>
          <button class="btn-save" @click="saveRecord">
            <text class="icon">💾</text>
            <text>Сохранить запись</text>
          </button>
        </view>

        <view class="history-section card">
          <view class="section-title">
            <text class="icon-gold">📋</text>
            <text>История измерений</text>
            <button class="btn-clear" @click="clearHistory" v-if="history.length > 0">
              <text>Очистить</text>
            </button>
          </view>

          <view v-if="history.length === 0" class="empty-state">
            <text class="empty-text">Нет записей в истории</text>
          </view>

          <scroll-view v-else scroll-y class="history-list">
            <view 
              class="history-item" 
              v-for="item in history" 
              :key="item.id"
            >
              <view class="history-info">
                <text class="history-name">{{ item.modelName }}</text>
                <text class="history-volume">{{ formatVolume(item.currentVolume) }}</text>
                <text class="history-date">{{ item.date }}</text>
              </view>
              <button class="btn-delete" @click="deleteRecord(item.id)">
                <text>🗑️</text>
              </button>
            </view>
          </scroll-view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { storage } from '@/utils/storage.js';
import { volumeCalculator } from '@/utils/volumeCalculator.js';

export default {
  name: 'IndexPage',
  components: {},
  data() {
    return {
      currentModel: null,
      modelName: '',
      modelUrl: '',
      originalSize: { x: 0, y: 0, z: 0 },
      currentSize: { x: 0, y: 0, z: 0 },
      wallThickness: '',
      proportionalScale: true,
      scaleFactors: { x: 1, y: 1, z: 1 },
      calculatedVolume: 0,
      originalVolume: 0,
      history: [],
      contentHeight: '100vh',
      canvasWidth: 600,
      canvasHeight: 400,
      modelStats: {
        vertices: 0,
        faces: 0
      }
    };
  },
  onLoad() {
    this.loadHistory();
    this.calculateContentHeight();
  },
  methods: {
    calculateContentHeight() {
      const systemInfo = uni.getSystemInfoSync();
      this.contentHeight = `${systemInfo.windowHeight}px`;
    },

    uploadModel() {
      // #ifdef H5
      console.log('Начало загрузки файла...');
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.stl,.obj,.fbx';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          console.log('Файл выбран:', file.name, 'Размер:', file.size, 'байт');
          this.modelName = file.name;
          this.loadModelFile(file);
        }
      };
      input.click();
      // #endif
      
      // #ifndef H5
      uni.chooseFile({
        count: 1,
        extension: ['.stl', '.obj', '.fbx'],
        success: (res) => {
          const file = res.tempFiles[0];
          this.modelName = file.name;
          this.loadModelFile(file);
        },
        fail: () => {
          uni.showToast({ title: 'Загрузка отменена', icon: 'none' });
        }
      });
      // #endif
    },

    loadModelFile(file) {
      uni.showLoading({ title: 'Загрузка...' });
      console.log('Начало обработки файла:', file.name);
      
      const ext = file.name.split('.').pop().toLowerCase();
      console.log('Расширение файла:', ext);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('Файл прочитан, начало парсинга...');
        try {
          const arrayBuffer = e.target.result;
          
          this.currentModel = { 
            fileName: file.name,
            fileExtension: ext,
            rawData: arrayBuffer,
            fileSize: file.size,
            name: file.name 
          };
          
          this.parseModelData(arrayBuffer, ext);
          
          uni.hideLoading();
          uni.showToast({ title: 'Модель загружена успешно!', icon: 'success' });
        } catch (err) {
          console.error('Ошибка загрузки модели:', err);
          uni.hideLoading();
          uni.showToast({ title: 'Ошибка: ' + err.message, icon: 'none', duration: 3000 });
        }
      };
      
      reader.onerror = (err) => {
        console.error('Ошибка чтения файла:', err);
        uni.hideLoading();
        uni.showToast({ title: 'Ошибка чтения файла', icon: 'none' });
      };
      
      // #ifdef H5
      console.log('Чтение файла как ArrayBuffer...');
      reader.readAsArrayBuffer(file);
      // #endif
      // #ifndef H5
      reader.readAsArrayBuffer(file.path);
      // #endif
    },

    parseModelData(arrayBuffer, ext) {
      console.log('[IndexPage] Парсинг модели:', ext);
      
      try {
        let geometry = null;
        
        if (ext === 'stl') {
          geometry = this.parseSTL(arrayBuffer);
        } else if (ext === 'obj') {
          geometry = this.parseOBJ(new TextDecoder().decode(arrayBuffer));
        } else {
          geometry = this.createDummyGeometry();
        }
        
        if (geometry) {
          this.currentModel.geometry = geometry;
          this.modelStats.vertices = geometry.attributes.position.count;
          this.modelStats.faces = geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3;
          
          this.originalSize = volumeCalculator.getBoundingBox(geometry);
          this.currentSize = { 
            x: (this.originalSize.x / 1000).toFixed(3),
            y: (this.originalSize.y / 1000).toFixed(3),
            z: (this.originalSize.z / 1000).toFixed(3)
          };
          this.originalVolume = volumeCalculator.calculateVolume(
            geometry, 
            { x: 1, y: 1, z: 1 }, 
            0
          );
          this.calculatedVolume = this.originalVolume;
          
          this.create3DModelUrl(geometry, ext);
          
          this.$nextTick(() => {
            this.draw2DPreview(geometry);
          });
          
          console.log('[IndexPage] Исходный размер:', this.originalSize);
          console.log('[IndexPage] Исходный объем:', this.originalVolume);
        }
      } catch (err) {
        console.error('[IndexPage] Ошибка парсинга:', err);
        uni.showToast({ title: 'Ошибка обработки модели', icon: 'none' });
      }
    },

    parseSTL(arrayBuffer) {
      const dataView = new DataView(arrayBuffer);
      const isASCII = this.isASCIISTL(arrayBuffer);
      
      if (isASCII) {
        return this.parseSTLASCII(new TextDecoder().decode(arrayBuffer));
      } else {
        return this.parseSTLBinary(dataView);
      }
    },

    isASCIISTL(arrayBuffer) {
      const text = new TextDecoder().decode(arrayBuffer.slice(0, 80));
      return text.toLowerCase().includes('solid');
    },

    parseSTLBinary(dataView) {
      const faces = dataView.getUint32(80, true);
      const positions = [];
      const indices = [];
      
      for (let i = 0; i < faces; i++) {
        const offset = 84 + i * 50;
        for (let j = 0; j < 3; j++) {
          const vOffset = offset + 12 + j * 12;
          positions.push(
            dataView.getFloat32(vOffset, true),
            dataView.getFloat32(vOffset + 4, true),
            dataView.getFloat32(vOffset + 8, true)
          );
          indices.push(i * 3 + j);
        }
      }
      
      return {
        attributes: {
          position: {
            array: new Float32Array(positions),
            itemSize: 3,
            count: positions.length / 3
          }
        },
        index: {
          array: new Uint32Array(indices),
          count: indices.length
        }
      };
    },

    parseSTLASCII(text) {
      const positions = [];
      const indices = [];
      const vertexPattern = /vertex\s+([\d.eE+-]+)\s+([\d.eE+-]+)\s+([\d.eE+-]+)/g;
      let match;
      let vertexCount = 0;
      
      while ((match = vertexPattern.exec(text)) !== null) {
        positions.push(
          parseFloat(match[1]),
          parseFloat(match[2]),
          parseFloat(match[3])
        );
        indices.push(vertexCount++);
      }
      
      return {
        attributes: {
          position: {
            array: new Float32Array(positions),
            itemSize: 3,
            count: positions.length / 3
          }
        },
        index: {
          array: new Uint32Array(indices),
          count: indices.length
        }
      };
    },

    parseOBJ(text) {
      const positions = [];
      const indices = [];
      const lines = text.split('\n');
      const vertices = [];
      
      for (let line of lines) {
        line = line.trim();
        if (line.startsWith('v ')) {
          const parts = line.split(/\s+/);
          vertices.push([
            parseFloat(parts[1]),
            parseFloat(parts[2]),
            parseFloat(parts[3])
          ]);
        } else if (line.startsWith('f ')) {
          const parts = line.split(/\s+/).slice(1);
          for (let part of parts) {
            const vertexIndex = parseInt(part.split('/')[0]) - 1;
            if (vertices[vertexIndex]) {
              positions.push(...vertices[vertexIndex]);
              indices.push(indices.length);
            }
          }
        }
      }
      
      return {
        attributes: {
          position: {
            array: new Float32Array(positions),
            itemSize: 3,
            count: positions.length / 3
          }
        },
        index: {
          array: new Uint32Array(indices),
          count: indices.length
        }
      };
    },

    createDummyGeometry() {
      const positions = [
        -1, -1, -1,  1, -1, -1,  1,  1, -1, -1,  1, -1,
        -1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,  1
      ];
      const indices = [
        0, 1, 2,  0, 2, 3,  4, 5, 6,  4, 6, 7,
        0, 1, 5,  0, 5, 4,  2, 3, 7,  2, 7, 6,
        0, 3, 7,  0, 7, 4,  1, 2, 6,  1, 6, 5
      ];
      
      return {
        attributes: {
          position: {
            array: new Float32Array(positions),
            itemSize: 3,
            count: positions.length / 3
          }
        },
        index: {
          array: new Uint32Array(indices),
          count: indices.length
        }
      };
    },

    create3DModelUrl(geometry, ext) {
      // #ifdef H5
      try {
        const positions = geometry.attributes.position.array;
        const indices = geometry.index ? geometry.index.array : null;
        
        const glbData = this.createGLBFromGeometry(positions, indices);
        const blob = new Blob([glbData], { type: 'model/gltf-binary' });
        
        if (this.modelUrl) {
          URL.revokeObjectURL(this.modelUrl);
        }
        
        this.modelUrl = URL.createObjectURL(blob);
        console.log('[IndexPage] 3D модель создана:', this.modelUrl);
      } catch (err) {
        console.error('[IndexPage] Ошибка создания 3D модели:', err);
        this.modelUrl = '';
      }
      // #endif
    },

    createGLBFromGeometry(positions, indices) {
      const vertices = new Float32Array(positions);
      const indicesArray = indices ? new Uint16Array(indices) : null;
      
      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
      
      for (let i = 0; i < vertices.length; i += 3) {
        minX = Math.min(minX, vertices[i]);
        maxX = Math.max(maxX, vertices[i]);
        minY = Math.min(minY, vertices[i + 1]);
        maxY = Math.max(maxY, vertices[i + 1]);
        minZ = Math.min(minZ, vertices[i + 2]);
        maxZ = Math.max(maxZ, vertices[i + 2]);
      }
      
      const gltf = {
        asset: { version: '2.0', generator: '3D Volume Calculator' },
        scene: 0,
        scenes: [{ nodes: [0] }],
        nodes: [{ mesh: 0 }],
        meshes: [{
          primitives: [{
            attributes: { POSITION: 0 },
            indices: indicesArray ? 1 : undefined,
            mode: 4
          }]
        }],
        accessors: [
          {
            bufferView: 0,
            componentType: 5126,
            count: vertices.length / 3,
            type: 'VEC3',
            max: [maxX, maxY, maxZ],
            min: [minX, minY, minZ]
          }
        ],
        bufferViews: [{
          buffer: 0,
          byteOffset: 0,
          byteLength: vertices.byteLength
        }],
        buffers: [{ byteLength: vertices.byteLength }]
      };
      
      if (indicesArray) {
        gltf.accessors.push({
          bufferView: 1,
          componentType: 5123,
          count: indicesArray.length,
          type: 'SCALAR'
        });
        gltf.bufferViews.push({
          buffer: 0,
          byteOffset: vertices.byteLength,
          byteLength: indicesArray.byteLength
        });
        gltf.buffers[0].byteLength += indicesArray.byteLength;
      }
      
      const jsonString = JSON.stringify(gltf);
      const jsonBuffer = new TextEncoder().encode(jsonString);
      const jsonAlignedLength = Math.ceil(jsonBuffer.length / 4) * 4;
      
      const binaryLength = vertices.byteLength + (indicesArray ? indicesArray.byteLength : 0);
      const totalLength = 12 + 8 + jsonAlignedLength + 8 + binaryLength;
      
      const glb = new ArrayBuffer(totalLength);
      const view = new DataView(glb);
      
      view.setUint32(0, 0x46546C67, true);
      view.setUint32(4, 2, true);
      view.setUint32(8, totalLength, true);
      
      view.setUint32(12, jsonAlignedLength, true);
      view.setUint32(16, 0x4E4F534A, true);
      const jsonChunk = new Uint8Array(glb, 20, jsonAlignedLength);
      jsonChunk.set(jsonBuffer);
      
      const binOffset = 20 + jsonAlignedLength;
      view.setUint32(binOffset, binaryLength, true);
      view.setUint32(binOffset + 4, 0x004E4942, true);
      
      const binChunk = new Uint8Array(glb, binOffset + 8, binaryLength);
      binChunk.set(new Uint8Array(vertices.buffer));
      
      if (indicesArray) {
        binChunk.set(new Uint8Array(indicesArray.buffer), vertices.byteLength);
      }
      
      return glb;
    },

    draw2DPreview(geometry) {
      // #ifdef H5
      const canvas = document.getElementById('preview2d');
      if (!canvas) {
        console.error('Canvas не найден');
        return;
      }
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Не удалось получить 2D контекст');
        return;
      }
      
      canvas.width = this.canvasWidth;
      canvas.height = this.canvasHeight;
      
      ctx.fillStyle = '#FFFBF0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const positions = geometry.attributes.position.array;
      const points = [];
      
      for (let i = 0; i < positions.length; i += 3) {
        points.push({
          x: positions[i],
          y: positions[i + 1],
          z: positions[i + 2]
        });
      }
      
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      
      points.forEach(p => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      });
      
      const rangeX = maxX - minX || 1;
      const rangeY = maxY - minY || 1;
      const scale = Math.min(
        (canvas.width - 40) / rangeX,
        (canvas.height - 40) / rangeY
      );
      
      ctx.strokeStyle = '#5D4037';
      ctx.fillStyle = '#FFD700';
      ctx.lineWidth = 1;
      
      const indices = geometry.index.array;
      for (let i = 0; i < indices.length; i += 3) {
        const p1 = points[indices[i]];
        const p2 = points[indices[i + 1]];
        const p3 = points[indices[i + 2]];
        
        if (!p1 || !p2 || !p3) continue;
        
        ctx.beginPath();
        ctx.moveTo(
          (p1.x - minX) * scale + 20,
          canvas.height - ((p1.y - minY) * scale + 20)
        );
        ctx.lineTo(
          (p2.x - minX) * scale + 20,
          canvas.height - ((p2.y - minY) * scale + 20)
        );
        ctx.lineTo(
          (p3.x - minX) * scale + 20,
          canvas.height - ((p3.y - minY) * scale + 20)
        );
        ctx.closePath();
        ctx.stroke();
      }
      // #endif
    },

    formatFileSize(bytes) {
      if (!bytes) return 'N/A';
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    },

    onSizeChange() {
      if (this.proportionalScale && this.originalSize.x > 0) {
        const ratio = parseFloat(this.currentSize.x) / (this.originalSize.x / 1000);
        this.currentSize.y = ((this.originalSize.y / 1000) * ratio).toFixed(3);
        this.currentSize.z = ((this.originalSize.z / 1000) * ratio).toFixed(3);
      }
      this.updateScale();
    },

    toggleProportional(e) {
      this.proportionalScale = e.detail.value;
    },

    onWallThicknessChange() {
      if (this.currentModel && this.currentModel.geometry) {
        this.calculateVolume();
      }
    },

    getScaleVolumeFactor() {
      return this.scaleFactors.x * this.scaleFactors.y * this.scaleFactors.z;
    },

    updateScale() {
      if (this.originalSize.x > 0) {
        this.scaleFactors = {
          x: (parseFloat(this.currentSize.x) * 1000) / this.originalSize.x || 1,
          y: (parseFloat(this.currentSize.y) * 1000) / this.originalSize.y || 1,
          z: (parseFloat(this.currentSize.z) * 1000) / this.originalSize.z || 1
        };
      }
    },

    calculateVolume() {
      if (!this.currentModel) {
        uni.showToast({ title: 'Сначала загрузите модель', icon: 'none' });
        return;
      }

      if (!this.currentModel.geometry) {
        console.error('[IndexPage] Геометрия модели не найдена');
        uni.showToast({ title: 'Геометрия модели не загружена, попробуйте загрузить модель снова', icon: 'none', duration: 3000 });
        return;
      }

      const thickness = parseFloat(this.wallThickness) || 0;
      this.calculatedVolume = volumeCalculator.calculateVolume(
        this.currentModel.geometry,
        this.scaleFactors,
        thickness
      );

      console.log('[IndexPage] Рассчитанный объем:', this.calculatedVolume);
      uni.showToast({ title: 'Расчет завершен', icon: 'success' });
    },

    formatVolume(volume) {
      if (!volume || isNaN(volume)) return '0.0 мл';
      const adjustedVolume = volume / 1000000;
      if (adjustedVolume >= 1000000) return `${(adjustedVolume / 1000).toFixed(2)} л`;
      if (adjustedVolume >= 1000) return `${adjustedVolume.toFixed(0)} мл`;
      if (adjustedVolume >= 1) return `${adjustedVolume.toFixed(4)} мл`;
      return `${adjustedVolume.toFixed(6)} мл`;
    },

    formatSolidVolume(volume) {
      if (!volume || isNaN(volume)) return '0.0 мл';
      const adjustedVolume = volume / 1000000;
      if (adjustedVolume >= 1000000) return `${(adjustedVolume / 1000).toFixed(2)} л`;
      if (adjustedVolume >= 1000) return `${adjustedVolume.toFixed(0)} мл`;
      if (adjustedVolume >= 1) return `${adjustedVolume.toFixed(4)} мл`;
      return `${adjustedVolume.toFixed(6)} мл`;
    },

    saveRecord() {
      const record = {
        modelName: this.modelName,
        originalVolume: this.originalVolume,
        currentVolume: this.calculatedVolume,
        originalSize: this.originalSize,
        currentSize: {
          x: parseFloat(this.currentSize.x) * 1000,
          y: parseFloat(this.currentSize.y) * 1000,
          z: parseFloat(this.currentSize.z) * 1000
        },
        wallThickness: parseFloat(this.wallThickness) || 0
      };

      const success = storage.saveRecord(record);
      if (success) {
        uni.showToast({ title: 'Запись сохранена', icon: 'success' });
        this.loadHistory();
      } else {
        uni.showToast({ title: 'Ошибка сохранения', icon: 'none' });
      }
    },

    loadHistory() {
      this.history = storage.getHistory();
    },

    clearHistory() {
      uni.showModal({
        title: 'Подтвердите удаление',
        content: 'Вы уверены, что хотите очистить всю историю?',
        success: (res) => {
          if (res.confirm) {
            storage.clearHistory();
            this.loadHistory();
            uni.showToast({ title: 'История очищена', icon: 'success' });
          }
        }
      });
    },

    deleteRecord(id) {
      storage.deleteRecord(id);
      this.loadHistory();
      uni.showToast({ title: 'Удалено', icon: 'success' });
    }
  }
};
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: var(--secondary-color);
}

.navbar {
  background: var(--primary-color);
  padding: 30rpx 40rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4rpx 12rpx var(--shadow-light);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-title {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--secondary-color);
}

.btn-upload {
  background: var(--accent-color);
  color: var(--primary-color);
  padding: 20rpx 32rpx;
  border-radius: 12rpx;
  font-weight: 600;
  font-size: 28rpx;
  border: none;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.content-wrapper {
  width: 100%;
}

.main-content {
  padding: 40rpx;
}

.viewer-section {
  margin-bottom: 40rpx;
}

.model-preview {
  width: 100%;
}

.model-info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background: linear-gradient(135deg, var(--primary-color) 0%, #795548 100%);
  border-radius: 12rpx 12rpx 0 0;
  margin-bottom: 20rpx;
}

.model-name {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--secondary-color);
  flex: 1;
}

.model-format {
  background: var(--accent-color);
  color: var(--primary-color);
  padding: 8rpx 20rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  font-weight: 700;
}

.model-visual {
  width: 100%;
  height: 400rpx;
  background: #FFFBF0;
  border-radius: 12rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
  position: relative;
}

.model-viewer-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.model-3d-viewer {
  width: 100%;
  height: 100%;
  display: block;
  background: #FFFBF0;
}

.preview-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.model-stats {
  display: flex;
  gap: 20rpx;
  padding: 20rpx;
  background: #FFF9E6;
  border-radius: 12rpx;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 24rpx;
  color: var(--text-secondary);
  margin-bottom: 8rpx;
}

.stat-value {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: var(--primary-color);
}

.placeholder-viewer {
  height: 600rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: var(--secondary-color);
  border-radius: 16rpx;
}

.placeholder-img {
  width: 300rpx;
  height: 300rpx;
  opacity: 0.6;
}

.placeholder-text {
  margin-top: 30rpx;
  font-size: 28rpx;
  color: var(--text-secondary);
}

.controls-section {
  margin-bottom: 40rpx;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 16rpx;
  font-size: 32rpx;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 30rpx;
}

.size-info {
  background: #FFF9E6;
  padding: 24rpx;
  border-radius: 12rpx;
  margin-bottom: 30rpx;
}

.info-label {
  font-size: 26rpx;
  color: var(--text-secondary);
}

.info-value {
  font-size: 28rpx;
  color: var(--primary-color);
  font-weight: 600;
  margin-left: 12rpx;
}

.input-row {
  display: flex;
  gap: 20rpx;
  margin-bottom: 30rpx;
}

.input-group {
  flex: 1;
}

.wall-thickness-group {
  flex: 1;
  background: #FFF9E6;
  padding: 24rpx;
  border-radius: 12rpx;
  border: 2rpx dashed var(--accent-color);
}

.input-label-with-info {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.info-badge {
  background: var(--accent-color);
  color: var(--primary-color);
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  font-weight: 600;
}

.input-description {
  display: block;
  font-size: 24rpx;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 16rpx;
  font-style: italic;
}

.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  margin-bottom: 30rpx;
  border-top: 1rpx solid var(--border-color);
  border-bottom: 1rpx solid var(--border-color);
}

.switch-label {
  font-size: 28rpx;
  color: var(--text-primary);
}

.btn-calculate {
  width: 100%;
  background: var(--primary-color);
  color: var(--secondary-color);
  padding: 28rpx;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: 700;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16rpx;
  margin-top: 20rpx;
}

.result-section {
  margin-bottom: 40rpx;
}

.result-box {
  background: linear-gradient(135deg, var(--primary-color) 0%, #795548 100%);
  padding: 50rpx;
  border-radius: 20rpx;
  text-align: center;
  margin-bottom: 30rpx;
}

.result-label {
  display: block;
  font-size: 28rpx;
  color: rgba(255, 251, 240, 0.8);
  margin-bottom: 20rpx;
}

.result-value {
  display: block;
  font-size: 64rpx;
  font-weight: 700;
  color: var(--accent-color);
  margin-bottom: 20rpx;
}

.result-desc {
  display: block;
  font-size: 26rpx;
  color: rgba(255, 251, 240, 0.9);
}

.volume-details {
  margin-top: 30rpx;
  padding-top: 30rpx;
  border-top: 1rpx solid rgba(255, 251, 240, 0.3);
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.volume-detail-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  background: rgba(255, 251, 240, 0.1);
  padding: 20rpx;
  border-radius: 12rpx;
}

.detail-icon {
  font-size: 32rpx;
  line-height: 1;
}

.detail-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.detail-label {
  font-size: 24rpx;
  color: rgba(255, 251, 240, 0.8);
}

.detail-value {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--accent-color);
}

.btn-save {
  width: 100%;
  background: var(--accent-color);
  color: var(--primary-color);
  padding: 28rpx;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: 700;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16rpx;
}

.history-section {
  margin-bottom: 40rpx;
}

.btn-clear {
  background: transparent;
  color: #f44336;
  font-size: 26rpx;
  padding: 12rpx 24rpx;
  border: 1rpx solid #f44336;
  border-radius: 8rpx;
  margin-left: auto;
}

.empty-state {
  text-align: center;
  padding: 80rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: var(--text-secondary);
}

.history-list {
  max-height: 800rpx;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1rpx solid var(--border-color);
}

.history-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.history-name {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.history-volume {
  font-size: 32rpx;
  color: var(--accent-color);
  font-weight: 700;
}

.history-date {
  font-size: 24rpx;
  color: var(--text-secondary);
}

.btn-delete {
  background: transparent;
  border: none;
  font-size: 40rpx;
  padding: 0 20rpx;
}

.icon {
  font-size: 32rpx;
}

.icon-gold {
  font-size: 36rpx;
  color: var(--accent-color);
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
</style>