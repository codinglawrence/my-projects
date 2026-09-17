import {
  CompassDirection,
  TrigramName,
  FamilyRole,
  RoomFunction,
  PalaceCell,
  YangZhaiDiagnosis,
} from "../types/tianji";

export const COMPASS_DIRECTIONS: {
  direction: CompassDirection;
  trigram: TrigramName;
  nameZh: string;
  defaultRole: string;
  element: string;
  defaultRoleKey: FamilyRole;
}[] = [
  { direction: "NW", trigram: "乾", nameZh: "西北方 (乾位)", defaultRole: "父亲 / 一家之主", element: "金", defaultRoleKey: "father" },
  { direction: "N",  trigram: "坎", nameZh: "正北方 (坎位)", defaultRole: "次男 / 中男", element: "水", defaultRoleKey: "son_middle" },
  { direction: "NE", trigram: "艮", nameZh: "东北方 (艮位)", defaultRole: "少男 / 三子", element: "土", defaultRoleKey: "son_youngest" },
  { direction: "W",  trigram: "兑", nameZh: "正西方 (兑位)", defaultRole: "少女 / 三女", element: "金", defaultRoleKey: "daughter_youngest" },
  { direction: "C",  trigram: "中", nameZh: "中央 (中宫太极)", defaultRole: "全家枢纽 / 太极之所", element: "土", defaultRoleKey: "empty" },
  { direction: "E",  trigram: "震", nameZh: "正东方 (震位)", defaultRole: "长男 (长子开拓位)", element: "木", defaultRoleKey: "son_eldest" },
  { direction: "SW", trigram: "坤", nameZh: "西南方 (坤位)", defaultRole: "母亲 / 女主人", element: "土", defaultRoleKey: "mother" },
  { direction: "S",  trigram: "离", nameZh: "正南方 (离位)", defaultRole: "次女 / 中女", element: "火", defaultRoleKey: "daughter_middle" },
  { direction: "SE", trigram: "巽", nameZh: "东南方 (巽位)", defaultRole: "长女 (长女文昌位)", element: "木", defaultRoleKey: "daughter_eldest" },
];

export const ROLE_NAMES: Record<FamilyRole, string> = {
  father: "父亲 (一家之主/乾)",
  mother: "母亲 (女主人/坤)",
  son_eldest: "长男 (长子/震)",
  son_middle: "次男 (中男/坎)",
  son_youngest: "少男 (三子/艮)",
  daughter_eldest: "长女 (长女/巽)",
  daughter_middle: "次女 (中女/离)",
  daughter_youngest: "少女 (三女/兑)",
  empty: "未设定/空置",
};

export const ROLE_TRIGRAM_MAP: Record<FamilyRole, TrigramName> = {
  father: "乾",
  mother: "坤",
  son_eldest: "震",
  son_middle: "坎",
  son_youngest: "艮",
  daughter_eldest: "巽",
  daughter_middle: "离",
  daughter_youngest: "兑",
  empty: "中",
};

export const ROOM_NAMES: Record<RoomFunction, string> = {
  master_bedroom: "主卧 (夫妻房)",
  eldest_son_room: "长子卧室",
  middle_son_room: "次子卧室",
  youngest_son_room: "少男卧室",
  eldest_daughter_room: "长女卧室",
  middle_daughter_room: "次女卧室",
  youngest_daughter_room: "少女卧室",
  kitchen: "厨房 (火之源)",
  bathroom: "卫生间 (水污之所)",
  front_door: "入户大门 (气口)",
  study: "书房/办公室 (文昌)",
  living_room: "客厅/明堂",
  storage: "储藏室",
  balcony: "阳台/景观台",
};

// 《地脉道》64卦阳宅全真卦象断语结构
export interface YangzhaiHexagramInfo {
  hexagramName: string;
  role: FamilyRole;
  direction: CompassDirection;
  upperTrigram: TrigramName; // 居住方位为内卦还是外卦
  lowerTrigram: TrigramName;
  status: "auspicious" | "neutral" | "warning" | "danger";
  summary: string;
  careerDetail: string;
  marriageDetail: string;
  healthDetail: string;
  specialZodiacSign: string; // 生肖克应
  timeDiffVsPeers: string; // 比同时生人早/晚婚、早成
  remedyAction: string; // 倪师化解之道
}

