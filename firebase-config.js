// ============================================================
//  Firebase 設定檔
//  請到 Firebase Console 建立專案後，把設定值貼進下方物件。
//  步驟見 README.md 的「Firebase 設定教學」。
// ============================================================

export const firebaseConfig = {
  apiKey: "AIzaSyAXNlMVIqRDujBIjMInb76zVFA2qMwzqGA",
  authDomain: "shifen-earth-camp.firebaseapp.com",
  projectId: "shifen-earth-camp",
  storageBucket: "shifen-earth-camp.firebasestorage.app",
  messagingSenderId: "583965678863",
  appId: "1:583965678863:web:ace7698e750c9a16ca327a",
};

// ============================================================
//  工作人員名單（來源：試算表「告白十分名單」分頁）
//  role  = 職務、name = 姓名、nick = 稱呼（綽號，可留空）
//  · 選對象時：顯示「職務 · 姓名（稱呼）」完整資訊
//  · 留言牆顯示：優先用綽號；沒綽號則顯示姓名後兩字
//  使用者仍可在選單選「✏️ 其他（自行輸入）」手動輸入名單以外的人。
// ============================================================
export const STAFF_LIST = [
  { role: "老師",     name: "李宗勳", nick: "李老師" },
  { role: "老師",     name: "林瑋揚", nick: "林老師" },
  { role: "總召",     name: "張筠欣", nick: "花花" },
  { role: "總召",     name: "林慈英", nick: "草草" },
  { role: "活動長",   name: "林柏揚", nick: "哥哥" },
  { role: "授課老師", name: "楊妤柔", nick: "米雪" },
  { role: "授課老師", name: "陳冠綸", nick: "罐頭" },
  { role: "授課老師", name: "邱莉芸", nick: "莉莉" },
  { role: "隊輔",     name: "黃桐",   nick: "大只" },
  { role: "隊輔",     name: "柳昀希", nick: "希希" },
  { role: "隊輔",     name: "曾筠絜", nick: "饅頭" },
  { role: "隊輔",     name: "彭怡榛", nick: "小棒" },
  { role: "隊輔",     name: "王禾芸", nick: "晚安" },
  { role: "隊輔",     name: "王沁琳", nick: "早安" },
  { role: "隊輔",     name: "洪筠媜", nick: "大頭針" },
  { role: "隊輔",     name: "趙奕翔", nick: "Frank" },
  { role: "隊輔",     name: "林育嫺", nick: "小魚" },
  { role: "隊輔",     name: "許皓勛", nick: "星星" },
  { role: "隊輔",     name: "伍海舜", nick: "珍奶" },
  { role: "隊輔",     name: "簡薇容", nick: "Vicky" },
  { role: "生活組",   name: "林詩涵", nick: "海倫" },
  { role: "生活組",   name: "許家齊", nick: "" },
  { role: "生活組",   name: "張哲睿", nick: "帥哥" },
  { role: "生活組",   name: "黃士豪", nick: "" },
  { role: "生活組",   name: "康珍瑄", nick: "康康" },
  { role: "生活組",   name: "劉映霈", nick: "小波" },
  { role: "音控",     name: "劉欣泰", nick: "" },
];

// 留言牆上顯示用的名稱：有綽號用綽號，否則用姓名後兩字。
export function displayName(person) {
  if (person.nick && person.nick.trim()) return person.nick.trim();
  const n = (person.name || "").trim();
  return n.length > 2 ? n.slice(-2) : n;
}
