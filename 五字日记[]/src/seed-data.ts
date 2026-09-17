/**
 * 临时种子数据
 * 用途：把旧日记批量导入到新 App 中，打包进 APK 后首次启动自动写入 SQLite。
 * 注意：用户打包完成后应删除本文件，并从 src/stores/diary.ts 中移除引用。
 */

import type { DiaryEntry } from "./stores/diary";

function ts(date: string, offsetHours = 0): number {
  return Date.parse(`${date}T00:00:00+08:00`) + offsetHours * 3600 * 1000;
}

export const TEMP_SEED_ENTRIES: DiaryEntry[] = [
  { id: "seed-20260413", text: "跟酒窝分手", date: "2026年04月13日", timestamp: ts("2026-04-13") },
  { id: "seed-20260414", text: "家具去面试", date: "2026年04月14日", timestamp: ts("2026-04-14") },
  { id: "seed-20260415", text: "跟酒窝分手", date: "2026年04月15日", timestamp: ts("2026-04-15") },
  { id: "seed-20260416", text: "跟酒窝复合", date: "2026年04月16日", timestamp: ts("2026-04-16") },
  { id: "seed-20260420", text: "去面试北瓜", date: "2026年04月20日", timestamp: ts("2026-04-20") },
  { id: "seed-20260421", text: "北瓜来上班", date: "2026年04月21日", timestamp: ts("2026-04-21") },
  { id: "seed-20260422", text: "吃了肉蟹煲", date: "2026年04月22日", timestamp: ts("2026-04-22") },
  { id: "seed-20260424-a", text: "就业课挂你", date: "2026年04月24日", timestamp: ts("2026-04-24", 8) },
  { id: "seed-20260424-b", text: "做出一坨屎", date: "2026年04月24日", timestamp: ts("2026-04-24", 20) },
  { id: "seed-20260426", text: "陶喆演唱会", date: "2026年04月26日", timestamp: ts("2026-04-26") },
  { id: "seed-20260503", text: "智慧城健身", date: "2026年05月03日", timestamp: ts("2026-05-03") },
  { id: "seed-20260504", text: "南亭虾健身", date: "2026年05月04日", timestamp: ts("2026-05-04") },
  { id: "seed-20260508", text: "盒马小龙虾", date: "2026年05月08日", timestamp: ts("2026-05-08") },
  { id: "seed-20260509", text: "妹妹刘文祥", date: "2026年05月09日", timestamp: ts("2026-05-09") },
  { id: "seed-20260511", text: "买个尼泊尔", date: "2026年05月11日", timestamp: ts("2026-05-11") },
  { id: "seed-20260514", text: "跟酒窝吵架", date: "2026年05月14日", timestamp: ts("2026-05-14") },
  { id: "seed-20260526", text: "四海城桌游", date: "2026年05月26日", timestamp: ts("2026-05-26") },
  { id: "seed-20260611", text: "酒窝生日了", date: "2026年06月11日", timestamp: ts("2026-06-11") },
  { id: "seed-20260612", text: "万博剧本杀", date: "2026年06月12日", timestamp: ts("2026-06-12") },
  { id: "seed-20260615", text: "跟酒窝分手", date: "2026年06月15日", timestamp: ts("2026-06-15") },
  { id: "seed-20260616", text: "雨杀lxt", date: "2026年06月16日", timestamp: ts("2026-06-16") },
  { id: "seed-20260626", text: "新人阿卡纳", date: "2026年06月26日", timestamp: ts("2026-06-26") },
  { id: "seed-20260627", text: "通宵阿瓦隆", date: "2026年06月27日", timestamp: ts("2026-06-27") },
  { id: "seed-20260707", text: "又回月成绩", date: "2026年07月07日", timestamp: ts("2026-07-07") },
];