// 阳宅64卦速查数据库（涵盖《地脉道》全书真传断语）
export const YANGZHAI_64_DATABASE: Record<string, YangzhaiHexagramInfo> = {
  "father_NW": {
    hexagramName: "乾为天",
    role: "father",
    direction: "NW",
    upperTrigram: "乾",
    lowerTrigram: "乾",
    status: "auspicious",
    summary: "正位得配，刚健纯粹。官人连升三级，商人财多禄丰，坚持到底必有大成。",
    careerDetail: "官人逢之举步青云，心想事成，往往越级晋升；商人逢之为大老板，领导统御乃天生好手，当机立断。",
    marriageDetail: "对家庭有强烈责任感，良好丈夫与贤能父亲。婚后居此坚守到底大吉。",
    healthDetail: "身心刚健，百病难侵。",
    specialZodiacSign: "无特别生肖相克，全吉。",
    timeDiffVsPeers: "始终如一，事业腾飞比同侪提早5至10年立足巅峰。",
    remedyAction: "本位已至善至吉，切莫轻易搬动或让出西北主位。"
  },
  "mother_SW": {
    hexagramName: "坤为地",
    role: "mother",
    direction: "SW",
    upperTrigram: "坤",
    lowerTrigram: "坤",
    status: "neutral",
    summary: "地厚载物，女强人当家。官家掌权，商人赚钱易如反掌，但婚姻主破散，老来孤单。",
    careerDetail: "女中强人型，其志过丈夫，商人赚钱轻而易举，公司行号必须用女主人正名方可成大器。",
    marriageDetail: "婚姻主破散，孤军奋战，夫宫不得志。婚破后不再有正式婚姻，老来归向宗教行善。",
    healthDetail: "身体操劳，易因孤寂成疾。",
    specialZodiacSign: "无特定生肖克应。",
    timeDiffVsPeers: "财运起步极快，但婚姻与同侪相比多半在中年独立持家。",
    remedyAction: "若要保全婚姻夫妻和睦，宜同移居西北乾位成【地天泰】大吉卦；若已单身则安心居此成就大业。"
  },
  "son_middle_E": {
    hexagramName: "水雷屯",
    role: "son_middle",
    direction: "E",
    upperTrigram: "坎",
    lowerTrigram: "震",
    status: "warning",
    summary: "次子越位，才智胜长兄。家族交替时父必立次子继承，但肖狗、肖牛人主凶不利。",
    careerDetail: "次子之事业才智超越长兄，在家族企业中常获父亲青睐执掌大权。",
    marriageDetail: "比长子早婚，比同时出生之人提早二年结婚。",
    healthDetail: "肖狗、狄姓人氏逢犬年主夭折大凶；肖牛人任妻摆布背离家庭。",
    specialZodiacSign: "肖狗（戌）、肖牛（丑）大凶，其余生肖无大碍。",
    timeDiffVsPeers: "早婚二年，创业提早越级。",
    remedyAction: "长子若未婚，次子切忌霸占正东震位；宜移至正北坎位或东北艮位恢复长幼有序。"
  },
  "son_youngest_N": {
    hexagramName: "山水蒙",
    role: "son_youngest",
    direction: "N",
    upperTrigram: "艮",
    lowerTrigram: "坎",
    status: "danger",
    summary: "蒙蔽欺瞒，惟利是图。性刚不听兄言，早婚7年，求财常走险赌博。",
    careerDetail: "愚昧不知进退，好赌博性求财，往往求财遇险，事业坎坷。",
    marriageDetail: "比同时生人提早七年早婚，较次子早婚，较长子晚婚。",
    healthDetail: "易因行险遭外伤或官非牢狱。",
    specialZodiacSign: "无特定生肖克应。",
    timeDiffVsPeers: "早婚七年，但心智未开。",
    remedyAction: "必须及早换房至东北艮位（艮为山）以养正开智，令其想通立志方可成器。"
  },
  "son_middle_NW": {
    hexagramName: "水天需",
    role: "son_middle",
    direction: "NW",
    upperTrigram: "坎",
    lowerTrigram: "乾",
    status: "auspicious",
    summary: "智慧飞速超越同辈，刚烈年少居权位。长兄结婚立转雷天大壮，婚延7年娶二婚妻。",
    careerDetail: "年少居权位，受大人物重用，智慧成长迅速，进退有据。",
    marriageDetail: "婚事延后七年，逢单岁婚，妻多为离异改嫁之人；若八字喜庆逢凶则不婚入道。",
    healthDetail: "精力充沛，但性格过于刚强不纳建言。",
    specialZodiacSign: "无特定生肖克应。",
    timeDiffVsPeers: "事业早成10年，婚姻推迟7年。",
    remedyAction: "长兄一旦结婚，此局立消转为雷天大壮，需注意婚姻晚成之常态，安心立业。"
  },
  "father_N": {
    hexagramName: "天水讼",
    role: "father",
    direction: "N",
    upperTrigram: "乾",
    lowerTrigram: "坎",
    status: "danger",
    summary: "官司缠身，诉讼纷扰。官人升官慢5年，商人财禄不进需兴讼，夫妻官非离婚。",
    careerDetail: "官人升迁受阻拖延五年，常受他人连累牵连；商人财禄不进，非经诉讼官非不得财。",
    marriageDetail: "夫妻婚姻主破裂，甚至对簿公堂闹上法庭。",
    healthDetail: "神经衰弱，泌尿系统暗疾。",
    specialZodiacSign: "无特定生肖克应。",
    timeDiffVsPeers: "升职慢五年，官非无妄之灾多。",
    remedyAction: "立刻搬离正北坎位，迁回西北乾位（乾为天）或西南坤位（地天泰）以解官非！"
  },
  "mother_N": {
    hexagramName: "地水师",
    role: "mother",
    direction: "N",
    upperTrigram: "坤",
    lowerTrigram: "坎",
    status: "warning",
    summary: "女人性刚暴烈，泼妇骂街妻殴夫。男命女身胆大过人，从商得财利肖虎马羊，但婚必凶。",
    careerDetail: "独来独往胆大过人，从商主得财利，尤利肖虎、马、羊之人商机官运通达。",
    marriageDetail: "婚姻必凶，有妻殴夫反目之象。",
    healthDetail: "肝火过盛，妇科疾患。",
    specialZodiacSign: "大利肖虎（寅）、肖马（午）、肖羊（未）之人从商，但婚姻皆不利。",
    timeDiffVsPeers: "财运起色快但婚姻破碎极早。",
    remedyAction: "必须移出正北坎位，迁入西南坤位或西北乾位以柔顺坤德化解暴戾。"
  },
  "son_middle_SW": {
    hexagramName: "水地比",
    role: "son_middle",
    direction: "SW",
    upperTrigram: "坎",
    lowerTrigram: "坤",
    status: "neutral",
    summary: "与母连心从母事，居佐才难为大老板。晚婚三年娶年长之妻，兄婚后转雷地豫。",
    careerDetail: "任劳任怨家事一手包办，事业居副手佐才之位，无法胜任正职一把手或老板。",
    marriageDetail: "喜娶比自己年长之女人，比同时生人延后三年（如28岁运延至31岁），娶年长女方合。",
    healthDetail: "脾湿胃弱。",
    specialZodiacSign: "无特定生肖克应。",
    timeDiffVsPeers: "晚婚三年。",
    remedyAction: "若想次子有雄心霸气担任一把手，应调换至正东震位或东北艮位。"
  },
  "daughter_eldest_NW": {
    hexagramName: "风天小畜",
    role: "daughter_eldest",
    direction: "NW",
    upperTrigram: "巽",
    lowerTrigram: "乾",
    status: "auspicious",
    summary: "女代父职女强人，能力强过男人。早年当老板，终身不嫁或早婚2年独撑大局，利羊马。",
    careerDetail: "事业企图心旺盛，早年自立门户当老板，独立自主不依赖他人，独撑大局。",
    marriageDetail: "婚事若命中顺畅则提早二年结婚，若命中带凶则终身不嫁，全心投入事业。",
    healthDetail: "头风操劳，呼吸系统虚弱。",
    specialZodiacSign: "大利肖羊（未）、肖马（午）之人。",
    timeDiffVsPeers: "早婚二年或终身不嫁独成女富豪。",
    remedyAction: "若长女追求美满婚姻想早嫁贵夫，移回东南巽位（巽为风）即可顺利引动红鸾！"
  },
  "father_W": {
    hexagramName: "天泽履",
    role: "father",
    direction: "W",
    upperTrigram: "乾",
    lowerTrigram: "兑",
    status: "warning",
    summary: "进退两难如履虎尾。官运停滞，商机丧失，妻能力过己而在外娶妾以求自尊，婚必凶破。",
    careerDetail: "事业进退维谷，欲进不得退之又凶；官运停滞，商机错失而懊恼无补。",
    marriageDetail: "妻子能力强过自己，丈夫易在外面纳妾找心理平衡，婚姻主破散无救。",
    healthDetail: "肺燥咽喉不适，胸闷叹气。",
    specialZodiacSign: "无特定生肖克应。",
    timeDiffVsPeers: "事业错失关键五年，婚姻严重破裂。",
    remedyAction: "坚决搬出正西少女位，重返西北乾位重树天威！"
  },
  "mother_NW": {
    hexagramName: "地天泰",
    role: "mother",
    direction: "NW",
    upperTrigram: "坤",
    lowerTrigram: "乾",
    status: "auspicious",
    summary: "【天纪第一吉局】天地交泰万物生。一世夫妻白首到老，贤妻良母，心想事成，福厚无病！",
    careerDetail: "公事进退有据，受人重用，相夫教子与职场事业皆大获全胜，财禄丰隆。",
    marriageDetail: "主一世夫妻，白首到老，琴瑟和鸣，恩爱终身。",
    healthDetail: "一生无大病痛，平安到老，福泽深厚。",
    specialZodiacSign: "全吉，无任何生肖忌讳。",
    timeDiffVsPeers: "各方面均领先同侪一步，事事顺遂圆满。",
    remedyAction: "绝佳格局！倪师极力推荐所有已婚妇女居此西北乾位主卧（地天泰），大功德！"
  },
  "father_SW": {
    hexagramName: "天地否",
    role: "father",
    direction: "SW",
    upperTrigram: "乾",
    lowerTrigram: "坤",
    status: "danger",
    summary: "【极凶大忌】天地隔绝否塞不通。夫妻反目成仇，官人降职退休，商人败绝家散，大病缠身！",
    careerDetail: "官家之人否塞不通无所作为，招惹凶祸提前退休；商人居之必生大耗，财耗家散一败涂地。",
    marriageDetail: "婚姻大凶，夫妻反目成仇，加上八字主破则必离无疑。",
    healthDetail: "大病缠身，若流年逢羊刃七杀必见血光手术大难。",
    specialZodiacSign: "无特别生肖免克，全凶。",
    timeDiffVsPeers: "运势全方位跌入谷底，事业家庭双双受创。",
    remedyAction: "【生死攸关】：必须在24小时内搬出西南坤位，换至西北乾位，立解否塞之厄！"
  },
  "father_S": {
    hexagramName: "天火同人",
    role: "father",
    direction: "S",
    upperTrigram: "乾",
    lowerTrigram: "离",
    status: "auspicious",
    summary: "天下大同，贵人人和。官人平步青云禄命重来，商人合伙大发，但妻成明夷暗伤血光。",
    careerDetail: "官人得民心手下得力，禄命九重来平步青云；商人须二人合伙方能大成，自由服务业名扬天下。",
    marriageDetail: "丈夫事业如日中天，但妻子暗伤血光连年，病痛不断。",
    healthDetail: "对妻子健康极其不利（妻成地火明夷卦），妻需防血光手术。",
    specialZodiacSign: "无特定生肖克应。",
    timeDiffVsPeers: "事业大发，但家庭内需分担妻子病痛。",
    remedyAction: "若妻子身体欠佳，宜将主卧从正南离位迁至西北乾位或西南坤位以保妻康泰。"
  },
  "daughter_middle_NW": {
    hexagramName: "火天大有",
    role: "daughter_middle",
    direction: "NW",
    upperTrigram: "离",
    lowerTrigram: "乾",
    status: "auspicious",
    summary: "日丽中天娇美如花，事业功成名就。不重婚姻有未婚生子之象（得二子），肖犬大吉！",
    careerDetail: "性格阳刚倔强，功成名就女总裁，祖业大家庭中女承父业，兄弟无力。",
    marriageDetail: "不在乎婚姻，未婚生子抚养二子；若命中婚顺则比同侪提早三年成婚；肖犬人大吉生双胞胎。",
    healthDetail: "心火偏亢，注意睡眠与血压。",
    specialZodiacSign: "肖犬（戌）之小姐居此大吉大利，智慧超群，婚吉业顺，双生二子。",
    timeDiffVsPeers: "早三年成婚或未婚创业成巨富。",
    remedyAction: "若为未婚中女且追求独当一面事业，居此大吉；若想按传统成婚宜住正南或东南。"
  },
  "mother_NE": {
    hexagramName: "地山谦",
    role: "mother",
    direction: "NE",
    upperTrigram: "坤",
    lowerTrigram: "艮",
    status: "neutral",
    summary: "劳谦君子任劳任怨。贤妻良母但夫感情退化，小病不断，有民选官国会殿堂之象。",
    careerDetail: "官人遇事公正一尘不染，商人得财但防股东分利不均；政界常有参选民选官、居国会殿堂倾向。",
    marriageDetail: "尽心尽力为家操劳，但丈夫成遯卦感情退化冷淡，65岁后不成此局。",
    healthDetail: "因劳成疾，小病痛不断。",
    specialZodiacSign: "无特定生肖克应。",
    timeDiffVsPeers: "从政民选优势明显，但家庭操心过多。",
    remedyAction: "宜将主卧迁至西北乾位成【地天泰】，使夫妻重归同心同德。"
  },
  "son_eldest_SW": {
    hexagramName: "雷地豫",
    role: "son_eldest",
    direction: "SW",
    upperTrigram: "震",
    lowerTrigram: "坤",
    status: "neutral",
    summary: "因禄远行利肖马，家务巨细靡遗一手好菜。财官双美但母先丧，晚婚五年娶年长女。",
    careerDetail: "财官双美平步青云，事业为极佳之辅佐良臣，老板任用必得大幸，常因公差远行他乡。",
    marriageDetail: "婚姻延后五年，常娶二婚之妻或年长于己之女子。",
    healthDetail: "母亲有先丧之虞，自身脾胃易虚。",
    specialZodiacSign: "大利肖马（午）之人。",
    timeDiffVsPeers: "晚婚五年，六亲缘分稍薄远行发展。",
    remedyAction: "长男若想自主当老板创业，应从西南坤位迁回正东震位（震为雷）或西北乾位（天雷无妄）。"
  },
  "daughter_youngest_E": {
    hexagramName: "泽雷随",
    role: "daughter_youngest",
    direction: "E",
    upperTrigram: "兑",
    lowerTrigram: "震",
    status: "warning",
    summary: "女扮男装女同倾向，不屑周遭男人。事业不择手段居董事长身侧，早婚4年嫁豪门，【巽风可解】。",
    careerDetail: "全心扑在事业上，为达目的不择手段，身居高位常在天子或董事长身边担任核心要职。",
    marriageDetail: "女扮男装或性喜女子；若命中婚姻吉祥则早婚四年嫁入豪门世家（对方若不富终必散）。",
    healthDetail: "肝气郁结，情绪波动大。",
    specialZodiacSign: "无特定生肖克应。",
    timeDiffVsPeers: "早婚四年或独身从同性倾向。",
    remedyAction: "【天纪真传秘法】：若命中婚姻凶险，必须立刻迁入东南巽位（巽为风）即可彻底解开此局祸端！"
  },
  "son_youngest_SE": {
    hexagramName: "山风蛊",
    role: "son_youngest",
    direction: "SE",
    upperTrigram: "艮",
    lowerTrigram: "巽",
    status: "neutral",
    summary: "野心极大图利求成，发科甲读书超群。早婚4年兄未娶己先娶，男人图利在心中。",
    careerDetail: "图利野心极大，读书考试成绩超群绝伦、金榜题名，商场竞争手段多端。",
    marriageDetail: "早婚之象，比同侪提前四年结婚，且两位兄长未娶而自己先娶。",
    healthDetail: "神经系统紧绷，易有隐疾。",
    specialZodiacSign: "无特定生肖克应。",
    timeDiffVsPeers: "早婚四年，读书科甲极早折桂。",
    remedyAction: "引导其将野心转化为正道经商与治学，若心术不正宜换至东北艮位修德。"
  },
  "mother_W": {
    hexagramName: "地泽临",
    role: "mother",
    direction: "W",
    upperTrigram: "坤",
    lowerTrigram: "兑",
    status: "warning",
    summary: "母权过大子女反弹，夫业受困。母亲全包烦忧，肖虎婚破但事业力争上游成就非凡。",
    careerDetail: "母亲凡事一手包办，权柄过重导致子女反叛；肖虎之人居此婚破但事业拔尖成就非凡。",
    marriageDetail: "夫业受困，丈夫委靡不振，婚姻危机；肖虎人婚姻凶主破裂。",
    healthDetail: "因过度焦虑操心致肺气与肠胃受损。",
    specialZodiacSign: "肖虎（寅）之人居此婚必破，但事业成就非凡。",
    timeDiffVsPeers: "操心过度致使家道风波提前来临。",
    remedyAction: "母亲宜退居西北乾位（地天泰）或西南坤位，放手给丈夫和子女空间。"
  },
  "daughter_eldest_SW": {
    hexagramName: "风地观",
    role: "daughter_eldest",
    direction: "SW",
    upperTrigram: "巽",
    lowerTrigram: "坤",
    status: "neutral",
    summary: "以财论婚宁为偏房，长女代母职。过明则无徒，嫁二婚有子之夫延后6年，僧道命终身不嫁。",
    careerDetail: "未婚前长女代母职掌管一家大小，有姐如母；洞察力过人但水清无鱼。",
    marriageDetail: "以男方财富决定是否出嫁，宁为富豪偏房；或嫁二婚带子之人晚婚六年；僧道命终身不嫁。",
    healthDetail: "体质偏虚寒。",
    specialZodiacSign: "无特定生肖克应。",
    timeDiffVsPeers: "婚事延后六年。",
    remedyAction: "若欲摆脱偏房或迟婚宿命，将长女卧室迁回东南巽位（巽为风）促成正缘。"
  },
  "daughter_middle_E": {
    hexagramName: "火雷噬嗑",
    role: "daughter_middle",
    direction: "E",
    upperTrigram: "离",
    lowerTrigram: "震",
    status: "warning",
    summary: "性刚争胜少年得志，影剧名气大。嫁阴柔男晚婚6年，肖鸡坐吃山空，需与寡母同住。",
    careerDetail: "想法动作如同男子，少年得志，年轻影剧艺术界名气极大，但肖鸡女性逢之必坐吃山空。",
    marriageDetail: "婚配阴柔温顺之男，婚事延后六年（如26岁延至32岁）；常见未婚妾或离婚女与寡母同住居此。",
    healthDetail: "易咬人争吵，心火攻肝。",
    specialZodiacSign: "肖鸡（酉）女性逢之必坐吃山空破耗大凶。",
    timeDiffVsPeers: "晚婚六年，少年成名极快。",
    remedyAction: "中女宜搬至正南离位（离为火）或东南巽位（火风鼎）以修身得良缘。"
  },
  "son_youngest_S": {
    hexagramName: "山火贲",
    role: "son_youngest",
    direction: "S",
    upperTrigram: "艮",
    lowerTrigram: "离",
    status: "neutral",
    summary: "男身女态爱慕外饰，利科甲考试。好动易怒，30岁后婚恋进退失据，多见空服影剧圈。",
    careerDetail: "利科甲声名与各类考试，多见空乘、艺人、服装设计人员；个性好动不耐静守。",
    marriageDetail: "男身女态喜夸张服饰，婚姻延后，三十岁后进退失据难以成家。",
    healthDetail: "心浮气躁，注意眼目与神经系统。",
    specialZodiacSign: "无特定生肖克应。",
    timeDiffVsPeers: "考试提早中榜，婚姻推迟至30岁后。",
    remedyAction: "若要少男沉稳立志早日成家，迁回东北艮位（艮为山）以达笃实纯厚。"
  },
  "son_youngest_SW": {
    hexagramName: "山地剥",
    role: "son_youngest",
    direction: "SW",
    upperTrigram: "艮",
    lowerTrigram: "坤",
    status: "danger",
    summary: "【极度大凶】耗破家业伦理丧失。性毒暗生害人不知，婚不成科甲必败，病多折寿！",
    careerDetail: "败家子之局！出此一子必散尽家财乃至引发杀戮；科甲不顺，考试必败，家道中落。",
    marriageDetail: "婚事不成，即使流年逢红鸾吉星亦无法成婚，伤风败俗。",
    healthDetail: "身体灾病多，折损阳寿，大凶之象。",
    specialZodiacSign: "全凶，老幼皆受其害。",
    timeDiffVsPeers: "全面败退破耗，凶险莫测。",
    remedyAction: "【必须极尽人事破坏此局】：立刻将少男迁出西南坤位，移居东北艮位或正北，免招破门大祸！"
  },
  "mother_E": {
    hexagramName: "地雷复",
    role: "mother",
    direction: "E",
    upperTrigram: "坤",
    lowerTrigram: "震",
    status: "auspicious",
    summary: "花木兰代夫出征，独立撑家运。利武官军警法外交（肖虎兔大吉），夫妻不和夫涉讼。",
    careerDetail: "已婚妇女婚事不佳但独立支撑家运，允文允武，利发武官（军警法外交），发官不发商，肖虎兔人大旺。",
    marriageDetail: "夫成无妄卦夫妻必不和，妻志过夫，夫无法匹配且夫有官司是非缠身。",
    healthDetail: "劳碌身心，肝血偏虚。",
    specialZodiacSign: "肖虎（寅）、肖兔（卯）之人大吉大旺。",
    timeDiffVsPeers: "事业仕途女强人，婚姻坎坷孤独。",
    remedyAction: "若想缓和夫妻关系，宜调至西北乾位（地天泰）重归和谐。"
  },
  "father_E": {
    hexagramName: "天雷无妄",
    role: "father",
    direction: "E",
    upperTrigram: "乾",
    lowerTrigram: "震",
    status: "neutral",
    summary: "从商吉防阴人暗客得财遇险（肖猪鼠大财有阴谋）。公职走险，性刚固执，须防子灾长子失位。",
    careerDetail: "从商较吉但须防小人暗算陷阱，肖猪肖鼠人得大财但暗藏阴谋；公职人易铤而走险求利。",
    marriageDetail: "性刚固执不听劝告，住满第二年若不动必见求财凶险；夫妻关系紧张。",
    healthDetail: "防长子夭折或叛逆，因占长子位导致长子无位受克。",
    specialZodiacSign: "肖猪（亥）、肖鼠（子）人得大财，但皆有阴谋陷阱在其中。",
    timeDiffVsPeers: "财来得快险亦随之，住满两年必见波折。",
    remedyAction: "父亲搬回西北乾位，将正东还给长子，长幼各安其位，子灾自解。"
  },
  "son_youngest_NW": {
    hexagramName: "山天大畜",
    role: "son_youngest",
    direction: "NW",
    upperTrigram: "艮",
    lowerTrigram: "乾",
    status: "neutral",
    summary: "代父职守负担生计，极度节俭积蓄多。婚不足三月破（早婚2年），公职受困积案如山。",
    careerDetail: "代父职守负担全家生计，极度节俭绝不浪费奢侈品；不利公职，常被琐碎公文堆积如山所困。",
    marriageDetail: "婚姻短促，常不足三月而破裂离异；比同侪提前二年结婚，婚后难以容忍配偶消费习惯。",
    healthDetail: "长期操劳节俭，身体紧绷。",
    specialZodiacSign: "无特定生肖克应。",
    timeDiffVsPeers: "早婚二年但短命婚姻，聚财极丰。",
    remedyAction: "少男宜居东北艮位，避免过早背负全家生计而牺牲个人婚恋幸福。"
  },
  "son_youngest_E": {
    hexagramName: "山雷颐",
    role: "son_youngest",
    direction: "E",
    upperTrigram: "艮",
    lowerTrigram: "震",
    status: "auspicious",
    summary: "少年得志早来兴发，体魄健朗化病解厄。早婚5年，多见同父异母之子居此。",
    careerDetail: "少年得志早来兴发之象，才思敏捷，自然吸纳天地精华为己所用。",
    marriageDetail: "婚姻比同侪提前五年结婚，早婚倾向明显。",
    healthDetail: "身体健康平安！同侪中若身体差者，居此局可自然大幅改善体质化解病痛。",
    specialZodiacSign: "同父异母之人多自然居于此局中。",
    timeDiffVsPeers: "早婚五年，早发五年。",
    remedyAction: "极佳之养生健体方位，体弱多病之青年居之立竿见影！"
  },
  "daughter_youngest_SE": {
    hexagramName: "泽风大过",
    role: "daughter_youngest",
    direction: "SE",
    upperTrigram: "兑",
    lowerTrigram: "巽",
    status: "auspicious",
    summary: "小妹最早嫁且嫁最好豪门世家（早婚3年嫁长十岁夫）。性过刚，不可配同龄人。",
    careerDetail: "身进豪门世家，享尽荣华富贵；性情过刚任意而为，婚前婚后皆然。",
    marriageDetail: "比同时生人早婚三年，嫁夫往往年长十岁以上；若与同龄男子成婚则必主凶破。",
    healthDetail: "肺燥木受克，防咳嗽牙痛。",
    specialZodiacSign: "配年长夫君大吉，忌同龄配偶。",
    timeDiffVsPeers: "早婚三年入豪门。",
    remedyAction: "适婚少女居此极佳，但择偶务必寻找成熟稳重年长之士。"
  },
  "son_middle_N": {
    hexagramName: "坎为水",
    role: "son_middle",
    direction: "N",
    upperTrigram: "坎",
    lowerTrigram: "坎",
    status: "danger",
    summary: "【重险之地】子嗜赌博毒品惊险刺激。常犯官司牢狱（肖牛虎吉肖鼠害母），【既济可解】！",
    careerDetail: "常犯官司牢狱之灾；喜冒险、赌博、毒品等惊险刺激，难以踏实工作。",
    marriageDetail: "婚姻比同侪延后二年，感情波折重重。",
    healthDetail: "水险溺水，肾脏泌尿疾患，嗜瘾伤身。",
    specialZodiacSign: "唯肖牛（丑）、肖虎（寅）人住吉；肖鼠（子）人住则暗中生害祸及母亲！",
    timeDiffVsPeers: "晚婚二年，频招官非。",
    remedyAction: "【天纪真传解法】：搬至正南离位成【水火既济】卦，立令其脱胎换骨、化险为夷！"
  },
  "daughter_middle_S": {
    hexagramName: "离为火",
    role: "daughter_middle",
    direction: "S",
    upperTrigram: "离",
    lowerTrigram: "离",
    status: "auspicious",
    summary: "中虚为明远行外地，28岁前必婚。天生明理不惧，不守财利，科甲必中第一志愿！",
    careerDetail: "天生明理知进退，科甲高中往往考取第一志愿；心在迁移外地发展，不恋本土。",
    marriageDetail: "命格若28岁婚，居此宅不出28岁必成婚；感情光明磊落。",
    healthDetail: "眼目明亮，心气旺盛。",
    specialZodiacSign: "无特定生肖克应，全吉。",
    timeDiffVsPeers: "按期或提前早婚，学业拔尖。",
    remedyAction: "绝佳之才女科甲吉位，保持正南采光通透即可大展宏图。"
  },
  "daughter_youngest_NE": {
    hexagramName: "泽山咸",
    role: "daughter_youngest",
    direction: "NE",
    upperTrigram: "兑",
    lowerTrigram: "艮",
    status: "neutral",
    summary: "媒妁成婚先成后破，嫁豪门单岁婚（早婚1年）。财禄顺利野心大，但科甲不兴。",
    careerDetail: "财禄事业顺畅，工作野心大，但科甲考试不兴旺；婚事成于媒妁之言非自由恋爱。",
    marriageDetail: "婚事先成后破有凶；配偶为豪门世家，比同侪早婚一年，逢单岁成婚。",
    healthDetail: "关节与肺部易有微疾。",
    specialZodiacSign: "无特定生肖克应。",
    timeDiffVsPeers: "早婚一年，单岁完婚。",
    remedyAction: "若欲自由恋爱美满长久，换至东南巽位（泽风大过或巽为风）更吉。"
  },
  "son_eldest_SE": {
    hexagramName: "雷风恒",
    role: "son_eldest",
    direction: "SE",
    upperTrigram: "震",
    lowerTrigram: "巽",
    status: "neutral",
    summary: "易信偏门宗教失去坚持，晚婚一年。智慧受压，肖鼠吉，官商不顺利教职自由业。",
    careerDetail: "官运不佳商场不顺，惟科甲旺，极利教师、学者、自由职业者；智慧易受压抑不知取舍。",
    marriageDetail: "比同时出生之人晚婚一年；易迷信非正道宗教信仰。",
    healthDetail: "下肢神经酸痛，情绪易纠结。",
    specialZodiacSign: "肖鼠（子）人居此有吉，阴谋不生。",
    timeDiffVsPeers: "晚婚一年，商场受阻。",
    remedyAction: "【化解局式】：迁往西南坤位成【雷地豫】卦，立见财官双美平步青云！"
  },
  "father_NE": {
    hexagramName: "天山遯",
    role: "father",
    direction: "NE",
    upperTrigram: "乾",
    lowerTrigram: "艮",
    status: "danger",
    summary: "一家之主唉声叹气中年无干劲，劳多功给他人。萌生退意仕途原地踏步，中年得老年病，离婚！",
    careerDetail: "该升不升萌生退意，工作付出汗水极多功劳全归他人，仕途原地踏步毫无进展。",
    marriageDetail: "夫妻感情退化冷漠，终致离婚分道扬镳。",
    healthDetail: "身体机能大幅退化，中年即患各种老年慢性病。",
    specialZodiacSign: "无特定生肖克应，全凶。",
    timeDiffVsPeers: "仕途停滞十年，事事回归原地重新出发。",
    remedyAction: "【急需改位】：必须迁回西北乾位（乾为天）重拾霸气干劲，恢复健朗！"
  },
  "son_eldest_NW": {
    hexagramName: "雷天大壮",
    role: "son_eldest",
    direction: "NW",
    upperTrigram: "震",
    lowerTrigram: "乾",
    status: "auspicious",
    summary: "性刚越居父位责任重，不婚（猴兔犬不足三月破）。自由业一方之主声名远播！",
    careerDetail: "性格刚强为一家之主，有越居父位之势；事业独立自主，自由职业者可为一方霸主名震八方。",
    marriageDetail: "多不婚；若有婚姻必配肖猴、肖兔、肖犬之人，但常常不足三个月即告婚破！",
    healthDetail: "肝火旺盛，注意防头胀高血压。",
    specialZodiacSign: "婚配唯猴（申）、兔（卯）、犬（戌）有可能成婚，但防三个月破裂。",
    timeDiffVsPeers: "事业早立十年，婚姻多独身掌权。",
    remedyAction: "若长子欲成家立业生儿育女，宜移至正东震位（震为雷）顺应红鸾动星。"
  },
  "daughter_middle_SW": {
    hexagramName: "火地晋",
    role: "daughter_middle",
    direction: "SW",
    upperTrigram: "离",
    lowerTrigram: "坤",
    status: "neutral",
    summary: "性柔有母爱守财极省，晚婚40岁后为偏房。若嫁肖鸡年长夫君则大吉！",
    careerDetail: "守财不花性格极度节俭，具备仁厚母爱与持家理财之功。",
    marriageDetail: "婚姻多晚成（四十岁以后），常为他人偏房；但若婚嫁对象属鸡（酉）且年长大许多者则大吉！",
    healthDetail: "胃脘冷痛，血气偏弱。",
    specialZodiacSign: "婚嫁对像若肖鸡（酉）年长者大吉大利。",
    timeDiffVsPeers: "晚婚至40岁后，或为偏房名分。",
    remedyAction: "中女若求正房早婚，迁入正南离位（离为火）或东南巽位（火风鼎）。"
  },
  "mother_S": {
    hexagramName: "地火明夷",
    role: "mother",
    direction: "S",
    upperTrigram: "坤",
    lowerTrigram: "离",
    status: "danger",
    summary: "【极凶大忌】母先亡生前血光连年！妻生隐疾破财小人暗害，唯肖虎平安，【急求变局】！",
    careerDetail: "破财且诸事不顺，易听信小人谗言而招致暗害陷害，损失惨重。",
    marriageDetail: "妻子生有难言隐疾，夫妻冷漠，婚姻凶险。",
    healthDetail: "大凶！主母亲先亡且生前血光手术连年，一旦见血光终致大凶；唯肖虎人可平安渡过。",
    specialZodiacSign: "唯肖虎（寅）之人可平安渡过，余者皆招血光破财大祸！",
    timeDiffVsPeers: "健康与家运遭受毁灭性打击。",
    remedyAction: "【无量阴德化解】：见此宅局必须力求变局，移出正南离位，迁入西北乾位成【地天泰】！"
  },
  "daughter_eldest_S": {
    hexagramName: "风火家人",
    role: "daughter_eldest",
    direction: "S",
    upperTrigram: "巽",
    lowerTrigram: "离",
    status: "neutral",
    summary: "科甲功名无虑家和顾家，从官无法升职。婚延5年，多妇人病。",
    careerDetail: "科甲功名无虑学业优异；但若从官职必无法升职晋升。",
    marriageDetail: "与家人相处极为和睦且非常顾家，婚事比同侪延后五年。",
    healthDetail: "易患妇科血热及内分泌相关妇人病。",
    specialZodiacSign: "无特定生肖克应。",
    timeDiffVsPeers: "晚婚五年，学业早成。",
    remedyAction: "若想长女早日升迁官位并喜结良缘，迁回东南巽位（巽为风）大吉。"
  },
  "daughter_middle_W": {
    hexagramName: "火泽睽",
    role: "daughter_middle",
    direction: "W",
    upperTrigram: "离",
    lowerTrigram: "兑",
    status: "danger",
    summary: "背离家人自私任性胡闹，肖牛鼠更凶。科甲不兴婚不成，官非灾祸，同性倾向。",
    careerDetail: "性刚僻倔强任性胡闹以致家宅难容，科甲不兴，事业动辄招惹官司是非灾祸连连。",
    marriageDetail: "婚姻不成，有同性恋倾向；肖牛、肖鼠之人见之更凶恶。",
    healthDetail: "心浮气躁，情绪极度不稳定。",
    specialZodiacSign: "肖牛（丑）、肖鼠（子）人见之大凶！",
    timeDiffVsPeers: "诸事难成，处处与家人社会抵触。",
    remedyAction: "立刻搬离正西兑位，换至东南巽位（火风鼎）或正南离位化除叛逆戾气！"
  },
  "son_middle_NE": {
    hexagramName: "水山蹇",
    role: "son_middle",
    direction: "NE",
    upperTrigram: "坎",
    lowerTrigram: "艮",
    status: "auspicious",
    summary: "特利武官军警司法外交，求财亨通无功利心。官调他乡远六亲，婚延7年，特立独行！",
    careerDetail: "大部利于军人、警察、外交官、司法官等武职公职；求财亨通且心无功利，考试必顺心。",
    marriageDetail: "婚姻较同时生人延后七年；独自发展特立独行，官调他乡远涉六亲。",
    healthDetail: "体魄坚韧，耐劳耐险。",
    specialZodiacSign: "从武官大吉，无特定生肖克应。",
    timeDiffVsPeers: "晚婚七年，公职武贵早成。",
    remedyAction: "若希望儿子投身国防、公安、外交或法律司法，刻意布局此位极佳！"
  },
  "son_eldest_N": {
    hexagramName: "雷水解",
    role: "son_eldest",
    direction: "N",
    upperTrigram: "震",
    lowerTrigram: "坎",
    status: "warning",
    summary: "性刚武勇官司是非不断，无婚。肖兔刘柳姓凶，【出家为唯一解人手段】。",
    careerDetail: "性刚武勇，但工作中总是官非不断、纠纷缠身；从武职易有险难。",
    marriageDetail: "终身无婚；肖兔之人、刘姓、柳姓人逢之主凶上加凶。",
    healthDetail: "筋骨易受外伤，水险。",
    specialZodiacSign: "肖兔（卯）、刘姓、柳姓之人见之主大凶。",
    timeDiffVsPeers: "无婚且多讼。",
    remedyAction: "【人事化解】：出家修行或从事高风险解危行业；阳宅必须迁入正东（震为雷）或东南（雷风恒）。"
  },
  "son_youngest_W": {
    hexagramName: "山泽损",
    role: "son_youngest",
    direction: "W",
    upperTrigram: "艮",
    lowerTrigram: "兑",
    status: "warning",
    summary: "儿子问题多多父母烦忧，只花不赚。官运不通，好逸恶劳须经两次大灾方能觉悟！",
    careerDetail: "官运不通所求不成，贪图享乐不思进取，对家庭只会花钱不会赚钱；须历经两次重大挫折大灾方能悔悟。",
    marriageDetail: "与同时生人相比婚事延后一年方成，对方为同一人。",
    healthDetail: "沉溺酒色娱乐损身。",
    specialZodiacSign: "无特定生肖克应。",
    timeDiffVsPeers: "晚婚一年，晚成多年。",
    remedyAction: "将少男换房至东北艮位（艮为山），磨炼心志，令其自立自强。"
  },
  "daughter_eldest_E": {
    hexagramName: "风雷益",
    role: "daughter_eldest",
    direction: "E",
    upperTrigram: "巽",
    lowerTrigram: "震",
    status: "neutral",
    summary: "祖业丰盛工作超男性，女身男性格。长女婚不成或成后破，贵人为男小人为女，从官忌贪禄。",
    careerDetail: "财禄充足有祖业相继，工作能力与魄力超过男性；女身男相，从官运吉但切不可贪禄。",
    marriageDetail: "长女婚事难成，或成婚之后又破裂离异；贵人为男士，小人多为女子。",
    healthDetail: "肝气过旺，易头晕失眠。",
    specialZodiacSign: "无特定生肖克应。",
    timeDiffVsPeers: "事业财运胜同侪，婚姻多波折。",
    remedyAction: "长女若想婚姻美满，应回东南巽位（巽为风）居住，兼收文昌与良缘。"
  },
  "daughter_youngest_NW": {
    hexagramName: "泽天夬",
    role: "daughter_youngest",
    direction: "NW",
    upperTrigram: "兑",
    lowerTrigram: "乾",
    status: "danger",
    summary: "婚事延宕不成，刚从武柔从宗教。事业先凶后吉自行发展，体差不寿30前有险！",
    careerDetail: "性格刚烈者从武职，性格柔顺者归向宗教；事业先凶后吉自行创业发展，科甲不兴。",
    marriageDetail: "婚事长期延宕不成，独身概率极高。",
    healthDetail: "身体健康极差，不长寿，三十岁之前必有重大凶险灾厄！",
    specialZodiacSign: "无特定生肖克应。",
    timeDiffVsPeers: "早立门户但寿数堪忧。",
    remedyAction: "【性命攸关】：少女切不可久居西北乾位！必须立刻搬回正西兑位或东南巽位保寿安康！"
  },
  "father_SE": {
    hexagramName: "天风姤",
    role: "father",
    direction: "SE",
    upperTrigram: "乾",
    lowerTrigram: "巽",
    status: "warning",
    summary: "丈夫在外风流多事桃花不断，外有妾及多女友。商人旺前6年第七年必凶，夫妻失和二婚必破！",
    careerDetail: "商人财禄丰盛只旺前六年（须防虚假泡沫），第七年必大凶；官家人亦前六年顺遂，第七年升迁受阻牵连官非。",
    marriageDetail: "丈夫在外风流多事，桃花运不断，外有妾室及多位女友；夫妻失和，若命中带二婚则必离无疑。",
    healthDetail: "酒色伤身，腰肾亏损。",
    specialZodiacSign: "无特定生肖克应。",
    timeDiffVsPeers: "前六年暴发，第七年崩塌。",
    remedyAction: "必须立刻将主卧从东南巽位移回西北乾位（乾为天）收敛心神、固本培元！"
  },
  "daughter_youngest_SW": {
    hexagramName: "泽地萃",
    role: "daughter_youngest",
    direction: "SW",
    upperTrigram: "兑",
    lowerTrigram: "坤",
    status: "neutral",
    summary: "不喜成婚对异性无趣，退居家内代母行职为良母型。从餐饮业大利！",
    careerDetail: "终日进德修业，退居家庭内部代母亲操持家务；若从事餐饮餐饮行业则大获丰利。",
    marriageDetail: "女儿不想成婚，对异性缺乏兴趣，安心在家持家养老。",
    healthDetail: "脾胃稍弱，多喜静少动。",
    specialZodiacSign: "无特定生肖克应。",
    timeDiffVsPeers: "多独身持家。",
    remedyAction: "若欲少女早结良缘出嫁，移至东南巽位（泽风大过）必嫁入豪门！"
  },
  "mother_SE": {
    hexagramName: "地风升",
    role: "mother",
    direction: "SE",
    upperTrigram: "坤",
    lowerTrigram: "巽",
    status: "auspicious",
    summary: "官职大利平步青云，财禄丰盛承继祖业。夫妻有竞争，局不变成婚第七年必凶！",
    careerDetail: "官职大利平步青云，事业财禄丰盛，能承继并光大祖业，更新门面。",
    marriageDetail: "夫妻之间有竞争不和之象；此局若长期不改，婚姻进入第七年必见凶险裂痕。",
    healthDetail: "操劳过度，注意肝胆及颈椎。",
    specialZodiacSign: "无特定生肖克应。",
    timeDiffVsPeers: "升迁极快，但婚姻逢七年之痒大坎。",
    remedyAction: "七年之期将至前，宜迁回西北乾位（地天泰）以保全婚姻长治久安。"
  },
  "daughter_youngest_N": {
    hexagramName: "泽水困",
    role: "daughter_youngest",
    direction: "N",
    upperTrigram: "兑",
    lowerTrigram: "坎",
    status: "danger",
    summary: "【极度凶险】体弱多病寿不过三十！性刚烈独断，婚不成财不守经商必凶，【大过卦可解】！",
    careerDetail: "财禄难守，从商做生意必凶败涂地，只有一线生机。",
    marriageDetail: "婚事不成多有阻滞，性情刚烈独行独断。",
    healthDetail: "体弱多病，阳寿大限往往不过三十岁，水厄重重！",
    specialZodiacSign: "无特别生肖免克，凶险异常。",
    timeDiffVsPeers: "三十岁前大限关口重重。",
    remedyAction: "【救命秘传】：唯有迁入东南巽位成【泽风大过】卦方可逆转生死、转危为安！"
  },
  "son_middle_SE": {
    hexagramName: "水风井",
    role: "son_middle",
    direction: "SE",
    upperTrigram: "坎",
    lowerTrigram: "巽",
    status: "neutral",
    summary: "娶二婚妻且妻年长，心志不坚受诱惑。从商有祖业吉，从官招陷升迁受阻。",
    careerDetail: "从商吉利，若有祖业继承更吉；从官则易招陷害是非不断，升迁受阻滞。",
    marriageDetail: "心志不坚易受外界诱惑；婚事必娶二婚之妻且妻子年长于己。",
    healthDetail: "泌尿风湿，注意养肾。",
    specialZodiacSign: "无特定生肖克应。",
    timeDiffVsPeers: "经商起步顺，仕途多磨难。",
    remedyAction: "若欲从官提拔，次子宜移居东北艮位（水山蹇）利武职司法升迁。"
  },
  "daughter_youngest_S": {
    hexagramName: "泽火革",
    role: "daughter_youngest",
    direction: "S",
    upperTrigram: "兑",
    lowerTrigram: "离",
    status: "auspicious",
    summary: "天生刚勇明理，感情困扰多。比同侪早婚2年且比姐姐早婚！",
    careerDetail: "天生果敢刚勇且明事理，办事雷厉风行，适合公检法司或改革开拓型岗位。",
    marriageDetail: "婚姻比同时生人提前二年成婚，且比家中姐姐更早出嫁，但感情过程波折困扰较多。",
    healthDetail: "心血偏燥，注意调经。",
    specialZodiacSign: "无特定生肖克应。",
    timeDiffVsPeers: "早婚二年，比姐先嫁。",
    remedyAction: "感情受困扰时多向长辈倾诉，保持正南明朗清凉。"
  },
  "daughter_middle_SE": {
    hexagramName: "火风鼎",
    role: "daughter_middle",
    direction: "SE",
    upperTrigram: "离",
    lowerTrigram: "巽",
    status: "auspicious",
    summary: "【未婚小姐第一吉局】果决明断必嫁贵夫！婚比姐早冬成，官运亨通科甲吉（肖鼠凶财不利）。",
    careerDetail: "果决刚断不易受惑，官运亨通，科甲吉利考试高中，但求偏财不利。",
    marriageDetail: "必嫁大贵夫婿！婚事比姐姐更早完成，且多在冬季完婚成家。",
    healthDetail: "身心清爽，木火通明。",
    specialZodiacSign: "肖鼠（子）人居此凶不吉，其余生肖全吉！",
    timeDiffVsPeers: "早结良缘嫁入显贵门第。",
    remedyAction: "倪师助未婚女士成良缘之第一秘法方位！未婚二女儿居东南巽位极佳！"
  },
  "son_eldest_E": {
    hexagramName: "震为雷",
    role: "son_eldest",
    direction: "E",
    upperTrigram: "震",
    lowerTrigram: "震",
    status: "auspicious",
    summary: "天生贵子承继祖业发扬光大。科甲名列前茅，官运通顺（限婚前），红鸾年必婚！",
    careerDetail: "天生好手，在家为贵子无疑；有继承祖业并将其发扬光大之雄厚实力；科甲名列前茅，婚前官运亨通，从商亦吉为负责人。",
    marriageDetail: "婚姻严格按命盘走，红鸾星动之年即为成婚之年；此局只显现于婚前，婚后局消。",
    healthDetail: "体魄强壮，精力过人。",
    specialZodiacSign: "无特定生肖克应，全吉。",
    timeDiffVsPeers: "青年才俊，婚前运势登峰造极。",
    remedyAction: "长男婚前居正东震位大吉；婚后必须搬至西北乾位成【乾为天】以延续其宏大运势！"
  },
  "son_youngest_NE": {
    hexagramName: "艮为山",
    role: "son_youngest",
    direction: "NE",
    upperTrigram: "艮",
    lowerTrigram: "艮",
    status: "auspicious",
    summary: "科甲必中理想名校，孝子安康。红鸾年必婚，公职大利知进退人见人爱！",
    careerDetail: "科甲顺利必考中理想名校；公职大利，知进退有据，天生受长辈领导喜欢任用。",
    marriageDetail: "婚姻顺遂，步入八字红鸾星动之年必顺利完婚。",
    healthDetail: "健康平安，温和笃实为天下孝子。",
    specialZodiacSign: "全吉无克。",
    timeDiffVsPeers: "学业仕途顺风顺水，规矩成器。",
    remedyAction: "少男本位正吉，安居此位大吉大利。"
  },
  "daughter_eldest_NE": {
    hexagramName: "风山渐",
    role: "daughter_eldest",
    direction: "NE",
    upperTrigram: "巽",
    lowerTrigram: "艮",
    status: "neutral",
    summary: "科甲缺临门一脚，工作心不定思变。身体平安灾少，婚姻不主动难成，利公教职。",
    careerDetail: "出任公职、教育行业大利；但考试往往缺临门一脚；工作心念不定常思变动。",
    marriageDetail: "对待婚姻不采取主动，致使婚事磋跎难成。",
    healthDetail: "身体平安，少灾少难。",
    specialZodiacSign: "无特定生肖克应。",
    timeDiffVsPeers: "婚事推迟多年。",
    remedyAction: "长女若想快速成家且考运亨通，移居东南巽位（巽为风）大吉。"
  },
  "son_eldest_W": {
    hexagramName: "雷泽归妹",
    role: "son_eldest",
    direction: "W",
    upperTrigram: "震",
    lowerTrigram: "兑",
    status: "warning",
    summary: "男同性恋父母烦忧离家出走，委曲求禄无婚。诸事不顺多才多艺走艺术佳，【正位可解】！",
    careerDetail: "诸事不顺，委曲求全以谋生计；但多才多艺，走纯艺术、设计、演艺路线佳。",
    marriageDetail: "男同性倾向，父母极度烦忧终致离家出走，无正常婚姻。",
    healthDetail: "情绪苦闷压抑，易受传染病困扰。",
    specialZodiacSign: "无特定生肖克应。",
    timeDiffVsPeers: "艺术才华横溢但人生多坎坷。",
    remedyAction: "【天纪正位法门】：只须将长男移回正东震位（震为雷）或西北乾位，即可重塑男儿阳刚本性！"
  },
  "son_eldest_S": {
    hexagramName: "雷火丰",
    role: "son_eldest",
    direction: "S",
    upperTrigram: "震",
    lowerTrigram: "离",
    status: "neutral",
    summary: "婚事先成后破，科甲考试顺利。性刚易争感情困扰，从商必破财从官职吉！",
    careerDetail: "科甲考试顺利金榜题名；从商经商必破大财，从公职仕途则顺风顺水获吉。",
    marriageDetail: "性格刚烈易与人争执，常受感情困扰；与同侪不同，婚事必先成而后破裂。",
    healthDetail: "心火偏盛，注意心血管及眼目。",
    specialZodiacSign: "无特定生肖克应。",
    timeDiffVsPeers: "考试顺利，但商财与婚姻受挫。",
    remedyAction: "长男宜从事公职，经商应谨慎，主卧宜迁至正东震位。"
  },
  "daughter_middle_NE": {
    hexagramName: "火山旅",
    role: "daughter_middle",
    direction: "NE",
    upperTrigram: "离",
    lowerTrigram: "艮",
    status: "neutral",
    summary: "科甲兴旺女身男态，婚不成（须逢未申年或肖羊猴方成）。城府较深终自取咎。",
    careerDetail: "科甲兴旺文思敏捷；但为人城府较深，机关算尽反自取悔咎。",
    marriageDetail: "女身男态，婚事难成；唯有逢肖羊（未）、肖猴（申）之年或对象属羊猴方有成婚希望。",
    healthDetail: "神经紧绷，失眠多梦。",
    specialZodiacSign: "逢肖羊（未）、肖猴（申）之人或未申年份婚恋方有希望。",
    timeDiffVsPeers: "婚期推迟，需特定年份引动。",
    remedyAction: "次女宜迁入正南离位（离为火）或东南巽位（火风鼎）卸下心理防备。"
  },
  "daughter_eldest_SE": {
    hexagramName: "巽为风",
    role: "daughter_eldest",
    direction: "SE",
    upperTrigram: "巽",
    lowerTrigram: "巽",
    status: "auspicious",
    summary: "【未婚女士第一幸福局】科甲必中嫁好夫婿！逢凶化吉灾事不兴，性情稳定体健平安，逢红鸾即动！",
    careerDetail: "科甲兴旺考试必中，公职文昌大旺，逢凶化吉灾事不兴；性情温婉沉稳，处忧不惧。",
    marriageDetail: "必能嫁得如意好夫婿！八字逢红鸾星动之年即刻顺理成章完婚，婚姻终身幸福美满。",
    healthDetail: "健康平安，神清气爽。",
    specialZodiacSign: "全吉无克。",
    timeDiffVsPeers: "学业与婚恋全方位吉祥圆满。",
    remedyAction: "倪师每逢有未婚小姐求教，皆力荐居此巽为风之位！"
  },
  "daughter_youngest_W": {
    hexagramName: "兑为泽",
    role: "daughter_youngest",
    direction: "W",
    upperTrigram: "兑",
    lowerTrigram: "兑",
    status: "neutral",
    summary: "求婚必不成感情复杂又专一，夫凶婚延3年。科甲顺多才艺，公职顺从商不利，母荫重无父虞。",
    careerDetail: "科甲顺畅多才多艺，出任公职顺遂；但从商经商必主不利受骗损财。",
    marriageDetail: "求婚事必不成，感情复杂又专一不二，如遇虎狼之人伤害甚大；待婚中见夫凶，婚延三年。",
    healthDetail: "体健无灾，母荫极重，但有无父之虞。",
    specialZodiacSign: "防遇不良居心之男子欺骗感情。",
    timeDiffVsPeers: "晚婚三年，才艺双绝。",
    remedyAction: "择偶须格外审慎，若求良缘可迁入东南巽位（泽风大过）。"
  },
  "daughter_eldest_N": {
    hexagramName: "风水涣",
    role: "daughter_eldest",
    direction: "N",
    upperTrigram: "巽",
    lowerTrigram: "坎",
    status: "danger",
    summary: "心在宗教易入邪道，心中有鬼诸事不成。官非牢狱祸事连连，出家解灾母终日忧，【巽卦立解】！",
    careerDetail: "心中有鬼诸事不成，祸事连连，官非牢狱之灾在所难免。",
    marriageDetail: "心在宗教不想结婚，但容易误入邪教邪道；出家化解灾厄，母亲终日担忧落泪。",
    healthDetail: "精神恍惚，气血涣散。",
    specialZodiacSign: "无特定生肖克应。",
    timeDiffVsPeers: "人生严重迷失走入歧途。",
    remedyAction: "【天纪立解秘法】：立刻将长女换至东南巽位（巽为风），涣局立破，迷途知返！"
  },
  "son_middle_W": {
    hexagramName: "水泽节",
    role: "son_middle",
    direction: "W",
    upperTrigram: "坎",
    lowerTrigram: "兑",
    status: "neutral",
    summary: "肖鸡必大贵，肖犬以小做大自陷。财无积余行险招凶，犬人遇鸡成婚妻长一岁主大贵助夫渡厄！",
    careerDetail: "本人肖鸡（酉）则必获大贵；本人肖犬（戌）则盲目以小做大招致自陷；财无积余，行险招凶。",
    marriageDetail: "婚事难成；但犬人若遇肖鸡之妻则能成婚，妻年长一岁主大贵，能助夫渡过重重灾厄！",
    healthDetail: "肺肾阴虚，易有水湿之疾。",
    specialZodiacSign: "肖鸡（酉）大贵，肖犬（戌）自陷；犬配鸡妻大吉助夫。",
    timeDiffVsPeers: "成败极度取决于生肖与配偶。",
    remedyAction: "次子若非肖鸡，宜调至正东或正北，防财力匮乏。"
  },
  "daughter_eldest_W": {
    hexagramName: "风泽中孚",
    role: "daughter_eldest",
    direction: "W",
    upperTrigram: "巽",
    lowerTrigram: "兑",
    status: "auspicious",
    summary: "每试必中科甲状元！武职大利女司法官女中豪杰，双喜同临金榜伴婚，初不成后成婚延3年。",
    careerDetail: "科甲状元每考必中！武职司法大利，女中豪杰，现今女法官、女检察官多出此局。",
    marriageDetail: "双喜同临，常在婚姻中伴随金榜登科；婚事起初家中不同意，后成婚，比同侪延后三年。",
    healthDetail: "身心坚毅，精神饱满。",
    specialZodiacSign: "无特定生肖克应，大吉利女官。",
    timeDiffVsPeers: "晚婚三年，科甲与官运登峰造极。",
    remedyAction: "若家中女孩准备司法考试、公考或考博，布此局百发百中！"
  },
  "son_eldest_NE": {
    hexagramName: "雷山小过",
    role: "son_eldest",
    direction: "NE",
    upperTrigram: "震",
    lowerTrigram: "艮",
    status: "warning",
    summary: "沉溺情关神魂颠倒无法工作，过失伤人婚不成。肖猴候姓不忌，小人困扰。",
    careerDetail: "神魂颠倒无法踏实工作，常因冲动或过失伤人惹上官非是非，事业难以为继。",
    marriageDetail: "深陷感情困扰，为情不顾一切摆脱不了情关；过失伤人导致婚事难成；肖猴、侯姓人不忌。",
    healthDetail: "神经衰弱，精神迷乱失常。",
    specialZodiacSign: "肖猴（申）、侯姓人氏不忌，其余人皆受情伤所困。",
    timeDiffVsPeers: "感情受挫严重耽误前程五年以上。",
    remedyAction: "立刻移回正东震位（震为雷）斩断情丝孽缘，恢复理智振作立业！"
  },
  "son_middle_S": {
    hexagramName: "水火既济",
    role: "son_middle",
    direction: "S",
    upperTrigram: "坎",
    lowerTrigram: "离",
    status: "auspicious",
    summary: "【解困卦第一良局】财官双美科甲吉利！不重财货，先子后婚（婚慢8年），事业定后用雷卦解婚。",
    careerDetail: "天性不重财货，但官运大吉，经商亦得大财，财官双美，科甲考试亦吉利顺畅。",
    marriageDetail: "先有子后有婚；若命中有妾则主正房一子、偏房一子；婚姻比同侪慢八年，常先有妾后有婚。",
    healthDetail: "水火既济，心肾相交，体魄健朗。",
    specialZodiacSign: "全吉，善解水难。",
    timeDiffVsPeers: "晚婚八年，但财官功名极早显赫。",
    remedyAction: "【天纪秘法】：常用此局化解困卦与坎卦；待事业彻底安定后，再用雷卦（正东）化解婚姻推迟问题！"
  },
  "daughter_middle_N": {
    hexagramName: "火水未济",
    role: "daughter_middle",
    direction: "N",
    upperTrigram: "离",
    lowerTrigram: "坎",
    status: "danger",
    summary: "女身男态性刚易怒，肖虎女子枯坐无成。求财是非官非争执，刘宋高姓从武吉婚必不成！",
    careerDetail: "求财是非多，甚至官司争执不下；刘姓、宋姓、高姓人氏从武职吉利；肖虎女子居此枯坐无成。",
    marriageDetail: "女身男态性刚易怒，婚姻必不成，与同时生人婚期大不相同。",
    healthDetail: "心肾不交，失眠心悸，内分泌失调。",
    specialZodiacSign: "肖虎（寅）女子必枯坐无成；刘、宋、高姓人从武吉。",
    timeDiffVsPeers: "诸事难济，是非官司不断。",
    remedyAction: "必须将次女迁回正南离位（离为火）或东南巽位（火风鼎）以实现既济圆满！"
  },
};

