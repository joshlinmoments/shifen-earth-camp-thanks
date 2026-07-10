// ============================================================
//  永續十分地球營 · 感謝告白牆 — 前端邏輯
// ============================================================
import { firebaseConfig, STAFF_LIST, displayName } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const CONFIGURED = !firebaseConfig.apiKey.startsWith("REPLACE_ME");

let db;
if (CONFIGURED) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

// ---------- 夜空背景 ----------
(function buildSky() {
  const sky = document.getElementById("sky");
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 90; i++) {
    const s = document.createElement("div");
    s.className = "star";
    const size = Math.random() * 2.4 + 0.6;
    s.style.width = s.style.height = size + "px";
    s.style.left = Math.random() * 100 + "%";
    s.style.top = Math.random() * 100 + "%";
    s.style.setProperty("--dur", (Math.random() * 3 + 2).toFixed(1) + "s");
    s.style.animationDelay = (Math.random() * 4).toFixed(1) + "s";
    frag.appendChild(s);
  }
  for (let i = 0; i < 10; i++) {
    const l = document.createElement("div");
    l.className = "lantern";
    l.style.left = Math.random() * 100 + "%";
    l.style.setProperty("--dur", (Math.random() * 14 + 18).toFixed(0) + "s");
    l.style.setProperty("--delay", (Math.random() * 20).toFixed(0) + "s");
    const scale = Math.random() * 0.7 + 0.7;
    l.style.transform = `scale(${scale})`;
    frag.appendChild(l);
  }
  sky.appendChild(frag);
})();

// ---------- Tab 切換 ----------
const tabs = document.querySelectorAll(".tab");
const views = { wall: document.getElementById("view-wall"), write: document.getElementById("view-write") };
tabs.forEach((t) => t.addEventListener("click", () => {
  tabs.forEach((x) => x.classList.remove("is-active"));
  t.classList.add("is-active");
  const v = t.dataset.view;
  views.wall.hidden = v !== "wall";
  views.write.hidden = v !== "write";
}));

// ---------- 依職務整理名單 ----------
// roleOrder：職務出現順序；roleMembers：每個職務的成員（含原始 index）
const roleOrder = [];
const roleMembers = {};
STAFF_LIST.forEach((p, i) => {
  if (!roleMembers[p.role]) { roleMembers[p.role] = []; roleOrder.push(p.role); }
  roleMembers[p.role].push({ ...p, idx: i });
});

// 群組（職務）顯示名稱
const GROUP_LABEL = {
  "老師": "老師們", "總召": "總召們", "活動長": "活動長們",
  "授課老師": "授課老師們", "隊輔": "隊輔們", "生活組": "生活組夥伴", "音控": "音控",
};
const groupName = (role) => GROUP_LABEL[role] || role + "們";

const ALL_LABEL = "全體夥伴們";

// ---------- 建立「告白對象」下拉選單 ----------
const toSelect = document.getElementById("to-select");
const toCustomField = document.getElementById("to-custom-field");
const toCustom = document.getElementById("to-custom");

// 群組區：全體 + 各職務（2 人以上才成群）
const groupOptg = document.createElement("optgroup");
groupOptg.label = "👥 寫給一整群";
groupOptg.appendChild(new Option("🌏 " + ALL_LABEL, "all"));
roleOrder.forEach((role) => {
  if (roleMembers[role].length >= 2) {
    groupOptg.appendChild(new Option(groupName(role), `group:${role}`));
  }
});
toSelect.appendChild(groupOptg);

// 個人區：依職務分組
roleOrder.forEach((role) => {
  const og = document.createElement("optgroup");
  og.label = role;
  roleMembers[role].forEach((p) => {
    const label = `${p.name}${p.nick ? "（" + p.nick + "）" : ""}`;
    og.appendChild(new Option(label, `staff:${p.idx}`));
  });
  toSelect.appendChild(og);
});

toSelect.appendChild(new Option("✏️ 其他（自行輸入）", "custom"));

toSelect.addEventListener("change", () => {
  const isCustom = toSelect.value === "custom";
  toCustomField.hidden = !isCustom;
  toCustom.required = isCustom;
});

// ---------- 匿名切換 ----------
const anon = document.getElementById("anon");
const fromInput = document.getElementById("from");
anon.addEventListener("change", () => {
  fromInput.disabled = anon.checked;
  if (anon.checked) fromInput.value = "";
});

// ---------- 字數計算 ----------
const messageEl = document.getElementById("message");
const msgCount = document.getElementById("msg-count");
messageEl.addEventListener("input", () => { msgCount.textContent = messageEl.value.length; });

// ---------- 送出感謝 ----------
const form = document.getElementById("thank-form");
const submitBtn = document.getElementById("submit-btn");
const status = document.getElementById("form-status");

