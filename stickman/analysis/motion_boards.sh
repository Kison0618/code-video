#!/usr/bin/env bash
# 重新生成 研究/动作逐帧/ 里的关键帧展板（研究/动作逐帧_四集.md 用的图）、弓步刺的"原片 vs 我们"对比图、上勾拳设计练习的对比图（动作设计.md 用）。
#   bash analysis/motion_boards.sh [参考片目录]      （在 stickman/ 下运行）
# 参考片目录里要有 coding.mp4 math.mp4 geometry.mp4 physics.mp4；没有的话自动从 origin/claude专用 分支取出来。
# 图先出成 png，再包成 svg（svg 里内嵌 png，因为推送接口只能传文本文件）。
set -e
cd "$(dirname "$0")/.."
V=${1:-/tmp/refvids}; O=研究/动作逐帧; A=analysis; mkdir -p "$V" "$O"
declare -A SRC=([coding]='火柴人 VS 编程（Coding)' [math]='火柴人 VS 数学(Math)' [geometry]='火柴人 VS 几何（Geometry）' [physics]='火柴人 VS 物理 (Physics)')
for k in "${!SRC[@]}"; do
  [ -s "$V/$k.mp4" ] && continue
  git fetch -q origin claude专用 || true
  f=$(git -c core.quotepath=off ls-tree -r --name-only origin/claude专用 | grep -F "${SRC[$k]}" | grep mp4 | head -1)
  git show "origin/claude专用:$f" > "$V/$k.mp4"
done
B() { python3 $A/ref_board.py "$@" >/dev/null; echo "$3"; }
B "$V/geometry.mp4" 420,280,1180,900 $O/A_startle.png "A 吓得跳起往后跌坐（几何集 4:02.5，24fps，H≈700px）" \
  "242.40|静止 16 帧\n完全不动" "242.54|第1帧\n手缩到头边，地面一震" "242.58|第2帧 蹬直离地\n手往上后甩" "242.67|空中" \
  "242.71|最高点 +0.21H\n手张开，腿收在身下" "242.79|下落\n腿朝威胁伸" "242.83|手往后下伸\n准备撑地" "242.875|第9帧 着地\n手撑身后，膝立起" --cols 4 --cell 360
B "$V/math.mp4" 470,380,1250,800 $O/B_lunge.png "B 弓步刺（数学集 7:28.3，24fps，H≈375px）" \
  "448.30|f0 架势\n前倾37°，后手举过头" "448.34|f1 上身先直起来(28°)\n后脚离地往前收" "448.39|f2 后腿从身下穿过\n胯 +0.28H，不往下沉" \
  "448.43|f3 剑收在胸前\n新前脚在空中够出去" "448.47|f4 刺中=前脚落地\n剑手1帧伸直，前倾57°，胯降0.11H" "448.55|f6 定住\n微微回撤" \
  "448.64|f8 开始收" "448.68|f9 被反击，往回退" --cols 4 --cell 380
B "$V/math.mp4" 640,500 $O/C_dive.png "C 冲刺扑空→回身扑→趴地（数学集 1:50.6，24fps，H≈430px，镜头固定，按人居中裁切）" \
  "110.53|起跑：先前倾\n4 帧加到全速" "110.75|全速冲\n上身压得很低，双手前伸去抓" "111.34|扑空，脚伸到前面刹车" "111.43|转身只有 1 帧\n侧面压扁的画" \
  "111.51|反身扑出去\n身体几乎水平" "111.63|手先着地\n腿拖在后面" "111.72|趴成四点\n之后衰减着动 0.8 秒" "113.69|定住 1.1 秒\n完全不动" --cols 4 --cell 340
B "$V/physics.mp4" 330,260 $O/D_sprint_tumble.png "D 冲刺 4 张循环 + 绊倒翻滚（物理集 1:03.5，24fps，H≈240px，镜头跟拍，按人居中裁切）" \
  "63.55|跑①腾空\n两脚离地，前倾49°" "63.59|跑②前脚落地\n后脚跟踢起" "63.63|跑③两腿交错\n最低点，上身直" "63.68|跑④蹬地\n后腿蹬直，前膝提起" \
  "64.05|绊倒：往前扑" "64.13|身体水平飞出" "64.22|头着地，腿翻过头顶" "64.38|翻过来坐在地上" "64.55|往后再滚一圈" "64.80|坐起来" \
  "65.13|往前倒，趴着滑" "65.30|滑的时候小腿翘起" --cols 4 --cell 300
