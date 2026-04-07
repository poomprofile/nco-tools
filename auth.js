// ═══ NCO AUTH — Gmail whitelist (client-side gate) ═══
// ข้อควรรู้: นี่เป็น soft-gate ป้องกันคนทั่วไป ไม่ใช่ security จริงๆ
// อยากได้ความปลอดภัยสูงต้องใช้ Google OAuth backend

const NCO_ALLOWED = [
  // ─── เพิ่ม/ลบ email ที่อนุญาตตรงนี้ ───
  "poomprofile@gmail.com",
  "fernery11@gmail.com",
  // ใส่ email ทีม DSR ทั้งหมดตรงนี้
];

const AUTH_KEY = "nco_auth_v1";
const AUTH_EXPIRY_HOURS = 72; // login ค้างได้ 72 ชม.

function ncoGetSession() {
  try {
    const raw = sessionStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (Date.now() > s.exp) { sessionStorage.removeItem(AUTH_KEY); return null; }
    return s;
  } catch { return null; }
}

function ncoSaveSession(email) {
  sessionStorage.setItem(AUTH_KEY, JSON.stringify({
    email, exp: Date.now() + AUTH_EXPIRY_HOURS * 3600000
  }));
}

function ncoLogout() {
  sessionStorage.removeItem(AUTH_KEY);
  location.reload();
}

function ncoCheck(email) {
  const e = email.trim().toLowerCase();
  return NCO_ALLOWED.map(x => x.toLowerCase()).includes(e);
}

// ─── Gate: เรียก ncoGate() ที่ top ของทุกหน้า ───
function ncoGate(opts) {
  opts = opts || {};
  const s = ncoGetSession();
  if (s) {
    // Already logged in — inject user bar
    _ncoInjectUserBar(s.email, opts.accentColor || "#00A850");
    return true;
  }
  // Show login overlay — block the page
  _ncoShowLogin(opts);
  return false;
}

function _ncoInjectUserBar(email, color) {
  const bar = document.createElement("div");
  bar.id = "nco-user-bar";
  bar.style.cssText = `
    position:fixed;bottom:16px;right:16px;z-index:9999;
    background:#1E1420;border:1px solid rgba(255,255,255,.15);
    border-radius:40px;padding:8px 14px 8px 10px;
    display:flex;align-items:center;gap:8px;
    font-family:'Barlow','Noto Sans Thai',sans-serif;
    box-shadow:0 4px 20px rgba(0,0,0,.4);
    cursor:pointer;transition:opacity .2s;
    font-size:12px;color:rgba(255,255,255,.7);
  `;
  bar.innerHTML = `
    <span style="width:26px;height:26px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;flex-shrink:0;">
      ${email[0].toUpperCase()}
    </span>
    <span>${email}</span>
    <span style="color:rgba(255,255,255,.3);margin-left:2px">·</span>
    <span onclick="ncoLogout()" style="color:rgba(255,255,255,.5);font-size:11px;cursor:pointer;padding:2px 6px;border-radius:4px;border:1px solid rgba(255,255,255,.1);">ออก</span>
  `;
  document.body.appendChild(bar);
}

function _ncoShowLogin(opts) {
  const color = opts.accentColor || "#00A850";
  const title = opts.title || "NCO Internal Tools";
  // Hide body content
  document.body.style.overflow = "hidden";
  const overlay = document.createElement("div");
  overlay.id = "nco-login-overlay";
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:99999;
    background:#0f0c14;
    display:flex;align-items:center;justify-content:center;
    font-family:'Barlow','Noto Sans Thai',sans-serif;
  `;
  overlay.innerHTML = `
    <div style="
      width:100%;max-width:380px;margin:0 20px;
      background:#1E1420;border:1px solid rgba(255,255,255,.1);
      border-radius:20px;overflow:hidden;
      box-shadow:0 24px 64px rgba(0,0,0,.6);
    ">
      <div style="height:3px;background:linear-gradient(90deg,#D22630,#E8622A,${color})"></div>
      <div style="padding:36px 32px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:28px;">
          <div style="width:40px;height:40px;border-radius:10px;background:${color};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;color:white;letter-spacing:.5px;flex-shrink:0;">NCO</div>
          <div>
            <div style="font-size:16px;font-weight:700;color:white;">Nice Center Oil</div>
            <div style="font-size:11px;color:rgba(255,255,255,.4);margin-top:1px;">${title}</div>
          </div>
        </div>
        <div style="font-size:13px;color:rgba(255,255,255,.6);margin-bottom:20px;line-height:1.6;">
          เฉพาะผู้ใช้ที่ได้รับอนุญาต<br>กรุณากรอก Gmail ของคุณ
        </div>
        <div style="position:relative;margin-bottom:12px;">
          <input id="nco-email-inp" type="email" inputmode="email"
            placeholder="your@gmail.com"
            style="
              width:100%;padding:13px 16px;
              background:rgba(255,255,255,.07);
              border:1px solid rgba(255,255,255,.15);
              border-radius:10px;color:white;
              font-size:15px;font-family:inherit;outline:none;
              transition:border-color .15s;
            "
            onkeydown="if(event.key==='Enter')ncoDoLogin()"
            onfocus="this.style.borderColor='${color}'"
            onblur="this.style.borderColor='rgba(255,255,255,.15)'">
        </div>
        <div id="nco-login-err" style="font-size:12px;color:#f26457;margin-bottom:12px;min-height:18px;"></div>
        <button onclick="ncoDoLogin()" style="
          width:100%;padding:13px;
          background:${color};border:none;border-radius:10px;
          color:white;font-size:15px;font-weight:700;font-family:inherit;
          cursor:pointer;transition:opacity .15s;letter-spacing:.3px;
        " onmouseover="this.style.opacity='.88'" onmouseout="this.style.opacity='1'">
          เข้าสู่ระบบ
        </button>
        <div style="font-size:11px;color:rgba(255,255,255,.25);margin-top:16px;text-align:center;line-height:1.6;">
          ระบบสำหรับทีมงาน Nice Center Oil เท่านั้น<br>
          หากไม่มีสิทธิ์ติดต่อผู้ดูแลระบบ
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => document.getElementById("nco-email-inp")?.focus(), 100);
}

function ncoDoLogin() {
  const inp = document.getElementById("nco-email-inp");
  const err = document.getElementById("nco-login-err");
  if (!inp) return;
  const email = inp.value.trim().toLowerCase();
  if (!email) { err.textContent = "กรุณากรอก email"; return; }
  if (!email.includes("@")) { err.textContent = "รูปแบบ email ไม่ถูกต้อง"; return; }
  if (!ncoCheck(email)) {
    err.textContent = "❌ Email นี้ไม่มีสิทธิ์เข้าใช้งาน";
    inp.style.borderColor = "#f26457";
    return;
  }
  ncoSaveSession(email);
  const overlay = document.getElementById("nco-login-overlay");
  if (overlay) overlay.remove();
  document.body.style.overflow = "";
  _ncoInjectUserBar(email, "#00A850");
}
