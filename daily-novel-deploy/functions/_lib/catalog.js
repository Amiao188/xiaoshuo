export const TAGS = [
  "悬疑", "姐弟恋", "白月光", "大女主", "病娇", "豪门霸总", "双男主",
  "双女主", "先婚后爱", "追妻火葬场", "娱乐圈", "甜宠", "虐恋", "先虐后甜", "宫斗"
];

export function isAllowedTag(tag) {
  return TAGS.includes(String(tag || "").trim());
}