// 初始阳宅预设
export function getInitialYangZhaiLayout(): PalaceCell[] {
  return [
    { direction: "NW", trigram: "乾", nameZh: "西北 (乾位)", defaultRole: "父亲/一家之主", element: "金", assignedRole: "father", roomFunction: "master_bedroom" },
    { direction: "N",  trigram: "坎", nameZh: "正北 (坎位)", defaultRole: "次男/中男", element: "水", assignedRole: "son_middle", roomFunction: "middle_son_room" },
    { direction: "NE", trigram: "艮", nameZh: "东北 (艮位)", defaultRole: "少男/三子", element: "土", assignedRole: "son_youngest", roomFunction: "study" },
    { direction: "W",  trigram: "兑", nameZh: "正西 (兑位)", defaultRole: "少女/三女", element: "金", assignedRole: "daughter_youngest", roomFunction: "youngest_daughter_room" },
    { direction: "C",  trigram: "中", nameZh: "中央 (中宫)", defaultRole: "太极枢纽", element: "土", assignedRole: "empty", roomFunction: "living_room" },
    { direction: "E",  trigram: "震", nameZh: "正东 (震位)", defaultRole: "长男", element: "木", assignedRole: "son_eldest", roomFunction: "eldest_son_room" },
    { direction: "SW", trigram: "坤", nameZh: "西南 (坤位)", defaultRole: "母亲/女主人", element: "土", assignedRole: "mother", roomFunction: "storage" },
    { direction: "S",  trigram: "离", nameZh: "正南 (离位)", defaultRole: "次女/中女", element: "火", assignedRole: "daughter_middle", roomFunction: "middle_daughter_room" },
    { direction: "SE", trigram: "巽", nameZh: "东南 (巽位)", defaultRole: "长女", element: "木", assignedRole: "daughter_eldest", roomFunction: "front_door" },
  ];
}