function setStatus(msg, kind) {
  status.textContent = msg;
  status.className = "form__status" + (kind ? " " + kind : "");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // 解析對象：個人 / 職務群組 / 全體 / 自行輸入
  let to = "", toType = "", toRole = "";
  const v = toSelect.value;
  if (v === "all") {
    toType = "all"; to = ALL_LABEL;
  } else if (v.startsWith("group:")) {
    toType = "group"; toRole = v.slice(6); to = groupName(toRole);
  } else if (v.startsWith("staff:")) {
    const p = STAFF_LIST[Number(v.split(":")[1])];
    toType = "person"; toRole = p.role; to = displayName(p);
  } else if (v === "custom") {
    toType = "custom"; to = toCustom.value.trim();
  }
  if (!to) { setStatus("請選擇或輸入告白的對象 🙏", "err"); return; }

  const message = messageEl.value.trim();
  if (!message) { setStatus("寫幾句想說的話吧 ✍️", "err"); return; }

  const isAnon = anon.checked;
  const from = isAnon ? "" : fromInput.value.trim();

  if (!CONFIGURED) {
    setStatus("⚠️ 尚未設定 Firebase，請先填入 firebase-config.js 的設定值。", "err");
    return;
  }

  submitBtn.disabled = true;
  setStatus("🏮 正在放天燈…", "");

  try {
    await addDoc(collection(db, "messages"), {
      to,
      toType,
      toRole,
      from,
      anonymous: isAnon,
      message,
      photoUrl: "",
      createdAt: serverTimestamp(),
    });

    form.reset();
    msgCount.textContent = "0";
    toCustomField.hidden = true;
    fromInput.disabled = false;
    setStatus("✨ 告白已送出，你的天燈正在升空！", "ok");
    // 自動切到告白牆
    document.querySelector('.tab[data-view="wall"]').click();
  } catch (err) {
    console.error(err);
    setStatus("送出失敗：" + (err.message || err), "err");
  } finally {
    submitBtn.disabled = false;
  }
});

// ---------- 告白牆即時載入 ----------
const wall = document.getElementById("wall");
const wallEmpty = document.getElementById("wall-empty");
const wallLoading = document.getElementById("wall-loading");
const countEl = document.getElementById("count");
let allDocs = [];

// ---------- 分層搜尋（職務 → 姓名） ----------
const filterRole = document.getElementById("filter-role");
const filterName = document.getElementById("filter-name");
const filterReset = document.getElementById("filter-reset");

roleOrder.forEach((role) => filterRole.appendChild(new Option(role, role)));

// 第二層：依所選職務動態列出成員（用綽號/顯示名稱）
filterRole.addEventListener("change", () => {
  const R = filterRole.value;
  filterName.innerHTML = "";
  if (!R) {
    filterName.appendChild(new Option("全部", ""));
    filterName.disabled = true;
  } else {
    filterName.appendChild(new Option("全部（此職務）", ""));
    roleMembers[R].forEach((p) => filterName.appendChild(new Option(displayName(p), displayName(p))));
    filterName.disabled = false;
  }
  updateResetVisibility();
  render();
});
filterName.addEventListener("change", () => { updateResetVisibility(); render(); });
filterReset.addEventListener("click", () => {
  filterRole.value = "";
  filterRole.dispatchEvent(new Event("change"));
});

function updateResetVisibility() {
  filterReset.hidden = !filterRole.value && !filterName.value;
}

// 顯示名稱 → 職務對照（供沒有 toRole 的舊訊息推斷職務）
const nameToRole = {};
STAFF_LIST.forEach((p) => { nameToRole[displayName(p)] = p.role; });

// 判斷某則告白是否符合目前的搜尋條件
function matchFilter(d) {
  const R = filterRole.value;   // 職務；"" = 全部職務
  const P = filterName.value;   // 姓名（顯示名稱）；"" = 此職務全部
  if (!R) return true;
  // 向下相容舊訊息（沒有 toType）：視為個人告白，用 to 反查職務
  const type = d.toType || "person";
  const role = d.toRole || nameToRole[d.to] || "";
  if (P) {
    // 找特定某人：本人的告白 + 該職務群組告白 + 全體告白
    return (type === "person" && d.to === P)
      || (type === "group" && role === R)
      || (type === "all");
  }
  // 只選職務：該職務所有人 + 該職務群組 + 全體
  return role === R || type === "all";
}

