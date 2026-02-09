/* LinkCryptVault - Phantom connect + modern affiliate UI */

const state = {
  connected: false,
  publicKey: null,
  view: "home",
};

// Partner table data (example placeholders)
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

function maskAll(text) {
  if (!text) return "—";
  // fully star out (keep length feel)
  return "★".repeat(Math.max(10, text.length));
}

function maskUrl(url) {
  // fully star out url length feel (no hints)
  return maskAll(url);
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

function setWalletUI() {
  const connectBtn = document.getElementById("connectBtn");
  const connectBtnText = document.getElementById("connectBtnText");

  if (!connectBtn || !connectBtnText) return;

  if (state.connected && state.publicKey) {
    connectBtnText.textContent = `${shortAddress(state.publicKey)} • Connected`;
    connectBtn.classList.add("is-connected");
  } else {
    connectBtnText.textContent = "Connect Wallet";
    connectBtn.classList.remove("is-connected");
  }
}

function updateBanner() {
  const banner = document.getElementById("connectBanner");
  const title = document.getElementById("bannerTitle");
  const sub = document.getElementById("bannerSub");
  if (!banner || !title || !sub) return;

  // Banner ONLY on My Links + Analytics when not connected
  if (state.connected) {
    banner.hidden = true;
    return;
  }

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

  // Home + How it works => no banner
  banner.hidden = true;
}

function renderPartnersTable() {
  const tbody = document.getElementById("partnersTbody");
  if (!tbody) return;

  const rows = PARTNERS.map((p) => {
    const displayName = state.connected ? p.name : maskAll(p.name);
    const displayUrl = state.connected ? p.url : maskUrl(p.url);

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

  // No page blur/overlay. Banner is the connect prompt.
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
  setWalletUI();
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

    setWalletUI();
    updateBanner();
    renderAll();
  } catch (err) {
    console.error(err);
  }
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
    setWalletUI();
    updateBanner();
    renderAll();
  });
}

function attachEvents() {
  document.getElementById("connectBtn")?.addEventListener("click", connectWallet);
  document.getElementById("connectStartBtn")?.addEventListener("click", connectWallet);
  document.getElementById("bannerConnectBtn")?.addEventListener("click", connectWallet);

  document.querySelectorAll(".nav-link").forEach((btn) => {
    btn.addEventListener("click", () => showView(btn.dataset.view));
  });
}

function init() {
  attachEvents();
  syncIfAlreadyConnected();
  setWalletUI();
  showView("home");
  updateBanner();
  renderAll();
}

document.addEventListener("DOMContentLoaded", init);