// 诊断九宫布局并生成详细的地脉道与风水报告
export function diagnoseYangZhai(layout: PalaceCell[]): YangZhaiDiagnosis[] {
  const results: YangZhaiDiagnosis[] = [];

  layout.forEach((cell) => {
    const { direction, trigram, assignedRole, roomFunction, nameZh } = cell;

    // 1. 厨房火煞检测
    if (roomFunction === "kitchen") {
      if (direction === "NW") {
        results.push({
          direction,
          title: "西北乾位安灶 ——【火烧天门】（极凶大忌）",
          hexagramName: "火山旅 / 火金相克",
          status: "danger",
          phenomenon: "西北乾位为男主人、老父及事业顶梁柱之天门位。灶火极烈，克犯乾金，主男主人脑部血管、肺部、偏头痛等疾患，事业名誉受阻，脾气暴躁，财运大漏。",
          tianjiRule: "《地脉道》大戒：万不可火烧天门！天门清净方能官贵通达，灶居西北必损一家之长。",
          remedy: "【天纪化解之策】：首选将灶台移至正东（木生火）或东南巽位。若无法移灶，灶台改用电磁炉减少明火；灶下垫黄色陶瓷厚板以‘土’通关（火生土，土生金）；在西北悬挂天然铜葫芦与乾坤太极图收纳燥气。",
        });
      } else if (direction === "C") {
        results.push({
          direction,
          title: "中宫安灶 ——【火烧心脏】（大忌）",
          hexagramName: "火地晋变卦 / 攻心煞",
          status: "danger",
          phenomenon: "中宫为住宅太极心脏，安放火灶主全家人易患心血管、高血压、肠胃火旺，家宅动荡不宁，财帛不聚。",
          tianjiRule: "中宫宜虚宜静，藏风聚气，安灶如心火焚身，极损健康元气。",
          remedy: "【天纪化解之策】：立刻封闭中宫明火，将厨房移至外围通风采光之位；中宫摆放白水晶球或纯铜葫芦镇宅定心。",
        });
      } else if (direction === "E" || direction === "SE") {
        results.push({
          direction,
          title: `${nameZh}安灶 ——【木火通明】（吉顺）`,
          hexagramName: "火风鼎 / 木火相生",
          status: "auspicious",
          phenomenon: "厨房安于震木或巽木之方，木生火旺，炊烟顺畅，主家人食禄充盈，文思敏捷，家运蒸蒸日上。",
          tianjiRule: "木火通明，食禄自丰，顺应五行相生之道。",
          remedy: "【养气建议】：厨房保持通风干燥与洁净，灶台定期清洁，财源更显清朗。",
        });
      }
    }

    // 2. 卫生间水浊煞检测
    if (roomFunction === "bathroom") {
      if (direction === "NW") {
        results.push({
          direction,
          title: "西北乾位设厕 ——【污秽天门】（重度不利）",
          hexagramName: "水天需变卦 / 浊水侵金",
          status: "danger",
          phenomenon: "天门受浊水污秽，主男主人事业受暗中小人构陷，贵人远离，易患泌尿系统、前列腺及偏头痛疾病，家道难昌。",
          tianjiRule: "天门见水为漏财，天门见秽损名声。《天纪》云：西北秽气，百事缠滞。",
          remedy: "【天纪化解之策】：卫生间门常闭，安装强力排风除湿机；马桶上方摆放一盆茂盛的水生黄金葛或开光泰山石敢当镇压秽气；墙面宜用暖黄米白色瓷砖。",
        });
      } else if (direction === "E") {
        results.push({
          direction,
          title: "正东震位设厕 ——【水浸震木 / 损长男】",
          hexagramName: "水雷屯 / 浊水溺木",
          status: "warning",
          phenomenon: "正东为长男之位，震为雷为肝胆与志向。厕所设于正东，容易导致长子学业事业缺乏魄力、情绪低落，或肝胆神经衰弱。",
          tianjiRule: "震木受污，长子受累。凡家中有未成年或创业中之长男者需特别重视。",
          remedy: "【天纪化解之策】：卫生间内摆放一盆绿色常青阔叶植物，以木纳水化浊；保持明亮干燥，门挂天然桃木葫芦。",
        });
      } else if (direction === "C") {
        results.push({
          direction,
          title: "中宫设厕 ——【水浸心包 / 浊气熏心】",
          hexagramName: "水地比变卦 / 阴浊攻心",
          status: "danger",
          phenomenon: "中宫设厕是现代住宅最常见之通病，湿气与秽气向四周八方弥散，主全家胃肠、呼吸道免疫力低下，财运大漏。",
          tianjiRule: "中宫为太极立极点，最忌污浊阴冷。《天纪》强调中宫必须通透明朗。",
          remedy: "【天纪化解之策】：长期开启排气扇与除湿机，放置吸湿活性炭与天然白水晶柱；随手关门，门口铺设红色脚垫挡煞。",
        });
      }
    }

    // 3. 角色住位全64卦深度研判
    if (assignedRole !== "empty" && (roomFunction.includes("bedroom") || roomFunction === "study")) {
      const key = `${assignedRole}_${direction}`;
      const dbInfo = YANGZHAI_64_DATABASE[key];
      if (dbInfo) {
        results.push({
          direction,
          title: `${ROLE_NAMES[assignedRole]}居${nameZh} ——【${dbInfo.hexagramName}】`,
          hexagramName: dbInfo.hexagramName,
          status: dbInfo.status,
          phenomenon: `${dbInfo.summary} 【事业/科甲】：${dbInfo.careerDetail} 【婚姻/感情】：${dbInfo.marriageDetail} 【生肖/流年】：${dbInfo.specialZodiacSign}（${dbInfo.timeDiffVsPeers}）。`,
          tianjiRule: `《地脉道》真传：${dbInfo.summary}`,
          remedy: `【天纪以果决行化解之道】：${dbInfo.remedyAction}`,
        });
      }
    }

    // 4. 大门气口分析
    if (roomFunction === "front_door") {
      if (direction === "SE") {
        results.push({
          direction,
          title: "大门开在东南巽位 ——【紫气东来·文昌纳吉】",
          hexagramName: "风地观 / 巽门吉庆",
          status: "auspicious",
          phenomenon: "东南巽门为传统风水‘生旺文昌门’，纳和风煦日之祥瑞，利出读书人、学者、艺术家及声名显赫之士。",
          tianjiRule: "巽门迎风，名扬四海，家运和乐。",
          remedy: "【吉祥指引】：玄关保持整洁，可设迎客绿植或山水画。",
        });
      } else if (direction === "NW") {
        results.push({
          direction,
          title: "大门开在西北乾位 ——【天门洞开·威权四达】",
          hexagramName: "乾门纳气 / 乾纲大振",
          status: "auspicious",
          phenomenon: "乾门高朗，主男主人在外人脉广博，具有大统领之格局与贵人帮扶。",
          tianjiRule: "天门大开，进退有度，但玄关需防直冲穿堂。",
          remedy: "【化解屏风】：若进门直通阳台（穿堂煞），务必设置玄关屏风以聚气。",
        });
      }
    }
  });

  if (results.length === 0) {
    results.push({
      direction: "C",
      title: "阳宅九宫气场基调",
      hexagramName: "八卦中和",
      status: "neutral",
      phenomenon: "当前房屋各功能空间分布较为平稳，未见严重五行刑克。",
      tianjiRule: "《天纪》云：宅以人立，人以宅安。善加调和乾坤位，家道永昌。",
      remedy: "根据家庭成员核心诉求（如求官、求财、求学业或早婚），针对性进行卧室调换。",
    });
  }

  return results;
}

