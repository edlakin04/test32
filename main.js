/* LinkCryptVault - Phantom connect + modern gated UI */

const state = {
  connected: false,
  publicKey: null,
};

function getPhantom() {
  const provider = window?.solana;
  if (provider?.isPhantom) return provider;
  return null;
}

function shortAddress(addr) {
  if (!addr || addr.length < 10) return addr || "—";
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function setActiveNav(view) {
  document.querySelectorAll(".nav-link").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.view === view);
  });
}

function showView(view) {
  document.querySelectorAll(".view").forEach((section) => {
    section.classList.remove("is-visible");
  });
  const el = document.getElementById(`view-${view}`);
  if (el) el.classList.add("is-visible");

  setActiveNav(view);
  renderGatedPanels();
}

function setWalletUI() {
  const connectBtnText = document.getElementById("connectBtnText");
  const walletAddress = document.getElementById("walletAddress");
  const walletStatus = document.getElementById("walletStatus");
  const walletBadgeText = document.getElementById("walletBadgeText");
  const statusText = document.getElementById("statusText");
  const statusDot = document.getElementById("statusDot");

  if (state.connected && state.publicKey) {
    connectBtnText.textContent = shortAddress(state.publicKey);
    walletAddress.textContent = state.publicKey;
    walletStatus.textContent = "Connected";
    walletBadgeText.textContent = "Wallet: Connected";
    statusText.textContent = `Connected: ${shortAddress(state.publicKey)}`;
    statusDot.classList.add("is-on");
  } else {
    connectBtnText.textContent = "Connect Wallet";
    walletAddress.textContent = "—";
    walletStatus.textContent = "Not connected";
    walletBadgeText.textContent = "Wallet: Disconnected";
    statusText.textContent = "Not connected";
    statusDot.classList.remove("is-on");
  }
}

function renderGatedPanels() {
  // My Links panel
  const linksPanel = document.getElementById("linksPanel");
  // Earnings panel
  const earningsPanel = document.getElementById("earningsPanel");

  if (!linksPanel || !earningsPanel) return;

  if (!state.connected) {
    linksPanel.innerHTML = gateCard("Connect wallet to view your links.");
    earningsPanel.innerHTML =
      gateCard("Connect wallet to view earnings.") +
      gateCard("Connect wallet to view clicks & partner metrics.");
    return;
  }

  // Connected: show empty states (no selections/data in this UI-only build)
  linksPanel.innerHTML = `
    <div class="panel-inner">
      <div class="panel-title">Your chosen affiliate links</div>
      <div class="table-wrap">
        <table class="table">
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
                  <div class="empty-text">Choose a partner link to see it here.</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  earningsPanel.innerHTML = `
    <div class="panel">
      <div class="panel-inner">
        <div class="panel-title">Earnings timeline</div>
        <div class="panel-sub">Total earned and recent activity.</div>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Earnings</th>
                <th>Conversions</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr class="empty-row">
                <td colspan="4">
                  <div class="empty-state">
                    <div class="empty-title">No data</div>
                    <div class="empty-text">No links selected yet — connect a partner to start tracking.</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-inner">
        <div class="panel-title">Clicks & partner metrics</div>
        <div class="panel-sub">Clicks, CTR, and partner performance breakdown.</div>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Partner</th>
                <th>Clicks</th>
                <th>CTR</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr class="empty-row">
                <td colspan="4">
                  <div class="empty-state">
                    <div class="empty-title">No data</div>
                    <div class="empty-text">Metrics will appear once you generate and share affiliate links.</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function gateCard(message) {
  return `
    <div class="panel">
      <div class="panel-inner gate">
        <div class="gate-title">${message}</div>
        <button class="btn btn-primary js-connect" type="button">
          <span class="btn-dot" aria-hidden="true"></span>
          Connect Wallet
        </button>
        <div class="gate-sub">Connect your Phantom wallet to unlock this section.</div>
      </div>
    </div>
  `;
}

async function connectWallet() {
  const phantom = getPhantom();
  if (!phantom) {
    alert("Phantom Wallet not detected. Please install Phantom or open in the Phantom in-app browser.");
    return;
  }

  try {
    const resp = await phantom.connect();
    const pubkey = resp?.publicKey?.toString?.() || phantom?.publicKey?.toString?.();
    state.connected = true;
    state.publicKey = pubkey || null;

    setWalletUI();
    renderGatedPanels();
  } catch (err) {
    // User rejected or other error
    console.error(err);
  }
}

function attachEvents() {
  // Header connect button
  document.getElementById("connectBtn")?.addEventListener("click", connectWallet);

  // Home connect buttons
  document.getElementById("connectStartBtn")?.addEventListener("click", connectWallet);
  document.getElementById("connectTableBtn")?.addEventListener("click", connectWallet);

  // Nav view switching
  document.querySelectorAll(".nav-link").forEach((btn) => {
    btn.addEventListener("click", () => showView(btn.dataset.view));
  });

  // Delegate connect clicks inside gated cards
  document.body.addEventListener("click", (e) => {
    const target = e.target;
    const btn = target?.closest?.(".js-connect");
    if (btn) connectWallet();
  });
}

function syncIfAlreadyConnected() {
  const phantom = getPhantom();
  if (!phantom) return;

  // If Phantom already has a publicKey (previously connected)
  const pubkey = phantom?.publicKey?.toString?.();
  if (pubkey) {
    state.connected = true;
    state.publicKey = pubkey;
  }

  // Keep UI in sync if user changes accounts in Phantom
  phantom.on?.("accountChanged", (publicKey) => {
    if (publicKey) {
      state.connected = true;
      state.publicKey = publicKey.toString();
    } else {
      state.connected = false;
      state.publicKey = null;
    }
    setWalletUI();
    renderGatedPanels();
  });
}

function init() {
  attachEvents();
  syncIfAlreadyConnected();
  setWalletUI();
  renderGatedPanels();
  showView("home");
}

document.addEventListener("DOMContentLoaded", init);
