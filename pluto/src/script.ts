/**
 * 旁白脚本 / Narration script
 *
 * 每个场景对应一个配音文件：public/voiceover/<id>.mp3（也支持 .wav / .m4a）
 * 配音文件的内容 = 该场景所有 lines.zh 依次连起来朗读。
 * 运行 `npm run voiceover:list` 可以打印出每个文件需要读的完整文本。
 *
 * 没有配音文件时，会按字数估算时长，视频照样能预览和渲染。
 */

export type Line = {zh: string; en: string};

export type Chapter = {no: string; zh: string; en: string} | null;

export type SceneDef = {
	id: string;
	chapter: Chapter;
	lines: Line[];
	/** 场景最短时长（秒），用于标题、片尾等需要留白的画面 */
	minSeconds?: number;
	/** 旁白结束后额外停留（秒） */
	tailSeconds?: number;
};

export const SCENES: SceneDef[] = [
	{
		id: 's01',
		chapter: {no: '01', zh: '发现', en: 'DISCOVERY'},
		lines: [
			{zh: '1930 年 2 月，美国亚利桑那州。', en: 'February 1930. Arizona.'},
			{
				zh: '一个 24 岁的农家青年，正盯着两张夜空照片，来回比对。',
				en: 'A 24-year-old farm boy is flicking between two photographs of the night sky.',
			},
			{
				zh: '成千上万颗星星里，只有一个光点，悄悄挪动了位置。',
				en: 'Among thousands of stars, a single point of light has moved.',
			},
		],
		tailSeconds: 1.2,
	},
	{
		id: 's02',
		chapter: null,
		lines: [{zh: '那个光点，就是冥王星。', en: 'That point of light is Pluto.'}],
		minSeconds: 8,
		tailSeconds: 4.5,
	},
	{
		id: 's03',
		chapter: {no: '02', zh: '命名', en: 'THE NAME'},
		lines: [
			{
				zh: '为它取名的，是英国牛津一个 11 岁的女孩。',
				en: 'It was named by an 11-year-old girl in Oxford, England.',
			},
			{
				zh: '她觉得，这么遥远、寒冷又黑暗的地方，应该属于冥界之神。',
				en: 'A place so distant, cold and dark, she felt, belonged to the god of the underworld.',
			},
			{
				zh: '而 Pluto 的前两个字母，恰好是天文台创始人洛厄尔的缩写。',
				en: "And its first two letters were the initials of Percival Lowell, the observatory's founder.",
			},
		],
		tailSeconds: 1.6,
	},
	{
		id: 's04',
		chapter: {no: '03', zh: '尺度', en: 'SCALE'},
		lines: [
			{zh: '可它比所有人想象的都要小。', en: 'But it was smaller than anyone imagined.'},
			{
				zh: '直径只有 2377 公里，还不到月球的七成。',
				en: 'Just 2,377 km across: less than 70% of our Moon.',
			},
			{zh: '质量，只有地球的 0.2%。', en: "Its mass: about 0.2% of Earth's."},
		],
		tailSeconds: 1.6,
	},
	{
		id: 's05',
		chapter: {no: '04', zh: '距离', en: 'DISTANCE'},
		lines: [
			{zh: '它离太阳，平均 59 亿公里。', en: 'On average, it lies 5.9 billion km from the Sun.'},
			{zh: '阳光要走五个半小时，才能抵达那里。', en: 'Sunlight needs five and a half hours to get there.'},
			{
				zh: '冥王星正午的阳光，只有地球的一千六百分之一，就像地球上日落后的黄昏。',
				en: "Noon on Pluto gets 1/1600 of Earth's sunlight, like dusk just after sunset.",
			},
		],
		tailSeconds: 1.4,
	},
	{
		id: 's06',
		chapter: {no: '05', zh: '轨道', en: 'ORBIT'},
		lines: [
			{zh: '它绕太阳一圈，要 248 年。', en: 'One trip around the Sun takes 248 years.'},
			{
				zh: '从被发现到今天，它还没走完一圈的四成。',
				en: 'Since it was found, it has not yet covered 40% of one orbit.',
			},
			{
				zh: '它的轨道又扁又斜，有二十年，它甚至比海王星离太阳更近。',
				en: 'Its orbit is stretched and tilted. For twenty years, it was even closer to the Sun than Neptune.',
			},
			{
				zh: '但它们永远不会相撞：海王星每绕三圈，冥王星恰好绕两圈。',
				en: 'Yet they never collide: for every three laps of Neptune, Pluto makes exactly two.',
			},
		],
		tailSeconds: 2,
	},
	{
		id: 's07',
		chapter: {no: '06', zh: '远征', en: 'THE VOYAGE'},
		lines: [
			{
				zh: '此后八十多年，人类始终没能看清它的样子。',
				en: 'For more than eighty years, no one could see what it really looked like.',
			},
			{zh: '2006 年 1 月，新视野号出发了。', en: 'In January 2006, New Horizons set off.'},
			{zh: '它飞了九年半，跨越近 50 亿公里，', en: 'It flew for nine and a half years, nearly 5 billion km,'},
			{zh: '只为一次擦肩而过。', en: 'for one brief encounter.'},
		],
		tailSeconds: 1.2,
	},
	{
		id: 's08',
		chapter: {no: '07', zh: '心', en: 'THE HEART'},
		lines: [
			{zh: '2015 年 7 月 14 日，它从冥王星身旁掠过。', en: 'On July 14, 2015, it swept past Pluto.'},
			{
				zh: '照片传回地球，人们看见了一颗巨大的心。',
				en: 'When the pictures reached Earth, we saw a giant heart.',
			},
		],
		minSeconds: 10,
		tailSeconds: 3,
	},
	{
		id: 's09',
		chapter: {no: '08', zh: '冰川', en: 'GLACIER'},
		lines: [
			{
				zh: '这颗心的左半边，是一片比法国还大的氮冰冰川。',
				en: 'Its left lobe is a glacier of nitrogen ice, larger than France.',
			},
			{
				zh: '冰面下的热量让它缓缓翻涌，把表面切成一块块多边形。',
				en: 'Heat from below keeps it slowly churning, cutting the surface into polygons.',
			},
			{
				zh: '这里找不到一个陨石坑，它可能还不到一千万岁。',
				en: 'There is not a single crater. It may be less than ten million years old.',
			},
			{
				zh: '在它的边缘，坚硬如岩石的水冰，堆成了数千米高的山。',
				en: 'At its edge, water ice as hard as rock is piled into mountains kilometres high.',
			},
		],
		tailSeconds: 1.4,
	},
	{
		id: 's10',
		chapter: {no: '09', zh: '薄雾', en: 'BLUE HAZE'},
		lines: [
			{zh: '离开时，新视野号回头望了一眼。', en: 'As it left, New Horizons looked back.'},
			{zh: '冥王星的背后，亮起了一圈淡蓝色的薄雾。', en: 'Behind Pluto, a thin ring of blue haze lit up.'},
			{zh: '那是它稀薄的大气，被远方的太阳照亮。', en: 'Its fragile atmosphere, backlit by the faraway Sun.'},
		],
		tailSeconds: 2,
	},
	{
		id: 's11',
		chapter: {no: '10', zh: '卡戎', en: 'CHARON'},
		lines: [
			{
				zh: '冥王星有五颗卫星，最大的卡戎，直径超过它的一半。',
				en: 'Pluto has five moons. The largest, Charon, is more than half its width.',
			},
			{zh: '它们彼此锁定，永远以同一面相对。', en: 'The two are locked, forever facing each other with the same side.'},
			{
				zh: '在冥王星的半边天空里，卡戎一动不动，永不落下。',
				en: "Over one half of Pluto, Charon hangs motionless in the sky. It never sets.",
			},
		],
		tailSeconds: 1.8,
	},
	{
		id: 's12',
		chapter: {no: '11', zh: '除名', en: 'THE VERDICT'},
		lines: [
			{zh: '2006 年 8 月，布拉格。', en: 'August 2006. Prague.'},
			{
				zh: '国际天文学联合会投票决定：行星必须清空自己轨道附近的区域。',
				en: 'The International Astronomical Union voted: a planet must clear the neighbourhood around its orbit.',
			},
			{
				zh: '而冥王星身处柯伊伯带，周围还有无数冰冷的天体。',
				en: 'But Pluto lives in the Kuiper Belt, among countless icy bodies.',
			},
			{zh: '它从第九大行星，变成了一颗矮行星。', en: 'It went from the ninth planet to a dwarf planet.'},
			{zh: '那时，新视野号已经出发七个月了。', en: 'By then, New Horizons had been on its way for seven months.'},
		],
		tailSeconds: 1.6,
	},
	{
		id: 's13',
		chapter: {no: '12', zh: '尾声', en: 'EPILOGUE'},
		lines: [
			{zh: '冥王星不在乎这些。', en: 'Pluto does not care.'},
			{
				zh: '它仍在 59 亿公里外，慢慢走着那条 248 年的路。',
				en: 'Still 5.9 billion km away, it walks its 248-year road.',
			},
			{zh: '新视野号上，载着一小撮汤博的骨灰。', en: "Aboard New Horizons is a small portion of Clyde Tombaugh's ashes."},
			{zh: '发现它的人，最后也去了那里。', en: 'The man who found it went there, in the end.'},
		],
		tailSeconds: 9,
	},
];