// 《地脉道》64卦阳宅全景断语字典类型
export interface DiMaiDaoItem {
  number: number;
  name: string;
  pinyin: string;
  symbol: string;
  status: "auspicious" | "danger" | "warning" | "neutral";
  applicableLayout: string;
  phenomenon: string;
  zodiacImpact: string;
  timing: string;
  remedy: string;
}

const HEXAGRAM_META_LIST: {
  number: number;
  name: string;
  pinyin: string;
  symbol: string;
  fallbackStatus: "auspicious" | "danger" | "warning" | "neutral";
  applicableLayout: string;
  phenomenon: string;
  zodiac: string;
  timing: string;
  remedy: string;
}[] = [
  { number: 1, name: "乾为天", pinyin: "Qián Wéi Tiān", symbol: "䷀", fallbackStatus: "auspicious", applicableLayout: "父亲居西北乾位 / 乾位大门", phenomenon: "正位得配，纯阳刚健。官人连升三级，商人财多禄丰，坚持到底必有大成。", zodiac: "全吉，各生肖皆吉", timing: "事业比同侪提早5~10年登顶", remedy: "坚守西北主位，切莫轻易让出。" },
  { number: 2, name: "坤为地", pinyin: "Kūn Wéi Dì", symbol: "䷁", fallbackStatus: "neutral", applicableLayout: "母亲居西南坤位", phenomenon: "厚德载物，女强人当家。官家掌权，商人赚钱易如反掌，但老来容易孤单清冷。", zodiac: "肖牛羊土性人吉", timing: "财运起步极快，婚姻独立持家", remedy: "若求夫妻偕老，宜同移居西北乾位成【地天泰】。" },
  { number: 3, name: "水雷屯", pinyin: "Shuǐ Léi Zhūn", symbol: "䷂", fallbackStatus: "warning", applicableLayout: "次男居正东震位", phenomenon: "次子越位，才智胜长兄。家族交替时父必立次子继承，但肖狗肖牛人主凶。", zodiac: "肖狗（戌）、肖牛（丑）不利", timing: "比同侪提早二年结婚", remedy: "长子若未婚，次子切忌霸占正东；宜移至正北坎位。" },
  { number: 4, name: "山水蒙", pinyin: "Shān Shuǐ Méng", symbol: "䷃", fallbackStatus: "danger", applicableLayout: "少男居正北坎位", phenomenon: "蒙蔽欺瞒，惟利是图。好赌博行险求财，往往遇险坎坷。", zodiac: "无特定生肖克应", timing: "早婚七年，心智未开", remedy: "及早调换至东北艮位（艮为山）以养正开智。" },
  { number: 5, name: "水天需", pinyin: "Shuǐ Tiān Xū", symbol: "䷄", fallbackStatus: "auspicious", applicableLayout: "次男居西北乾位", phenomenon: "智慧飞速超越同辈，刚烈年少居权位。长兄结婚立转雷天大壮，娶二婚妻。", zodiac: "全吉", timing: "事业早成10年，婚事延后7年", remedy: "长兄婚后自然归位，安心建功立业。" },
  { number: 6, name: "天水讼", pinyin: "Tiān Shuǐ Sòng", symbol: "䷅", fallbackStatus: "danger", applicableLayout: "父亲居正北坎位", phenomenon: "官司缠身，诉讼纷扰。官人升迁拖延五年，商人财禄不进需兴讼，夫妻官非离婚。", zodiac: "肖鼠人尤甚", timing: "升职慢五年，多官非无妄之灾", remedy: "立刻搬离正北坎位，迁回西北乾位或西南坤位。" },
  { number: 7, name: "地水师", pinyin: "Dì Shuǐ Shī", symbol: "䷆", fallbackStatus: "warning", applicableLayout: "母亲居正北坎位", phenomenon: "女强男性，独来独往胆大过人。从商得财利，尤利肖虎马羊，但夫妻反目。", zodiac: "大利肖虎（寅）、肖马（午）、肖羊（未）", timing: "财运爆发早但婚姻破碎极早", remedy: "必须移出正北坎位，迁入西南坤位或西北乾位以柔克刚。" },
  { number: 8, name: "水地比", pinyin: "Shuǐ Dì Bǐ", symbol: "䷇", fallbackStatus: "neutral", applicableLayout: "次男居西南坤位", phenomenon: "与母连心从母事，居佐才难为大老板。娶年长之妻，兄婚后转雷地豫。", zodiac: "肖羊人吉", timing: "比同侪延后三年结婚", remedy: "若想次子有雄心霸气担任一把手，应调换至正东震位。" },
  { number: 9, name: "风天小畜", pinyin: "Fēng Tiān Xiǎo Xù", symbol: "䷈", fallbackStatus: "auspicious", applicableLayout: "长女居西北乾位", phenomenon: "女代父职女强人，能力强过男人。早年自立当老板，终身不嫁或早婚2年独撑大局。", zodiac: "大利肖羊（未）、肖马（午）", timing: "早成女富豪", remedy: "若长女求良缘早嫁，移回东南巽位（巽为风）即可引动红鸾。" },
  { number: 10, name: "天泽履", pinyin: "Tiān Zé Lǚ", symbol: "䷉", fallbackStatus: "warning", applicableLayout: "父亲居正西兑位", phenomenon: "进退两难如履虎尾。妻能力过己而在外纳妾求自尊，官运停滞，商机丧失。", zodiac: "无特定生肖克应", timing: "事业错失关键五年", remedy: "坚决搬出正西少女位，重返西北乾位重树天威。" },
  { number: 11, name: "地天泰", pinyin: "Dì Tiān Tài", symbol: "䷊", fallbackStatus: "auspicious", applicableLayout: "夫妻同居西北乾位 / 母亲居西北", phenomenon: "【天纪第一吉局】天地交泰万物生。一世夫妻白首到老，贤妻良母，心想事成，福厚无病！", zodiac: "全吉，无任何忌讳", timing: "家运长青，三十年鼎盛", remedy: "万金难换之吉局，永固此位！" },
  { number: 12, name: "天地否", pinyin: "Tiān Dì Pǐ", symbol: "䷋", fallbackStatus: "danger", applicableLayout: "父亲居西南坤位（未婚或单身男）", phenomenon: "闭塞不通，孤芳自赏。男人做女人事，意志消沉，商机断绝，同床异梦。", zodiac: "肖羊猴人较重", timing: "诸事蹉跎三年至五年", remedy: "速归西北乾位（乾为天）激发乾阳统摄之气。" },
  { number: 13, name: "天火同人", pinyin: "Tiān Huǒ Tóng Rén", symbol: "䷌", fallbackStatus: "auspicious", applicableLayout: "父亲居正南离位", phenomenon: "大公无私，四海皆兄弟。利合伙创业，官场人脉通达，声威远播。", zodiac: "肖马、肖虎人吉", timing: "事业迅速破圈成名", remedy: "保持公心合伙，注意心脑血管调养。" },
  { number: 14, name: "火天大有", pinyin: "Huǒ Tiān Dà Yǒu", symbol: "䷍", fallbackStatus: "auspicious", applicableLayout: "次女居西北乾位", phenomenon: "日丽中天，女中栋梁。早年掌管家族或大型企业财务权柄，富甲一方。", zodiac: "大利肖蛇马火命人", timing: "比同侪提早五年执掌大权", remedy: "吉亨之局，注意防燥热与眼疾。" },
  { number: 15, name: "地山谦", pinyin: "Dì Shān Qiān", symbol: "䷎", fallbackStatus: "auspicious", applicableLayout: "母亲居东北艮位", phenomenon: "内高外卑，劳谦长寿。家道厚重，子孙贤孝，聚财不漏。", zodiac: "肖牛虎人吉", timing: "福禄绵长，安享晚年", remedy: "安居吉位，多行善事。" },
  { number: 16, name: "雷地豫", pinyin: "Léi Dì Yù", symbol: "䷏", fallbackStatus: "neutral", applicableLayout: "长男居西南坤位", phenomenon: "顺理而动，乐极生悲之虞。孝顺体贴，但缺乏狼性霸气，易沉溺安逸。", zodiac: "无特定生肖克应", timing: "婚期推迟，性格温和", remedy: "若需开拓大事业，应移居正东震位（震为雷）。" },
  { number: 25, name: "天雷无妄", pinyin: "Tiān Léi Wú Wàng", symbol: "䷘", fallbackStatus: "auspicious", applicableLayout: "长男居西北乾位", phenomenon: "【长子当家大格局】天下雷行顺天而动。少年老成，提早当家创业，掌印掌权！", zodiac: "肖龙、肖虎大吉", timing: "事业提早十年立足巅峰", remedy: "大吉当家局，若未婚成家立业一气呵成。" },
  { number: 63, name: "水火既济", pinyin: "Shuǐ Huǒ Jì Jì", symbol: "䷾", fallbackStatus: "auspicious", applicableLayout: "次男居正南离位", phenomenon: "水火交融，事已大成。聪明绝顶，才华横溢，但初吉终乱宜防盛极必衰。", zodiac: "水火相济，肖鼠马平衡", timing: "早年成名获利", remedy: "见好就收，居安思危建立风控长效机制。" },
  { number: 64, name: "火水未济", pinyin: "Huǒ Shuǐ Wèi Jì", symbol: "䷿", fallbackStatus: "warning", applicableLayout: "次女居正北坎位", phenomenon: "水火不交，事未有济。思虑重重，好事多磨，宜潜沉蓄势待破晓。", zodiac: "防肖鼠肖蛇冲突", timing: "晚婚三年，磨砺后成", remedy: "移居正南离位或东南巽位以顺五行生克。" },
];

