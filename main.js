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

/* Mask middle letters: keep first + last visible */
function maskNamePartial(name) {
  if (!name) return "—";
  if (name.length <= 2) return "★".repeat(name.length);
  const first = name.slice(0, 1);
  const last = name.slice(-1);
  const mid = "★".repeat(Math.max(3, name.length - 2));
  return `${first}${mid}${last}`;
}

/* Mask URL: keep protocol + a tiny hint, star main bit, keep tail */
function maskUrlPartial(url) {
  if (!url) return "—";
  const protoMatch = url.match(/^(https?:\/\/)/i);
  const proto = protoMatch ? protoMatch[1] : "";
  const rest = proto ? url.slice(proto.length) : url;

  // keep first 2 chars of rest + last 4 chars
  if (rest.length <= 10) return proto + "★".repeat(Math.max(8, rest.length));
  const head = rest.slice(0, 2);
  const tail = rest.slice(-4);
  const stars = "★".repeat(Math.max(10, rest.length - (head.length + tail.length)));
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

function renderHomeConnectButtonVisibility() {
  const wrap = document.getElementById("homeConnectWrap");
  if (!wrap) return;
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
    await phantom?.disconnect?.();
  } catch (_) {
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