B "$V/coding.mp4" 380,380,1180,760 $O/E_bump.png "E 跑着撞上方块被弹倒（编程集 4:46.9，30fps 文件=24fps 动画，H≈300px）" \
  "286.88|跑着，方块突然出现" "286.92|撞上：整个人贴平在方块上\n画面上下震 1–2 帧" "287.02|头和上身先弹回\n后仰35°，手还朝前" \
  "287.12|像木板一样往后倒\n脚贴地往后滑" "287.22|整个人往后退约 1H\n速度几乎不减" "287.32|快到地" "287.42|着地，腿弹一下" "287.75|衰减着动 → 坐起来" \
  --cols 4 --cell 330 --color yellow
B "$V/math.mp4" 760,520 $O/F_tackle.png "F 飞扑抱住 → 被打飞 → 翻滚 → 爬起（数学集 4:15–4:21，24fps，按人居中裁切）" \
  "255.11|大步飞跃着冲过去" "255.28|鱼跃：身体完全水平\n这一帧前移 0.34H" "255.36|肚皮着地往前滑" "255.48|收腿，把对手抱住" \
  "258.59|被打飞回来（倒着飞）" "258.83|落地往后翻\n头朝下，腿在上" "259.00|手撑地翻过来" "259.25|缩成一团再滚" \
  "259.50|仰面腿翘着滑\n匀速约 0.09H/帧" "259.88|趴住，按两三帧一张微调" "260.13|转身只有 1 帧" "260.63|爬起来 7 帧" "260.79|站直后衰减着定住" --cols 4 --cell 300
# 学习闭环的验收图：原片 / 实测版 lunge_step（含 st 拉长）/ 原来估计的 lunge_punch，同帧并排
T=$(mktemp -d)
(cd render && node src/tools/move_seq.js $T/new 1.0 10 fence_guard@0.3 lunge_step@1.0 >/dev/null && node src/tools/move_seq.js $T/old 1.0 10 guard@0.3 lunge_punch@1.0 >/dev/null)
python3 $A/ref_compare.py "$V/math.mp4" 448.31 10 375 "实测 lunge_step=$T/new,原估计 lunge_punch=$T/old" $O/B_lunge_对比.png --cell 200 \
  --labels 'f0 架势|f1|f2|f3|f4 刺中|f5|f6|f7|f8|f9' | head -1
# 设计练习：上勾拳 设计版 uppercut_d / 原来估计的 uppercut（没有原片，视频写 -）
(cd render && node src/tools/move_seq.js $T/up_new 1.0 20 guard@0.3 uppercut_d@1.0 >/dev/null && node src/tools/move_seq.js $T/up_old 1.0 20 guard@0.3 uppercut@1.0 >/dev/null)
python3 $A/ref_compare.py - 0 20 0 "设计版=$T/up_new,原估计版=$T/up_old" $O/设计_上勾拳_对比.png --cell 120 \
  --labels 'f0 架势|f1|f2|f3 最紧|f4 打中|f5 过冲|f6|f7|f8 挂住|f9|f10 落地|f11|f12|f13|f14|f15|f16|f17|f18|f19' | head -1
# png → 内嵌 png 的 svg（量化到 128 色，体积小一半，看不出差别）
python3 - "$O" <<'PY'
import sys, glob, base64, io, os
from PIL import Image
for p in sorted(glob.glob(os.path.join(sys.argv[1], '*.png'))):
    im = Image.open(p).convert('RGB'); w, h = im.size
    b = io.BytesIO(); im.quantize(128, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(b, 'png', optimize=True)
    s = (f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
         f'<image width="{w}" height="{h}" xlink:href="data:image/png;base64,{base64.b64encode(b.getvalue()).decode()}"/></svg>\n')
    open(p[:-4] + '.svg', 'w').write(s); os.remove(p); print(p[:-4] + '.svg', len(s) // 1024, 'KB')
PY
