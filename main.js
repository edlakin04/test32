/* LinkCryptVault - UI-perfect connect flow (button-driven) */

const state = {
  // IMPORTANT: This is UI-driven. We still call wallet.connect(),
  // but the UI state is controlled by clicks to match the exact prototype behavior.
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
  const provider = window?.solana;
  if (provider) return provider;
  return null;
}

function shortAddress(addr) {
  if (!addr || addr.length < 10) return addr || "—";
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function maskNamePartial(name) {
  if (!name) return "—";
  if (name.length <= 2) return "★".repeat(name.length);
  const first = name.slice(0, 1);
  const last = name.slice(-1);
  const mid = "★".repeat(Math.max(3, name.length - 2));
  return `${first}${mid}${last}`;
}

function maskUrlPartial(url) {
  if (!url) return "—";
  const protoMatch = url.match(/^(https?:\/\/)/i);
  const proto = protoMatch ? protoMatch[1] : "";
  const rest = proto ? url.slice(proto.length) : url;

  if (rest.length <= 10) return proto + "★".repeat(Math.max(8, rest.length));
  const head = rest.slice(0, 2);
  const tail = rest.slice(-4);
  const stars = "★".repeat(Math.max(10, rest.length - (head.length + tail.length)));
  return proto + head + stars + tail;
}

/* ---------- NAV ---------- */
function setActiveNav(view) {
  document.querySelectorAll(".nav-link").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.view === view);
  });
}

function showView(view) {
  state.view = view;

  document.querySelectorAll(".view").forEach((section) => {
    section.classList.remove("is-visible");
  });

  const el = document.getElementById(`view-${view}`);
  if (el) el.classList.add("is-visible");

  setActiveNav(view);
  renderAll();
}

/* ---------- MODAL ---------- */
function modalEl() {
  return document.getElementById("walletModal");
}
function openModal() {
  const m = modalEl();
  if (!m) return;
  m.classList.add("is-open");
  m.setAttribute("aria-hidden", "false");
}
function closeModal() {
  const m = modalEl();
  if (!m) return;
  m.classList.remove("is-open");
  m.setAttribute("aria-hidden", "true");
}

/* ---------- UI RULES (BUTTON-DRIVEN) ---------- */
/*
  Rules we enforce exactly:

  - Disconnect button ONLY visible when connected (state.connected = true)
  - Home CTA:
      disconnected => show Connect-to-Reveal + $399 button (two buttons)
      connected    => show ONLY $399 button centered, connect-to-reveal hidden
  - If $399 pressed while disconnected => modal appears (connect required)
*/

function setHeaderButtons() {
  const connectBtn = document.getElementById("connectBtn");
  const connectBtnText = document.getElementById("connectBtnText");
  const disconnectBtn = document.getElementById("disconnectBtn");
  if (!connectBtn || !connectBtnText || !disconnectBtn) return;

  if (state.connected && state.publicKey) {
    connectBtnText.textContent = `${shortAddress(state.publicKey)} • Connected`;
    connectBtn.classList.add("is-connected");
    disconnectBtn.hidden = false; // ✅ only when connected
  } else {
    connectBtnText.textContent = "Connect Wallet";
    connectBtn.classList.remove("is-connected");
    disconnectBtn.hidden = true; // ✅ hidden when disconnected
  }
}

function renderHomeActions() {
  const connectStartBtn = document.getElementById("connectStartBtn");
  const upgradeBtn = document.getElementById("upgradeBtn");
  const wrap = document.getElementById("homeActionsWrap");
  if (!connectStartBtn || !upgradeBtn || !wrap) return;

  if (state.connected) {
    // ✅ once connected, connect-to-reveal disappears
    connectStartBtn.hidden = true;

    // ✅ only $399 remains
    upgradeBtn.hidden = false;

    // ✅ centered single CTA layout
    wrap.classList.remove("hero-actions-duo");
    wrap.classList.add("hero-actions-single");
    return;
  }

  // disconnected: show both buttons
  connectStartBtn.hidden = false;
  upgradeBtn.hidden = false;

  wrap.classList.add("hero-actions-duo");
  wrap.classList.remove("hero-actions-single");
}

function currentRevShare() {
  if (state.connected && state.upgraded) return "95%";
  return "50%";
}

