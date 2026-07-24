(() => {
  "use strict";

  const PREFIX = "sam-tanks-";
  const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  const $ = (id) => document.getElementById(id);
  const startPanel = $("startPanel");
  const roomPanel = $("roomPanel");
  const hostButton = $("hostButton");
  const joinButton = $("joinButton");
  const joinCode = $("joinCode");
  const statusDot = $("statusDot");
  const statusText = $("statusText");
  const hostCodeArea = $("hostCodeArea");
  const hostCode = $("hostCode");
  const copyCodeButton = $("copyCodeButton");
  const incomingArea = $("incomingArea");
  const acceptButton = $("acceptButton");
  const declineButton = $("declineButton");
  const controlsArea = $("controlsArea");
  const angle = $("angle");
  const power = $("power");
  const angleOutput = $("angleOutput");
  const powerOutput = $("powerOutput");
  const fireButton = $("fireButton");
  const log = $("log");
  const resetButton = $("resetButton");

  let peer = null;
  let connection = null;
  let pendingConnection = null;
  let role = null;
  let accepted = false;
  let isResetting = false;
  let acceptRequested = false;

  function makeCode(length = 6) {
    const bytes = new Uint32Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, n => CODE_CHARS[n % CODE_CHARS.length]).join("");
  }

  function cleanCode(value) {
    return value.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 6);
  }

  function setStatus(text, kind = "waiting") {
    statusText.textContent = text;
    statusDot.className = "status-dot";
    if (kind === "connected") statusDot.classList.add("connected");
    if (kind === "error") statusDot.classList.add("error");
  }

  function addLog(message, kind = "") {
    const row = document.createElement("div");
    row.className = `log-entry ${kind}`.trim();
    const time = document.createElement("span");
    time.className = "log-time";
    time.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    row.append(time, document.createTextNode(message));
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
  }

  function showRoom() {
    startPanel.classList.add("hidden");
    roomPanel.classList.remove("hidden");
  }

  function libraryAvailable() {
    if (typeof window.Peer === "function") return true;
    showRoom();
    setStatus("PeerJS could not load", "error");
    addLog("The PeerJS library did not load. Check the internet connection or content-blocking settings.", "bad");
    return false;
  }

  function commonPeerEvents(instance) {
    instance.on("error", (error) => {
      if (isResetting) return;
      console.error(error);
      const messages = {
        "peer-unavailable": "That host code was not found. Check the code and try again.",
        "network": "The signalling service could not be reached.",
        "server-error": "The signalling service reported an error.",
        "socket-error": "The signalling connection failed.",
        "socket-closed": "The signalling connection closed.",
        "browser-incompatible": "This browser does not support the required WebRTC features.",
        "invalid-id": "The room code was rejected.",
        "unavailable-id": "That room code is already in use. Creating another one…"
      };

      if (role === "host" && error.type === "unavailable-id") {
        safelyDestroyPeer();
        setTimeout(startHost, 150);
        return;
      }

      const message = messages[error.type] || `Connection error: ${error.type || error.message || "unknown error"}`;
      setStatus("Connection error", "error");
      addLog(message, "bad");
    });

    instance.on("disconnected", () => {
      if (!isResetting && (!connection || !connection.open)) {
        setStatus("Signalling service disconnected", "error");
        addLog("The introduction service disconnected before the peer link was ready.", "bad");
      }
    });
  }

  function startHost() {
    if (!libraryAvailable()) return;
    role = "host";
    accepted = false;
    showRoom();
    hostCodeArea.classList.remove("hidden");
    controlsArea.classList.add("hidden");
    incomingArea.classList.add("hidden");
    setStatus("Creating host code…");

    const code = makeCode();
    hostCode.textContent = code;
    addLog("Creating a temporary host identity…");

    peer = new Peer(PREFIX + code, { debug: 1 });
    commonPeerEvents(peer);

    peer.on("open", () => {
      setStatus("Waiting for a guest");
      addLog(`Host ready. Share code ${code}.`);
    });

    peer.on("connection", (incoming) => {
      if (connection || pendingConnection) {
        incoming.close();
        return;
      }

      pendingConnection = incoming;
      wireConnection(incoming);
      incomingArea.classList.remove("hidden");
      setStatus("Guest requesting access");
      addLog("A guest has reached the host. Accept or decline the request.");
    });
  }

  function startGuest() {
    if (!libraryAvailable()) return;
    const code = cleanCode(joinCode.value);
    joinCode.value = code;
    if (code.length !== 6) {
      joinCode.focus();
      return;
    }

    role = "guest";
    accepted = false;
    showRoom();
    setStatus("Contacting host…");
    addLog(`Looking for host ${code}…`);

    peer = new Peer(undefined, { debug: 1 });
    commonPeerEvents(peer);

    peer.on("open", () => {
      const outgoing = peer.connect(PREFIX + code, {
        reliable: true,
        serialization: "json",
        metadata: { application: "tanks-p2p-demo", request: "join" }
      });
      connection = outgoing;
      wireConnection(outgoing);
    });
  }

  function wireConnection(conn) {
    conn.on("open", () => {
      if (role === "guest") {
        setStatus("Waiting for host to accept");
        addLog("Direct data channel opened. Waiting for the host's approval.");
      } else {
        addLog("Direct data channel is ready; approval is still required.");
        if (acceptRequested) finalizeGuestAcceptance();
      }
    });

    conn.on("data", (data) => {
      handleData(data);
    });

    conn.on("close", () => {
      if (isResetting) return;
      accepted = false;
      controlsArea.classList.add("hidden");
      incomingArea.classList.add("hidden");
      setStatus("Other player disconnected", "error");
      addLog("The peer-to-peer connection closed.", "bad");
      connection = null;
      pendingConnection = null;
    });

    conn.on("error", (error) => {
      if (isResetting) return;
      console.error(error);
      setStatus("Peer connection error", "error");
      addLog(`Peer link error: ${error.message || error.type || "unknown error"}`, "bad");
    });
  }

  function handleData(data) {
    if (!data || typeof data !== "object") {
      addLog("Received unrecognised data.", "bad");
      return;
    }

    if (data.type === "accepted") {
      accepted = true;
      controlsArea.classList.remove("hidden");
      setStatus("Connected directly", "connected");
      addLog("Host accepted. The browsers can now exchange game data directly.", "received");
      return;
    }

    if (data.type === "declined") {
      setStatus("Host declined the request", "error");
      addLog("The host declined the join request.", "bad");
      return;
    }

    if (data.type === "shot" && accepted) {
      addLog(`RECEIVED SHOT — angle ${data.angle}°, power ${data.power}, shot #${data.shotNumber}`, "received");
      flashReceivedShot(data);
      return;
    }

    if (data.type === "shot-ack" && accepted) {
      addLog(`Remote browser confirmed shot #${data.shotNumber}.`, "received");
    }
  }

  function acceptGuest() {
    if (!pendingConnection) return;
    acceptRequested = true;
    acceptButton.disabled = true;
    acceptButton.textContent = "Accepting…";

    if (pendingConnection.open) finalizeGuestAcceptance();
    else addLog("Approval recorded; completing the direct data channel…");
  }

  function finalizeGuestAcceptance() {
    if (!pendingConnection || !pendingConnection.open) return;
    connection = pendingConnection;
    pendingConnection = null;
    acceptRequested = false;
    acceptButton.disabled = false;
    acceptButton.textContent = "Accept";
    accepted = true;
    incomingArea.classList.add("hidden");
    controlsArea.classList.remove("hidden");
    setStatus("Connected directly", "connected");
    connection.send({ type: "accepted" });
    addLog("Guest accepted. The peer-to-peer link is active.", "received");
  }

  function declineGuest() {
    if (!pendingConnection) return;
    acceptRequested = false;
    acceptButton.disabled = false;
    acceptButton.textContent = "Accept";
    if (pendingConnection.open) pendingConnection.send({ type: "declined" });
    setTimeout(() => pendingConnection && pendingConnection.close(), 100);
    pendingConnection = null;
    incomingArea.classList.add("hidden");
    setStatus("Waiting for a guest");
    addLog("Join request declined.");
  }

  function sendShot() {
    if (!connection || !connection.open || !accepted) {
      addLog("No accepted peer connection is ready.", "bad");
      return;
    }

    const packet = {
      type: "shot",
      angle: Number(angle.value),
      power: Number(power.value),
      shotNumber: Date.now()
    };

    connection.send(packet);
    addLog(`SENT SHOT — angle ${packet.angle}°, power ${packet.power}`, "sent");
  }

  function flashReceivedShot(data) {
    const previous = fireButton.textContent;
    fireButton.textContent = `INCOMING: ${data.angle}° / POWER ${data.power}`;
    fireButton.disabled = true;
    setTimeout(() => {
      fireButton.textContent = previous;
      fireButton.disabled = false;
    }, 850);
    if (connection && connection.open) {
      connection.send({ type: "shot-ack", shotNumber: data.shotNumber });
    }
  }

  async function copyCode() {
    const code = hostCode.textContent;
    try {
      await navigator.clipboard.writeText(code);
      copyCodeButton.textContent = "Copied";
      setTimeout(() => { copyCodeButton.textContent = "Copy"; }, 1200);
    } catch {
      addLog(`Copy was blocked. Manually copy: ${code}`, "bad");
    }
  }

  function safelyDestroyPeer() {
    try { if (connection) connection.close(); } catch {}
    try { if (pendingConnection) pendingConnection.close(); } catch {}
    try { if (peer && !peer.destroyed) peer.destroy(); } catch {}
    peer = null;
    connection = null;
    pendingConnection = null;
  }

  function resetAll() {
    isResetting = true;
    safelyDestroyPeer();
    role = null;
    accepted = false;
    acceptRequested = false;
    acceptButton.disabled = false;
    acceptButton.textContent = "Accept";
    log.replaceChildren();
    hostCodeArea.classList.add("hidden");
    incomingArea.classList.add("hidden");
    controlsArea.classList.add("hidden");
    roomPanel.classList.add("hidden");
    startPanel.classList.remove("hidden");
    joinCode.value = "";
    setStatus("Starting…");
    setTimeout(() => { isResetting = false; }, 50);
  }

  hostButton.addEventListener("click", startHost);
  joinButton.addEventListener("click", startGuest);
  joinCode.addEventListener("input", () => { joinCode.value = cleanCode(joinCode.value); });
  joinCode.addEventListener("keydown", (event) => { if (event.key === "Enter") startGuest(); });
  copyCodeButton.addEventListener("click", copyCode);
  acceptButton.addEventListener("click", acceptGuest);
  declineButton.addEventListener("click", declineGuest);
  fireButton.addEventListener("click", sendShot);
  resetButton.addEventListener("click", resetAll);
  angle.addEventListener("input", () => { angleOutput.textContent = `${angle.value}°`; });
  power.addEventListener("input", () => { powerOutput.textContent = power.value; });
  window.addEventListener("beforeunload", safelyDestroyPeer);
})();
