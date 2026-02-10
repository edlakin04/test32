const state = {
  connected: false,
  publicKey: null,
  view: "home",
  upgraded: false,
};

const PARTNERS = [
  { id: "nova", name: "NovaSwap", url: "https://novaswap.exchange/affiliates" },
  { id: "arcade", name: "ArcadePerps", url: "https://arcadeperps.io/partners/apply" },
  { id: "stable", name: "StableBridge", url: "https://stablebridge.com/affiliate-program" },
  { id: "frost", name: "FrostWallet", url: "https://frostwallet.app/affiliates" },
  { id: "kite", name: "KiteLaunch", url: "https://kitelaunch.xyz/affiliate" },
  { id: "pulse", name: "PulseStake", url: "https://pulsestake.finance/partners" },
  { id: "orbit", name: "OrbitLend", url: "https://orbitlend.io/affiliate" },
  { id: "delta", name: "DeltaOTC", url: "https://deltaotc.market/affiliates" },
  { id: "mirage", name: "MirageNFT", url: "https://miragenft.art/affiliate-program" },
  { id: "apex", name: "ApexSignals", url: "https://apexsignals.trade/partners" },
  { id: "zen", name: "ZenBridge", url: "https://zenbridge.network/affiliate" },
  { id: "volt", name: "VoltFutures", url: "https://voltfutures.exchange/affiliate" },
];

function getWalletProvider() {
  return window?.solana || null;
}

function shortAddress(addr) {
  if (!addr || addr.length < 10) return addr || "—";
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function maskNamePartial(name) {
  if (!name) return "—";
  if (name.length <= 2) return "★".repeat(name.length);
  return `${name.slice(0, 1)}${"★".repeat(Math.max(3, name.length - 2))}${name.slice(-1)}`;
}

function maskUrlPartial(url) {
  if (!url) return "—";
  const proto = (url.match(/^(https?:\/\/)/i)?.[1]) || "";
  const rest = proto ? url.slice(proto.length) : url;
  const head = rest.slice(0, 2);
  const tail = rest.slice(-4);
  const stars = "★".repeat(Math.max(10, rest.length - (head.length + tail.length)));
  return proto + head + stars + tail;
}

/* ---------- MODAL ---------- */
const modal = () => document.getElementById("walletModal");
function openModal() {
  const m = modal();
  if (!m) return;
  m.classList.add("is-open");
  m.setAttribute("aria-hidden", "false");
}
function closeModal() {
  const m = modal();
  if (!m) return;
  m.classList.remove("is-open");
  m.setAttribute("aria-hidden", "true");
}

/* ---------- NAV ---------- */
function setActiveNav(view) {
  document.querySelectorAll(".nav-link").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.view === view);
  });
}
function showView(view) {
  state.view = view;
  document.querySelectorAll(".view").forEach((s) => s.classList.remove("is-visible"));
  document.getElementById(`view-${view}`)?.classList.add("is-visible");
  setActiveNav(view);
}

/* ---------- HARD UI CONTROL ---------- */
function forceHeaderUI() {
  const disconnectBtn = document.getElementById("disconnectBtn");
  const connectBtn = document.getElementById("connectBtn");
  const connectBtnText = document.getElementById("connectBtnText");

  if (!disconnectBtn || !connectBtn || !connectBtnText) return;

  if (state.connected && state.publicKey) {
    disconnectBtn.hidden = false;
    connectBtn.classList.add("is-connected");
    connectBtnText.textContent = `${shortAddress(state.publicKey)} • Connected`;
  } else {
    disconnectBtn.hidden = true;
    connectBtn.classList.remove("is-connected");
    connectBtnText.textContent = "Connect Wallet";
  }
}

function ensureConnectRevealButtonExists() {
  const wrap = document.getElementById("homeActionsWrap");
  if (!wrap) return;

  let btn = document.getElementById("connectStartBtn");
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "connectStartBtn";
    btn.className = "btn btn-glow";
    btn.type = "button";
    btn.innerHTML = `<span class="btn-shine" aria-hidden="true"></span>Connect Wallet to Reveal Links`;
    btn.addEventListener("click", connectFlow);
    wrap.prepend(btn);
  }
}

