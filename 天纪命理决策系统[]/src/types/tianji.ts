export type Gender = "male" | "female";

export type HeavenlyStem = "甲" | "乙" | "丙" | "丁" | "戊" | "己" | "庚" | "辛" | "壬" | "癸";
export type EarthlyBranch = "子" | "丑" | "寅" | "卯" | "辰" | "巳" | "午" | "未" | "申" | "酉" | "戌" | "亥";

export type FiveElementBureau = "水二局" | "木三局" | "金四局" | "土五局" | "火六局";

export type PalaceName =
  | "命宫"
  | "兄弟宫"
  | "夫妻宫"
  | "子女宫"
  | "财帛宫"
  | "疾厄宫"
  | "迁移宫"
  | "仆役宫" // 亦称交友宫
  | "官禄宫" // 亦称事业宫
  | "田宅宫"
  | "福德宫"
  | "父母宫";

export type StarBrightness = "庙" | "旺" | "得" | "利" | "平" | "不" | "陷";

export type SiHuaType = "禄" | "权" | "科" | "忌";

export interface StarInfo {
  name: string;
  type: "major" | "auspicious" | "inauspicious" | "minor" | "sihua";
  brightness?: StarBrightness;
  sihua?: SiHuaType;
  description?: string;
  category?: string;
}

export interface PalaceData {
  index: number; // 0 to 11 (子 to 亥)
  branch: EarthlyBranch;
  stem: HeavenlyStem;
  name: PalaceName;
  isBodyPalace: boolean; // 身宫所在
  isLifePalace: boolean; // 命宫所在
  majorStars: StarInfo[];
  minorStars: StarInfo[];
  decadeStartAge: number;
  decadeEndAge: number;
  smallLimitAges: number[];
  niHaixiaAnalysis: {
    overview: string;
    actionAdvice: string;
    warningNote: string;
  };
}

export interface FormationPattern {
  name: string;
  type: "auspicious" | "inauspicious" | "special";
  description: string;
  tianjiSignificance: string;
  actionStrategy: string;
}

export interface NatalChart {
  name: string;
  gender: Gender;
  solarDate: string;
  lunarDate: {
    year: number;
    month: number;
    day: number;
    isLeap: boolean;
    stemBranchYear: string;
    stemBranchMonth: string;
    stemBranchDay: string;
    stemBranchHour: string;
  };
  heavenlyStems: {
    year: HeavenlyStem;
    month: HeavenlyStem;
    day: HeavenlyStem;
    hour: HeavenlyStem;
  };
  earthlyBranches: {
    year: EarthlyBranch;
    month: EarthlyBranch;
    day: EarthlyBranch;
    hour: EarthlyBranch;
  };
  hourBranch: EarthlyBranch;
  bureau: FiveElementBureau;
  yinYangGender: string; // 阳男, 阴男, 阳女, 阴女
  lifePalaceBranch: EarthlyBranch;
  bodyPalaceBranch: EarthlyBranch;
  palaces: PalaceData[];
  patterns: FormationPattern[];
  annualSiHua: {
    stem: HeavenlyStem;
    lu: string;
    quan: string;
    ke: string;
    ji: string;
  };
  coreSummary: string;
}

// Yang Zhai / Feng Shui Types
export type CompassDirection = "NW" | "N" | "NE" | "W" | "C" | "E" | "SW" | "S" | "SE";

export type TrigramName = "乾" | "坎" | "艮" | "震" | "巽" | "离" | "坤" | "兑" | "中";

export type FamilyRole =
  | "father" // 父亲 / 一家之主 (乾)
  | "mother" // 母亲 / 主妇 (坤)
  | "son_eldest" // 长男 (震)
  | "son_middle" // 次男 / 中男 (坎)
  | "son_youngest" // 少男 / 三子 (艮)
  | "daughter_eldest" // 长女 (巽)
  | "daughter_middle" // 次女 / 中女 (离)
  | "daughter_youngest" // 少女 / 三女 (兑)
  | "empty";

export type RoomFunction =
  | "master_bedroom" // 主卧
  | "eldest_son_room" // 长子房
  | "middle_son_room" // 次子房
  | "youngest_son_room" // 少男房
  | "eldest_daughter_room" // 长女房
  | "middle_daughter_room" // 次女房
  | "youngest_daughter_room" // 少女房
  | "kitchen" // 厨房 (火)
  | "bathroom" // 卫生间 (水污)
  | "front_door" // 大门 (气口)
  | "study" // 书房 / 办公室 (文昌)
  | "living_room" // 客厅
  | "storage" // 储藏室
  | "balcony"; // 阳台 / 气场通达

export interface PalaceCell {
  direction: CompassDirection;
  trigram: TrigramName;
  nameZh: string; // 如 "西北 (乾位)"
  defaultRole: string; // "父 / 一家之主"
  element: string; // "金", "水", etc.
  assignedRole: FamilyRole;
  roomFunction: RoomFunction;
  customNote?: string;
}

export interface YangZhaiDiagnosis {
  direction: CompassDirection;
  title: string;
  hexagramName: string;
  status: "auspicious" | "neutral" | "warning" | "danger";
  phenomenon: string;
  tianjiRule: string;
  remedy: string;
}

// I Ching 64 Hexagrams Types
export interface HexagramData {
  number: number;
  name: string;
  pinyin: string;
  upperTrigram: TrigramName;
  lowerTrigram: TrigramName;
  symbol: string;
  judgment: string;
  image: string;
  tianjiContext: string;
  actionGuidance: string; // 以果决行指导
  businessGuidance: string;
  relationshipGuidance: string;
  healthGuidance: string;
}

// Face Reading Types
export interface FacialPalace {
  id: string;
  name: string;
  location: string;
  correspondsTo: string;
  auspiciousSigns: string;
  inauspiciousSigns: string;
  tianjiInsight: string;
}