export const DI_MAI_DAO_64_YANGZHAI: Record<string, DiMaiDaoItem> = (() => {
  const result: Record<string, DiMaiDaoItem> = {};

  // First seed from meta list
  HEXAGRAM_META_LIST.forEach((m) => {
    result[m.name] = {
      number: m.number,
      name: m.name,
      pinyin: m.pinyin,
      symbol: m.symbol,
      status: m.fallbackStatus,
      applicableLayout: m.applicableLayout,
      phenomenon: m.phenomenon,
      zodiacImpact: m.zodiac,
      timing: m.timing,
      remedy: m.remedy,
    };
  });

  // Then enrich from YANGZHAI_64_DATABASE where available
  Object.values(YANGZHAI_64_DATABASE).forEach((dbItem) => {
    if (!result[dbItem.hexagramName]) {
      result[dbItem.hexagramName] = {
        number: Object.keys(result).length + 1,
        name: dbItem.hexagramName,
        pinyin: "",
        symbol: "☯",
        status: dbItem.status,
        applicableLayout: `${ROLE_NAMES[dbItem.role]}居${dbItem.direction}位`,
        phenomenon: `${dbItem.summary} ${dbItem.careerDetail} ${dbItem.marriageDetail}`,
        zodiacImpact: dbItem.specialZodiacSign,
        timing: dbItem.timeDiffVsPeers,
        remedy: dbItem.remedyAction,
      };
    } else {
      // update with rich db content
      result[dbItem.hexagramName].applicableLayout = `${ROLE_NAMES[dbItem.role]}居${dbItem.direction}位`;
      result[dbItem.hexagramName].phenomenon = `${dbItem.summary} ${dbItem.careerDetail}`;
      result[dbItem.hexagramName].zodiacImpact = dbItem.specialZodiacSign;
      result[dbItem.hexagramName].timing = dbItem.timeDiffVsPeers;
      result[dbItem.hexagramName].remedy = dbItem.remedyAction;
      result[dbItem.hexagramName].status = dbItem.status;
    }
  });

  return result;
})();

