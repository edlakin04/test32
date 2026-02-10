/* LinkCryptVault - Phantom connect + modern affiliate UI */

const state = {
  connected: false,
  publicKey: null,
  view: "home",

  // Home CTA flow
  connectCtaDismissed: false,
  upgradeCtaDismissed: false,

  // Upgrade (UI only)
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

/* Mask URL: keep protocol + small head + tail visible */
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

function renderHomeActions() {
  const connectBtn = document.getElementById("connectStartBtn");
  const upgradeBtn = document.getElementById("upgradeBtn");
  if (!connectBtn || !upgradeBtn) return;

  // If wallet connected, never show the connect CTA again
  if (state.connected) {
    connectBtn.hidden = true;
    upgradeBtn.hidden = true;
    return;
  }

  // If user hasn't pressed connect CTA yet, show it
  if (!state.connectCtaDismissed) {
    connectBtn.hidden = false;
    upgradeBtn.hidden = true;
    return;
  }

  // After connect CTA pressed, show upgrade CTA (until dismissed)
  connectBtn.hidden = true;
  upgradeBtn.hidden = !!state.upgradeCtaDismissed;
}

function currentRevShare() {
  // UI logic: if upgraded, show 95% for connected users; otherwise 50%
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

function buildAffiliateLink(partner) {
  // UI-only link format (placeholder)
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
  document.getElementById("connectBtn")?.addEventListener("click", connectWallet);
  document.getElementById("disconnectBtn")?.addEventListener("click", disconnectWallet);

  // Home CTA flow
  document.getElementById("connectStartBtn")?.addEventListener("click", async () => {
    // Hide the connect CTA immediately (as requested), then attempt connect via Phantom
    state.connectCtaDismissed = true;
    renderHomeActions();
    await connectWallet();
  });

  document.getElementById("upgradeBtn")?.addEventListener("click", () => {
    // UI-only “purchase”: mark upgraded and remove the button
    state.upgradeCtaDismissed = true;
    state.upgraded = true;
    renderAll();
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

function init() {
  attachEvents();
  syncIfAlreadyConnected();
  showView("home");
  renderAll();
}

document.addEventListener("DOMContentLoaded", init);
