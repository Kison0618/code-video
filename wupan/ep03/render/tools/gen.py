#!/usr/bin/env python3
"""第三集素材生成：带参考图调用 kedaya（OpenAI 兼容 /v1/images/edits）。

用法：KEDAYA_API_KEY=... python3 tools/gen.py E01 [E02 ...]   （在 ep03/render 下运行）
每张写 assets/gen/<编号>.png 和同名 .source.txt（模型、参考图、提示词）。
提示词保持短：参考图 + 画风 + 主体。图里不要文字。
"""
import base64, json, os, sys, time, urllib.request, uuid

BASE = os.environ.get('KEDAYA_BASE', 'https://kedaya.ai/v1')
KEY = os.environ['KEDAYA_API_KEY']
MODEL = os.environ.get('KEDAYA_MODEL', 'gpt-image-2.5')
HERE = os.path.dirname(os.path.abspath(__file__))
GEN = os.path.join(HERE, '..', 'assets', 'gen')
EP02 = os.path.join(HERE, '..', '..', '..', 'ep02', 'render', 'assets', 'gen')

STYLE = ('Victorian copperplate engraving, fine crosshatching and stippling, warm sepia ink on a plain flat cream background, '
         'match the drawing style of the reference image exactly. Isolated subject with empty background around it. '
         'No text, no letters, no numbers, no signs with writing, no frame, no border.')
SCENE = ('Victorian copperplate engraving, fine crosshatching, warm sepia ink on cream paper, match the drawing style of the reference image. '
         'Full illustration. No text, no letters, no numbers, no readable signs, no frame, no border.')
YOU = 'the same young man as in the first reference image (same face, same short black hair, light shirt, dark trousers)'

# 编号: (尺寸, 参考图列表, 画风, 主体)
JOBS = {
  'E01': ('1024x1536', ['I05'], STYLE, 'a young East Asian man in his twenties, short black hair, plain light-colored button shirt with sleeves rolled up, dark trousers, standing upright facing the viewer, full body head to shoes, arms relaxed, calm neutral face'),
  'E02': ('1024x1536', ['@E01', 'G01'], STYLE, f'{YOU}, walking to the right in side profile, full body head to shoes, mid-stride'),
  'E03': ('1024x1536', ['@E01', 'J02'], STYLE, f'{YOU}, sitting on a plain wooden chair seen from the front, hands resting on his knees, full figure including chair legs and shoes'),
  'E04': ('1024x1536', ['@E01'], STYLE, f'{YOU}, standing still in three-quarter view, head slightly lowered, one hand at his chin, thinking, full body head to shoes'),
  'E05': ('1024x1536', ['I03'], STYLE, 'a middle-aged East Asian man in a plain jacket and trousers, standing in side profile facing right as if waiting in a queue, full body head to shoes'),
  'E06': ('1024x1536', ['@E05'], STYLE, 'an ordinary middle-aged East Asian woman (not a uniform), short permed hair, plain knitted cardigan, loose trousers, a shopping bag on her arm, standing in side profile facing right as if waiting in a queue, full body head to shoes'),
  'E07': ('1024x1536', ['H01'], STYLE, 'an elderly East Asian man in a cap and plain jacket, standing in side profile facing right as if waiting in a queue, hands behind his back, full body head to shoes'),
  'E08': ('1024x1536', ['@E05'], STYLE, 'a middle-aged East Asian man in side profile facing right, holding his cap raised in one hand above his head, sheepish expression, full body head to shoes'),
  'E09': ('1536x1024', ['G05'], STYLE, 'the front of a small traditional Chinese steamed-bun shop: open counter with tall stacked bamboo steamers releasing steam, awning, blank signboard with no writing, isolated building front'),
  'E10': ('1536x1024', ['V6_watch'], STYLE, 'one round open bamboo steamer basket full of white steamed buns, three-quarter view, single object'),
  'E11': ('1536x1024', ['G05', 'I01'], SCENE, 'a cutaway cross-section diagram of a street-level shop with an underground parking garage below it: a ramp going down from the street on the left, concrete pillars, a few parked cars, a stairway coming back up on the right into the shop, clean side view'),
  'E12': ('1536x1024', ['I01'], SCENE, 'a street in an unfamiliar Chinese city at dinner time, two small restaurants side by side: the left one has a big crowd of people waiting at its door, the right one is empty and quiet, blank signboards'),
  'E13': ('1536x1024', ['H01', 'G04'], SCENE, 'a crowd of ordinary people standing in a half circle, every single one of them turning their head to stare at one lone man standing alone in the middle, he looks uncomfortable'),
  'E14': ('1024x1536', ['J02'], STYLE, 'a young man in a shirt sitting on a plain wooden chair seen from the front, hands on knees, full figure including chair and shoes'),
  'E15': ('1024x1536', ['J02'], STYLE, 'a young woman in a blouse and skirt sitting on a plain wooden chair seen from the front, hands on knees, full figure including chair and shoes'),
  'E16': ('1024x1536', ['J02'], STYLE, 'a middle-aged man with glasses and a sweater sitting on a plain wooden chair seen from the front, hands on knees, full figure including chair and shoes'),
  'E17': ('1536x1024', ['G05'], STYLE, 'an empty supermarket shelf unit seen straight from the front, four evenly spaced shelves, completely empty, metal frame, single object'),
  'E18': ('1024x1536', ['H04'], STYLE, 'one small plain white plastic bag of table salt standing upright, pillow-shaped package, no printing at all, single object'),
  'E19': ('1024x1536', ['I08'], STYLE, 'a human hand and forearm reaching down from above, gripping two small plain white bags of salt, sleeve visible at the top, single object'),
  'E20': ('1024x1536', ['G06'], STYLE, 'an old candy-bar mobile phone from around 2010 with a small blank screen and completely blank keypad buttons (no numbers or symbols printed on any key), front view, single object'),
  'E21': ('1024x1536', ['I03'], STYLE, 'a man walking to the right in side profile carrying a huge tall stack of small white salt bags on his shoulder, straining, full body head to shoes'),
  'E22': ('1024x1536', ['I03', 'G04'], STYLE, 'a person standing in side profile facing right, holding a tall stack of small flat rectangular white plastic salt packets in both arms against the chest, the packets clearly look like table salt packets, waiting in line, full body head to shoes'),
  'E23': ('1536x1024', ['G05'], STYLE, 'a supermarket customer service counter seen from the front, with a blank sign board hanging above it, no writing, isolated object'),
  'E24': ('1536x1024', ['I01'], SCENE, 'a pharmacy storefront at night, warm light pouring out of the shop window, a long line of people waiting outside along the sidewalk, dark night sky'),
  'E25': ('1536x1024', ['I06'], SCENE, 'a meeting room with a long table, office workers seated all around it, all silent with closed mouths and blank faces, one person standing at the end presenting a chart on an easel'),
  'E26': ('1536x1024', ['H01'], STYLE, 'an elderly East Asian couple sitting together on a sofa seen from the front, attentive faces, full figures including the sofa, isolated'),
  'E27': ('1024x1536', ['E26:ref'], STYLE, 'an elderly East Asian man of the same age and the same plain everyday clothing style as the couple in the reference image (a retired neighbour), sitting in an armchair turned to the left, raising one hand while talking earnestly, full figure including chair'),
  'E29': ('1536x1024', ['I06'], SCENE, 'a gym with a row of people running on treadmills side by side, seen from the side'),
  'E30': ('1536x1024', ['K02'], SCENE, 'a reading club: a group of friends sitting around a table, each reading a book, cozy room'),
  'E31': ('1536x1024', ['G04', 'G15'], SCENE, 'a dense crowd of ordinary people all walking quickly to the right along a city street, side view, everyone moving the same direction'),
}

