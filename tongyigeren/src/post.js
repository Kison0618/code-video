// 后期：泛光、空气里的微尘、暗角、颗粒。都只由时间决定
'use strict';
const Post = (() => {
  const bw = 480, bh = 270;
  const b1 = document.createElement('canvas'); b1.width = bw; b1.height = bh; const x1 = b1.getContext('2d');
  const b2 = document.createElement('canvas'); b2.width = bw; b2.height = bh; const x2 = b2.getContext('2d');
  // 颗粒贴图
  const gn = document.createElement('canvas'); gn.width = 256; gn.height = 256;
  { const x = gn.getContext('2d'), im = x.createImageData(256, 256); for (let i = 0; i < 65536; i++) { const v = 128 + (hash(i * 3 + 7) - .5) * 90; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; } x.putImageData(im, 0, 0); }
  return {
    // 把铺好木板的画面 src 贴到 ctx 上，并加泛光。amount = 泛光强度
    blit(ctx, src, amount, view) {
      ctx.save();
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      if (view && view.z !== 1) { const z = view.z; ctx.translate(W / 2 - view.x * z, H / 2 - view.y * z); ctx.scale(z, z); }
      ctx.drawImage(src, 0, 0);
      ctx.restore();
      if (amount <= 0) return;
      x1.globalCompositeOperation = 'source-over'; x1.filter = 'none'; x1.clearRect(0, 0, bw, bh);
      x1.save(); if (view && view.z !== 1) { const z = view.z, k = bw / W; x1.translate((W / 2 - view.x * z) * k, (H / 2 - view.y * z) * k); x1.scale(z, z); }
      x1.drawImage(src, 0, 0, bw, bh); x1.restore();
      x1.globalCompositeOperation = 'multiply'; x1.drawImage(b1, 0, 0);                    // 平方一下，只留亮的地方
      x2.clearRect(0, 0, bw, bh); x2.filter = 'blur(7px)'; x2.drawImage(b1, 0, 0); x2.filter = 'blur(2px)'; x2.globalAlpha = .6; x2.drawImage(b1, 0, 0); x2.globalAlpha = 1; x2.filter = 'none';
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = amount; ctx.drawImage(b2, 0, 0, W, H); ctx.restore();
    },
    // 空气里的微尘（暖色小点，慢慢飘）
    dust(ctx, t, o) {
      o = o || {}; const n = o.n || 46, a = o.a === undefined ? 1 : o.a, col = o.col || [255, 226, 180];
      if (a <= 0) return;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) {
        const sp = .012 + hash(i * 5 + 1) * .02, x = ((hash(i * 5 + 2) + t * sp * (hash(i * 5 + 3) - .3)) % 1 + 1) % 1 * W, y = ((hash(i * 5 + 4) - t * sp * .35) % 1 + 1) % 1 * H;
        const tw = .5 + .5 * Math.sin(t * (1 + hash(i) * 2) + i), r = 1.6 + hash(i * 9) * 2.6;
        ctx.fillStyle = css(col, a * (.1 + .3 * tw) * (.4 + hash(i * 3) * .6)); ctx.fillRect(x, y, r * 2, r * 2);
      }
      ctx.restore();
    },
    finish(ctx, t, o) {
      o = o || {}; const v = o.vig === undefined ? .55 : o.vig;
      const gr = ctx.createRadialGradient(W / 2, H * .5, H * .35, W / 2, H * .5, W * .68); gr.addColorStop(0, 'rgba(3,4,8,0)'); gr.addColorStop(1, `rgba(3,4,8,${v})`);
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
      const f = Math.floor(t * FPS); ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = o.grain === undefined ? .16 : o.grain;
      const ox = Math.floor(hash(f * 2 + 1) * 256), oy = Math.floor(hash(f * 2 + 2) * 256);
      for (let y = -oy; y < H; y += 256) for (let x = -ox; x < W; x += 256) ctx.drawImage(gn, x, y);
      ctx.restore();
    },
  };
})();
