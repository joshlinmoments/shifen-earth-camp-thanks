// ============================================================
//  永續十分地球營 · 感謝告白牆 — 前端邏輯
// ============================================================
import { firebaseConfig, STAFF_LIST, displayName } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getStorage, ref as storageRef, uploadBytes, getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const CONFIGURED = !firebaseConfig.apiKey.startsWith("REPLACE_ME");

let db, storage;
if (CONFIGURED) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);
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

// ---------- 建立名單下拉選單 ----------
const toSelect = document.getElementById("to-select");
const filterSelect = document.getElementById("filter-select");
const toCustomField = document.getElementById("to-custom-field");
const toCustom = document.getElementById("to-custom");

STAFF_LIST.forEach((p, i) => {
  const label = `${p.role} · ${p.name}${p.nick ? "（" + p.nick + "）" : ""}`;
  const shown = displayName(p);
  // 選單 value 存「留言牆顯示名稱」，方便直接使用
  toSelect.appendChild(new Option(label, `staff:${i}`));
  filterSelect.appendChild(new Option(shown, shown));
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

// ---------- 照片預覽 ----------
const photoInput = document.getElementById("photo");
const photoBtn = document.getElementById("photo-btn");
const photoName = document.getElementById("photo-name");
const photoPreview = document.getElementById("photo-preview");
photoBtn.addEventListener("click", () => photoInput.click());
photoInput.addEventListener("change", () => {
  const f = photoInput.files[0];
  if (!f) { photoName.textContent = "尚未選擇"; photoPreview.hidden = true; return; }
  photoName.textContent = f.name;
  photoPreview.src = URL.createObjectURL(f);
  photoPreview.hidden = false;
});

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

  // 解析對象
  let to = "";
  if (toSelect.value === "custom") {
    to = toCustom.value.trim();
  } else if (toSelect.value.startsWith("staff:")) {
    to = displayName(STAFF_LIST[Number(toSelect.value.split(":")[1])]);
  }
  if (!to) { setStatus("請選擇或輸入感謝的對象 🙏", "err"); return; }

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
    let photoUrl = "";
    const file = photoInput.files[0];
    if (file) {
      setStatus("📷 上傳照片中…", "");
      const path = `photos/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${file.name}`;
      const snap = await uploadBytes(storageRef(storage, path), file);
      photoUrl = await getDownloadURL(snap.ref);
    }

    await addDoc(collection(db, "messages"), {
      to,
      from,
      anonymous: isAnon,
      message,
      photoUrl,
      createdAt: serverTimestamp(),
    });

    form.reset();
    msgCount.textContent = "0";
    photoName.textContent = "尚未選擇";
    photoPreview.hidden = true;
    toCustomField.hidden = true;
    fromInput.disabled = false;
    setStatus("✨ 感謝已送出，你的天燈正在升空！", "ok");
    // 自動切到感謝牆
    document.querySelector('.tab[data-view="wall"]').click();
  } catch (err) {
    console.error(err);
    setStatus("送出失敗：" + (err.message || err), "err");
  } finally {
    submitBtn.disabled = false;
  }
});

// ---------- 感謝牆即時載入 ----------
const wall = document.getElementById("wall");
const wallEmpty = document.getElementById("wall-empty");
const wallLoading = document.getElementById("wall-loading");
const countEl = document.getElementById("count");
let allDocs = [];

function fmtTime(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function esc(s) {
  return (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function render() {
  const filter = filterSelect.value;
  const list = filter ? allDocs.filter((d) => d.to === filter) : allDocs;
  countEl.textContent = allDocs.length;
  wall.innerHTML = "";
  wallLoading.hidden = true;
  wallEmpty.hidden = list.length !== 0;

  for (const d of list) {
    const el = document.createElement("article");
    el.className = "note";
    const fromLabel = d.anonymous || !d.from ? "一位神秘的夥伴" : esc(d.from);
    const photo = d.photoUrl
      ? `<img class="note__photo" src="${esc(d.photoUrl)}" alt="感謝照片" loading="lazy" />`
      : "";
    el.innerHTML = `
      <p class="note__to"><small>致</small> ${esc(d.to)}</p>
      <p class="note__msg">${esc(d.message)}</p>
      ${photo}
      <div class="note__foot">
        <span class="note__from">— ${fromLabel}</span>
        <span>${fmtTime(d.createdAt)}</span>
      </div>`;
    wall.appendChild(el);
  }
}

filterSelect.addEventListener("change", render);

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

// ---------- Lightbox ----------
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
wall.addEventListener("click", (e) => {
  if (e.target.classList.contains("note__photo")) {
    lightboxImg.src = e.target.src;
    lightbox.hidden = false;
  }
});
lightbox.addEventListener("click", () => { lightbox.hidden = true; lightboxImg.src = ""; });
