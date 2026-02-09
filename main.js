/* LinkCryptVault - Phantom connect + modern affiliate UI */

const state = {
  connected: false,
  publicKey: null,
  view: "home",
};

// Partner table data (example)
const PARTNERS = [
  { name: "NovaSwap", category: "DEX", deal: "RevShare", url: "https://novaswap.exchange/affiliates" },
  { name: "ArcadePerps", category: "Perps", deal: "Up to 35%", url: "https://arcadeperps.io/partners/apply" },
  { name: "StableBridge", category: "On/Off-ramp", deal: "CPA", url: "https://stablebridge.com/affiliate-program" },
  { name: "FrostWallet", category: "Wallet", deal: "RevShare", url: "https://frostwallet.app/affiliates" },
  { name: "KiteLaunch", category: "Launchpad", deal: "CPA", url: "https://kitelaunch.xyz/affiliate" },
  { name: "PulseStake", category: "Staking", deal: "Up to 18%", url: "https://pulsestake.finance/partners" },
  { name: "OrbitLend", category: "Lending", deal: "RevShare", url: "https://orbitlend.io/affiliate" },
  { name: "DeltaOTC", category: "OTC", deal: "Tiered", url: "https://deltaotc.market/affiliates" },
  { name: "MirageNFT", category: "NFT", deal: "RevShare", url: "https://miragenft.art/affiliate-program" },
  { name: "ApexSignals", category: "Signals", deal: "CPA", url: "https://apexsignals.trade/partners" },
  { name: "ZenBridge", category: "Bridge", deal: "RevShare", url: "https://zenbridge.network/affiliate" },
  { name: "VoltFutures", category: "Futures", deal: "Up to 30%", url: "https://voltfutures.exchange/affiliate" },
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

function maskUrl(url) {
  // Keep protocol + first 2 + last 3 visible, star out the rest
  if (!url) return "—";
  const protoMatch = url.match(/^(https?:\/\/)/i);
  const proto = protoMatch ? protoMatch[1] : "";
  const rest = proto ? url.slice(proto.length) : url;

  if (rest.length <= 8) return proto + "****";

  const head = rest.slice(0, 2);
  const tail = rest.slice(-3);
  const stars = "★".repeat(Math.max(6, rest.length - (head.length + tail.length)));
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

function setWalletUI() {
  const connectBtnText = document.getElementById("connectBtnText");
  if (!connectBtnText) return;

  if (state.connected && state.publicKey) {
    connectBtnText.textContent = `${shortAddress(state.publicKey)} • Connected`;
  } else {
    connectBtnText.textContent = "Connect Wallet";
  }
}

function updateBanner() {
  const banner = document.getElementById("connectBanner");
  if (!banner) return;

  const gatedViews = new Set(["links", "analytics"]);
  const shouldShow = gatedViews.has(state.view) && !state.connected;

  banner.hidden = !shouldShow;
}

function renderPartnersTable() {
  const tbody = document.getElementById("partnersTbody");
  if (!tbody) return;

  const rows = PARTNERS.map((p) => {
    const displayUrl = state.connected ? p.url : maskUrl(p.url);
    return `
      <tr>
        <td class="td-strong">${p.name}</td>
        <td>${p.category}</td>
        <td><span class="deal">${p.deal}</span></td>
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
        <div class="locked-title">Connect wallet to view your links</div>
        <div class="locked-sub">Your affiliate links will appear here once connected.</div>
      </div>
    `;
    return;
  }

  target.innerHTML = `
    <div class="panel-title">Your chosen affiliate links</div>
    <div class="panel-sub">No links selected yet. Once you choose partners, they’ll appear here.</div>
    <div class="table-wrap">
      <table class="table" aria-label="My Links">
        <thead>
          <tr>
            <th>Partner</th>
            <th>Category</th>
            <th>Your Link</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr class="empty-row">
            <td colspan="4">
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
  const lock = document.getElementById("analyticsLock");
  if (lock) lock.hidden = state.connected;

  // Fill tables with placeholder/empty states depending on connected
  const timeline = document.getElementById("timelineTbody");
  const perf = document.getElementById("partnersPerfTbody");

  if (!timeline || !perf) return;

  if (!state.connected) {
    timeline.innerHTML = `
      <tr class="empty-row">
        <td colspan="4">
          <div class="empty-state">
            <div class="empty-title">Locked</div>
            <div class="empty-text">Connect your wallet to view analytics.</div>
          </div>
        </td>
      </tr>
    `;
    perf.innerHTML = `
      <tr class="empty-row">
        <td colspan="4">
          <div class="empty-state">
            <div class="empty-title">Locked</div>
            <div class="empty-text">Connect your wallet to view partner performance.</div>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  // Connected but no data yet (empty states)
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
  // keep placeholders minimal; no fake numbers unless connected + data exists
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

  // Connected but no data
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
  document.getElementById("connectRevealBtn")?.addEventListener("click", connectWallet);
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
  renderAll();
}

document.addEventListener("DOMContentLoaded", init);