function fmtTime(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function esc(s) {
  return (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

let renderedDocs = [];
function render() {
  const list = allDocs.filter(matchFilter);
  renderedDocs = list;
  countEl.textContent = allDocs.length;
  wall.innerHTML = "";
  wallLoading.hidden = true;
  wallEmpty.hidden = list.length !== 0;
  wallEmpty.textContent = (filterRole.value || filterName.value)
    ? "這個對象還沒收到告白，換個人看看，或成為第一個告白的人吧 ✨"
    : "還沒有人放天燈，成為第一個送出告白的人吧 ✨";

  list.forEach((d, i) => {
    const el = document.createElement("article");
    el.className = "note";
    el.dataset.index = i;
    const fromLabel = d.anonymous || !d.from ? "一位神秘的夥伴" : esc(d.from);
    const toIcon = d.toType === "all" ? "🌏 " : d.toType === "group" ? "👥 " : "";
    const tag = d.toType === "all"
      ? '<span class="note__tag">全體</span>'
      : d.toType === "group" ? '<span class="note__tag">一整群</span>' : "";
    const photo = d.photoUrl
      ? `<img class="note__photo" src="${esc(d.photoUrl)}" alt="告白照片" loading="lazy" />`
      : "";
    el.innerHTML = `
      <p class="note__to"><small>致</small> ${toIcon}${esc(d.to)}${tag}</p>
      <p class="note__msg">${esc(d.message)}</p>
      ${photo}
      <div class="note__foot">
        <span class="note__from">— ${fromLabel}</span>
        <span>${fmtTime(d.createdAt)}</span>
      </div>`;
    wall.appendChild(el);
  });
}

if (CONFIGURED) {
  const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snap) => {
    allDocs = snap.docs.map((doc) => doc.data());
    render();
  }, (err) => {
    console.error(err);
    wallLoading.textContent = "讀取失敗：" + err.message;
  });
} else {
  wallLoading.hidden = true;
  wallEmpty.hidden = false;
  wallEmpty.textContent = "⚠️ 尚未設定 Firebase，設定完成後這裡就會顯示所有感謝。";
}

// ---------- Present 模式（單則全螢幕展示） ----------
const present = document.getElementById("present");
const pTo = document.getElementById("present-to");
const pMsg = document.getElementById("present-msg");
const pFrom = document.getElementById("present-from");
const pTime = document.getElementById("present-time");
const pIndex = document.getElementById("present-index");
const pTotal = document.getElementById("present-total");
const pPrev = document.getElementById("present-prev");
const pNext = document.getElementById("present-next");
const pClose = document.getElementById("present-close");
const pCard = present.querySelector(".present__card");

let presentList = [];
let presentIdx = 0;

function paintPresent() {
  const d = presentList[presentIdx];
  if (!d) return;
  const toIcon = d.toType === "all" ? "🌏 " : d.toType === "group" ? "👥 " : "";
  pTo.textContent = toIcon + (d.to || "");
  pMsg.textContent = d.message || "";
  pFrom.textContent = "— " + (d.anonymous || !d.from ? "一位神秘的夥伴" : d.from);
  pTime.textContent = fmtTime(d.createdAt);
  pIndex.textContent = presentIdx + 1;
  pTotal.textContent = presentList.length;
  const single = presentList.length <= 1;
  pPrev.hidden = single;
  pNext.hidden = single;
  pCard.scrollTop = 0;
}

function openPresent(idx) {
  presentList = renderedDocs.slice();
  presentIdx = Math.max(0, Math.min(idx, presentList.length - 1));
  if (!presentList.length) return;
  paintPresent();
  present.hidden = false;
  document.body.style.overflow = "hidden";
}

function closePresent() {
  present.hidden = true;
  document.body.style.overflow = "";
}

function move(step) {
  if (presentList.length <= 1) return;
  presentIdx = (presentIdx + step + presentList.length) % presentList.length;
  paintPresent();
}

// 點卡片開啟
wall.addEventListener("click", (e) => {
  const note = e.target.closest(".note");
  if (!note) return;
  openPresent(Number(note.dataset.index));
});

pPrev.addEventListener("click", () => move(-1));
pNext.addEventListener("click", () => move(1));
pClose.addEventListener("click", closePresent);
// 點卡片以外的背景區也可關閉
present.addEventListener("click", (e) => {
  if (!e.target.closest(".present__card") && !e.target.closest(".present__controls")) closePresent();
});

// 鍵盤：← → 切換、Esc 關閉
document.addEventListener("keydown", (e) => {
  if (present.hidden) return;
  if (e.key === "ArrowLeft") move(-1);
  else if (e.key === "ArrowRight") move(1);
  else if (e.key === "Escape") closePresent();
});

// 手機滑動切換
let touchX = null;
present.addEventListener("touchstart", (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
present.addEventListener("touchend", (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) move(dx < 0 ? 1 : -1);
  touchX = null;
}, { passive: true });
