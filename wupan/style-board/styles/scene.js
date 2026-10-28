// 共用镜头：人从背后仰望巨大价签，价签垂下锚链，锚扎在地上。
// 各风格只换材质 / 灯光 / 后期。mesh.userData.role ∈ person|tag|tagface|chain|anchor|floor|string
window.WP = (function () {
  function tagTexture(THREE, c) {
    const cv = document.createElement('canvas'); cv.width = 840; cv.height = 1280;
    const g = cv.getContext('2d');
    g.fillStyle = c.paper; g.fillRect(0, 0, 840, 1280);
    g.fillStyle = c.ink; g.textAlign = 'center';
    g.font = `500 54px ${c.font || '"Noto Sans SC"'}`; g.fillText('羊毛大衣 · 原价', 420, 380);
    g.font = `700 170px ${c.numFont || 'Bahnschrift'}`; g.fillText('¥9,999', 420, 560);
    g.strokeStyle = c.accent; g.lineWidth = 22; g.beginPath(); g.moveTo(90, 540); g.lineTo(760, 470); g.stroke();
    g.fillStyle = c.accent; g.font = `500 54px ${c.font || '"Noto Sans SC"'}`; g.fillText('限时 · 现价', 420, 800);
    g.font = `800 230px ${c.numFont || 'Bahnschrift'}`; g.fillText('¥3,999', 420, 1020);
    const t = new THREE.CanvasTexture(cv); t.anisotropy = 8; if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  function tag(m, role) { m.userData.role = role; m.castShadow = true; m.receiveShadow = true; return m; }

  function build(THREE, opt) {
    opt = opt || {};
    const seg = opt.lowpoly ? 6 : 32;
    const scene = new THREE.Scene();
    const root = new THREE.Group(); scene.add(root);
    const M = opt.mat; // role -> material

    // 地面
    const floor = tag(new THREE.Mesh(new THREE.PlaneGeometry(80, 80), M('floor')), 'floor');
    floor.rotation.x = -Math.PI / 2; floor.castShadow = false; root.add(floor);

    // 价签
    const tg = new THREE.Group(); tg.position.set(0, 5.3, -4); tg.rotation.set(0, 0.22, 0.035); root.add(tg);
    const board = tag(new THREE.Mesh(new THREE.BoxGeometry(4.2, 6.4, 0.08), M('tag')), 'tag'); tg.add(board);
    const face = tag(new THREE.Mesh(new THREE.PlaneGeometry(4.2, 6.4), M('tagface')), 'tagface'); face.position.z = 0.041; tg.add(face);
    const eye = tag(new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 12, seg), M('anchor')), 'anchor'); eye.position.set(0, 2.75, 0.06); tg.add(eye);
    const str = tag(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 12, 6), M('string')), 'string'); str.position.set(0, 8.9, 0); tg.add(str);

    // 锚
    const an = new THREE.Group(); an.position.set(2.4, 0, -1.0); an.rotation.set(0.05, -0.5, -0.16); root.add(an);
    const A = (geo) => tag(new THREE.Mesh(geo, M('anchor')), 'anchor');
    const shank = A(new THREE.CylinderGeometry(0.1, 0.12, 2.1, seg)); shank.position.y = 1.25; an.add(shank);
    const ring = A(new THREE.TorusGeometry(0.24, 0.06, 12, seg)); ring.position.y = 2.55; an.add(ring);
    const stock = A(new THREE.CylinderGeometry(0.075, 0.075, 1.4, seg)); stock.rotation.z = Math.PI / 2; stock.position.y = 2.05; an.add(stock);
    const arms = A(new THREE.TorusGeometry(0.85, 0.1, 12, seg * 2, Math.PI)); arms.rotation.z = Math.PI; arms.position.y = 1.05; an.add(arms);
    [-1, 1].forEach(s => { const f = A(new THREE.ConeGeometry(0.2, 0.5, opt.lowpoly ? 4 : 16)); f.position.set(0.85 * s, 1.2, 0); f.rotation.z = -0.35 * s; an.add(f); });
    const ball = A(new THREE.SphereGeometry(0.13, seg, seg)); ball.position.y = 0.2; an.add(ball);
    an.position.y = -0.12; // 扎进地里一点

    // 链：价签底 → 落地 → 锚环
    scene.updateMatrixWorld(true);
    const p0 = new THREE.Vector3(0.1, -3.15, 0.05); tg.localToWorld(p0);
    const p3 = new THREE.Vector3(0, 2.55, 0); an.localToWorld(p3);
    const curve = new THREE.CatmullRomCurve3([p0, new THREE.Vector3(0.6, 0.9, -3.4), new THREE.Vector3(1.1, 0.07, -2.4), new THREE.Vector3(1.9, 0.07, -1.7), new THREE.Vector3(2.25, 0.9, -1.25), p3]);
    const N = Math.floor(curve.getLength() / 0.17);
    const linkGeo = new THREE.TorusGeometry(0.09, 0.028, 8, opt.lowpoly ? 6 : 16);
    linkGeo.scale(1, 1.6, 1);
    for (let i = 0; i < N; i++) {
      const t = i / N, p = curve.getPointAt(t), d = curve.getTangentAt(t);
      const l = tag(new THREE.Mesh(linkGeo, M('chain')), 'chain');
      l.position.copy(p);
      l.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
      l.rotateY(i % 2 ? Math.PI / 2 : 0);
      root.add(l);
    }

    // 人偶（背对镜头，仰头看价签）
    const P = new THREE.Group(); P.position.set(-2.3, 0, 1.6); P.rotation.y = Math.PI + 0.25; root.add(P);
    const B = (geo, x, y, z) => { const m = tag(new THREE.Mesh(geo, M('person')), 'person'); m.position.set(x, y, z); P.add(m); return m; };
    const cap = (r, l) => new THREE.CapsuleGeometry(r, l, opt.lowpoly ? 2 : 6, opt.lowpoly ? 6 : 16);
    const sph = (r) => new THREE.SphereGeometry(r, seg, seg);
    B(sph(0.15), 0, 0.98, 0).scale.set(1.15, 0.8, 0.8);
    const torso = B(cap(0.17, 0.32), 0, 1.3, 0); torso.scale.set(1.15, 1, 0.72);
    B(new THREE.CylinderGeometry(0.05, 0.06, 0.12, 12), 0, 1.58, 0.01);
    const head = B(sph(0.115), 0, 1.72, 0.03); head.scale.set(0.95, 1.18, 1.05);
    [-1, 1].forEach(s => {
      B(cap(0.075, 0.36), 0.1 * s, 0.68, 0);
      B(cap(0.06, 0.36), 0.1 * s, 0.27, 0.0);
      B(new THREE.BoxGeometry(0.1, 0.06, 0.22), 0.1 * s, 0.03, 0.06);
      const ua = B(cap(0.055, 0.25), 0.26 * s, 1.32, 0); ua.rotation.z = 0.12 * s;
      const la = B(cap(0.048, 0.24), 0.29 * s, 1.03, 0.03); la.rotation.z = 0.05 * s;
    });
    P.rotation.x = 0; head.rotation.x = -0.35;

    // 相机
    const cam = new THREE.PerspectiveCamera(opt.fov || 38, 1920 / 1080, 0.1, 200);
    cam.position.set(...(opt.camPos || [-5.2, 2.6, 12.5]));
    cam.lookAt(...(opt.camLook || [0.2, 2.9, -2.2]));
    return { scene, cam, root, tagFace: face, person: P, anchor: an, tagGroup: tg };
  }

  function renderer(THREE, w, h, o) {
    const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, ...(o || {}) });
    r.setPixelRatio(1); r.setSize(w || 1920, h || 1080);
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    if (THREE.SRGBColorSpace) r.outputColorSpace = THREE.SRGBColorSpace;
    return r;
  }
  function sun(THREE, scene, color, inten, pos, size) {
    const d = new THREE.DirectionalLight(color, inten); d.position.set(...pos); d.castShadow = true;
    d.shadow.mapSize.set(2048, 2048); const s = size || 12;
    Object.assign(d.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 0.5, far: 60 }); d.shadow.bias = -0.0005; d.shadow.radius = 4;
    scene.add(d); return d;
  }
  async function fonts() { await Promise.all(['700 100px Bahnschrift', '500 50px "Noto Sans SC"', '800 50px "Noto Sans SC"'].map(f => document.fonts.load(f))); }

  // 反壳描边：每个 mesh 加一层背面放大的纯色壳
  function outline(THREE, root, color, px, skip) {
    const mat = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });
    const list = []; root.traverse(o => { if (o.isMesh && !(skip || ['floor', 'tagface']).includes(o.userData.role)) list.push(o); });
    list.forEach(o => { o.geometry.computeBoundingSphere(); const r = o.geometry.boundingSphere.radius;
      const h = new THREE.Mesh(o.geometry, mat); h.scale.setScalar(1 + px / r); h.position.copy(o.geometry.boundingSphere.center).multiplyScalar(-px / r); h.userData.role = 'hull'; o.add(h); });
  }
  // 线框：EdgesGeometry
  function edges(THREE, root, color, angle) {
    const mat = new THREE.LineBasicMaterial({ color });
    const list = []; root.traverse(o => { if (o.isMesh && o.userData.role !== 'floor' && o.userData.role !== 'hull') list.push(o); });
    list.forEach(o => o.add(new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, angle || 25), mat)));
  }
  // 把 WebGL 画面读成 2D ImageData，供抖动/ASCII/半调等后期
  function pixels(r) { const c = document.createElement('canvas'); c.width = r.domElement.width; c.height = r.domElement.height;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(r.domElement, 0, 0); return g.getImageData(0, 0, c.width, c.height); }
  return { build, tagTexture, renderer, sun, fonts, outline, edges, pixels };
})();
