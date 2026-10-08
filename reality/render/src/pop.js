// 人群样本：2000 个点，每个点是一个人。全片都在用这群点做"实验"
'use strict';
const { W, H, mulberry32 } = require('./core');

const N = 2000;
function gauss(r) { return Math.sqrt(-2 * Math.log(1 - r() * 0.999)) * Math.cos(6.2832 * r()); }
const PEOPLE = (() => {
  const r = mulberry32(2026), out = [];
  for (let i = 0; i < N; i++) {
    // 人群在画面上的位置：一大片，中间略密
    const a = r() * 6.2832, d = Math.pow(r(), 0.62);
    const x = W / 2 + Math.cos(a) * d * W * 0.47, y = H / 2 + Math.sin(a) * d * H * 0.44;
    // 听到一句真话后的反应：认同 12%、无感 61%、敌意 27%
    const q = r();
    const react = q < 0.12 ? 1 : q < 0.73 ? 0 : -1;
    // 每个人希望"你"站的位置（立场地图）
    const sa = r() * 6.2832, sd = 120 + Math.pow(r(), 0.5) * 420;
    // 对你的感受：你没有立场时 ≈ 0；你表明立场后分成两群
    const calm = gauss(r) * 0.06;
    const side = react === 1 || (react === 0 && r() < 0.35) ? 1 : react === -1 || r() < 0.5 ? -1 : 0;
    const felt = side === 0 ? gauss(r) * 0.08 : side * (0.55 + Math.abs(gauss(r)) * 0.18) + gauss(r) * 0.05;
    out.push({ x, y, a, d, react, sx: W / 2 + Math.cos(sa) * sd, sy: H / 2 + Math.sin(sa) * sd * 0.8, calm, felt, ord: r(), tw: r() * 6.28, sz: 1.2 + r() * 1.3 });
  }
  return out;
})();
module.exports = { N, PEOPLE, gauss };