function removeConnectRevealButtonForeverForSession() {
  const btn = document.getElementById("connectStartBtn");
  if (btn) btn.remove();
}

function forceHomeHeroUI() {
  const wrap = document.getElementById("homeActionsWrap");
  const upgradeBtn = document.getElementById("upgradeBtn");
  if (!wrap || !upgradeBtn) return;

  if (state.connected) {
    removeConnectRevealButtonForeverForSession();
    upgradeBtn.hidden = false;

    wrap.classList.remove("hero-actions-duo");
    wrap.classList.add("hero-actions-single");
  } else {
    ensureConnectRevealButtonExists();
    upgradeBtn.hidden = false;

    wrap.classList.add("hero-actions-duo");
    wrap.classList.remove("hero-actions-single");
  }
}

/* ---------- TABLE ---------- */
function currentRevShare() {
  return state.connected && state.upgraded ? "95%" : "50%";
}

function renderPartnersTable() {
  const tbody = document.getElementById("partnersTbody");
  if (!tbody) return;

  const revShare = currentRevShare();

  tbody.innerHTML = PARTNERS.map((p) => {
    const displayName = state.connected ? p.name : maskNamePartial(p.name);
    const displayUrl = state.connected ? p.url : maskUrlPartial(p.url);

    const locked = !state.connected;
    const lockIcon = locked ? `<span class="lock" aria-hidden="true">🔒</span>` : "";
    const disabled = locked ? "disabled" : "";
    const cls = locked ? "btn-mini btn-mini-locked" : "btn-mini";

    return `
      <tr>
        <td class="td-strong">${displayName}</td>
        <td><span class="deal">${revShare}</span></td>
        <td class="mono">${displayUrl}</td>
        <td class="td-actions">
          <button class="${cls}" data-generate="${p.id}" ${disabled} type="button">Generate ${lockIcon}</button>
        </td>
      </tr>
    `;
  }).join("");

  const overlay = document.getElementById("revealOverlay");
  if (overlay) overlay.style.display = state.connected ? "none" : "grid";
}

