/* Góc ôn tập · Tư tưởng Hồ Chí Minh — logic ứng dụng. Tiến độ tự lưu trong trình duyệt (localStorage). */
(function () {
  const Q = window.QUESTIONS || [], N = Q.length, byN = {};
  Q.forEach((q, i) => (byN[q.n] = i));
  const KEY = "hcm-on-tap-v1", MOCK_SIZE = 60, MOCK_MIN = 45;
  const $ = (s) => document.querySelector(s), app = $("#app");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fresh = () => ({ stat: {}, marks: {}, hist: [], range: [1, Math.min(25, N)] });
  let mem = null;
  const load = () => { try { return Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY))); } catch (e) { return mem || fresh(); } };
  let D = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) { mem = D; } };
  let S = null, timerId = null;

  const QUOTES = ["Không có việc gì khó, chỉ sợ lòng không bền.", "Học, học nữa, học mãi — mỗi câu đúng là một bước nhỏ tiến về phía trước.", "Việc học không bao giờ cùng, còn sống còn phải học.", "Từng chút một, hôm nay thêm một chút hiểu biết."];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const nums = (a, b) => Q.filter((q) => q.n >= a && q.n <= b).map((q) => q.n);
  const L = "ABCD";

  /* ---------- trang chủ ---------- */
  function home() {
    clearInterval(timerId); $("#timer").hidden = true; S = null;
    const done = Object.keys(D.stat).length, right = Object.values(D.stat).filter((s) => s.l === 1).length;
    const wrong = Object.values(D.stat).filter((s) => s.l === 0).length, marks = Object.keys(D.marks).length;
    const pct = done ? Math.round((right / done) * 100) : 0;
    const chips = []; for (let a = 1; a <= N; a += 25) chips.push([a, Math.min(a + 24, N)]);
    const cells = Q.map((q) => { const s = D.stat[q.n]; return `<button class="cell ${s ? (s.l ? "ok" : "bad") : ""} ${D.marks[q.n] ? "mk" : ""}" data-act="one" data-n="${q.n}" title="Câu ${q.n}">${q.n}</button>`; }).join("");
    app.innerHTML = `
    <section class="card hero"><h1>Chào bạn, ôn bài thôi nào 🌿</h1><p>${N} câu trắc nghiệm · tiến độ tự động được lưu lại.</p>
      <p class="quote">“${esc(QUOTES[new Date().getDate() % QUOTES.length])}”</p>
      <div class="stats">
        <div class="stat"><b>${done}/${N}</b><span>Câu đã làm</span><div class="bar"><i style="width:${(done / N) * 100}%"></i></div></div>
        <div class="stat"><b>${pct}%</b><span>Đúng ở lần gần nhất</span><div class="bar"><i style="width:${pct}%"></i></div></div>
        <div class="stat"><b>${wrong}</b><span>Câu cần ôn lại</span></div>
        <div class="stat"><b>${marks}</b><span>Câu đánh dấu ★</span></div>
      </div></section>
    <section class="card"><h3>Ôn theo số câu</h3>
      <div class="chips">${chips.map(([a, b]) => `<button class="chip" data-act="chip" data-a="${a}" data-b="${b}">${a}–${b}</button>`).join("")}</div>
      <div class="range"><span>Từ câu</span><input type="number" id="ra" min="1" max="${N}" value="${D.range[0]}"><span>đến câu</span><input type="number" id="rb" min="1" max="${N}" value="${D.range[1]}"></div>
      <div class="row" style="margin-bottom:14px"><label class="ck"><input type="checkbox" id="rs"> Xáo trộn thứ tự</label><label class="ck"><input type="checkbox" id="rd"> Bỏ qua câu đã đúng</label></div>
      <button class="btn pri" data-act="range">Bắt đầu ôn ✨</button></section>
    <section class="card"><h3>Các chế độ khác</h3><div class="modes">
      <button class="mode" data-act="rand"><b>🎲 Ngẫu nhiên 20 câu</b><span>Rút ngẫu nhiên từ cả bộ đề</span></button>
      <button class="mode" data-act="wrong" ${wrong ? "" : "disabled"}><b>🩹 Ôn câu sai (${wrong})</b><span>Làm lại những câu lần trước chưa đúng</span></button>
      <button class="mode" data-act="marks" ${marks ? "" : "disabled"}><b>★ Câu đã đánh dấu (${marks})</b><span>Những câu bạn muốn xem kỹ</span></button>
      <button class="mode" data-act="mock"><b>📝 Thi thử ${MOCK_SIZE} câu</b><span>${MOCK_MIN} phút, chấm điểm khi nộp bài</span></button></div></section>
    <section class="card"><h3>Bản đồ tiến độ</h3><div class="grid">${cells}</div>
      <div class="legend"><span><i style="background:var(--okbg);border-color:var(--ok)"></i>Đúng</span><span><i style="background:var(--badbg);border-color:var(--bad)"></i>Sai</span><span><i></i>Chưa làm</span><span>Bấm vào số để làm câu đó</span></div></section>
    <div class="foot"><button class="btn sm" data-act="export">⬇ Sao lưu tiến độ</button><button class="btn sm" data-act="import">⬆ Khôi phục</button><button class="btn sm" data-act="theme">🌙 Sáng / tối</button><button class="btn sm" data-act="reset">Xóa tiến độ</button><input type="file" id="file" accept=".json" hidden></div>`;
  }

  /* ---------- bắt đầu phiên ---------- */
  function start(mode, queue, title) {
    if (!queue.length) { alert("Không có câu nào để ôn trong lựa chọn này."); return; }
    S = { mode, title, queue, i: 0, picks: {}, reveal: mode !== "mock", done: false };
    if (mode === "mock") {
      S.end = Date.now() + MOCK_MIN * 60000; const t = $("#timer"); t.hidden = false;
      const tick = () => { const r = Math.max(0, S.end - Date.now()); t.textContent = "⏳ " + String(Math.floor(r / 60000)).padStart(2, "0") + ":" + String(Math.floor((r % 60000) / 1000)).padStart(2, "0"); if (!r) finish(); };
      tick(); timerId = setInterval(tick, 1000);
    }
    quiz(); scrollTo(0, 0);
  }

  /* ---------- màn hình câu hỏi ---------- */
  function quiz() {
    const n = S.queue[S.i], q = Q[byN[n]], pick = S.picks[n], shown = S.reveal || S.done, last = S.i === S.queue.length - 1;
    const opts = q.o.map((t, k) => {
      let cls = "", mark = "", tag = "";
      if (shown && pick !== undefined || (S.done && pick === undefined)) {
        if (k === q.a) { cls = "right"; tag = "Đáp án đúng"; mark = `<svg class="mark" viewBox="0 0 100 40" preserveAspectRatio="none"><path class="g" pathLength="1" d="M6 21C4 8 30 3 55 3s42 3 42 17-30 17-54 17S6 33 6 21z"/></svg>`; }
        else if (k === pick) { cls = "wrong"; tag = "Bạn chọn"; mark = `<svg class="mark" viewBox="0 0 100 40" preserveAspectRatio="none"><path class="r" pathLength="1" d="M3 8 97 33M97 8 3 33"/></svg>`; }
      } else if (k === pick) cls = "sel";
      return `<button class="opt ${cls}" data-k="${k}" ${shown && pick !== undefined || S.done ? "disabled" : ""}><span class="ltr">${L[k]}</span><span class="txt">${esc(t)}</span>${tag ? `<span class="tag">${tag}</span>` : ""}${mark}</button>`;
    }).join("");
    const ok = pick === q.a, v = shown && pick !== undefined ? `<div class="verdict ${ok ? "ok" : "bad"}">${ok ? "Chính xác! 🌸" : "Chưa đúng rồi — đáp án khoanh xanh nhé."}</div>` : "";
    const note = shown && q.w ? `<div class="note">⚠ ${esc(q.w)}</div>` : "";
    const pal = S.queue.map((m, j) => { const p = S.picks[m], c = ["cell"]; if (j === S.i) c.push("cur"); if (p !== undefined) c.push(S.reveal || S.done ? (p === Q[byN[m]].a ? "ok" : "bad") : "sel"); return `<button class="${c.join(" ")}" data-act="go" data-j="${j}">${m}</button>`; }).join("");
    app.innerHTML = `<section class="card">
      <div class="qhead"><span><span class="qno">Câu ${n}</span> &nbsp;${S.i + 1}/${S.queue.length} · ${esc(S.title)}</span><button class="star ${D.marks[n] ? "on" : ""}" data-act="mark" title="Đánh dấu câu này">${D.marks[n] ? "★" : "☆"}</button></div>
      <h2 class="stem">${esc(q.q)}</h2><div class="opts">${opts}</div>${v}${note}
      <div class="nav"><button class="btn" data-act="prev" ${S.i ? "" : "disabled"}>← Trước</button>
        <button class="btn" data-act="home">Về trang chủ</button>
        ${last ? `<button class="btn pri" data-act="finish">${S.done ? "Xem kết quả" : "Hoàn thành ✓"}</button>` : `<button class="btn pri" data-act="next">Sau →</button>`}</div></section>
      <section class="card"><div class="grid">${pal}</div></section>`;
  }

  function choose(k) {
    const n = S.queue[S.i], q = Q[byN[n]];
    if (S.done || S.picks[n] !== undefined && S.reveal) return;
    S.picks[n] = k;
    if (S.reveal) record(n, k === q.a);
    quiz();
  }
  function record(n, ok) {
    const s = D.stat[n] || { r: 0, w: 0, l: 0 }; ok ? s.r++ : s.w++; s.l = ok ? 1 : 0; D.stat[n] = s; save();
  }

  /* ---------- kết quả ---------- */
  function finish() {
    clearInterval(timerId); $("#timer").hidden = true; const first = !S.done;
    if (S.mode === "mock" && first) S.queue.forEach((n) => record(n, S.picks[n] === Q[byN[n]].a));
    S.done = true; S.reveal = true;
    const total = S.queue.length, right = S.queue.filter((n) => S.picks[n] === Q[byN[n]].a).length;
    const bad = S.queue.filter((n) => S.picks[n] !== Q[byN[n]].a);
    if (first) { D.hist.push({ t: Date.now(), mode: S.mode, total, right }); D.hist = D.hist.slice(-50); save(); } S.bad = bad;
    const msg = right / total >= 0.8 ? "Tuyệt vời, bạn nắm bài rất chắc! 🌟" : right / total >= 0.5 ? "Khá ổn rồi, ôn thêm vài câu nữa là vững 🌱" : "Không sao, mỗi lần ôn là một lần nhớ lâu hơn 💪";
    const list = bad.map((n) => { const q = Q[byN[n]], p = S.picks[n]; return `<div class="rv"><b>Câu ${n}.</b> ${esc(q.q)}<br><span class="a">✓ ${L[q.a]}. ${esc(q.o[q.a])}</span>${p !== undefined ? `<br><span class="x">✗ Bạn chọn ${L[p]}. ${esc(q.o[p])}</span>` : `<br><span class="x">✗ Chưa trả lời</span>`}</div>`; }).join("");
    app.innerHTML = `<section class="card" style="text-align:center"><div class="score">${right}/${total}</div><p>${msg}</p>
      <div class="row" style="justify-content:center"><button class="btn pri" data-act="retrywrong" ${bad.length ? "" : "disabled"}>Ôn lại ${bad.length} câu sai</button><button class="btn" data-act="review">Xem lại từng câu</button><button class="btn" data-act="home">Trang chủ</button></div></section>
      ${bad.length ? `<section class="card"><h3>Những câu cần xem lại</h3>${list}</section>` : ""}`;
    scrollTo(0, 0);
  }

  /* ---------- sự kiện ---------- */
  app.addEventListener("click", (e) => {
    const o = e.target.closest(".opt"); if (o && S) return choose(+o.dataset.k);
    const b = e.target.closest("[data-act]"); if (!b || b.disabled) return;
    const a = b.dataset.act;
    if (a === "chip") { $("#ra").value = b.dataset.a; $("#rb").value = b.dataset.b; document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", c === b)); }
    else if (a === "range") {
      let x = Math.max(1, Math.min(N, +$("#ra").value || 1)), y = Math.max(1, Math.min(N, +$("#rb").value || N)); if (x > y) [x, y] = [y, x];
      D.range = [x, y]; save(); let q = nums(x, y);
      if ($("#rd").checked) q = q.filter((n) => !(D.stat[n] && D.stat[n].l));
      if ($("#rs").checked) q = shuffle(q);
      start("range", q, `Câu ${x}–${y}`);
    }
    else if (a === "one") start("range", nums(+b.dataset.n, Math.min(N, +b.dataset.n + 24)), `Từ câu ${b.dataset.n}`);
    else if (a === "rand") start("rand", shuffle(nums(1, N)).slice(0, 20), "Ngẫu nhiên");
    else if (a === "wrong") start("wrong", nums(1, N).filter((n) => D.stat[n] && !D.stat[n].l), "Ôn câu sai");
    else if (a === "marks") start("marks", nums(1, N).filter((n) => D.marks[n]), "Câu đánh dấu");
    else if (a === "mock") start("mock", shuffle(nums(1, N)).slice(0, MOCK_SIZE), "Thi thử");
    else if (a === "retrywrong") start("wrong", S.bad.slice(), "Ôn lại câu sai");
    else if (a === "review") { S.i = 0; quiz(); scrollTo(0, 0); }
    else if (a === "go") { S.i = +b.dataset.j; quiz(); }
    else if (a === "prev") { S.i--; quiz(); }
    else if (a === "next") { S.i++; quiz(); scrollTo(0, 0); }
    else if (a === "finish") S.done && S.bad ? finish() : confirmFinish();
    else if (a === "mark") { const n = S.queue[S.i]; D.marks[n] ? delete D.marks[n] : (D.marks[n] = 1); save(); quiz(); }
    else if (a === "home") home();
    else if (a === "export") { const u = URL.createObjectURL(new Blob([JSON.stringify(D)], { type: "application/json" })), l = document.createElement("a"); l.href = u; l.download = "tien-do-on-tap.json"; l.click(); URL.revokeObjectURL(u); }
    else if (a === "import") $("#file").click();
    else if (a === "theme") { const r = document.documentElement, dark = getComputedStyle(r).getPropertyValue("--ink").trim().startsWith("#ece"); r.dataset.theme = dark ? "light" : "dark"; }
    else if (a === "reset") { if (confirm("Xóa toàn bộ tiến độ đã lưu?")) { D = fresh(); save(); home(); } }
  });
  function confirmFinish() {
    const left = S.queue.filter((n) => S.picks[n] === undefined).length;
    if (S.mode === "mock" && left && !confirm(`Còn ${left} câu chưa làm. Nộp bài luôn?`)) return;
    finish();
  }
  app.addEventListener("change", (e) => {
    if (e.target.id !== "file" || !e.target.files[0]) return;
    const r = new FileReader(); r.onload = () => { try { D = Object.assign(fresh(), JSON.parse(r.result)); save(); home(); alert("Đã khôi phục tiến độ."); } catch (x) { alert("File không hợp lệ."); } }; r.readAsText(e.target.files[0]);
  });
  document.addEventListener("keydown", (e) => {
    if (!S || /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    const k = "abcd1234".indexOf(e.key.toLowerCase());
    if (k >= 0 && document.querySelector(".opts")) choose(k % 4);
    else if (e.key === "ArrowRight" && S.i < S.queue.length - 1 && document.querySelector(".opts")) { S.i++; quiz(); }
    else if (e.key === "ArrowLeft" && S.i > 0 && document.querySelector(".opts")) { S.i--; quiz(); }
  });
  $("#homeLink").addEventListener("click", (e) => { e.preventDefault(); if (S && S.mode === "mock" && !S.done && !confirm("Thoát bài thi thử? Bài làm sẽ không được chấm.")) return; home(); });

  /* cánh hoa rơi */
  const pet = $("#petals");
  for (let i = 0; i < 16; i++) { const p = document.createElement("i"); p.className = "petal"; const s = 8 + Math.random() * 10; Object.assign(p.style, { left: Math.random() * 100 + "%", width: s + "px", height: s * 1.3 + "px", animationDuration: 12 + Math.random() * 14 + "s", animationDelay: -Math.random() * 20 + "s" }); pet.appendChild(p); }
  /* chặn zoom bằng 2 ngón / chạm đúp (iOS Safari bỏ qua user-scalable) */
  ["gesturestart", "gesturechange", "gestureend"].forEach((t) => document.addEventListener(t, (e) => e.preventDefault()));
  document.addEventListener("touchmove", (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
  document.addEventListener("dblclick", (e) => e.preventDefault());
  document.addEventListener("dragstart", (e) => e.preventDefault());
  home();
})();
