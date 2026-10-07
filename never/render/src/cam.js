// 3D 透视相机：x 右、y 上、z 向前。cam = { x, y, z, yaw, pitch, f }
'use strict';
const { W, H } = require('./core');
function camera({ x = 0, y = 0, z = 0, yaw = 0, pitch = 0, f = 1100, cx = W / 2, cy = H / 2 }) {
  const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const P = p => {
    const dx = p[0] - x, dy = p[1] - y, dz = p[2] - z;
    const X = dx * cyw - dz * syw;
    let Z = dx * syw + dz * cyw;
    const Y = dy * cp - Z * sp;
    Z = dy * sp + Z * cp;
    if (Z < 2) return null;
    const s = f / Z;
    return [cx + X * s, cy - Y * s, s, Z];
  };
  return P;
}
module.exports = { camera };