// 辅助查询单卦地脉道详情
export function getDiMaiDaoDetail(hexagramName: string): DiMaiDaoItem {
  return DI_MAI_DAO_64_YANGZHAI[hexagramName] || DI_MAI_DAO_64_YANGZHAI["乾为天"];
}

// 堪舆核心经典别名与结构化导出
export const CLASSIC_FENGSHUI_PRINCIPLES = {
  siLingJue: {
    title: "四灵山势与形峦正局（左青龙右白虎）",
    desc: "左青龙、右白虎、前朱雀、后玄武。四灵得配，藏风聚气。",
    qinglong: "东方生发，宜高大绵长有情，主贵人得力、官运亨通。",
    baihu: "西方肃杀，宜低伏驯服不昂头，忌高压反客为主。",
    zhuque: "南方明堂，宜平整开阔、水聚天心或九曲来朝。",
    xuanwu: "北方靠山，宜雄浑端庄，后顾有托，主基业稳固。"
  },
  tianXingSiGui: {
    title: "天星四贵催官发富水法",
    desc: "二十四山对天星，亥艮丙巽为天地四贵垣局，龙水交汇出将入相。",
    positions: {
      hai: "紫微垣，主帝王尊贵与核心统御权柄。",
      gen: "天市垣，主商贾巨富、天下财帛汇聚。",
      bing: "太微垣，主文武重臣、内阁辅弼之才。",
      xun: "太乙垣，主科名声誉与文曲魁首。"
    }
  },
  baLuHuangQuan: {
    title: "水法八路黄泉八煞绝水秘诀",
    verse: "庚丁坤向是黄泉，坤向庚丁且莫言。巽向忌行乙丙上，乙丙须防巽水先。甲癸向上忧见艮，艮逢甲癸祸连连。辛壬乾路最宜忌，乾向辛壬祸亦然。",
    meaning: "立向与水法交战，若开门放水或来水犯八路黄泉，必主人口损耗、家业破败，阳宅阴宅皆大忌。"
  },
  tianYuanDiFang: {
    title: "天圆地方图与卦气年限推演",
    core: "天圆图主时间运程（顺左知往，逆右知来），地方图主空间方位（坤上乾下天地交泰）。阳爻管九年，阴爻管六年。"
  }
};