def ref_path(r):
    if r.startswith('@'): return os.path.join(GEN, r[1:] + '.png')
    if r.endswith(':ref'): return os.path.join(GEN, r[:-4] + '.png')
    return os.path.join(EP02, r + '.png')

def multipart(fields, files):
    b = uuid.uuid4().hex; out = []
    for k, v in fields.items():
        out.append(f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
    for k, path in files:
        out.append(f'--{b}\r\nContent-Disposition: form-data; name="{k}"; filename="{os.path.basename(path)}"\r\nContent-Type: image/png\r\n\r\n'.encode())
        out.append(open(path, 'rb').read()); out.append(b'\r\n')
    out.append(f'--{b}--\r\n'.encode())
    return b''.join(out), f'multipart/form-data; boundary={b}'

def gen(n, tries=3):
    size, refs, style, subject = JOBS[n]
    prompt = f'{style} Subject: {subject}.'
    paths = [ref_path(r) for r in refs]
    body, ctype = multipart({'model': MODEL, 'prompt': prompt, 'size': size, 'n': '1'}, [('image[]', p) for p in paths])
    for k in range(tries):
        try:
            req = urllib.request.Request(BASE + '/images/edits', data=body, headers={'Authorization': 'Bearer ' + KEY, 'Content-Type': ctype})
            d = json.load(urllib.request.urlopen(req, timeout=600))
            item = d['data'][0]
            img = base64.b64decode(item['b64_json']) if item.get('b64_json') else urllib.request.urlopen(item['url'], timeout=300).read()
            open(os.path.join(GEN, n + '.png'), 'wb').write(img)
            with open(os.path.join(GEN, n + '.source.txt'), 'w', encoding='utf-8') as f:
                f.write(f'AI 生成（kedaya {MODEL}，/v1/images/edits，{time.strftime("%Y-%m-%d")}），带参考图。\n')
                f.write('参考图：' + '、'.join(('ep03/render/assets/gen/' + r.strip('@').replace(':ref', '')) if (r.startswith('@') or r.endswith(':ref')) else ('ep02/render/assets/gen/' + r) for r in refs) + '\n')
                f.write(f'尺寸：{size}\n提示词：{prompt}\n')
            print('ok', n, len(img)); return True
        except Exception as e:
            msg = e.read().decode()[:300] if hasattr(e, 'read') else str(e)
            print('retry', n, k, msg); time.sleep(5)
    return False

if __name__ == '__main__':
    os.makedirs(GEN, exist_ok=True)
    bad = [n for n in sys.argv[1:] if not gen(n)]
    if bad: print('FAILED', ' '.join(bad)); sys.exit(1)
