(() => {
  "use strict";

  const PREFIX = "sam-red-blue-tanks-";
  const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const WORLD_HEIGHT = 100;
  const MIN_TERRAIN_SAMPLES = 560;
  const TEAM_NAMES = { blue: "Blue", red: "Red" };
  const OTHER_TEAM = { blue: "red", red: "blue" };
  const WIND_LABELS = ["None", "Low", "Medium", "High", "Wild"];
  const WIND_LIMITS = [0, 1.5, 3.25, 5.5, 8.5];
  const WORLD_WIDTHS = { compact: 130, standard: 180, wide: 270, massive: 430, epic: 680 };
  const LOCATION_PRESETS = {
    earth: { label: "Earth", gravity: 9.81, wind: 2, terrainBase: 26 },
    moon: { label: "Moon", gravity: 1.62, wind: 0, terrainBase: 22 },
    mars: { label: "Mars", gravity: 3.71, wind: 2, terrainBase: 25 },
    space: { label: "Space asteroid", gravity: 0.65, wind: 1, terrainBase: 21 }
  };

  const $ = (id) => document.getElementById(id);
  const dom = {
    homeScreen: $("homeScreen"),
    lobbyScreen: $("lobbyScreen"),
    gameScreen: $("gameScreen"),
    connectionPill: $("connectionPill"),
    connectionText: $("connectionText"),
    locationSelect: $("locationSelect"),
    gravityInput: $("gravityInput"),
    gravityOutput: $("gravityOutput"),
    tankSizeInput: $("tankSizeInput"),
    tankSizeOutput: $("tankSizeOutput"),
    worldSizeSelect: $("worldSizeSelect"),
    windInput: $("windInput"),
    windOutput: $("windOutput"),
    hitsInput: $("hitsInput"),
    hitsOutput: $("hitsOutput"),
    presetButton: $("presetButton"),
    hostButton: $("hostButton"),
    botButton: $("botButton"),
    joinCode: $("joinCode"),
    joinButton: $("joinButton"),
    homeNotice: $("homeNotice"),
    lobbyTitle: $("lobbyTitle"),
    lobbyMessage: $("lobbyMessage"),
    roomCodeWrap: $("roomCodeWrap"),
    roomCode: $("roomCode"),
    copyCodeButton: $("copyCodeButton"),
    incomingRequest: $("incomingRequest"),
    declineButton: $("declineButton"),
    acceptButton: $("acceptButton"),
    rulesSummary: $("rulesSummary"),
    lobbyLog: $("lobbyLog"),
    leaveLobbyButton: $("leaveLobbyButton"),
    blueRoleLabel: $("blueRoleLabel"),
    redRoleLabel: $("redRoleLabel"),
    blueHits: $("blueHits"),
    redHits: $("redHits"),
    turnLabel: $("turnLabel"),
    windLabel: $("windLabel"),
    worldLabel: $("worldLabel"),
    blueScore: $("blueScore"),
    redScore: $("redScore"),
    roundNumber: $("roundNumber"),
    canvasFrame: $("canvasFrame"),
    canvas: $("gameCanvas"),
    canvasMessage: $("canvasMessage"),
    canvasMessageTitle: $("canvasMessageTitle"),
    canvasMessageSub: $("canvasMessageSub"),
    canvasMessageActions: $("canvasMessageActions"),
    replayRequestButton: $("replayRequestButton"),
    replayAcceptButton: $("replayAcceptButton"),
    replayDeclineButton: $("replayDeclineButton"),
    fullscreenButton: $("fullscreenButton"),
    moveLeftButton: $("moveLeftButton"),
    moveRightButton: $("moveRightButton"),
    moveStatus: $("moveStatus"),
    angleInput: $("angleInput"),
    angleOutput: $("angleOutput"),
    powerInput: $("powerInput"),
    powerOutput: $("powerOutput"),
    fireButton: $("fireButton"),
    telemetryWind: $("telemetryWind"),
    telemetryGravity: $("telemetryGravity"),
    telemetryMove: $("telemetryMove"),
    telemetryHits: $("telemetryHits"),
    connectionBadge: $("connectionBadge"),
    soundButton: $("soundButton"),
    chatLog: $("chatLog"),
    chatForm: $("chatForm"),
    chatInput: $("chatInput"),
    eventLog: $("eventLog"),
    restartRoundButton: $("restartRoundButton"),
    regenerateMapButton: $("regenerateMapButton"),
    roundControlBadge: $("roundControlBadge"),
    roundControlNote: $("roundControlNote"),
    leaveGameButton: $("leaveGameButton")
  };

  const ctx = dom.canvas.getContext("2d");

  let peer = null;
  let connection = null;
  let pendingConnection = null;
  let role = null;
  let accepted = false;
  let acceptRequested = false;
  let isResetting = false;
  let gameState = null;
  let animation = null;
  let localInputPending = false;
  let botTimer = null;
  let pendingActionRequest = null;
  let localActionRequest = null;
  let soundEnabled = true;
  let audioContext = null;
  let lastFrameTime = performance.now();

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function round(value, places = 2) {
    const factor = 10 ** places;
    return Math.round(value * factor) / factor;
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function makeCode(length = 6) {
    const bytes = new Uint32Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, n => CODE_CHARS[n % CODE_CHARS.length]).join("");
  }

  function cleanCode(value) {
    return value.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 6);
  }

  function mulberry32(seed) {
    let value = seed >>> 0;
    return () => {
      value += 0x6D2B79F5;
      let t = value;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function randomSeed() {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return values[0];
  }

  function setScreen(name) {
    dom.homeScreen.classList.toggle("hidden", name !== "home");
    dom.lobbyScreen.classList.toggle("hidden", name !== "lobby");
    dom.gameScreen.classList.toggle("hidden", name !== "game");
  }

  function setConnectionStatus(text, kind = "offline") {
    dom.connectionText.textContent = text;
    dom.connectionPill.className = `connection-pill ${kind}`;
  }

  function addLobbyLog(message) {
    const row = document.createElement("div");
    row.className = "log-row";
    const time = document.createElement("time");
    time.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    row.append(time, document.createTextNode(message));
    dom.lobbyLog.appendChild(row);
    dom.lobbyLog.scrollTop = dom.lobbyLog.scrollHeight;
  }

  function addEvent(message, kind = "") {
    const row = document.createElement("div");
    row.className = `event-row ${kind}`.trim();
    row.textContent = `${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}  ${message}`;
    dom.eventLog.appendChild(row);
    dom.eventLog.scrollTop = dom.eventLog.scrollHeight;
  }

  function addChatMessage(sender, text, mine = false, bot = false) {
    const bubble = document.createElement("div");
    bubble.className = `chat-message${mine ? " mine" : ""}${bot ? " bot" : ""}`;
    const label = document.createElement("strong");
    label.textContent = sender;
    bubble.append(label, document.createTextNode(text));
    dom.chatLog.appendChild(bubble);
    dom.chatLog.scrollTop = dom.chatLog.scrollHeight;
  }

  function libraryAvailable() {
    if (typeof window.Peer === "function") return true;
    dom.homeNotice.textContent = "The connection library did not load. Check the internet connection or content-blocking settings.";
    setConnectionStatus("PeerJS unavailable", "error");
    return false;
  }

  function readSettings() {
    return {
      location: dom.locationSelect.value,
      gravity: Number(dom.gravityInput.value),
      tankSize: Number(dom.tankSizeInput.value),
      worldSize: dom.worldSizeSelect.value,
      worldWidth: WORLD_WIDTHS[dom.worldSizeSelect.value],
      windVariability: Number(dom.windInput.value),
      hitsToDestroy: Number(dom.hitsInput.value)
    };
  }

  function applyLocationPreset() {
    const preset = LOCATION_PRESETS[dom.locationSelect.value];
    dom.gravityInput.value = preset.gravity;
    dom.windInput.value = preset.wind;
    updateSettingOutputs();
  }

  function updateSettingOutputs() {
    dom.gravityOutput.textContent = Number(dom.gravityInput.value).toFixed(2);
    dom.tankSizeOutput.textContent = `${dom.tankSizeInput.value}%`;
    dom.windOutput.textContent = WIND_LABELS[Number(dom.windInput.value)];
    dom.hitsOutput.textContent = dom.hitsInput.value;
  }

  function renderRulesSummary(settings) {
    const values = [
      ["Location", LOCATION_PRESETS[settings.location].label],
      ["Gravity", settings.gravity.toFixed(2)],
      ["Tank", `${settings.tankSize}%`],
      ["World", capitalize(settings.worldSize)],
      ["Wind", WIND_LABELS[settings.windVariability]],
      ["Direct hits", settings.hitsToDestroy]
    ];
    dom.rulesSummary.replaceChildren();
    values.forEach(([label, value]) => {
      const chip = document.createElement("div");
      chip.className = "rule-chip";
      const labelNode = document.createElement("span");
      const valueNode = document.createElement("strong");
      labelNode.textContent = label;
      valueNode.textContent = value;
      chip.append(labelNode, valueNode);
      dom.rulesSummary.appendChild(chip);
    });
  }

  function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function commonPeerEvents(instance) {
    instance.on("error", (error) => {
      if (isResetting) return;
      console.error(error);
      const messages = {
        "peer-unavailable": "That host code was not found.",
        network: "The introduction service could not be reached.",
        "server-error": "The introduction service reported an error.",
        "socket-error": "The signalling connection failed.",
        "socket-closed": "The signalling connection closed.",
        "browser-incompatible": "This browser does not support WebRTC.",
        "invalid-id": "The room code was rejected.",
        "unavailable-id": "That room code is already being used."
      };

      if (role === "host" && error.type === "unavailable-id") {
        safelyDestroyPeer();
        setTimeout(startHost, 120);
        return;
      }

      const message = messages[error.type] || `Connection error: ${error.type || error.message || "unknown"}`;
      setConnectionStatus("Connection error", "error");
      if (!dom.lobbyScreen.classList.contains("hidden")) addLobbyLog(message);
      if (!dom.gameScreen.classList.contains("hidden")) {
        addEvent(message, "error");
        showCanvasMessage("CONNECTION LOST");
      }
    });

    instance.on("disconnected", () => {
      if (isResetting || (connection && connection.open)) return;
      setConnectionStatus("Introduction lost", "error");
      addLobbyLog("The introduction service disconnected before the direct link was ready.");
    });
  }

  function startHost() {
    if (!libraryAvailable()) return;
    resetTransientState(false);
    role = "host";
    accepted = false;
    const settings = readSettings();
    renderRulesSummary(settings);
    dom.lobbyTitle.textContent = "Waiting for a challenger";
    dom.lobbyMessage.textContent = "Share the code. The match data will travel directly between browsers.";
    dom.roomCodeWrap.classList.remove("hidden");
    dom.incomingRequest.classList.add("hidden");
    setScreen("lobby");
    setConnectionStatus("Creating room", "waiting");

    const code = makeCode();
    dom.roomCode.textContent = code;
    addLobbyLog("Creating a temporary host identity…");
    peer = new Peer(PREFIX + code, { debug: 1 });
    commonPeerEvents(peer);

    peer.on("open", () => {
      setConnectionStatus("Waiting for guest", "waiting");
      addLobbyLog(`Host ready. Share code ${code}.`);
    });

    peer.on("connection", (incoming) => {
      if (connection || pendingConnection) {
        incoming.close();
        return;
      }
      pendingConnection = incoming;
      wireConnection(incoming);
      dom.incomingRequest.classList.remove("hidden");
      dom.lobbyTitle.textContent = "Incoming challenger";
      setConnectionStatus("Approval required", "waiting");
      addLobbyLog("A guest has reached the host. Accept or decline.");
    });
  }

  function startGuest() {
    if (!libraryAvailable()) return;
    const code = cleanCode(dom.joinCode.value);
    dom.joinCode.value = code;
    if (code.length !== 6) {
      dom.homeNotice.textContent = "Enter the complete six-character room code.";
      dom.joinCode.focus();
      return;
    }

    resetTransientState(false);
    role = "guest";
    accepted = false;
    dom.lobbyTitle.textContent = "Contacting host";
    dom.lobbyMessage.textContent = "The host must approve the connection before the battle begins.";
    dom.roomCodeWrap.classList.add("hidden");
    dom.incomingRequest.classList.add("hidden");
    dom.rulesSummary.innerHTML = '<div class="rule-chip"><span>Rules</span><strong>Waiting for host</strong></div>';
    setScreen("lobby");
    setConnectionStatus("Contacting host", "waiting");
    addLobbyLog(`Looking for room ${code}…`);

    peer = new Peer(undefined, { debug: 1 });
    commonPeerEvents(peer);
    peer.on("open", () => {
      const outgoing = peer.connect(PREFIX + code, {
        reliable: true,
        serialization: "json",
        metadata: { application: "red-blue-tanks", version: 2, request: "join" }
      });
      connection = outgoing;
      wireConnection(outgoing);
    });
  }

  function wireConnection(conn) {
    conn.on("open", () => {
      if (role === "guest") {
        dom.lobbyTitle.textContent = "Waiting for host approval";
        dom.lobbyMessage.textContent = "The direct data channel is ready.";
        setConnectionStatus("Awaiting host", "waiting");
        addLobbyLog("Direct peer channel opened. Waiting for approval.");
      } else {
        addLobbyLog("Direct data channel is ready.");
        if (acceptRequested) finalizeGuestAcceptance();
      }
    });

    conn.on("data", handleNetworkData);

    conn.on("close", () => {
      if (isResetting) return;
      accepted = false;
      connection = null;
      pendingConnection = null;
      setConnectionStatus("Other player left", "error");
      if (!dom.gameScreen.classList.contains("hidden")) {
        addEvent("The other player disconnected.", "error");
        showCanvasMessage("OPPONENT DISCONNECTED");
        updateGameControls();
      } else {
        dom.lobbyTitle.textContent = "Connection closed";
        dom.lobbyMessage.textContent = "Return to the start screen and create or join another room.";
        addLobbyLog("The peer-to-peer connection closed.");
      }
    });

    conn.on("error", (error) => {
      if (isResetting) return;
      console.error(error);
      setConnectionStatus("Peer link error", "error");
      const message = `Peer link error: ${error.message || error.type || "unknown"}`;
      if (!dom.gameScreen.classList.contains("hidden")) addEvent(message, "error");
      else addLobbyLog(message);
    });
  }

  function handleNetworkData(data) {
    if (!data || typeof data !== "object") return;

    switch (data.type) {
      case "accepted":
        if (role !== "guest") return;
        accepted = true;
        renderRulesSummary(data.settings);
        dom.lobbyTitle.textContent = "Host accepted";
        dom.lobbyMessage.textContent = "Receiving the battlefield…";
        setConnectionStatus("Connected directly", "online");
        addLobbyLog("Host accepted the connection.");
        break;

      case "declined":
        if (role !== "guest") return;
        dom.lobbyTitle.textContent = "Join request declined";
        dom.lobbyMessage.textContent = "The host did not accept this connection.";
        setConnectionStatus("Request declined", "error");
        addLobbyLog("The host declined the join request.");
        break;

      case "game-init":
        if (role !== "guest") return;
        accepted = true;
        enterGame(data.state);
        addEvent("Battlefield received from host.");
        break;

      case "input":
        if (role !== "host" || !accepted) return;
        handleGuestInput(data);
        break;

      case "state":
        if (role !== "guest") return;
        gameState = data.state;
        localInputPending = false;
        animation = null;
        updateGameUI(true);
        if (data.message) addEvent(data.message);
        break;

      case "shot":
        if (role !== "guest") return;
        localInputPending = false;
        beginShotAnimation(data.packet);
        break;

      case "round-start":
        if (role !== "guest") return;
        enterGame(data.state, true);
        addEvent(data.message || "A new round has started.");
        break;

      case "action-request":
        receiveActionRequest(data);
        break;

      case "action-response":
        receiveActionResponse(data);
        break;

      case "chat":
        if (typeof data.text !== "string") return;
        addChatMessage(TEAM_NAMES[data.sender] || "Player", data.text.slice(0, 180));
        playChatSound();
        break;

      default:
        break;
    }
  }

  function acceptGuest() {
    if (!pendingConnection) return;
    acceptRequested = true;
    dom.acceptButton.disabled = true;
    dom.acceptButton.textContent = "Accepting…";
    if (pendingConnection.open) finalizeGuestAcceptance();
    else addLobbyLog("Approval recorded; completing the direct data channel…");
  }

  function finalizeGuestAcceptance() {
    if (!pendingConnection || !pendingConnection.open) return;
    connection = pendingConnection;
    pendingConnection = null;
    acceptRequested = false;
    accepted = true;
    dom.acceptButton.disabled = false;
    dom.acceptButton.textContent = "Accept";
    dom.incomingRequest.classList.add("hidden");
    connection.send({ type: "accepted", settings: readSettings() });
    addLobbyLog("Guest accepted. Generating the shared battlefield…");
    const state = createGameState(readSettings());
    connection.send({ type: "game-init", state });
    enterGame(state);
    addEvent("Guest connected. Blue fires first.");
  }

  function declineGuest() {
    if (!pendingConnection) return;
    acceptRequested = false;
    dom.acceptButton.disabled = false;
    dom.acceptButton.textContent = "Accept";
    if (pendingConnection.open) pendingConnection.send({ type: "declined" });
    setTimeout(() => pendingConnection && pendingConnection.close(), 80);
    pendingConnection = null;
    dom.incomingRequest.classList.add("hidden");
    dom.lobbyTitle.textContent = "Waiting for a challenger";
    setConnectionStatus("Waiting for guest", "waiting");
    addLobbyLog("Join request declined.");
  }

  function startBotGame() {
    resetTransientState(false);
    role = "bot";
    accepted = true;
    setConnectionStatus("Computer opponent", "online");
    const state = createGameState(readSettings());
    enterGame(state);
    addEvent("Computer opponent ready. Blue fires first.");
    addChatMessage("Computer", "Systems online. Try not to scratch the paint.", false, true);
  }

  function createGameState(settings, session = {}) {
    const seed = randomSeed();
    const terrain = generateTerrain(settings, seed);
    const spawnPositions = chooseSpawnPositions(terrain, settings, seed);
    guaranteeSpawnHeightDifference(terrain, spawnPositions, settings);
    const padRadius = Math.max(2.8, 5.4 * (settings.tankSize / 100));
    flattenTerrain(terrain, spawnPositions.blue, settings.worldWidth, padRadius);
    flattenTerrain(terrain, spawnPositions.red, settings.worldWidth, padRadius);

    const scores = session.scores ? deepClone(session.scores) : { blue: 0, red: 0 };
    const roundNumber = Number.isFinite(session.round) ? session.round : 1;
    const state = {
      version: 2,
      seed,
      settings,
      terrain: terrain.map(value => round(value, 3)),
      baseTerrain: terrain.map(value => round(value, 3)),
      spawnPositions: deepClone(spawnPositions),
      tanks: {
        blue: { x: round(spawnPositions.blue, 3), hits: 0, alive: true, angle: 45, power: 62 },
        red: { x: round(spawnPositions.red, 3), hits: 0, alive: true, angle: 135, power: 62 }
      },
      scores,
      round: roundNumber,
      turn: "blue",
      movedThisTurn: false,
      wind: randomWind(settings),
      winner: null,
      shotNumber: 0
    };
    return state;
  }

  function terrainSampleCount(settings) {
    return Math.max(MIN_TERRAIN_SAMPLES, Math.round(settings.worldWidth * 5));
  }

  function generateTerrain(settings, seed) {
    const random = mulberry32(seed);
    const base = LOCATION_PRESETS[settings.location].terrainBase;
    const count = terrainSampleCount(settings);
    const phase1 = random() * Math.PI * 2;
    const phase2 = random() * Math.PI * 2;
    const phase3 = random() * Math.PI * 2;
    const phase4 = random() * Math.PI * 2;
    const values = [];
    let drift = 0;
    const broadAmplitude = 7 + random() * 8;
    const mediumAmplitude = 3 + random() * 5;
    const roughAmplitude = 1.2 + random() * 2.8;
    const broadFrequency = 0.72 + random() * 0.62;

    for (let i = 0; i < count; i += 1) {
      const t = i / (count - 1);
      drift = drift * 0.965 + (random() - 0.5) * 0.82;
      let height = base
        + Math.sin(t * Math.PI * 2 * broadFrequency + phase1) * broadAmplitude
        + Math.sin(t * Math.PI * 2 * 2.4 + phase2) * mediumAmplitude
        + Math.sin(t * Math.PI * 2 * 5.8 + phase3) * roughAmplitude
        + Math.sin(t * Math.PI * 2 * 12.5 + phase4) * 0.75
        + drift;

      if (settings.location === "moon") height += Math.sin(t * Math.PI * 15 + phase2) * 2.2;
      if (settings.location === "mars") height += Math.sin(t * Math.PI * 5 + phase1) * 3.4;
      if (settings.location === "space") height += Math.sin(t * Math.PI * 10 + phase3) * 3.1;
      values.push(clamp(height, 7, 61));
    }

    smoothArray(values, 2);
    addMajorTerrainFeatures(values, settings, random);
    addMinorCliffs(values, settings, random);
    return values.map(value => round(clamp(value, 5, 72), 3));
  }

  function addMajorTerrainFeatures(values, settings, random) {
    const featureCount = 1 + Math.floor(random() * 3);
    for (let feature = 0; feature < featureCount; feature += 1) {
      const type = Math.floor(random() * 4);
      const center = 0.36 + random() * 0.28;
      const width = 0.025 + random() * 0.085;
      const amplitude = 11 + random() * 23;
      for (let i = 0; i < values.length; i += 1) {
        const t = i / (values.length - 1);
        const d = Math.abs(t - center);
        if (type === 0) {
          const shape = Math.exp(-((d / width) ** 2) * 1.6);
          values[i] += amplitude * shape;
        } else if (type === 1) {
          const inner = width * 0.56;
          const edge = Math.max(width * 0.12, 0.004);
          const left = smoothStep(center - width, center - inner, t);
          const right = 1 - smoothStep(center + inner, center + width, t);
          values[i] += amplitude * left * right;
        } else if (type === 2) {
          const shape = Math.max(0, 1 - d / width);
          values[i] -= amplitude * 0.72 * shape * shape;
        } else {
          const signedDistance = (t - center) / Math.max(width * 0.16, 0.004);
          const step = (Math.tanh(signedDistance) + 1) / 2;
          const envelope = Math.max(0, 1 - Math.abs(t - center) / (width * 2.5));
          values[i] += amplitude * (step - 0.5) * envelope * 1.45;
        }
      }
    }

    if (random() < 0.56) {
      const center = 0.48 + (random() - 0.5) * 0.08;
      const halfWidth = 0.012 + random() * 0.025;
      const height = 17 + random() * 28;
      for (let i = 0; i < values.length; i += 1) {
        const t = i / (values.length - 1);
        const d = Math.abs(t - center);
        if (d < halfWidth) values[i] += height;
        else if (d < halfWidth * 1.22) {
          values[i] += height * (1 - (d - halfWidth) / (halfWidth * 0.22));
        }
      }
    }
  }

  function addMinorCliffs(values, settings, random) {
    const cliffCount = Math.floor(random() * 4);
    for (let c = 0; c < cliffCount; c += 1) {
      const center = 0.16 + random() * 0.68;
      const halfWidth = 0.008 + random() * 0.026;
      const lift = (random() < 0.5 ? -1 : 1) * (5 + random() * 12);
      for (let i = 0; i < values.length; i += 1) {
        const t = i / (values.length - 1);
        const distance = Math.abs(t - center);
        if (distance >= halfWidth) continue;
        const edge = 1 - distance / halfWidth;
        values[i] += lift * Math.min(1, edge * 3.4);
      }
    }
  }

  function smoothStep(edge0, edge1, value) {
    if (edge0 === edge1) return value < edge0 ? 0 : 1;
    const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function chooseSpawnPositions(values, settings, seed) {
    const random = mulberry32(seed ^ 0x51ed270b);
    const blueCandidates = [];
    const redCandidates = [];
    for (let i = 0; i < 9; i += 1) {
      blueCandidates.push(settings.worldWidth * (0.055 + random() * 0.265));
      redCandidates.push(settings.worldWidth * (0.68 + random() * 0.265));
    }

    let best = null;
    for (const blue of blueCandidates) {
      for (const red of redCandidates) {
        const blueHeight = terrainAtRaw(values, blue, settings.worldWidth);
        const redHeight = terrainAtRaw(values, red, settings.worldWidth);
        const heightDifference = Math.abs(blueHeight - redHeight);
        const edgeSafety = Math.min(blue / settings.worldWidth, 1 - red / settings.worldWidth);
        const score = heightDifference * 4 + edgeSafety * 35 + (red - blue) / settings.worldWidth * 8;
        if (!best || score > best.score) best = { blue, red, score };
      }
    }
    return { blue: best.blue, red: best.red };
  }

  function guaranteeSpawnHeightDifference(values, spawns, settings) {
    const blueHeight = terrainAtRaw(values, spawns.blue, settings.worldWidth);
    const redHeight = terrainAtRaw(values, spawns.red, settings.worldWidth);
    const difference = Math.abs(blueHeight - redHeight);
    if (difference >= 7) return;
    const target = blueHeight >= redHeight ? spawns.blue : spawns.red;
    const radius = Math.max(9, settings.worldWidth * 0.035);
    const needed = 8 - difference;
    for (let i = 0; i < values.length; i += 1) {
      const worldX = i / (values.length - 1) * settings.worldWidth;
      const d = Math.abs(worldX - target);
      if (d > radius) continue;
      const shape = (Math.cos(d / radius * Math.PI) + 1) / 2;
      values[i] += needed * shape;
    }
  }

  function terrainAtRaw(values, x, worldWidth) {
    const position = clamp(x / worldWidth, 0, 1) * (values.length - 1);
    const index = Math.floor(position);
    const fraction = position - index;
    return values[index] + (values[Math.min(index + 1, values.length - 1)] - values[index]) * fraction;
  }

  function smoothArray(values, passes = 1) {
    for (let pass = 0; pass < passes; pass += 1) {
      const copy = values.slice();
      for (let i = 2; i < values.length - 2; i += 1) {
        values[i] = (copy[i - 2] + copy[i - 1] * 2 + copy[i] * 3 + copy[i + 1] * 2 + copy[i + 2]) / 9;
      }
    }
  }

  function flattenTerrain(values, worldX, worldWidth, radius) {
    const centerIndex = Math.round((worldX / worldWidth) * (values.length - 1));
    const radiusIndex = Math.max(5, Math.round((radius / worldWidth) * values.length));
    const target = values[centerIndex];
    for (let offset = -radiusIndex; offset <= radiusIndex; offset += 1) {
      const index = centerIndex + offset;
      if (index < 0 || index >= values.length) continue;
      const t = Math.abs(offset) / radiusIndex;
      const blend = Math.cos(t * Math.PI / 2) ** 2;
      values[index] = values[index] * (1 - blend) + target * blend;
    }
  }

  function randomWind(settings) {
    const limit = WIND_LIMITS[settings.windVariability];
    if (limit === 0) return 0;
    return round((Math.random() * 2 - 1) * limit, 2);
  }

  function enterGame(state, preserveLogs = false) {
    gameState = normalizeGameState(state);
    animation = null;
    localInputPending = false;
    pendingActionRequest = null;
    localActionRequest = null;
    if (!preserveLogs) {
      dom.chatLog.replaceChildren();
      dom.eventLog.replaceChildren();
    }
    hideCanvasMessage();
    setScreen("game");

    dom.blueRoleLabel.textContent = role === "guest" ? "HOST" : "YOU";
    dom.redRoleLabel.textContent = role === "guest" ? "YOU" : role === "bot" ? "BOT" : "GUEST";
    dom.connectionBadge.textContent = role === "bot" ? "LOCAL" : "P2P";
    dom.roundControlBadge.textContent = role === "bot" ? "LOCAL" : role === "guest" ? "REQUEST" : "HOST";
    dom.roundControlNote.textContent = role === "guest"
      ? "Restart and regenerate requests are sent to the host."
      : role === "bot"
        ? "Restart or generate a fresh battlefield instantly."
        : "The host applies battlefield resets for both players.";
    setConnectionStatus(role === "bot" ? "Computer opponent" : "Connected directly", "online");
    updateGameUI(true);
    ensureAudio();
  }

  function normalizeGameState(state) {
    if (!state.scores) state.scores = { blue: 0, red: 0 };
    if (!Number.isFinite(state.round)) state.round = 1;
    if (!state.spawnPositions) {
      state.spawnPositions = { blue: state.tanks.blue.x, red: state.tanks.red.x };
    }
    if (!state.baseTerrain) state.baseTerrain = state.terrain.slice();
    return state;
  }

  function localTeam() {
    return role === "guest" ? "red" : "blue";
  }

  function canLocalAct() {
    return Boolean(
      gameState &&
      !gameState.winner &&
      !animation &&
      !localInputPending &&
      gameState.turn === localTeam() &&
      (role === "bot" || accepted)
    );
  }

  function updateGameUI(syncControls = false) {
    if (!gameState) return;
    const { settings, tanks } = gameState;
    const turnName = TEAM_NAMES[gameState.turn].toUpperCase();
    dom.turnLabel.textContent = gameState.winner ? `${TEAM_NAMES[gameState.winner].toUpperCase()} WINS` : `${turnName} TURN`;
    dom.windLabel.textContent = formatWind(gameState.wind);
    dom.worldLabel.textContent = `${LOCATION_PRESETS[settings.location].label.toUpperCase()} · GRAVITY ${settings.gravity.toFixed(2)}`;
    dom.telemetryWind.textContent = signed(gameState.wind);
    dom.telemetryGravity.textContent = settings.gravity.toFixed(2);
    dom.telemetryMove.textContent = moveStep().toFixed(1);
    dom.telemetryHits.textContent = String(settings.hitsToDestroy);
    dom.blueScore.textContent = String(gameState.scores.blue);
    dom.redScore.textContent = String(gameState.scores.red);
    dom.roundNumber.textContent = String(gameState.round);
    renderHitPips(dom.blueHits, tanks.blue.hits, settings.hitsToDestroy);
    renderHitPips(dom.redHits, tanks.red.hits, settings.hitsToDestroy);

    if (syncControls) {
      const tank = tanks[localTeam()];
      dom.angleInput.value = tank.angle;
      dom.powerInput.value = tank.power;
      dom.angleOutput.textContent = `${Math.round(tank.angle)}°`;
      dom.powerOutput.textContent = Math.round(tank.power);
    }

    updateGameControls();

    if (gameState.winner && !pendingActionRequest && !localActionRequest) {
      showCanvasMessage(
        `${TEAM_NAMES[gameState.winner].toUpperCase()} WINS`,
        `Match score ${gameState.scores.blue}–${gameState.scores.red}`,
        "winner"
      );
    } else if (!pendingActionRequest && !localActionRequest) {
      hideCanvasMessage();
    }

    if (role === "bot" && gameState.turn === "red" && !gameState.winner && !animation) scheduleBotTurn();
  }

  function renderHitPips(container, hits, total) {
    container.replaceChildren();
    for (let i = 0; i < total; i += 1) {
      const pip = document.createElement("span");
      pip.className = `hit-pip${i < hits ? " filled" : ""}`;
      container.appendChild(pip);
    }
  }

  function formatWind(wind) {
    if (Math.abs(wind) < 0.05) return "WIND CALM";
    return `WIND ${Math.abs(wind).toFixed(1)} ${wind > 0 ? "→" : "←"}`;
  }

  function signed(value) {
    return `${value > 0 ? "+" : ""}${value.toFixed(2)}`;
  }

  function updateGameControls() {
    const enabled = canLocalAct();
    const moveAvailable = enabled && !gameState.movedThisTurn;
    dom.moveLeftButton.disabled = !moveAvailable;
    dom.moveRightButton.disabled = !moveAvailable;
    dom.angleInput.disabled = !enabled;
    dom.powerInput.disabled = !enabled;
    dom.fireButton.disabled = !enabled;
    const roundControlBusy = Boolean(animation || pendingActionRequest || localActionRequest);
    dom.restartRoundButton.disabled = roundControlBusy;
    dom.regenerateMapButton.disabled = roundControlBusy;

    if (!gameState) return;
    if (gameState.winner) dom.moveStatus.textContent = "Battle complete";
    else if (animation) dom.moveStatus.textContent = "Projectile in flight";
    else if (localInputPending) dom.moveStatus.textContent = "Waiting for host";
    else if (gameState.turn !== localTeam()) dom.moveStatus.textContent = "Opponent's turn";
    else if (gameState.movedThisTurn) dom.moveStatus.textContent = "Movement used";
    else dom.moveStatus.textContent = "Movement available";
  }

  function moveStep() {
    if (!gameState) return 2.8;
    const base = { compact: 2.3, standard: 2.9, wide: 3.8, massive: 5.2, epic: 7.2 }[gameState.settings.worldSize];
    return base * (100 / gameState.settings.tankSize) ** 0.2;
  }

  function requestMove(direction) {
    if (!canLocalAct() || gameState.movedThisTurn) return;
    const team = localTeam();
    if (role === "guest") {
      localInputPending = true;
      connection.send({ type: "input", action: "move", direction });
      updateGameControls();
    } else {
      authoritativeMove(team, direction);
    }
  }

  function authoritativeMove(team, direction) {
    if (!gameState || animation || gameState.winner || gameState.turn !== team || gameState.movedThisTurn) return false;
    const tank = gameState.tanks[team];
    const other = gameState.tanks[OTHER_TEAM[team]];
    const step = moveStep() * Math.sign(direction);
    const minX = gameState.settings.worldWidth * 0.045;
    const maxX = gameState.settings.worldWidth * 0.955;
    const candidate = clamp(tank.x + step, minX, maxX);
    const safeDistance = tankWorldWidth() * 1.25;

    if (Math.abs(candidate - other.x) < safeDistance) {
      rejectGuestInput("Movement blocked by the other tank.");
      return false;
    }

    // Tanks may climb steep banks. Their body rotates to match the local surface.
    tank.x = round(candidate, 3);
    gameState.movedThisTurn = true;
    localInputPending = false;
    const message = `${TEAM_NAMES[team]} moved ${direction < 0 ? "left" : "right"}.`;
    addEvent(message);
    broadcastState(message);
    updateGameUI(true);
    return true;
  }

  function rejectGuestInput(message) {
    if (role === "host" && connection && connection.open) {
      connection.send({ type: "state", state: gameState, message });
    }
    addEvent(message);
  }

  function requestFire() {
    if (!canLocalAct()) return;
    const angle = Number(dom.angleInput.value);
    const power = Number(dom.powerInput.value);
    const team = localTeam();

    if (role === "guest") {
      localInputPending = true;
      connection.send({ type: "input", action: "fire", angle, power });
      updateGameControls();
    } else {
      authoritativeFire(team, angle, power);
    }
  }

  function handleGuestInput(data) {
    if (!gameState || gameState.turn !== "red" || animation || gameState.winner) {
      rejectGuestInput("Input ignored because it is not Red's active turn.");
      return;
    }
    if (data.action === "move") {
      authoritativeMove("red", Number(data.direction));
    } else if (data.action === "fire") {
      authoritativeFire("red", Number(data.angle), Number(data.power));
    }
  }

  function authoritativeFire(team, angle, power) {
    if (!gameState || animation || gameState.winner || gameState.turn !== team) return;
    const safeAngle = clamp(Number.isFinite(angle) ? angle : 45, 5, 175);
    const safePower = clamp(Number.isFinite(power) ? power : 60, 18, 100);
    gameState.tanks[team].angle = round(safeAngle, 1);
    gameState.tanks[team].power = round(safePower, 1);

    const result = simulateShot(gameState, team, safeAngle, safePower, true);
    const resultingState = deepClone(gameState);
    resultingState.shotNumber += 1;

    if (result.impact && result.impact.type !== "out") {
      applyCrater(resultingState, result.impact.x, result.impact.y, craterRadius(resultingState));
    }

    if (result.hitTeam) {
      resultingState.tanks[result.hitTeam].hits += 1;
      if (resultingState.tanks[result.hitTeam].hits >= resultingState.settings.hitsToDestroy) {
        resultingState.tanks[result.hitTeam].alive = false;
        resultingState.winner = OTHER_TEAM[result.hitTeam];
        resultingState.scores[resultingState.winner] += 1;
      }
    }

    if (!resultingState.winner) {
      resultingState.turn = OTHER_TEAM[team];
      resultingState.movedThisTurn = false;
      resultingState.wind = randomWind(resultingState.settings);
    }

    const packet = {
      shooter: team,
      angle: round(safeAngle, 1),
      power: round(safePower, 1),
      trajectory: result.trajectory,
      impact: result.impact,
      hitTeam: result.hitTeam,
      resultingState
    };

    if (role === "host" && connection && connection.open) connection.send({ type: "shot", packet });
    beginShotAnimation(packet);
  }

  function simulateShot(state, team, angle, power, recordTrajectory) {
    const tank = state.tanks[team];
    const origin = muzzlePosition(state, team, angle);
    const radians = angle * Math.PI / 180;
    const speed = power * 0.60;
    let x = origin.x;
    let y = origin.y;
    let vx = Math.cos(radians) * speed;
    let vy = Math.sin(radians) * speed;
    const dt = 0.035;
    const trajectory = [{ x: round(x), y: round(y) }];
    const maxSteps = 2600;

    for (let step = 0; step < maxSteps; step += 1) {
      vx += state.wind * 0.2 * dt;
      vy -= state.settings.gravity * dt;
      x += vx * dt;
      y += vy * dt;

      if (recordTrajectory && step % 2 === 0) trajectory.push({ x: round(x), y: round(y) });

      if (x < 0 || x > state.settings.worldWidth || y < -5) {
        if (recordTrajectory) trajectory.push({ x: round(x), y: round(y) });
        return { trajectory, impact: { x: round(x), y: round(y), type: "out" }, hitTeam: null };
      }

      for (const checkedTeam of ["blue", "red"]) {
        if (checkedTeam === team && step < 14) continue;
        const center = tankCenter(state, checkedTeam);
        const radius = tankCollisionRadius(state);
        const dx = x - center.x;
        const dy = y - center.y;
        if (dx * dx + dy * dy <= radius * radius) {
          if (recordTrajectory) trajectory.push({ x: round(x), y: round(y) });
          return {
            trajectory,
            impact: { x: round(x), y: round(y), type: "tank" },
            hitTeam: checkedTeam
          };
        }
      }

      const ground = terrainAt(x, state);
      if (step > 4 && y <= ground) {
        if (recordTrajectory) trajectory.push({ x: round(x), y: round(ground) });
        return {
          trajectory,
          impact: { x: round(x), y: round(ground), type: "terrain" },
          hitTeam: null
        };
      }
    }

    return { trajectory, impact: { x: round(x), y: round(y), type: "out" }, hitTeam: null };
  }

  function muzzlePosition(state, team, angle = state.tanks[team].angle) {
    const center = tankCenter(state, team);
    const radians = angle * Math.PI / 180;
    const length = tankWorldWidth(state) * 0.94;
    return {
      x: center.x + Math.cos(radians) * length,
      y: center.y + Math.sin(radians) * length
    };
  }

  function tankCenter(state, team) {
    const tank = state.tanks[team];
    return {
      x: tank.x,
      y: terrainAt(tank.x, state) + tankWorldHeight(state) * 0.80
    };
  }

  function tankScale(state = gameState) {
    return state ? state.settings.tankSize / 100 : 0.5;
  }

  function tankWorldWidth(state = gameState) {
    return 7.2 * tankScale(state);
  }

  function tankWorldHeight(state = gameState) {
    return 3.6 * tankScale(state);
  }

  function tankCollisionRadius(state = gameState) {
    return Math.max(0.42, 3.25 * tankScale(state));
  }

  function craterRadius(state = gameState) {
    return Math.max(2.4, 5.5 * Math.sqrt(tankScale(state)));
  }

  function terrainAt(x, state = gameState) {
    if (!state) return 0;
    const position = clamp(x / state.settings.worldWidth, 0, 1) * (state.terrain.length - 1);
    const index = Math.floor(position);
    const fraction = position - index;
    const a = state.terrain[index];
    const b = state.terrain[Math.min(index + 1, state.terrain.length - 1)];
    return a + (b - a) * fraction;
  }

  function terrainSlopeAt(x, state = gameState) {
    const delta = state.settings.worldWidth / state.terrain.length * 2;
    return (terrainAt(x + delta, state) - terrainAt(x - delta, state)) / (delta * 2);
  }

  function applyCrater(state, impactX, impactY, radius) {
    const centerIndex = (impactX / state.settings.worldWidth) * (state.terrain.length - 1);
    const radiusIndex = Math.ceil((radius / state.settings.worldWidth) * state.terrain.length);
    for (let offset = -radiusIndex; offset <= radiusIndex; offset += 1) {
      const index = Math.round(centerIndex + offset);
      if (index < 0 || index >= state.terrain.length) continue;
      const worldX = (index / (state.terrain.length - 1)) * state.settings.worldWidth;
      const distance = Math.abs(worldX - impactX);
      if (distance > radius) continue;
      const normal = distance / radius;
      const depth = radius * 0.72 * (1 - normal * normal);
      const rim = radius * 0.12 * Math.exp(-((normal - 0.9) ** 2) / 0.02);
      state.terrain[index] = round(clamp(state.terrain[index] - depth + rim, 3, WORLD_HEIGHT - 5), 3);
    }
    smoothLocalTerrain(state.terrain, Math.round(centerIndex), radiusIndex + 2);
  }

  function smoothLocalTerrain(values, center, radius) {
    const copy = values.slice();
    for (let i = Math.max(1, center - radius); i <= Math.min(values.length - 2, center + radius); i += 1) {
      values[i] = round(copy[i] * 0.72 + (copy[i - 1] + copy[i + 1]) * 0.14, 3);
    }
  }

  function beginShotAnimation(packet) {
    if (!packet || !Array.isArray(packet.trajectory) || packet.trajectory.length < 2) return;
    localInputPending = false;
    animation = {
      packet,
      start: performance.now(),
      travelDuration: clamp(packet.trajectory.length * 7.5, 700, 2650),
      explosionDuration: packet.impact && packet.impact.type !== "out" ? 520 : 180,
      phase: "travel"
    };
    playFireSound();
    addEvent(`${TEAM_NAMES[packet.shooter]} fired at ${packet.angle}° with power ${Math.round(packet.power)}.`);
    updateGameControls();
  }

  function finishShotAnimation() {
    if (!animation) return;
    const packet = animation.packet;
    gameState = packet.resultingState;
    animation = null;

    if (packet.hitTeam) {
      addEvent(`DIRECT HIT on ${TEAM_NAMES[packet.hitTeam]}!`, "hit");
      playHitSound();
    } else if (packet.impact && packet.impact.type === "terrain") {
      addEvent("Terrain impact.");
    } else {
      addEvent("Shot left the battlefield.");
    }

    if (gameState.winner) {
      addEvent(`${TEAM_NAMES[gameState.winner]} wins the battle.`, "hit");
      playVictorySound();
    }

    updateGameUI(true);
  }

  function broadcastState(message = "") {
    if (role === "host" && connection && connection.open) {
      connection.send({ type: "state", state: gameState, message });
    }
  }

  function scheduleBotTurn() {
    if (botTimer || role !== "bot" || !gameState || gameState.turn !== "red" || animation || gameState.winner) return;
    botTimer = setTimeout(() => {
      botTimer = null;
      if (!gameState || gameState.turn !== "red" || animation || gameState.winner) return;

      if (!gameState.movedThisTurn && Math.random() < 0.42) {
        const direction = gameState.tanks.red.x > gameState.settings.worldWidth * 0.76 ? -1 : (Math.random() < 0.5 ? -1 : 1);
        authoritativeMove("red", direction);
      }

      botTimer = setTimeout(() => {
        botTimer = null;
        if (!gameState || gameState.turn !== "red" || animation || gameState.winner) return;
        const aim = calculateBotAim();
        dom.angleInput.value = aim.angle;
        dom.powerInput.value = aim.power;
        authoritativeFire("red", aim.angle, aim.power);
      }, 650);
    }, 700);
  }

  function calculateBotAim() {
    let best = { angle: 135, power: 60, score: Infinity };
    const target = tankCenter(gameState, "blue");
    const shooter = "red";

    for (let angle = 98; angle <= 175; angle += 3) {
      for (let power = 24; power <= 100; power += 4) {
        const score = quickShotScore(shooter, angle, power, target);
        if (score < best.score) best = { angle, power, score };
        if (score < 0.4) break;
      }
    }

    const errorAngle = (Math.random() - 0.5) * 2.2;
    const errorPower = (Math.random() - 0.5) * 3.6;
    return {
      angle: round(clamp(best.angle + errorAngle, 95, 175), 1),
      power: round(clamp(best.power + errorPower, 20, 100), 1)
    };
  }

  function quickShotScore(team, angle, power, target) {
    const origin = muzzlePosition(gameState, team, angle);
    const radians = angle * Math.PI / 180;
    const speed = power * 0.60;
    let x = origin.x;
    let y = origin.y;
    let vx = Math.cos(radians) * speed;
    let vy = Math.sin(radians) * speed;
    const dt = 0.075;
    let bestDistance = Infinity;

    for (let step = 0; step < 900; step += 1) {
      vx += gameState.wind * 0.2 * dt;
      vy -= gameState.settings.gravity * dt;
      x += vx * dt;
      y += vy * dt;
      const distance = Math.hypot(x - target.x, y - target.y);
      bestDistance = Math.min(bestDistance, distance);
      if (distance <= tankCollisionRadius()) return 0;
      if (x < 0 || x > gameState.settings.worldWidth || y < -4) break;
      if (step > 3 && y <= terrainAt(x, gameState)) break;
    }
    return bestDistance;
  }

  function submitChat(event) {
    event.preventDefault();
    if (!gameState) return;
    const text = dom.chatInput.value.trim().slice(0, 180);
    if (!text) return;
    const team = localTeam();
    addChatMessage("You", text, true);
    dom.chatInput.value = "";

    if (role === "bot") {
      const replies = [
        "Wind correction noted.",
        "I calculate a 63 percent chance you miss.",
        "Your crater collection is impressive.",
        "Adjusting elevation.",
        "Blue paint is surprisingly visible from here.",
        "Message received. Target still acquired."
      ];
      setTimeout(() => addChatMessage("Computer", replies[Math.floor(Math.random() * replies.length)], false, true), 650);
    } else if (connection && connection.open && accepted) {
      connection.send({ type: "chat", sender: team, text });
    }
  }

  function showCanvasMessage(message, subtitle = "", mode = "notice") {
    dom.canvasMessageTitle.textContent = message;
    dom.canvasMessageSub.textContent = subtitle;
    dom.canvasMessageSub.classList.toggle("hidden", !subtitle);
    dom.canvasMessageActions.classList.toggle("hidden", mode === "notice" || mode === "waiting");
    dom.replayRequestButton.classList.toggle("hidden", mode !== "winner");
    dom.replayAcceptButton.classList.toggle("hidden", mode !== "request");
    dom.replayDeclineButton.classList.toggle("hidden", mode !== "request");
    dom.replayRequestButton.textContent = role === "bot" ? "Play again" : "Request replay";
    dom.canvasMessage.classList.remove("hidden");
  }

  function hideCanvasMessage() {
    dom.canvasMessage.classList.add("hidden");
    dom.canvasMessageActions.classList.add("hidden");
    dom.replayRequestButton.classList.add("hidden");
    dom.replayAcceptButton.classList.add("hidden");
    dom.replayDeclineButton.classList.add("hidden");
  }

  function actionLabel(action) {
    if (action === "restart") return "restart this battlefield";
    if (action === "regenerate") return "generate a new battlefield";
    return "play another round";
  }

  function requestRoundAction(action) {
    if (!gameState || animation || pendingActionRequest || localActionRequest) return;

    if (role === "bot") {
      executeRoundAction(action);
      return;
    }

    if (role === "host" && action !== "replay") {
      executeRoundAction(action);
      return;
    }

    if (!connection || !connection.open || !accepted) return;
    localActionRequest = action;
    connection.send({ type: "action-request", action, sender: localTeam() });
    showCanvasMessage(
      `${action === "replay" ? "REPLAY" : "BATTLEFIELD"} REQUESTED`,
      `Waiting for ${TEAM_NAMES[OTHER_TEAM[localTeam()]]} to accept.`,
      "waiting"
    );
    addEvent(`You requested to ${actionLabel(action)}.`);
    updateGameControls();
  }

  function receiveActionRequest(data) {
    if (!gameState || !accepted || !["restart", "regenerate", "replay"].includes(data.action)) return;
    if (pendingActionRequest || localActionRequest) {
      connection?.send({ type: "action-response", action: data.action, accepted: false, reason: "busy" });
      return;
    }
    pendingActionRequest = { action: data.action, sender: data.sender };
    const requester = TEAM_NAMES[data.sender] || "Opponent";
    showCanvasMessage(
      `${requester.toUpperCase()} REQUESTS A CHANGE`,
      `${requester} wants to ${actionLabel(data.action)}.`,
      "request"
    );
    addEvent(`${requester} requested to ${actionLabel(data.action)}.`);
    updateGameControls();
  }

  function acceptActionRequest() {
    if (!pendingActionRequest) return;
    const { action } = pendingActionRequest;
    pendingActionRequest = null;
    connection?.send({ type: "action-response", action, accepted: true });

    if (role === "host") {
      executeRoundAction(action);
    } else {
      showCanvasMessage("REQUEST ACCEPTED", "The host is preparing the battlefield.", "waiting");
    }
  }

  function declineActionRequest() {
    if (!pendingActionRequest) return;
    const { action } = pendingActionRequest;
    pendingActionRequest = null;
    connection?.send({ type: "action-response", action, accepted: false });
    addEvent("Replay or battlefield request declined.");
    if (gameState?.winner) updateGameUI(false);
    else hideCanvasMessage();
    updateGameControls();
  }

  function receiveActionResponse(data) {
    if (!localActionRequest || data.action !== localActionRequest) return;
    const action = localActionRequest;
    if (!data.accepted) {
      localActionRequest = null;
      addEvent("Your request was declined.", "error");
      if (gameState?.winner) updateGameUI(false);
      else hideCanvasMessage();
      updateGameControls();
      return;
    }

    addEvent("Your request was accepted.");
    if (role === "host") {
      localActionRequest = null;
      executeRoundAction(action);
    } else {
      showCanvasMessage("REQUEST ACCEPTED", "The host is preparing the battlefield.", "waiting");
    }
  }

  function executeRoundAction(action) {
    if (!gameState || (role !== "host" && role !== "bot")) return;
    clearTimeout(botTimer);
    botTimer = null;
    const nextRound = gameState.round + 1;
    const scores = deepClone(gameState.scores);
    let state;
    let message;

    if (action === "restart") {
      state = createRestartedState(gameState, nextRound);
      message = `Round ${nextRound}: battlefield restarted.`;
    } else {
      state = createGameState(gameState.settings, { scores, round: nextRound });
      message = `Round ${nextRound}: a new battlefield was generated.`;
    }

    pendingActionRequest = null;
    localActionRequest = null;
    if (role === "host" && connection && connection.open) {
      connection.send({ type: "round-start", state, message });
    }
    enterGame(state, true);
    addEvent(message);
  }

  function createRestartedState(previous, roundNumber) {
    const state = deepClone(previous);
    state.terrain = state.baseTerrain.slice();
    state.tanks = {
      blue: { x: round(state.spawnPositions.blue, 3), hits: 0, alive: true, angle: 45, power: 62 },
      red: { x: round(state.spawnPositions.red, 3), hits: 0, alive: true, angle: 135, power: 62 }
    };
    state.round = roundNumber;
    state.turn = "blue";
    state.movedThisTurn = false;
    state.wind = randomWind(state.settings);
    state.winner = null;
    state.shotNumber = 0;
    return state;
  }

  function resetTransientState(clearLobby = true) {
    clearTimeout(botTimer);
    botTimer = null;
    animation = null;
    gameState = null;
    localInputPending = false;
    pendingActionRequest = null;
    localActionRequest = null;
    acceptRequested = false;
    dom.homeNotice.textContent = "";
    dom.chatLog.replaceChildren();
    dom.eventLog.replaceChildren();
    hideCanvasMessage();
    if (clearLobby) dom.lobbyLog.replaceChildren();
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
    clearTimeout(botTimer);
    botTimer = null;
    safelyDestroyPeer();
    role = null;
    accepted = false;
    acceptRequested = false;
    gameState = null;
    animation = null;
    localInputPending = false;
    pendingActionRequest = null;
    localActionRequest = null;
    dom.lobbyLog.replaceChildren();
    dom.chatLog.replaceChildren();
    dom.eventLog.replaceChildren();
    dom.roomCodeWrap.classList.add("hidden");
    dom.incomingRequest.classList.add("hidden");
    dom.joinCode.value = "";
    hideCanvasMessage();
    dom.acceptButton.disabled = false;
    dom.acceptButton.textContent = "Accept";
    setConnectionStatus("Not connected", "offline");
    setScreen("home");
    setTimeout(() => { isResetting = false; }, 60);
  }

  function copyRoomCode() {
    const code = dom.roomCode.textContent;
    navigator.clipboard.writeText(code).then(() => {
      dom.copyCodeButton.textContent = "Copied";
      setTimeout(() => { dom.copyCodeButton.textContent = "Copy"; }, 1100);
    }).catch(() => addLobbyLog(`Copy was blocked. Manually copy ${code}.`));
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      dom.canvasFrame.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  function ensureAudio() {
    if (!audioContext) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (AudioCtor) audioContext = new AudioCtor();
    }
    if (audioContext && audioContext.state === "suspended") audioContext.resume().catch(() => {});
  }

  function tone(frequency, duration, type = "sine", volume = 0.05, delay = 0) {
    if (!soundEnabled) return;
    ensureAudio();
    if (!audioContext) return;
    const start = audioContext.currentTime + delay;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  function noiseBurst(duration = 0.22, volume = 0.09) {
    if (!soundEnabled) return;
    ensureAudio();
    if (!audioContext) return;
    const length = Math.floor(audioContext.sampleRate * duration);
    const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = audioContext.createBufferSource();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1200;
    gain.gain.value = volume;
    source.buffer = buffer;
    source.connect(filter).connect(gain).connect(audioContext.destination);
    source.start();
  }

  function playFireSound() {
    tone(160, .16, "sawtooth", .045);
    tone(75, .22, "square", .035, .04);
  }

  function playHitSound() {
    noiseBurst(.36, .12);
    tone(62, .45, "sine", .09);
  }

  function playVictorySound() {
    tone(330, .18, "triangle", .05);
    tone(440, .18, "triangle", .05, .16);
    tone(660, .35, "triangle", .06, .32);
  }

  function playChatSound() {
    tone(620, .08, "sine", .025);
    tone(810, .09, "sine", .018, .06);
  }

  function canvasMetrics() {
    return {
      width: dom.canvas.width,
      height: dom.canvas.height,
      sx: dom.canvas.width / gameState.settings.worldWidth,
      sy: dom.canvas.height / WORLD_HEIGHT
    };
  }

  function worldToCanvas(x, y) {
    const metrics = canvasMetrics();
    return { x: x * metrics.sx, y: metrics.height - y * metrics.sy };
  }

  function renderFrame(now) {
    const elapsed = Math.min(100, now - lastFrameTime);
    lastFrameTime = now;
    if (gameState) drawGame(now, elapsed);
    else drawIdleCanvas(now);
    requestAnimationFrame(renderFrame);
  }

  function drawIdleCanvas() {
    ctx.clearRect(0, 0, dom.canvas.width, dom.canvas.height);
  }

  function drawGame(now) {
    ctx.clearRect(0, 0, dom.canvas.width, dom.canvas.height);
    drawSky(now);
    drawDistantLandscape();
    drawTerrain();
    drawAimGuide();
    drawTank("blue", now);
    drawTank("red", now);
    drawProjectileAnimation(now);
    drawVignette();
  }

  function drawSky(now) {
    const width = dom.canvas.width;
    const height = dom.canvas.height;
    const location = gameState.settings.location;
    let top;
    let bottom;

    if (location === "earth") {
      top = "#337fbd";
      bottom = "#a7d8ec";
    } else if (location === "mars") {
      top = "#7d2d28";
      bottom = "#e69b6f";
    } else if (location === "moon") {
      top = "#030711";
      bottom = "#101827";
    } else {
      top = "#09051a";
      bottom = "#21133d";
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, top);
    gradient.addColorStop(1, bottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    if (location === "earth") drawEarthSky(now);
    if (location === "mars") drawMarsSky();
    if (location === "moon") drawMoonSky();
    if (location === "space") drawSpaceSky(now);
  }

  function drawEarthSky(now) {
    const width = dom.canvas.width;
    const height = dom.canvas.height;
    ctx.save();
    const sun = ctx.createRadialGradient(width * .79, height * .17, 5, width * .79, height * .17, 82);
    sun.addColorStop(0, "rgba(255,248,190,.95)");
    sun.addColorStop(.23, "rgba(255,224,132,.75)");
    sun.addColorStop(1, "rgba(255,224,132,0)");
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255,255,255,.28)";
    for (let i = 0; i < 5; i += 1) {
      const x = ((i * 310 + now * .006) % (width + 220)) - 110;
      const y = 95 + (i % 3) * 54;
      drawCloud(x, y, .8 + (i % 2) * .22);
    }
    ctx.restore();
  }

  function drawCloud(x, y, scale) {
    ctx.beginPath();
    ctx.ellipse(x, y, 48 * scale, 16 * scale, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 34 * scale, y - 8 * scale, 34 * scale, 22 * scale, 0, 0, Math.PI * 2);
    ctx.ellipse(x - 31 * scale, y - 5 * scale, 28 * scale, 19 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawMarsSky() {
    const width = dom.canvas.width;
    const height = dom.canvas.height;
    ctx.save();
    ctx.fillStyle = "rgba(255,205,155,.75)";
    ctx.beginPath();
    ctx.arc(width * .78, height * .17, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,230,210,.8)";
    ctx.beginPath();
    ctx.arc(width * .18, height * .14, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width * .24, height * .1, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(100,38,31,.16)";
    for (let i = 0; i < 7; i += 1) {
      ctx.fillRect(0, height * (.2 + i * .06), width, 2);
    }
    ctx.restore();
  }

  function drawMoonSky() {
    drawStars(95, "rgba(255,255,255,.72)", 2.1);
    const width = dom.canvas.width;
    const height = dom.canvas.height;
    const earth = ctx.createRadialGradient(width * .76, height * .18, 2, width * .76, height * .18, 55);
    earth.addColorStop(0, "#e7f6ff");
    earth.addColorStop(.42, "#4da4d9");
    earth.addColorStop(.72, "#237448");
    earth.addColorStop(1, "rgba(20,45,70,0)");
    ctx.fillStyle = earth;
    ctx.beginPath();
    ctx.arc(width * .76, height * .18, 55, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawSpaceSky(now) {
    drawStars(150, "rgba(255,255,255,.82)", 2.4);
    const width = dom.canvas.width;
    const height = dom.canvas.height;
    const nebula = ctx.createRadialGradient(width * .3, height * .18, 20, width * .3, height * .18, 260);
    nebula.addColorStop(0, "rgba(128,78,205,.26)");
    nebula.addColorStop(.45, "rgba(49,110,176,.12)");
    nebula.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width * .83, height * .16);
    ctx.rotate(now * .00001);
    const planet = ctx.createRadialGradient(-15, -18, 2, 0, 0, 62);
    planet.addColorStop(0, "#f3bd82");
    planet.addColorStop(.55, "#9f5b8e");
    planet.addColorStop(1, "#321b55");
    ctx.fillStyle = planet;
    ctx.beginPath();
    ctx.arc(0, 0, 62, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(230,202,255,.45)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.ellipse(0, 0, 94, 20, -.25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawStars(count, color, maxRadius) {
    const random = mulberry32(gameState.seed ^ 0x9e3779b9);
    ctx.fillStyle = color;
    for (let i = 0; i < count; i += 1) {
      const x = random() * dom.canvas.width;
      const y = random() * dom.canvas.height * .64;
      const radius = .35 + random() * maxRadius;
      ctx.globalAlpha = .35 + random() * .65;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawDistantLandscape() {
    const location = gameState.settings.location;
    const width = dom.canvas.width;
    const height = dom.canvas.height;
    ctx.save();
    ctx.globalAlpha = location === "earth" ? .18 : .25;
    ctx.fillStyle = location === "earth" ? "#345869" : location === "mars" ? "#6c332b" : "#4a5060";
    ctx.beginPath();
    ctx.moveTo(0, height * .72);
    for (let x = 0; x <= width; x += 80) {
      const y = height * (.55 + .09 * Math.sin(x * .009 + gameState.seed * .00003));
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawTerrain() {
    const metrics = canvasMetrics();
    const location = gameState.settings.location;
    const colors = {
      earth: ["#55784d", "#253e2d", "#15241c"],
      mars: ["#a65236", "#663024", "#351b18"],
      moon: ["#858b93", "#3e444d", "#242932"],
      space: ["#756579", "#40364d", "#241b30"]
    }[location];

    const gradient = ctx.createLinearGradient(0, metrics.height * .45, 0, metrics.height);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(.45, colors[1]);
    gradient.addColorStop(1, colors[2]);

    ctx.beginPath();
    ctx.moveTo(0, metrics.height);
    gameState.terrain.forEach((heightValue, index) => {
      const x = index / (gameState.terrain.length - 1) * metrics.width;
      const y = metrics.height - heightValue * metrics.sy;
      ctx.lineTo(x, y);
    });
    ctx.lineTo(metrics.width, metrics.height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    gameState.terrain.forEach((heightValue, index) => {
      const x = index / (gameState.terrain.length - 1) * metrics.width;
      const y = metrics.height - heightValue * metrics.sy;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineWidth = 4;
    ctx.strokeStyle = location === "earth" ? "#8faf6e" : location === "mars" ? "#d27a53" : "#b0b4ba";
    ctx.stroke();

    const random = mulberry32(gameState.seed ^ 0x85ebca6b);
    ctx.globalAlpha = .16;
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 95; i += 1) {
      const xWorld = random() * gameState.settings.worldWidth;
      const ground = terrainAt(xWorld);
      const depth = 1 + random() * 12;
      const p = worldToCanvas(xWorld, Math.max(1, ground - depth));
      ctx.beginPath();
      ctx.arc(p.x, p.y, .7 + random() * 1.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawTank(team, now) {
    const tank = gameState.tanks[team];
    const ground = terrainAt(tank.x);
    const groundPoint = worldToCanvas(tank.x, ground);
    const metrics = canvasMetrics();
    const bodyWidth = Math.max(0.45, tankWorldWidth() * metrics.sx);
    const bodyHeight = Math.max(0.28, tankWorldHeight() * metrics.sy);
    const slope = terrainSlopeAt(tank.x);
    const bodyAngle = clamp(-Math.atan(slope * metrics.sy / metrics.sx), -1.08, 1.08);
    const color = team === "blue" ? "#4fa4ff" : "#ff5c63";
    const light = team === "blue" ? "#91d2ff" : "#ffabb0";
    const mid = team === "blue" ? "#287bc8" : "#d83b48";
    const dark = team === "blue" ? "#123f72" : "#711b26";
    const detail = bodyWidth >= 11 && bodyHeight >= 5;

    const center = tankCenter(gameState, team);
    const turretPoint = worldToCanvas(center.x, center.y);
    const barrelAngle = -(tank.angle * Math.PI / 180);
    const barrelLength = bodyWidth * .94;
    const barrelThickness = Math.max(.55, bodyHeight * .16);

    // Barrel and muzzle brake sit behind the turret.
    ctx.save();
    ctx.translate(turretPoint.x, turretPoint.y);
    ctx.rotate(barrelAngle);
    const barrelGradient = ctx.createLinearGradient(0, 0, barrelLength, 0);
    barrelGradient.addColorStop(0, dark);
    barrelGradient.addColorStop(.55, mid);
    barrelGradient.addColorStop(1, light);
    ctx.fillStyle = barrelGradient;
    roundedRect(ctx, bodyHeight * .05, -barrelThickness / 2, barrelLength, barrelThickness, barrelThickness / 2);
    ctx.fill();
    if (detail) {
      ctx.fillStyle = "#18212c";
      roundedRect(ctx, barrelLength * .88, -barrelThickness * .78, barrelLength * .17, barrelThickness * 1.56, barrelThickness * .3);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.24)";
      ctx.fillRect(barrelLength * .18, -barrelThickness * .32, barrelLength * .52, Math.max(.55, barrelThickness * .16));
    }
    ctx.restore();

    ctx.save();
    ctx.translate(groundPoint.x, groundPoint.y - bodyHeight * .43);
    ctx.rotate(bodyAngle);

    // Ground shadow.
    ctx.fillStyle = "rgba(0,0,0,.30)";
    ctx.beginPath();
    ctx.ellipse(0, bodyHeight * .71, bodyWidth * .63, bodyHeight * .24, 0, 0, Math.PI * 2);
    ctx.fill();

    // Caterpillar track assembly.
    const trackY = bodyHeight * .12;
    const trackHeight = bodyHeight * .48;
    ctx.fillStyle = "#111821";
    roundedRect(ctx, -bodyWidth * .57, trackY, bodyWidth * 1.14, trackHeight, trackHeight * .43);
    ctx.fill();
    ctx.strokeStyle = "rgba(210,225,240,.28)";
    ctx.lineWidth = Math.max(.45, bodyHeight * .045);
    ctx.stroke();

    if (detail) {
      const wheelY = trackY + trackHeight * .52;
      const wheelRadius = trackHeight * .25;
      for (let i = 0; i < 5; i += 1) {
        const wheelX = -bodyWidth * .39 + i * bodyWidth * .195;
        ctx.fillStyle = i === 0 || i === 4 ? "#2b3440" : "#364251";
        ctx.beginPath();
        ctx.arc(wheelX, wheelY, wheelRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,.18)";
        ctx.stroke();
        ctx.fillStyle = "#111821";
        ctx.beginPath();
        ctx.arc(wheelX, wheelY, wheelRadius * .38, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = "rgba(255,255,255,.16)";
      ctx.lineWidth = Math.max(.45, bodyHeight * .04);
      for (let i = 0; i < 9; i += 1) {
        const treadX = -bodyWidth * .47 + i * bodyWidth * .118;
        ctx.beginPath();
        ctx.moveTo(treadX, trackY + trackHeight * .08);
        ctx.lineTo(treadX + bodyWidth * .025, trackY + trackHeight * .27);
        ctx.stroke();
      }
    }

    // Sloped armoured hull.
    const hullGradient = ctx.createLinearGradient(0, -bodyHeight * .43, 0, bodyHeight * .23);
    hullGradient.addColorStop(0, light);
    hullGradient.addColorStop(.33, color);
    hullGradient.addColorStop(1, dark);
    ctx.fillStyle = hullGradient;
    ctx.beginPath();
    ctx.moveTo(-bodyWidth * .50, bodyHeight * .18);
    ctx.lineTo(-bodyWidth * .37, -bodyHeight * .25);
    ctx.lineTo(bodyWidth * .30, -bodyHeight * .31);
    ctx.lineTo(bodyWidth * .52, -bodyHeight * .03);
    ctx.lineTo(bodyWidth * .43, bodyHeight * .22);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.28)";
    ctx.lineWidth = Math.max(.45, bodyHeight * .045);
    ctx.stroke();

    // Side armour plate and team marking.
    if (detail) {
      ctx.fillStyle = "rgba(9,18,29,.23)";
      roundedRect(ctx, -bodyWidth * .28, -bodyHeight * .08, bodyWidth * .54, bodyHeight * .20, bodyHeight * .05);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.16)";
      ctx.stroke();

      ctx.save();
      ctx.translate(team === "blue" ? -bodyWidth * .04 : bodyWidth * .04, bodyHeight * .015);
      ctx.fillStyle = "rgba(255,255,255,.82)";
      ctx.beginPath();
      if (team === "blue") {
        ctx.moveTo(-bodyHeight * .11, bodyHeight * .08);
        ctx.lineTo(0, -bodyHeight * .11);
        ctx.lineTo(bodyHeight * .11, bodyHeight * .08);
        ctx.lineTo(0, bodyHeight * .02);
      } else {
        ctx.moveTo(-bodyHeight * .12, -bodyHeight * .04);
        ctx.lineTo(bodyHeight * .12, -bodyHeight * .04);
        ctx.lineTo(0, bodyHeight * .12);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = "rgba(255,255,255,.3)";
      ctx.beginPath();
      ctx.arc(-bodyWidth * .39, bodyHeight * .04, bodyHeight * .035, 0, Math.PI * 2);
      ctx.arc(bodyWidth * .37, bodyHeight * .02, bodyHeight * .035, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Turret dome, mantlet, hatch and aerial.
    const turretRadius = Math.max(.28, bodyHeight * .38);
    ctx.save();
    ctx.translate(turretPoint.x, turretPoint.y);
    const turretGradient = ctx.createRadialGradient(-turretRadius * .35, -turretRadius * .5, 0, 0, 0, turretRadius * 1.2);
    turretGradient.addColorStop(0, light);
    turretGradient.addColorStop(.45, color);
    turretGradient.addColorStop(1, dark);
    ctx.fillStyle = turretGradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, turretRadius * 1.14, turretRadius, 0, Math.PI, Math.PI * 2);
    ctx.lineTo(turretRadius * .93, turretRadius * .34);
    ctx.lineTo(-turretRadius * .93, turretRadius * .34);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.3)";
    ctx.lineWidth = Math.max(.45, bodyHeight * .045);
    ctx.stroke();

    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.arc(Math.cos(-barrelAngle) * 0, 0, turretRadius * .27, 0, Math.PI * 2);
    ctx.fill();

    if (detail) {
      ctx.fillStyle = "#1b2634";
      roundedRect(ctx, -turretRadius * .34, -turretRadius * .88, turretRadius * .68, turretRadius * .22, turretRadius * .08);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.25)";
      ctx.stroke();

      ctx.strokeStyle = "#2b3340";
      ctx.lineWidth = Math.max(.55, bodyHeight * .045);
      ctx.beginPath();
      ctx.moveTo(-turretRadius * .55, -turretRadius * .7);
      ctx.lineTo(-turretRadius * .72, -turretRadius * 2.1);
      ctx.stroke();
      ctx.fillStyle = team === "blue" ? "#8dd4ff" : "#ffb1b5";
      ctx.beginPath();
      ctx.arc(-turretRadius * .72, -turretRadius * 2.1, Math.max(.75, turretRadius * .08), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    if (tank.hits > 0 && tank.alive) drawTankSmoke(turretPoint.x, turretPoint.y, tank.hits, now);
    if (!tank.alive) drawDestroyedTank(turretPoint.x, turretPoint.y, color, now);
  }

  function roundedRect(context, x, y, width, height, radius) {
    const r = Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  }

  function drawTankSmoke(x, y, hits, now) {
    ctx.save();
    for (let i = 0; i < Math.min(5, hits + 1); i += 1) {
      const phase = (now * .00035 + i * .21) % 1;
      const drift = Math.sin(now * .001 + i) * 8;
      ctx.globalAlpha = (1 - phase) * .27;
      ctx.fillStyle = "#20242a";
      ctx.beginPath();
      ctx.arc(x + drift, y - 15 - phase * 55, 7 + phase * 13, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawDestroyedTank(x, y, color, now) {
    const pulse = .5 + Math.sin(now * .012) * .12;
    ctx.save();
    ctx.globalAlpha = .75;
    ctx.fillStyle = "#171717";
    ctx.beginPath();
    ctx.arc(x, y - 5, 26 + pulse * 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 18, y - 28);
    ctx.lineTo(x + 17, y + 8);
    ctx.moveTo(x + 18, y - 28);
    ctx.lineTo(x - 17, y + 8);
    ctx.stroke();
    ctx.restore();
  }

  function drawAimGuide() {
    if (!canLocalAct()) return;
    const team = localTeam();
    const angle = Number(dom.angleInput.value);
    const power = Number(dom.powerInput.value);
    gameState.tanks[team].angle = angle;
    gameState.tanks[team].power = power;
    const origin = muzzlePosition(gameState, team, angle);
    const radians = angle * Math.PI / 180;
    let x = origin.x;
    let y = origin.y;
    let vx = Math.cos(radians) * power * .60;
    let vy = Math.sin(radians) * power * .60;
    const dt = .12;
    ctx.save();
    ctx.fillStyle = team === "blue" ? "rgba(172,220,255,.65)" : "rgba(255,190,194,.65)";
    for (let i = 0; i < 18; i += 1) {
      vx += gameState.wind * .2 * dt;
      vy -= gameState.settings.gravity * dt;
      x += vx * dt;
      y += vy * dt;
      if (x < 0 || x > gameState.settings.worldWidth || y <= terrainAt(x)) break;
      const point = worldToCanvas(x, y);
      ctx.globalAlpha = 1 - i / 12;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawProjectileAnimation(now) {
    if (!animation) return;
    const elapsed = now - animation.start;
    const packet = animation.packet;

    if (animation.phase === "travel") {
      const progress = clamp(elapsed / animation.travelDuration, 0, 1);
      const exactIndex = progress * (packet.trajectory.length - 1);
      const index = Math.floor(exactIndex);
      const nextIndex = Math.min(index + 1, packet.trajectory.length - 1);
      const blend = exactIndex - index;
      const a = packet.trajectory[index];
      const b = packet.trajectory[nextIndex];
      const x = a.x + (b.x - a.x) * blend;
      const y = a.y + (b.y - a.y) * blend;
      drawProjectileTrail(packet.trajectory, index);
      drawProjectile(x, y, packet.shooter);

      if (progress >= 1) {
        animation.phase = "explosion";
        animation.explosionStart = now;
        if (packet.impact && packet.impact.type !== "out") {
          noiseBurst(.3, .08);
        }
      }
    } else {
      const explosionProgress = clamp((now - animation.explosionStart) / animation.explosionDuration, 0, 1);
      if (packet.impact && packet.impact.type !== "out") drawExplosion(packet.impact.x, packet.impact.y, explosionProgress, packet.hitTeam);
      if (explosionProgress >= 1) finishShotAnimation();
    }
  }

  function drawProjectileTrail(trajectory, currentIndex) {
    const start = Math.max(0, currentIndex - 22);
    ctx.save();
    ctx.lineCap = "round";
    for (let i = start + 1; i <= currentIndex; i += 1) {
      const a = worldToCanvas(trajectory[i - 1].x, trajectory[i - 1].y);
      const b = worldToCanvas(trajectory[i].x, trajectory[i].y);
      ctx.globalAlpha = (i - start) / (currentIndex - start + 1) * .5;
      ctx.strokeStyle = "#fff6d4";
      ctx.lineWidth = 1 + (i - start) / 10;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawProjectile(x, y, team) {
    const p = worldToCanvas(x, y);
    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 18);
    glow.addColorStop(0, "rgba(255,255,255,1)");
    glow.addColorStop(.24, team === "blue" ? "rgba(79,164,255,.95)" : "rgba(255,92,99,.95)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4.3, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawExplosion(x, y, progress, hitTeam) {
    const p = worldToCanvas(x, y);
    const radius = 16 + Math.sin(progress * Math.PI) * 80;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const blast = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
    blast.addColorStop(0, "rgba(255,255,245,.98)");
    blast.addColorStop(.22, "rgba(255,215,84,.92)");
    blast.addColorStop(.58, hitTeam ? "rgba(255,64,55,.72)" : "rgba(255,124,56,.65)");
    blast.addColorStop(1, "rgba(80,20,10,0)");
    ctx.fillStyle = blast;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fill();

    const random = mulberry32((gameState.shotNumber + 1) * 1299709);
    for (let i = 0; i < 24; i += 1) {
      const angle = random() * Math.PI * 2;
      const distance = progress * (30 + random() * 90);
      const px = p.x + Math.cos(angle) * distance;
      const py = p.y + Math.sin(angle) * distance;
      ctx.globalAlpha = 1 - progress;
      ctx.fillStyle = i % 2 ? "#ffca61" : "#ff654e";
      ctx.beginPath();
      ctx.arc(px, py, 2 + random() * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawVignette() {
    const width = dom.canvas.width;
    const height = dom.canvas.height;
    const vignette = ctx.createRadialGradient(width / 2, height / 2, height * .25, width / 2, height / 2, height * .78);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,.28)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    dom.soundButton.classList.toggle("active", soundEnabled);
    dom.soundButton.textContent = soundEnabled ? "♪" : "×";
    if (soundEnabled) playChatSound();
  }

  function updateAimOutputs() {
    dom.angleOutput.textContent = `${dom.angleInput.value}°`;
    dom.powerOutput.textContent = dom.powerInput.value;
  }

  function keyboardControls(event) {
    if (dom.gameScreen.classList.contains("hidden")) return;
    if (document.activeElement === dom.chatInput) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      requestMove(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      requestMove(1);
    } else if (event.key === " " || event.code === "Space") {
      event.preventDefault();
      requestFire();
    }
  }

  dom.locationSelect.addEventListener("change", applyLocationPreset);
  dom.gravityInput.addEventListener("input", updateSettingOutputs);
  dom.tankSizeInput.addEventListener("input", updateSettingOutputs);
  dom.windInput.addEventListener("input", updateSettingOutputs);
  dom.hitsInput.addEventListener("input", updateSettingOutputs);
  dom.presetButton.addEventListener("click", applyLocationPreset);
  dom.hostButton.addEventListener("click", startHost);
  dom.botButton.addEventListener("click", startBotGame);
  dom.joinCode.addEventListener("input", () => { dom.joinCode.value = cleanCode(dom.joinCode.value); dom.homeNotice.textContent = ""; });
  dom.joinCode.addEventListener("keydown", event => { if (event.key === "Enter") startGuest(); });
  dom.joinButton.addEventListener("click", startGuest);
  dom.copyCodeButton.addEventListener("click", copyRoomCode);
  dom.acceptButton.addEventListener("click", acceptGuest);
  dom.declineButton.addEventListener("click", declineGuest);
  dom.leaveLobbyButton.addEventListener("click", resetAll);
  dom.moveLeftButton.addEventListener("click", () => requestMove(-1));
  dom.moveRightButton.addEventListener("click", () => requestMove(1));
  dom.angleInput.addEventListener("input", updateAimOutputs);
  dom.powerInput.addEventListener("input", updateAimOutputs);
  dom.fireButton.addEventListener("click", requestFire);
  dom.chatForm.addEventListener("submit", submitChat);
  dom.soundButton.addEventListener("click", toggleSound);
  dom.fullscreenButton.addEventListener("click", toggleFullscreen);
  dom.restartRoundButton.addEventListener("click", () => requestRoundAction("restart"));
  dom.regenerateMapButton.addEventListener("click", () => requestRoundAction("regenerate"));
  dom.replayRequestButton.addEventListener("click", () => requestRoundAction("replay"));
  dom.replayAcceptButton.addEventListener("click", acceptActionRequest);
  dom.replayDeclineButton.addEventListener("click", declineActionRequest);
  dom.leaveGameButton.addEventListener("click", resetAll);
  document.addEventListener("keydown", keyboardControls);
  document.addEventListener("pointerdown", ensureAudio, { once: true });
  window.addEventListener("beforeunload", safelyDestroyPeer);

  updateSettingOutputs();
  setScreen("home");
  requestAnimationFrame(renderFrame);
})();