/* ---------- PAGES ---------- */
function renderLinksPage() {
  const target = document.getElementById("linksContent");
  if (!target) return;

  if (!state.connected) {
    target.innerHTML = `
      <div class="locked-copy">
        <div class="locked-title">Connect wallet to view links</div>
        <div class="locked-sub">Your affiliate links appear here once you connect.</div>
      </div>
    `;
    return;
  }

  target.innerHTML = `
    <div class="panel-head">
      <div class="panel-kicker">Your chosen links</div>
      <div class="panel-desc">Links appear here after you select partner offers.</div>
    </div>

    <div class="table-wrap">
      <table class="table" aria-label="My Links">
        <thead><tr><th>Partner</th><th>Your Link</th><th>Status</th></tr></thead>
        <tbody>
          <tr class="empty-row">
            <td colspan="3">
              <div class="empty-state">
                <div class="empty-title">No links yet</div>
                <div class="empty-text">Use Generate on a partner to create your affiliate link.</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

function renderAnalyticsPage() {
  const timeline = document.getElementById("timelineTbody");
  const perf = document.getElementById("partnersPerfTbody");
  if (!timeline || !perf) return;

  if (!state.connected) {
    timeline.innerHTML = `
      <tr class="empty-row"><td colspan="4">
        <div class="empty-state">
          <div class="empty-title">Connect wallet to view data</div>
          <div class="empty-text">Analytics will populate after you connect.</div>
        </div>
      </td></tr>
    `;
    perf.innerHTML = `
      <tr class="empty-row"><td colspan="4">
        <div class="empty-state">
          <div class="empty-title">Connect wallet to view data</div>
          <div class="empty-text">Partner performance will appear after you connect.</div>
        </div>
      </td></tr>
    `;
    return;
  }

  timeline.innerHTML = `
    <tr class="empty-row"><td colspan="4">
      <div class="empty-state">
        <div class="empty-title">No earnings yet</div>
        <div class="empty-text">Analytics will populate once your links generate activity.</div>
      </div>
    </td></tr>
  `;

  perf.innerHTML = `
    <tr class="empty-row"><td colspan="4">
      <div class="empty-state">
        <div class="empty-title">No partner metrics yet</div>
        <div class="empty-text">Share affiliate links to start tracking clicks and revenue.</div>
      </div>
    </td></tr>
  `;
}

function renderStats() {
  const e = document.getElementById("statEarnings");
  const c = document.getElementById("statClicks");
  const r = document.getElementById("statCvr");
  if (!e || !c || !r) return;

  if (!state.connected) {
    e.textContent = "—";
    c.textContent = "—";
    r.textContent = "—";
  } else {
    e.textContent = "$0.00";
    c.textContent = "0";
    r.textContent = "0.0%";
  }
}

function renderAll() {
  forceHeaderUI();
  forceHomeHeroUI();

  renderPartnersTable();
  renderLinksPage();
  renderAnalyticsPage();
  renderStats();
}

/* ---------- CONNECT / DISCONNECT ---------- */
async function doWalletConnect() {
  const wallet = getWalletProvider();
  if (!wallet) {
    alert("Wallet not detected. Please install a compatible wallet or open this site inside a wallet browser.");
    return null;
  }
  const resp = await wallet.connect();
  return resp?.publicKey?.toString?.() || wallet?.publicKey?.toString?.() || null;
}

async function connectFlow() {
  try {
    const pubkey = await doWalletConnect();
    if (!pubkey) return;

    state.connected = true;
    state.publicKey = pubkey;

    closeModal();
    renderAll();
  } catch (e) {
    console.error(e);
  }
}

async function disconnectFlow() {
  const wallet = getWalletProvider();
  try { await wallet?.disconnect?.(); } catch {}

  state.connected = false;
  state.publicKey = null;

  renderAll();
}

/* ---------- UPGRADE ---------- */
function handleUpgradeClick() {
  if (!state.connected) {
    openModal();
    return;
  }

  state.upgraded = true;

  const upgradeBtn = document.getElementById("upgradeBtn");
  if (upgradeBtn) upgradeBtn.hidden = true;

  renderAll();
}

/* ---------- GENERATE ---------- */
function buildAffiliateLink(p) {
  const base = p.url;
  const ref = state.publicKey ? state.publicKey.slice(0, 8) : "anonymous";
  return `${base}${base.includes("?") ? "&" : "?"}ref=${encodeURIComponent(ref)}`;
}

async function handleGenerate(partnerId) {
  if (!state.connected) return;
  const p = PARTNERS.find((x) => x.id === partnerId);
  if (!p) return;

  const link = buildAffiliateLink(p);
  try {
    await navigator.clipboard.writeText(link);
    alert(`Affiliate link copied:\n\n${link}`);
  } catch {
    alert(`Affiliate link:\n\n${link}`);
  }
}

/* ---------- EVENTS ---------- */
function attachEvents() {
  document.getElementById("connectBtn")?.addEventListener("click", connectFlow);
  document.getElementById("disconnectBtn")?.addEventListener("click", disconnectFlow);

  document.getElementById("connectStartBtn")?.addEventListener("click", connectFlow);
  document.getElementById("upgradeBtn")?.addEventListener("click", handleUpgradeClick);
  document.getElementById("modalConnectBtn")?.addEventListener("click", connectFlow);

  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;

    if (t.matches("[data-modal-close='true']") || t.closest("[data-modal-close='true']")) closeModal();

    const gen = t.closest("[data-generate]");
    if (gen) {
      const id = gen.getAttribute("data-generate");
      if (id && !(gen instanceof HTMLButtonElement && gen.disabled)) handleGenerate(id);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  document.querySelectorAll(".nav-link").forEach((btn) => {
    btn.addEventListener("click", () => showView(btn.dataset.view));
  });
}

function init() {
  state.connected = false;
  state.publicKey = null;

  attachEvents();
  showView("home");
  renderAll();
}

document.addEventListener("DOMContentLoaded", init);
