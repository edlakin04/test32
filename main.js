/* LinkCryptVault - Phantom connect + modern affiliate UI */

const state = {
  connected: false,
  publicKey: null,
  view: "home",
};

const PARTNERS = [
  { name: "NovaSwap", url: "https://novaswap.exchange/affiliates" },
  { name: "ArcadePerps", url: "https://arcadeperps.io/partners/apply" },
  { name: "StableBridge", url: "https://stablebridge.com/affiliate-program" },
  { name: "FrostWallet", url: "https://frostwallet.app/affiliates" },
  { name: "KiteLaunch", url: "https://kitelaunch.xyz/affiliate" },
  { name: "PulseStake", url: "https://pulsestake.finance/partners" },
  { name: "OrbitLend", url: "https://orbitlend.io/affiliate" },
  { name: "DeltaOTC", url: "https://deltaotc.market/affiliates" },
  { name: "MirageNFT", url: "https://miragenft.art/affiliate-program" },
  { name: "ApexSignals", url: "https://apexsignals.trade/partners" },
  { name: "ZenBridge", url: "https://zenbridge.network/affiliate" },
  { name: "VoltFutures", url: "https://voltfutures.exchange/affiliate" },
];

function getPhantom() {
  const provider = window?.solana;
  if (provider?.isPhantom) return provider;
  return null;
}

function shortAddress(addr) {
  if (!addr || addr.length < 10) return addr || "—";
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

/**
 * Mask middle letters of a name: show first + last, star the middle.
 * Example: NovaSwap -> N★★★★★p
 */
function maskNamePartial(name) {
  if (!name) return "—";
  if (name.length <= 2) return "★".repeat(name.length);
  const first = name.slice(0, 1);
  const last = name.slice(-1);
  const mid = "★".repeat(Math.max(3, name.length - 2));
  return `${first}${mid}${last}`;
}

/**
 * Mask URL partially: keep protocol + maybe first domain char + TLD/end.
 * Example: https://novaswap.exchange/affiliates
 * -> https://n★★★★★★★★★★★★★★★★★★★es
 */
function maskUrlPartial(url) {
  if (!url) return "—";
  const protoMatch = url.match(/^(https?:\/\/)/i);
  const proto = protoMatch ? protoMatch[1] : "";
  const rest = proto ? url.slice(proto.length) : url;

  // keep first 1 char of rest and last 2 chars
  if (rest.length <= 6) return proto + "★".repeat(Math.max(4, rest.length));
  const head = rest.slice(0, 1);
  const tail = rest.slice(-2);
  const stars = "★".repeat(Math.max(10, rest.length - 3));
  return proto + head + stars + tail;
}

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
  updateBanner();
  renderAll();
}

function setHeaderButtons() {
  const connectBtn = document.getElementById("connectBtn");
  const connectBtnText = document.getElementById("connectBtnText");
  const disconnectBtn = document.getElementById("disconnectBtn");
  if (!connectBtn || !connectBtnText || !disconnectBtn) return;

  if (state.connected && state.publicKey) {
    connectBtnText.textContent = `${shortAddress(state.publicKey)} • Connected`;
    connectBtn.classList.add("is-connected");
    disconnectBtn.hidden = false;
  } else {
    connectBtnText.textContent = "Connect Wallet";
    connectBtn.classList.remove("is-connected");
    disconnectBtn.hidden = true;
  }
}

function updateBanner() {
  const banner = document.getElementById("connectBanner");
  const title = document.getElementById("bannerTitle");
  const sub = document.getElementById("bannerSub");
  if (!banner || !title || !sub) return;

  // Must disappear when connected
  if (state.connected) {
    banner.hidden = true;
    return;
  }

  // Must NOT show on Home or How it works
  if (state.view === "home" || state.view === "how") {
    banner.hidden = true;
    return;
  }

  // Only show on Links / Analytics when disconnected
  if (state.view === "links") {
    title.textContent = "Connect your wallet to see your links.";
    sub.textContent = "Your generated affiliate links will appear here once connected.";
    banner.hidden = false;
    return;
  }

  if (state.view === "analytics") {
    title.textContent = "Connect your wallet to view your data.";
    sub.textContent = "Analytics and performance metrics appear after you connect.";
    banner.hidden = false;
    return;
  }

  banner.hidden = true;
}

