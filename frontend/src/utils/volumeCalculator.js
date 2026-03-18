export const volumeCalculator = {
  calculateVolume(geometry, scale = { x: 1, y: 1, z: 1 }, wallThickness = 0) {
    if (!geometry || !geometry.attributes || !geometry.attributes.position) {
      console.error('Неверные данные геометрии');
      return 0;
    }

    const positions = geometry.attributes.position.array;
    const vertexCount = positions.length / 3;
    if (vertexCount < 3) return 0;

    const outerVolume = this._computeSignedVolume(geometry, scale);

    if (wallThickness <= 0) return outerVolume * 1000;

    const bbox = this.getBoundingBox(geometry);
    const wallVolume = this._computeWallVolume(geometry, scale, bbox, wallThickness);

    return Math.max(0, wallVolume) * 1000;
  },

  _computeSignedVolume(geometry, scale) {
    const positions = geometry.attributes.position.array;
    const faceCount = geometry.index ? geometry.index.count / 3 : positions.length / 9;
    let volume = 0;

    for (let i = 0; i < faceCount; i++) {
      let i0, i1, i2;
      if (geometry.index) {
        i0 = geometry.index.array[i * 3] * 3;
        i1 = geometry.index.array[i * 3 + 1] * 3;
        i2 = geometry.index.array[i * 3 + 2] * 3;
      } else {
        i0 = i * 9; i1 = i * 9 + 3; i2 = i * 9 + 6;
      }

      volume += this.signedVolumeOfTriangle(
        positions[i0] * scale.x, positions[i0 + 1] * scale.y, positions[i0 + 2] * scale.z,
        positions[i1] * scale.x, positions[i1 + 1] * scale.y, positions[i1 + 2] * scale.z,
        positions[i2] * scale.x, positions[i2 + 1] * scale.y, positions[i2 + 2] * scale.z
      );
    }
    return Math.abs(volume);
  },

  _computeWallVolume(geometry, scale, bbox, wallThickness) {
    const outerVolume = this._computeSignedVolume(geometry, scale);

    const wallMM = wallThickness;
    const outerX = bbox.x;
    const outerY = bbox.y;
    const outerZ = bbox.z;

    const innerX = Math.max(0.001, outerX - 2 * wallMM);
    const innerY = Math.max(0.001, outerY - 2 * wallMM);
    const innerZ = Math.max(0.001, outerZ - 2 * wallMM);

    const innerScaleRatio = {
      x: scale.x * (innerX / outerX),
      y: scale.y * (innerY / outerY),
      z: scale.z * (innerZ / outerZ)
    };

    const innerVolume = this._computeSignedVolume(geometry, innerScaleRatio);
    return Math.max(0, outerVolume - innerVolume);
  },

  signedVolumeOfTriangle(x0, y0, z0, x1, y1, z1, x2, y2, z2) {
    return (x0 * y1 * z2 + x1 * y2 * z0 + x2 * y0 * z1 -
            x2 * y1 * z0 - x1 * y0 * z2 - x0 * y2 * z1) / 6.0;
  },

  getBoundingBox(geometry) {
    if (!geometry || !geometry.attributes || !geometry.attributes.position) {
      return { x: 0, y: 0, z: 0 };
    }

    const positions = geometry.attributes.position.array;
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (let i = 0; i < positions.length; i += 3) {
      minX = Math.min(minX, positions[i]);     maxX = Math.max(maxX, positions[i]);
      minY = Math.min(minY, positions[i + 1]); maxY = Math.max(maxY, positions[i + 1]);
      minZ = Math.min(minZ, positions[i + 2]); maxZ = Math.max(maxZ, positions[i + 2]);
    }

    return {
      x: (maxX - minX) * 1000,
      y: (maxY - minY) * 1000,
      z: (maxZ - minZ) * 1000
    };
  },

  getScaleFactor(originalSize, targetSize) {
    return {
      x: (parseFloat(targetSize.x) || originalSize.x) / originalSize.x || 1,
      y: (parseFloat(targetSize.y) || originalSize.y) / originalSize.y || 1,
      z: (parseFloat(targetSize.z) || originalSize.z) / originalSize.z || 1
    };
  },

  getOuterVolume(geometry, scale) {
    if (!geometry || !geometry.attributes || !geometry.attributes.position) return 0;
    return this._computeSignedVolume(geometry, scale) * 1000;
  },

  formatVolume(volume) {
    if (!volume || isNaN(volume)) return '0.0 мл';
    const adjustedVolume = volume / 1000000;
    if (adjustedVolume >= 10) return `${(adjustedVolume / 1000).toFixed(2)} л`;
    if (adjustedVolume >= 0.01) return `${adjustedVolume.toFixed(4)} мл`;
    return `${adjustedVolume.toFixed(4)} мл`;
  }
};