// 风水堪舆经典要诀数据导出（供地脉道风水专栏展示）
export const FENGSHUI_CLASSIC_KNOWLEDGE = {
  longFa: {
    title: "寻龙点穴与生龙死龙判别",
    content: "山脉连绵起伏如龙之脊梁。生龙者，山势雄伟高大、青苍茂盛、神清气爽、气势蓬勃且延绵不绝，从太祖山、少祖山一路下来山棱线不绝；两山夹山棱线称为‘龙过峡’，遇此必知前有结穴！死龙者，光秃无树、到处塌陷落石，风水谓‘石山不葬’；瘦骨嶙峋则龙气不足；细石飞沙走石为凶龙，人丁败绝。",
  },
  tianXingSiGui: {
    title: "天星四贵与国都大都相会",
    content: "二十四山对天星：亥位上应【紫微星】、艮位上应【天市星】、巽位上应【太微星】、兑位上应【少微星】。此四星为至贵。凡国都首府大邑，若得亥、艮、巽三阴龙相会，三条直线横过明堂相交之点即为首府建都之大吉胜地！",
  },
  baLuHuangQuan: {
    title: "水法八路黄泉煞歌诀与禁忌",
    poem: "庚丁坤向是黄泉，坤向庚丁且莫言。巽向忌行乙丙上，乙丙须防巽水先。甲癸向上忧见艮，艮逢甲癸祸连连。辛壬乾路最宜忌，乾向辛壬祸亦然。",
    explanation: "黄泉煞专忌向上来水与开门放水。若立庚丁向，坤方忌有来去之水；立乙丙向，巽方忌有来去之水；立甲癸向，艮方忌有来去之水；立辛壬向，乾方忌有来去水。若逢黄泉水朝向穴前，必主少亡孤寡破败！",
  },
  mingTangAnShan: {
    title: "明堂、案山、朝山与水口砂",
    content: "明堂宜平整宽广如【水聚天心】（湖中小岛如日月潭光华岛）、【田园明堂】、【九曲入明堂必出帝王】。案山为穴前近山，圆肥敦厚为【富星砂】主出巨富，形如笔架为【笔架案山】主科甲状元，水中耸立为【水中案山】主出栋梁大臣。朝山为远山，如太师椅出宰相，如军营出武将。水口处若有天然巨石如动物，如关渡【狮子抱绣球】必为万年大吉福地！",
  },
  tianYuanDiFang: {
    title: "天圆地方图与卦气年限推演",
    content: "天圆图顺天左旋知过去、逆天右旋知未来，主时间；地方图坤在上乾在下（地气上升天气下降十二长生生死轮回），主空间地点。在风水中，以水口朝向为外卦，穴内坐山为内卦合成本卦。天圆地方图推演年限：每阴爻管六年，每阳爻管九年！如【地天泰】三阴爻走18年，三阳爻走27年，合管45年，依爻象生克推算各房发禄年限与代数！",
  }
};