function renderHomeConnectButtonVisibility() {
  const wrap = document.getElementById("homeConnectWrap");
  if (!wrap) return;

  // When connected, remove intro connect button
  wrap.style.display = state.connected ? "none" : "flex";
}

function renderPartnersTable() {
  const tbody = document.getElementById("partnersTbody");
  if (!tbody) return;

  const rows = PARTNERS.map((p) => {
    const displayName = state.connected ? p.name : maskNamePartial(p.name);
    const displayUrl = state.connected ? p.url : maskUrlPartial(p.url);

    return `
      <tr>
        <td class="td-strong">${displayName}</td>
        <td><span class="deal">50%</span></td>
        <td class="mono">${displayUrl}</td>
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
        <div class="locked-title">Your links are locked</div>
        <div class="locked-sub">Connect your wallet to view and manage your affiliate links.</div>
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
                <div class="empty-text">Select a partner to generate your affiliate link.</div>
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

  // No blur overlay; show empty/locked copy inside tables when disconnected
  if (!state.connected) {
    timeline.innerHTML = `
      <tr class="empty-row">
        <td colspan="4">
          <div class="empty-state">
            <div class="empty-title">No data</div>
            <div class="empty-text">Connect your wallet to view analytics data.</div>
          </div>
        </td>
      </tr>
    `;
    perf.innerHTML = `
      <tr class="empty-row">
        <td colspan="4">
          <div class="empty-state">
            <div class="empty-title">No data</div>
            <div class="empty-text">Connect your wallet to view partner performance.</div>
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
  updateBanner();
  renderHomeConnectButtonVisibility();
  renderPartnersTable();
  renderLinksPage();
  renderAnalyticsPage();
  renderStats();
}

async function connectWallet() {
  const phantom = getPhantom();
  if (!phantom) {
    alert("Phantom Wallet not detected. Please install Phantom or open this site inside Phantom’s browser.");
    return;
  }

  try {
    const resp = await phantom.connect();
    const pubkey = resp?.publicKey?.toString?.() || phantom?.publicKey?.toString?.();

    state.connected = true;
    state.publicKey = pubkey || null;

    renderAll();
  } catch (err) {
    console.error(err);
  }
}

async function disconnectWallet() {
  const phantom = getPhantom();
  try {
    // Phantom supports disconnect in many environments
    await phantom?.disconnect?.();
  } catch (e) {
    // ignore
  }

  state.connected = false;
  state.publicKey = null;

  renderAll();
}

function syncIfAlreadyConnected() {
  const phantom = getPhantom();
  if (!phantom) return;

  const pubkey = phantom?.publicKey?.toString?.();
  if (pubkey) {
    state.connected = true;
    state.publicKey = pubkey;
  }

  phantom.on?.("accountChanged", (publicKey) => {
    if (publicKey) {
      state.connected = true;
      state.publicKey = publicKey.toString();
    } else {
      state.connected = false;
      state.publicKey = null;
    }
    renderAll();
  });
}

function attachEvents() {
  document.getElementById("connectBtn")?.addEventListener("click", connectWallet);
  document.getElementById("connectStartBtn")?.addEventListener("click", connectWallet);
  document.getElementById("bannerConnectBtn")?.addEventListener("click", connectWallet);
  document.getElementById("disconnectBtn")?.addEventListener("click", disconnectWallet);

  document.querySelectorAll(".nav-link").forEach((btn) => {
    btn.addEventListener("click", () => showView(btn.dataset.view));
  });
}

function init() {
  attachEvents();
  syncIfAlreadyConnected();
  showView("home");
  renderAll();
}

document.addEventListener("DOMContentLoaded", init);
