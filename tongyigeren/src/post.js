// 后期：纸的纹理（不闪）和四周一点点压暗
'use strict';
const Post = (() => {
  const gn = document.createElement('canvas'); gn.width = 512; gn.height = 512;
  { const x = gn.getContext('2d'), im = x.createImageData(512, 512); for (let i = 0; i < 262144; i++) { const px = i % 512, py = (i / 512) | 0, v = 128 + (hash(i * 3 + 7) - .5) * 46 + (vnoise(px / 5, py / 38) - .5) * 26 + (vnoise(px / 60, py / 60) - .5) * 20; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; } x.putImageData(im, 0, 0); }
  return {
    finish(ctx, t, o) {
      o = o || {}; ctx.save(); camReset(ctx); shOff(ctx);
      const v = o.vig === undefined ? .34 : o.vig, g = ctx.createRadialGradient(W / 2, H * .5, H * .42, W / 2, H * .5, W * .72); g.addColorStop(0, 'rgba(20,12,8,0)'); g.addColorStop(1, `rgba(20,12,8,${v})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = o.grain === undefined ? .2 : o.grain;
      for (let y = 0; y < H; y += 512) for (let x = 0; x < W; x += 512) ctx.drawImage(gn, x, y);
      ctx.restore();
    },
  };
})();