function renderPartnersTable() {
  const tbody = document.getElementById("partnersTbody");
  if (!tbody) return;

  const revShare = currentRevShare();

  const rows = PARTNERS.map((p) => {
    const displayName = state.connected ? p.name : maskNamePartial(p.name);
    const displayUrl = state.connected ? p.url : maskUrlPartial(p.url);

    const locked = !state.connected;
    const lockIcon = locked ? `<span class="lock" aria-hidden="true">🔒</span>` : "";
    const btnDisabled = locked ? "disabled" : "";
    const btnClass = locked ? "btn-mini btn-mini-locked" : "btn-mini";

    return `
      <tr>
        <td class="td-strong">${displayName}</td>
        <td><span class="deal">${revShare}</span></td>
        <td class="mono">${displayUrl}</td>
        <td class="td-actions">
          <button class="${btnClass}" data-generate="${p.id}" ${btnDisabled} type="button">
            Generate ${lockIcon}
          </button>
        </td>
      </tr>
    `;
  }).join("");

  tbody.innerHTML = rows;

  const overlay = document.getElementById("revealOverlay");
  if (overlay) overlay.style.display = state.connected ? "none" : "grid";
}

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
        <thead>
          <tr>
            <th>Partner</th>
            <th>Your Link</th>
            <th>Status</th>
          </tr>
        </thead>
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
      <tr class="empty-row">
        <td colspan="4">
          <div class="empty-state">
            <div class="empty-title">Connect wallet to view data</div>
            <div class="empty-text">Analytics will populate after you connect.</div>
          </div>
        </td>
      </tr>
    `;
    perf.innerHTML = `
      <tr class="empty-row">
        <td colspan="4">
          <div class="empty-state">
            <div class="empty-title">Connect wallet to view data</div>
            <div class="empty-text">Partner performance will appear after you connect.</div>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  timeline.innerHTML = `
    <tr class="empty-row">
      <td colspan="4">
        <div class="empty-state">
          <div class="empty-title">No earnings yet</div>
          <div class="empty-text">Analytics will populate once your links generate activity.</div>
        </div>
      </td>
    </tr>
  `;

  perf.innerHTML = `
    <tr class="empty-row">
      <td colspan="4">
        <div class="empty-state">
          <div class="empty-title">No partner metrics yet</div>
          <div class="empty-text">Share affiliate links to start tracking clicks and revenue.</div>
        </div>
      </td>
    </tr>
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
    return;
  }

  e.textContent = "$0.00";
  c.textContent = "0";
  r.textContent = "0.0%";
}

function renderAll() {
  setHeaderButtons();
  renderHomeActions();
  renderPartnersTable();
  renderLinksPage();
  renderAnalyticsPage();
  renderStats();
}

/* ---------- CONNECT/DISCONNECT (BUTTON-DRIVEN UI) ---------- */
async function doWalletConnect() {
  const wallet = getWalletProvider();
  if (!wallet) {
    alert("Wallet not detected. Please install a compatible wallet or open this site inside a wallet browser.");
    return null;
  }
  const resp = await wallet.connect();
  const pubkey = resp?.publicKey?.toString?.() || wallet?.publicKey?.toString?.();
  return pubkey || null;
}

async function connectFlow() {
  try {
    const pubkey = await doWalletConnect();
    if (!pubkey) return;

    // ✅ UI now treated as connected because user clicked connect and connect succeeded
    state.connected = true;
    state.publicKey = pubkey;

    // ✅ close modal if it was open
    closeModal();

    renderAll();
  } catch (err) {
    console.error(err);
  }
}

async function disconnectFlow() {
  const wallet = getWalletProvider();
  try {
    await wallet?.disconnect?.();
  } catch (_) {}

  // ✅ UI now treated as disconnected
  state.connected = false;
  state.publicKey = null;

  renderAll();
}

/* ---------- UPGRADE CTA ---------- */
function handleUpgradeClick() {
  // ✅ if not connected, show modal (connect required)
  if (!state.connected) {
    openModal();
    return;
  }

  // UI-only upgrade (hide button after click)
  state.upgraded = true;

  const upgradeBtn = document.getElementById("upgradeBtn");
  if (upgradeBtn) upgradeBtn.hidden = true;

  renderAll();
}

/* ---------- GENERATE LINK ---------- */
function buildAffiliateLink(partner) {
  const base = partner.url;
  const ref = state.publicKey ? state.publicKey.slice(0, 8) : "anonymous";
  return `${base}${base.includes("?") ? "&" : "?"}ref=${encodeURIComponent(ref)}`;
}

async function handleGenerate(partnerId) {
  if (!state.connected) return;

  const partner = PARTNERS.find((p) => p.id === partnerId);
  if (!partner) return;

  const link = buildAffiliateLink(partner);

  try {
    await navigator.clipboard.writeText(link);
    alert(`Affiliate link copied:\n\n${link}`);
  } catch {
    alert(`Affiliate link:\n\n${link}`);
  }
}

function attachEvents() {
  // Header buttons
  document.getElementById("connectBtn")?.addEventListener("click", connectFlow);
  document.getElementById("disconnectBtn")?.addEventListener("click", disconnectFlow);

  // Home CTAs
  document.getElementById("connectStartBtn")?.addEventListener("click", connectFlow);
  document.getElementById("upgradeBtn")?.addEventListener("click", handleUpgradeClick);

  // Modal connect + close
  document.getElementById("modalConnectBtn")?.addEventListener("click", connectFlow);

  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;

    if (t.matches("[data-modal-close='true']")) closeModal();
    if (t.closest("[data-modal-close='true']")) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // Nav
  document.querySelectorAll(".nav-link").forEach((btn) => {
    btn.addEventListener("click", () => showView(btn.dataset.view));
  });

  // Table generate buttons (event delegation)
  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;

    const btn = target.closest("[data-generate]");
    if (!btn) return;

    const partnerId = btn.getAttribute("data-generate");
    if (!partnerId) return;

    if (btn instanceof HTMLButtonElement && btn.disabled) return;
    handleGenerate(partnerId);
  });
}

function init() {
  attachEvents();
  showView("home");

  // Start fully disconnected for perfect presentation
  state.connected = false;
  state.publicKey = null;

  renderAll();
}

document.addEventListener("DOMContentLoaded", init);
