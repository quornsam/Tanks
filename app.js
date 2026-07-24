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
    visibilityWarning: $("visibilityWarning"),
    visibilityWarningText: $("visibilityWarningText"),
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
    returnMenuButton: $("returnMenuButton"),
    modalCloseButton: $("modalCloseButton"),
    replayAcceptButton: $("replayAcceptButton"),
    replayDeclineButton: $("replayDeclineButton"),
    canvasViewLabel: $("canvasViewLabel"),
    locatorButton: $("locatorButton"),
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
  let visibilityWarningActive = false;
  let winnerModalDismissed = false;
  const inspectionCamera = {
    active: false,
    centerX: 0,
    centerY: WORLD_HEIGHT / 2,
    zoom: 1,
    targetX: null,
    targetY: null,
    dragging: false,
    lastClientX: 0,
    lastClientY: 0,
    pointers: new Map(),
    pinchDistance: 0,
    pinchZoom: 1
  };

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
    document.body.classList.toggle("game-active", name === "game");
    if (name === "game") requestAnimationFrame(() => {
      resizeCanvasToDisplaySize();
      fitPanelsToViewport();
    });
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
    updateVisibilityWarning();
  }

  function updateVisibilityWarning() {
    const tankSize = Number(dom.tankSizeInput.value);
    const worldSize = dom.worldSizeSelect.value;
    const difficult = (worldSize === "epic" && tankSize <= 20) || (worldSize === "massive" && tankSize <= 10);
    dom.visibilityWarning.classList.toggle("hidden", !difficult);
    if (difficult) {
      const worldLabel = capitalize(worldSize);
      const article = worldLabel === "Epic" ? "an" : "a";
      dom.visibilityWarningText.textContent = `${tankSize}% tanks on ${article} ${worldLabel} map will be tiny in the whole-map view. Use the magnifying-glass locator during play.`;
      if (!visibilityWarningActive) playWarningSound();
    }
    visibilityWarningActive = difficult;
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
        metadata: { application: "red-blue-tanks", version: 3, request: "join" }
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
        if (data.message) {
          addEvent(data.message);
          if (/ moved /.test(` ${data.message} `)) playMoveSound();
        }
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
        playIncomingChatSound();
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
    addChatMessage("Computer", "Link established. Fire-control system active.", false, true);
  }

  function createGameState(settings, session = {}) {
    const seed = randomSeed();
    const terrain = generateTerrain(settings, seed);
    const spawnPositions = chooseSpawnPositions(terrain, settings, seed);
    guaranteeSpawnHeightDifference(terrain, spawnPositions, settings);
    const padRadius = Math.max(6.5, 9.2 * (settings.tankSize / 100));
    flattenTerrain(terrain, spawnPositions.blue, settings.worldWidth, padRadius);
    flattenTerrain(terrain, spawnPositions.red, settings.worldWidth, padRadius);

    const scores = session.scores ? deepClone(session.scores) : { blue: 0, red: 0 };
    const roundNumber = Number.isFinite(session.round) ? session.round : 1;
    const state = {
      version: 4,
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
    const radiusIndex = Math.max(10, Math.round((radius / worldWidth) * values.length));
    const flatIndex = Math.max(5, Math.round(radiusIndex * 0.54));
    const target = values[centerIndex];
    for (let offset = -radiusIndex; offset <= radiusIndex; offset += 1) {
      const index = centerIndex + offset;
      if (index < 0 || index >= values.length) continue;
      const distance = Math.abs(offset);
      if (distance <= flatIndex) {
        values[index] = target;
      } else {
        const t = (distance - flatIndex) / Math.max(1, radiusIndex - flatIndex);
        const blend = Math.cos(t * Math.PI / 2) ** 2;
        values[index] = values[index] * (1 - blend) + target * blend;
      }
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
    resetInspectionView(false);
    winnerModalDismissed = false;
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

    if (gameState.winner && !pendingActionRequest && !localActionRequest && !winnerModalDismissed) {
      showCanvasMessage(
        `${TEAM_NAMES[gameState.winner].toUpperCase()} WINS`,
        `Match score ${gameState.scores.blue}–${gameState.scores.red}`,
        "winner"
      );
    } else if (!pendingActionRequest && !localActionRequest && !gameState.winner) {
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
    dom.locatorButton.disabled = Boolean(animation);
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
    playMoveSound();
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
    resetInspectionView(false);
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
      playMissSound();
    }

    if (gameState.winner) {
      addEvent(`${TEAM_NAMES[gameState.winner]} wins the battle.`, "hit");
      playVictorySound();
    } else {
      playTurnSound(gameState.turn);
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
        "Impact estimate updated.",
        "Adjusting elevation.",
        "Range correction entered.",
        "Message received. Target remains acquired."
      ];
      setTimeout(() => {
        addChatMessage("Computer", replies[Math.floor(Math.random() * replies.length)], false, true);
        playIncomingChatSound();
      }, 650);
    } else if (connection && connection.open && accepted) {
      connection.send({ type: "chat", sender: team, text });
    }
    playOutgoingChatSound();
  }

  function showCanvasMessage(message, subtitle = "", mode = "notice") {
    dom.canvasMessageTitle.textContent = message;
    dom.canvasMessageSub.textContent = subtitle;
    dom.canvasMessageSub.classList.toggle("hidden", !subtitle);
    const hasActions = mode === "winner" || mode === "request";
    dom.canvasMessageActions.classList.toggle("hidden", !hasActions);
    dom.modalCloseButton.classList.toggle("hidden", mode !== "winner");
    dom.replayRequestButton.classList.toggle("hidden", mode !== "winner");
    dom.returnMenuButton.classList.toggle("hidden", mode !== "winner");
    dom.replayAcceptButton.classList.toggle("hidden", mode !== "request");
    dom.replayDeclineButton.classList.toggle("hidden", mode !== "request");
    dom.replayRequestButton.textContent = "Play again";
    dom.canvasMessage.classList.remove("hidden");
  }

  function hideCanvasMessage() {
    dom.canvasMessage.classList.add("hidden");
    dom.canvasMessageActions.classList.add("hidden");
    dom.modalCloseButton.classList.add("hidden");
    dom.replayRequestButton.classList.add("hidden");
    dom.returnMenuButton.classList.add("hidden");
    dom.replayAcceptButton.classList.add("hidden");
    dom.replayDeclineButton.classList.add("hidden");
  }

  function dismissEndModal() {
    winnerModalDismissed = true;
    hideCanvasMessage();
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
    playRoundSound();
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
    winnerModalDismissed = false;
    resetInspectionView(false);
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
    winnerModalDismissed = false;
    resetInspectionView(false);
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
      dom.gameScreen.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  function updateFullscreenButton() {
    const active = document.fullscreenElement === dom.gameScreen;
    dom.fullscreenButton.textContent = active ? "×" : "⛶";
    dom.fullscreenButton.title = active ? "Exit full screen" : "Full screen";
    dom.fullscreenButton.setAttribute("aria-label", active ? "Exit full screen" : "Full screen");
    requestAnimationFrame(resizeCanvasToDisplaySize);
  }

  function resetInspectionView(announce = true) {
    inspectionCamera.active = false;
    inspectionCamera.zoom = 1;
    inspectionCamera.targetX = null;
    inspectionCamera.targetY = null;
    inspectionCamera.dragging = false;
    inspectionCamera.pointers.clear();
    if (gameState) {
      inspectionCamera.centerX = gameState.settings.worldWidth / 2;
      inspectionCamera.centerY = WORLD_HEIGHT / 2;
    }
    dom.canvasFrame.classList.remove("inspection-active");
    dom.locatorButton.classList.remove("active");
    dom.locatorButton.textContent = "⌖";
    dom.locatorButton.title = "Inspect terrain";
    dom.locatorButton.setAttribute("aria-label", "Inspect terrain");
    dom.canvasViewLabel.textContent = "WHOLE BATTLEFIELD";
    if (announce && gameState) addEvent("Whole battlefield view restored.");
  }

  function toggleInspectionMode() {
    if (!gameState) return;
    if (inspectionCamera.active) {
      resetInspectionView(true);
      playLocatorSound();
      return;
    }
    inspectionCamera.active = true;
    inspectionCamera.zoom = Math.max(2.4, inspectionCamera.zoom);
    inspectionCamera.centerX = gameState.settings.worldWidth / 2;
    inspectionCamera.centerY = WORLD_HEIGHT / 2;
    inspectionCamera.targetX = inspectionCamera.centerX;
    inspectionCamera.targetY = inspectionCamera.centerY;
    dom.canvasFrame.classList.add("inspection-active");
    dom.locatorButton.classList.add("active");
    dom.locatorButton.textContent = "×";
    dom.locatorButton.title = "Return to whole battlefield";
    dom.locatorButton.setAttribute("aria-label", "Return to whole battlefield");
    dom.canvasViewLabel.textContent = "INSPECT TERRAIN · DRAG · WHEEL OR PINCH";
    playLocatorSound();
    addEvent("Terrain inspection active. Drag to pan; wheel or pinch to zoom.");
  }

  function clampInspectionCenter() {
    if (!gameState) return;
    const bounds = rawInspectionBounds();
    const halfX = (bounds.maxX - bounds.minX) / 2;
    const halfY = (bounds.maxY - bounds.minY) / 2;
    inspectionCamera.centerX = clamp(inspectionCamera.centerX, halfX, gameState.settings.worldWidth - halfX);
    inspectionCamera.centerY = clamp(inspectionCamera.centerY, halfY, WORLD_HEIGHT - halfY);
  }

  function rawInspectionBounds() {
    const worldWidth = gameState ? gameState.settings.worldWidth : 1;
    const zoom = clamp(inspectionCamera.zoom, 1, 18);
    return { minX: 0, maxX: worldWidth / zoom, minY: 0, maxY: WORLD_HEIGHT / zoom };
  }

  function currentViewBounds() {
    if (!gameState || !inspectionCamera.active) {
      return { minX: 0, maxX: gameState ? gameState.settings.worldWidth : 1, minY: 0, maxY: WORLD_HEIGHT };
    }
    const span = rawInspectionBounds();
    const xSpan = span.maxX - span.minX;
    const ySpan = span.maxY - span.minY;
    const minX = clamp(inspectionCamera.centerX - xSpan / 2, 0, Math.max(0, gameState.settings.worldWidth - xSpan));
    const minY = clamp(inspectionCamera.centerY - ySpan / 2, 0, Math.max(0, WORLD_HEIGHT - ySpan));
    return { minX, maxX: minX + xSpan, minY, maxY: minY + ySpan };
  }

  function canvasToWorld(clientX, clientY) {
    const rect = dom.canvas.getBoundingClientRect();
    const bounds = currentViewBounds();
    const px = clamp((clientX - rect.left) / Math.max(1, rect.width), 0, 1);
    const py = clamp((clientY - rect.top) / Math.max(1, rect.height), 0, 1);
    return {
      x: bounds.minX + px * (bounds.maxX - bounds.minX),
      y: bounds.maxY - py * (bounds.maxY - bounds.minY)
    };
  }

  function setInspectionTarget(clientX, clientY) {
    const point = canvasToWorld(clientX, clientY);
    inspectionCamera.targetX = point.x;
    inspectionCamera.targetY = point.y;
    inspectionCamera.centerX = point.x;
    inspectionCamera.centerY = point.y;
    clampInspectionCenter();
  }

  function handleCanvasPointerDown(event) {
    if (!inspectionCamera.active || !gameState) return;
    dom.canvas.setPointerCapture?.(event.pointerId);
    inspectionCamera.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    inspectionCamera.dragging = true;
    inspectionCamera.lastClientX = event.clientX;
    inspectionCamera.lastClientY = event.clientY;
    if (inspectionCamera.pointers.size === 1) setInspectionTarget(event.clientX, event.clientY);
    if (inspectionCamera.pointers.size === 2) {
      const points = [...inspectionCamera.pointers.values()];
      inspectionCamera.pinchDistance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      inspectionCamera.pinchZoom = inspectionCamera.zoom;
    }
    event.preventDefault();
  }

  function handleCanvasPointerMove(event) {
    if (!inspectionCamera.active || !inspectionCamera.pointers.has(event.pointerId) || !gameState) return;
    const previous = inspectionCamera.pointers.get(event.pointerId);
    inspectionCamera.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (inspectionCamera.pointers.size >= 2) {
      const points = [...inspectionCamera.pointers.values()].slice(0, 2);
      const distance = Math.max(20, Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y));
      if (inspectionCamera.pinchDistance > 0) inspectionCamera.zoom = clamp(inspectionCamera.pinchZoom * distance / inspectionCamera.pinchDistance, 1.2, 18);
      const midX = (points[0].x + points[1].x) / 2;
      const midY = (points[0].y + points[1].y) / 2;
      setInspectionTarget(midX, midY);
    } else {
      const bounds = currentViewBounds();
      const rect = dom.canvas.getBoundingClientRect();
      const dxWorld = (event.clientX - previous.x) / Math.max(1, rect.width) * (bounds.maxX - bounds.minX);
      const dyWorld = (event.clientY - previous.y) / Math.max(1, rect.height) * (bounds.maxY - bounds.minY);
      inspectionCamera.centerX -= dxWorld;
      inspectionCamera.centerY += dyWorld;
      inspectionCamera.targetX = inspectionCamera.centerX;
      inspectionCamera.targetY = inspectionCamera.centerY;
      clampInspectionCenter();
    }
    inspectionCamera.lastClientX = event.clientX;
    inspectionCamera.lastClientY = event.clientY;
    event.preventDefault();
  }

  function handleCanvasPointerUp(event) {
    inspectionCamera.pointers.delete(event.pointerId);
    inspectionCamera.dragging = inspectionCamera.pointers.size > 0;
    if (inspectionCamera.pointers.size < 2) inspectionCamera.pinchDistance = 0;
  }

  function handleCanvasWheel(event) {
    if (!inspectionCamera.active || !gameState) return;
    event.preventDefault();
    const before = canvasToWorld(event.clientX, event.clientY);
    const factor = Math.exp(-event.deltaY * 0.0015);
    inspectionCamera.zoom = clamp(inspectionCamera.zoom * factor, 1.2, 18);
    const after = canvasToWorld(event.clientX, event.clientY);
    inspectionCamera.centerX += before.x - after.x;
    inspectionCamera.centerY += before.y - after.y;
    inspectionCamera.targetX = before.x;
    inspectionCamera.targetY = before.y;
    clampInspectionCenter();
  }

  function resizeCanvasToDisplaySize() {
    const rect = dom.canvas.getBoundingClientRect();
    const width = Math.max(320, Math.round(rect.width));
    const height = Math.max(180, Math.round(rect.height));
    if (dom.canvas.width !== width || dom.canvas.height !== height) {
      dom.canvas.width = width;
      dom.canvas.height = height;
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
    noiseBurst(.12, .035);
    tone(145, .13, "sawtooth", .055);
    tone(72, .26, "square", .04, .035);
    tone(410, .09, "triangle", .025, .02);
  }

  function playExplosionSound(directHit = false) {
    noiseBurst(directHit ? .48 : .38, directHit ? .15 : .11);
    tone(directHit ? 48 : 58, directHit ? .58 : .43, "sine", directHit ? .11 : .075);
    tone(115, .18, "sawtooth", .028, .025);
  }

  function playHitSound() {
    tone(880, .06, "square", .045);
    tone(510, .14, "square", .04, .055);
    tone(96, .32, "triangle", .055, .08);
  }

  function playMoveSound() {
    noiseBurst(.16, .025);
    tone(92, .08, "square", .025);
    tone(78, .08, "square", .022, .07);
    tone(102, .07, "square", .02, .135);
  }

  function playMissSound() {
    tone(260, .16, "sine", .024);
    tone(190, .22, "sine", .018, .12);
  }

  function playTurnSound(team) {
    const base = team === "blue" ? 520 : 390;
    tone(base, .08, "triangle", .025);
    tone(base * 1.25, .11, "triangle", .022, .075);
  }

  function playRoundSound() {
    tone(220, .1, "triangle", .035);
    tone(330, .12, "triangle", .035, .09);
    tone(440, .16, "triangle", .04, .18);
  }

  function playLocatorSound() {
    tone(720, .055, "sine", .022);
    tone(930, .075, "sine", .018, .06);
  }

  function playWarningSound() {
    tone(250, .09, "square", .022);
    tone(210, .12, "square", .018, .1);
  }

  function playUiSound() {
    tone(460, .045, "triangle", .012);
  }

  function playVictorySound() {
    noiseBurst(.18, .035);
    tone(330, .18, "triangle", .05);
    tone(440, .18, "triangle", .05, .16);
    tone(660, .35, "triangle", .06, .32);
    tone(880, .28, "triangle", .04, .47);
  }

  function playOutgoingChatSound() {
    tone(980, .035, "square", .018);
    tone(420, .045, "square", .012, .035);
  }

  function playIncomingChatSound() {
    noiseBurst(.055, .012);
    tone(760, .07, "square", .032);
    tone(1040, .09, "square", .028, .075);
    tone(620, .12, "triangle", .022, .16);
  }

  function canvasMetrics() {
    const bounds = currentViewBounds();
    return {
      width: dom.canvas.width,
      height: dom.canvas.height,
      minX: bounds.minX,
      maxX: bounds.maxX,
      minY: bounds.minY,
      maxY: bounds.maxY,
      sx: dom.canvas.width / Math.max(.001, bounds.maxX - bounds.minX),
      sy: dom.canvas.height / Math.max(.001, bounds.maxY - bounds.minY)
    };
  }

  function worldToCanvas(x, y) {
    const metrics = canvasMetrics();
    return {
      x: (x - metrics.minX) * metrics.sx,
      y: (metrics.maxY - y) * metrics.sy
    };
  }

  function renderFrame(now) {
    resizeCanvasToDisplaySize();
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
    drawTankPads();
    drawAimGuide();
    drawTank("blue", now);
    drawTank("red", now);
    drawInspectionReticle(now);
    drawProjectileAnimation(now);
    drawVignette();
  }

  function drawSky(now) {
    const width = dom.canvas.width;
    const height = dom.canvas.height;
    const location = gameState.settings.location;
    const palettes = {
      earth: ["#263746", "#65727a", "#a29d8e"],
      mars: ["#4b2925", "#8a5545", "#b28366"],
      moon: ["#020407", "#0c1118", "#252a2e"],
      space: ["#020307", "#090c16", "#151321"]
    };
    const colors = palettes[location];
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(.58, colors[1]);
    gradient.addColorStop(1, colors[2]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    if (location === "earth") drawEarthSky(now);
    if (location === "mars") drawMarsSky();
    if (location === "moon") drawMoonSky();
    if (location === "space") drawSpaceSky(now);

    // Fine atmospheric grain prevents the sky looking like a flat cartoon wash.
    const random = mulberry32(gameState.seed ^ 0xa5a5a5a5);
    ctx.save();
    ctx.globalAlpha = location === "earth" || location === "mars" ? .045 : .025;
    for (let i = 0; i < 340; i += 1) {
      const shade = 90 + Math.floor(random() * 120);
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
      ctx.fillRect(random() * width, random() * height, 1 + random() * 1.5, 1 + random());
    }
    ctx.restore();
  }

  function drawEarthSky(now) {
    const width = dom.canvas.width;
    const height = dom.canvas.height;
    ctx.save();
    const haze = ctx.createRadialGradient(width * .76, height * .2, 12, width * .76, height * .2, height * .36);
    haze.addColorStop(0, "rgba(225,215,184,.34)");
    haze.addColorStop(.32, "rgba(193,188,166,.13)");
    haze.addColorStop(1, "rgba(180,180,170,0)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, width, height);

    const random = mulberry32(gameState.seed ^ 0x1f123bb5);
    for (let band = 0; band < 6; band += 1) {
      const yBase = height * (.12 + band * .075);
      const bandHeight = 10 + random() * 20;
      const drift = (now * (.001 + band * .00012)) % 80;
      ctx.globalAlpha = .055 + band * .012;
      ctx.fillStyle = band < 2 ? "#d0d0c8" : "#aeb3b5";
      ctx.beginPath();
      ctx.moveTo(-30, yBase + bandHeight);
      for (let x = -30; x <= width + 60; x += 42) {
        const y = yBase + Math.sin((x + drift) * .017 + band) * (4 + band * .8) + (random() - .5) * 9;
        ctx.lineTo(x, y);
      }
      for (let x = width + 60; x >= -30; x -= 42) {
        const y = yBase + bandHeight + Math.sin((x + drift) * .014 + band * 1.3) * (4 + band * .6) + (random() - .5) * 8;
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
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
    const random = mulberry32(gameState.seed ^ 0x6d2b79f5);
    const layers = location === "earth" ? 3 : 2;
    ctx.save();
    for (let layer = 0; layer < layers; layer += 1) {
      const baseline = height * (.65 + layer * .07);
      const amplitude = height * (.07 + layer * .025);
      ctx.globalAlpha = .16 - layer * .035;
      ctx.fillStyle = location === "earth" ? ["#202b2d", "#293337", "#3a4140"][layer] : location === "mars" ? ["#432a26", "#5a3930"][layer] : ["#292d31", "#3b3d40"][layer];
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(0, baseline);
      for (let x = 0; x <= width + 60; x += 38) {
        const jag = (random() - .5) * amplitude * .38;
        const y = baseline - Math.abs(Math.sin(x * (.006 + layer * .0015) + gameState.seed * .00002)) * amplitude + jag;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function terrainSurfacePath() {
    ctx.beginPath();
    gameState.terrain.forEach((heightValue, index) => {
      const worldX = index / (gameState.terrain.length - 1) * gameState.settings.worldWidth;
      const point = worldToCanvas(worldX, heightValue);
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
  }

  function drawTerrain() {
    const metrics = canvasMetrics();
    const location = gameState.settings.location;
    const colors = {
      earth: ["#50513c", "#313425", "#171a14"],
      mars: ["#784c37", "#4b2f27", "#241918"],
      moon: ["#777a76", "#424542", "#202322"],
      space: ["#5f565c", "#393139", "#1b171d"]
    }[location];

    const gradient = ctx.createLinearGradient(0, metrics.height * .38, 0, metrics.height);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(.34, colors[1]);
    gradient.addColorStop(1, colors[2]);

    ctx.beginPath();
    ctx.moveTo(0, metrics.height);
    gameState.terrain.forEach((heightValue, index) => {
      const worldX = index / (gameState.terrain.length - 1) * gameState.settings.worldWidth;
      const point = worldToCanvas(worldX, heightValue);
      ctx.lineTo(point.x, point.y);
    });
    ctx.lineTo(metrics.width, metrics.height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Geological strata and fractures clipped inside the terrain.
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, metrics.height);
    gameState.terrain.forEach((heightValue, index) => {
      const worldX = index / (gameState.terrain.length - 1) * gameState.settings.worldWidth;
      const point = worldToCanvas(worldX, heightValue);
      ctx.lineTo(point.x, point.y);
    });
    ctx.lineTo(metrics.width, metrics.height);
    ctx.closePath();
    ctx.clip();

    const random = mulberry32(gameState.seed ^ 0x85ebca6b);
    ctx.lineCap = "round";
    for (let layer = 0; layer < 8; layer += 1) {
      ctx.globalAlpha = .055 + layer * .008;
      ctx.strokeStyle = layer % 2 ? "#d5c7aa" : "#090b0a";
      ctx.lineWidth = .6 + random() * 1.2;
      ctx.beginPath();
      const yBase = metrics.height * (.56 + layer * .058);
      for (let x = -20; x <= metrics.width + 20; x += 30) {
        const y = yBase + Math.sin(x * .018 + layer * 1.7) * (4 + layer) + (random() - .5) * 7;
        if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    ctx.globalAlpha = .18;
    for (let i = 0; i < 260; i += 1) {
      const xWorld = random() * gameState.settings.worldWidth;
      const ground = terrainAt(xWorld);
      const depth = 1.4 + random() * 17;
      const p = worldToCanvas(xWorld, Math.max(1, ground - depth));
      const size = .45 + random() * 2.2;
      ctx.fillStyle = random() > .55 ? "#0d100e" : "#b4aa91";
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, size * (1.2 + random()), size, random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = .13;
    ctx.strokeStyle = "#050606";
    for (let i = 0; i < 58; i += 1) {
      const xWorld = random() * gameState.settings.worldWidth;
      const ground = terrainAt(xWorld);
      const p = worldToCanvas(xWorld, ground - 2 - random() * 13);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + (random() - .5) * 18, p.y + 8 + random() * 28);
      ctx.stroke();
    }
    ctx.restore();

    terrainSurfacePath();
    ctx.lineWidth = Math.max(1.2, Math.min(3, metrics.sy * .24));
    ctx.strokeStyle = location === "earth" ? "#74745b" : location === "mars" ? "#9a6447" : "#999a94";
    ctx.stroke();
    terrainSurfacePath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(10,12,10,.72)";
    ctx.stroke();
  }

  function drawTankPads() {
    if (!gameState?.spawnPositions) return;
    const radius = Math.max(6.5, 9.2 * (gameState.settings.tankSize / 100));
    const random = mulberry32(gameState.seed ^ 0xc2b2ae35);
    ctx.save();
    for (const team of ["blue", "red"]) {
      const centerX = gameState.spawnPositions[team];
      const ground = terrainAt(centerX);
      const originalGround = terrainAt(centerX, { ...gameState, terrain: gameState.baseTerrain });
      if (Math.abs(ground - originalGround) > 1.5) continue;
      const left = worldToCanvas(centerX - radius * .64, ground + .03);
      const right = worldToCanvas(centerX + radius * .64, ground + .03);
      const thickness = Math.max(2, Math.min(7, canvasMetrics().sy * .55));
      ctx.strokeStyle = "rgba(20,20,17,.72)";
      ctx.lineWidth = thickness + 2;
      ctx.beginPath();
      ctx.moveTo(left.x, left.y);
      ctx.lineTo(right.x, right.y);
      ctx.stroke();
      ctx.strokeStyle = "rgba(91,88,72,.62)";
      ctx.lineWidth = thickness;
      ctx.stroke();
      ctx.globalAlpha = .4;
      ctx.fillStyle = "#10110e";
      for (let i = 0; i < 8; i += 1) {
        const t = i / 7;
        const x = left.x + (right.x - left.x) * t + (random() - .5) * 5;
        ctx.fillRect(x, left.y - 1 + (random() - .5) * 2, 1 + random() * 2, 1 + random() * 1.5);
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
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
    const accent = team === "blue" ? "#486f86" : "#7d4743";
    const accentLight = team === "blue" ? "#7192a3" : "#a0665f";
    const steel = "#434840";
    const steelLight = "#666b61";
    const steelDark = "#1e221f";
    const detail = bodyWidth >= 9 && bodyHeight >= 4;
    const fineDetail = bodyWidth >= 18 && bodyHeight >= 8;

    const center = tankCenter(gameState, team);
    const turretPoint = worldToCanvas(center.x, center.y);
    const barrelAngle = -(tank.angle * Math.PI / 180);
    const barrelLength = bodyWidth * 1.08;
    const barrelThickness = Math.max(.55, bodyHeight * .13);

    // Long steel barrel with a squared mantlet and muzzle brake.
    ctx.save();
    ctx.translate(turretPoint.x, turretPoint.y);
    ctx.rotate(barrelAngle);
    const barrelGradient = ctx.createLinearGradient(0, -barrelThickness, 0, barrelThickness);
    barrelGradient.addColorStop(0, steelLight);
    barrelGradient.addColorStop(.45, steel);
    barrelGradient.addColorStop(1, steelDark);
    ctx.fillStyle = barrelGradient;
    ctx.fillRect(bodyHeight * .04, -barrelThickness / 2, barrelLength, barrelThickness);
    ctx.fillStyle = "#171a18";
    ctx.fillRect(barrelLength * .91, -barrelThickness * .85, barrelLength * .14, barrelThickness * 1.7);
    ctx.fillStyle = "rgba(220,220,205,.17)";
    ctx.fillRect(barrelLength * .12, -barrelThickness * .34, barrelLength * .55, Math.max(.45, barrelThickness * .12));
    ctx.restore();

    ctx.save();
    ctx.translate(groundPoint.x, groundPoint.y - bodyHeight * .39);
    ctx.rotate(bodyAngle);

    ctx.fillStyle = "rgba(0,0,0,.46)";
    ctx.beginPath();
    ctx.ellipse(0, bodyHeight * .72, bodyWidth * .66, bodyHeight * .21, 0, 0, Math.PI * 2);
    ctx.fill();

    // Track housing: angular rather than toy-like rounded lozenges.
    const trackTop = bodyHeight * .12;
    const trackBottom = bodyHeight * .61;
    ctx.fillStyle = "#111411";
    ctx.beginPath();
    ctx.moveTo(-bodyWidth * .57, trackTop + bodyHeight * .12);
    ctx.lineTo(-bodyWidth * .48, trackTop);
    ctx.lineTo(bodyWidth * .48, trackTop);
    ctx.lineTo(bodyWidth * .58, trackTop + bodyHeight * .13);
    ctx.lineTo(bodyWidth * .50, trackBottom);
    ctx.lineTo(-bodyWidth * .50, trackBottom);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#5f625a";
    ctx.lineWidth = Math.max(.45, bodyHeight * .035);
    ctx.stroke();

    if (detail) {
      const wheelY = bodyHeight * .39;
      const wheelRadius = bodyHeight * .18;
      for (let i = 0; i < 6; i += 1) {
        const wheelX = -bodyWidth * .40 + i * bodyWidth * .16;
        ctx.fillStyle = i === 0 || i === 5 ? "#343934" : "#454b44";
        ctx.beginPath();
        ctx.arc(wheelX, wheelY, wheelRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#777a70";
        ctx.lineWidth = Math.max(.35, bodyHeight * .025);
        ctx.stroke();
        ctx.fillStyle = "#171a17";
        ctx.beginPath();
        ctx.arc(wheelX, wheelY, wheelRadius * .38, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = "rgba(180,184,170,.23)";
      ctx.lineWidth = Math.max(.35, bodyHeight * .025);
      for (let i = 0; i < 12; i += 1) {
        const x = -bodyWidth * .50 + i * bodyWidth * .091;
        ctx.beginPath();
        ctx.moveTo(x, trackTop + bodyHeight * .03);
        ctx.lineTo(x + bodyWidth * .018, trackTop + bodyHeight * .15);
        ctx.stroke();
      }
    }

    // Low, sloped hull with muted team identification panel.
    const hull = ctx.createLinearGradient(0, -bodyHeight * .42, 0, bodyHeight * .2);
    hull.addColorStop(0, steelLight);
    hull.addColorStop(.42, steel);
    hull.addColorStop(1, steelDark);
    ctx.fillStyle = hull;
    ctx.beginPath();
    ctx.moveTo(-bodyWidth * .48, bodyHeight * .16);
    ctx.lineTo(-bodyWidth * .36, -bodyHeight * .24);
    ctx.lineTo(bodyWidth * .31, -bodyHeight * .28);
    ctx.lineTo(bodyWidth * .51, -bodyHeight * .02);
    ctx.lineTo(bodyWidth * .42, bodyHeight * .20);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#151815";
    ctx.lineWidth = Math.max(.55, bodyHeight * .05);
    ctx.stroke();

    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(-bodyWidth * .28, -bodyHeight * .10);
    ctx.lineTo(bodyWidth * .25, -bodyHeight * .12);
    ctx.lineTo(bodyWidth * .31, bodyHeight * .07);
    ctx.lineTo(-bodyWidth * .30, bodyHeight * .09);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = .5;
    ctx.strokeStyle = accentLight;
    ctx.stroke();
    ctx.globalAlpha = 1;

    if (fineDetail) {
      // Bolts, seams, scratches and dried mud.
      ctx.strokeStyle = "rgba(15,17,14,.65)";
      ctx.lineWidth = Math.max(.4, bodyHeight * .026);
      ctx.beginPath();
      ctx.moveTo(-bodyWidth * .30, -bodyHeight * .04);
      ctx.lineTo(bodyWidth * .27, -bodyHeight * .05);
      ctx.stroke();
      ctx.fillStyle = "#a2a08e";
      for (const x of [-.29, -.12, .05, .22]) {
        ctx.beginPath();
        ctx.arc(bodyWidth * x, bodyHeight * .015, Math.max(.55, bodyHeight * .022), 0, Math.PI * 2);
        ctx.fill();
      }
      const random = mulberry32(gameState.seed ^ (team === "blue" ? 0x22334455 : 0x88442211));
      ctx.strokeStyle = "rgba(218,209,183,.25)";
      ctx.lineWidth = Math.max(.35, bodyHeight * .02);
      for (let i = 0; i < 13; i += 1) {
        const x = (random() - .5) * bodyWidth * .78;
        const y = -bodyHeight * .18 + random() * bodyHeight * .31;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (random() - .5) * bodyWidth * .12, y + (random() - .5) * bodyHeight * .06);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(82,58,38,.46)";
      for (let i = 0; i < 10; i += 1) {
        ctx.beginPath();
        ctx.arc((random() - .5) * bodyWidth * .9, bodyHeight * (.18 + random() * .32), 1 + random() * bodyHeight * .05, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // Angular turret and cupola.
    const turretW = Math.max(.5, bodyWidth * .42);
    const turretH = Math.max(.35, bodyHeight * .46);
    ctx.save();
    ctx.translate(turretPoint.x, turretPoint.y);
    const turretGradient = ctx.createLinearGradient(0, -turretH, 0, turretH * .35);
    turretGradient.addColorStop(0, steelLight);
    turretGradient.addColorStop(.55, steel);
    turretGradient.addColorStop(1, steelDark);
    ctx.fillStyle = turretGradient;
    ctx.beginPath();
    ctx.moveTo(-turretW * .52, turretH * .25);
    ctx.lineTo(-turretW * .40, -turretH * .47);
    ctx.lineTo(turretW * .28, -turretH * .52);
    ctx.lineTo(turretW * .52, -turretH * .14);
    ctx.lineTo(turretW * .46, turretH * .28);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#141714";
    ctx.lineWidth = Math.max(.5, bodyHeight * .045);
    ctx.stroke();

    ctx.fillStyle = accent;
    ctx.fillRect(-turretW * .30, -turretH * .22, turretW * .46, turretH * .22);
    ctx.fillStyle = "#171a18";
    ctx.fillRect(turretW * .34, -turretH * .16, turretW * .20, turretH * .34);

    if (detail) {
      ctx.fillStyle = "#252a25";
      ctx.fillRect(-turretW * .18, -turretH * .70, turretW * .33, turretH * .16);
      ctx.strokeStyle = "#111411";
      ctx.strokeRect(-turretW * .18, -turretH * .70, turretW * .33, turretH * .16);
      ctx.strokeStyle = "#363b35";
      ctx.lineWidth = Math.max(.45, bodyHeight * .035);
      ctx.beginPath();
      ctx.moveTo(-turretW * .33, -turretH * .50);
      ctx.lineTo(-turretW * .43, -turretH * 1.65);
      ctx.stroke();
      ctx.fillStyle = team === "blue" ? "#617f8f" : "#8b5650";
      ctx.beginPath();
      ctx.arc(-turretW * .43, -turretH * 1.65, Math.max(.65, bodyHeight * .035), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    if (tank.hits > 0 && tank.alive) drawTankSmoke(turretPoint.x, turretPoint.y, tank.hits, now);
    if (!tank.alive) drawDestroyedTank(turretPoint.x, turretPoint.y, accent, now);
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

  function drawInspectionReticle(now) {
    if (!inspectionCamera.active || !gameState || !Number.isFinite(inspectionCamera.targetX)) return;
    const point = worldToCanvas(inspectionCamera.targetX, inspectionCamera.targetY);
    const pulse = 16 + Math.sin(now * .007) * 2;
    ctx.save();
    ctx.strokeStyle = "rgba(226, 231, 224, .82)";
    ctx.lineWidth = 1.25;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.arc(point.x, point.y, pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(point.x - pulse - 9, point.y);
    ctx.lineTo(point.x - 5, point.y);
    ctx.moveTo(point.x + 5, point.y);
    ctx.lineTo(point.x + pulse + 9, point.y);
    ctx.moveTo(point.x, point.y - pulse - 9);
    ctx.lineTo(point.x, point.y - 5);
    ctx.moveTo(point.x, point.y + 5);
    ctx.lineTo(point.x, point.y + pulse + 9);
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
          playExplosionSound(Boolean(packet.hitTeam));
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

  function togglePanel(panel, forceCollapsed = null) {
    if (!panel) return;
    const collapsed = forceCollapsed === null ? !panel.classList.contains("collapsed") : forceCollapsed;
    panel.classList.toggle("collapsed", collapsed);
    const button = panel.querySelector(".collapse-button");
    if (button) {
      button.textContent = collapsed ? "+" : "−";
      const name = panel.dataset.panel || "panel";
      button.title = collapsed ? "Expand panel" : "Collapse panel";
      button.setAttribute("aria-label", `${collapsed ? "Expand" : "Collapse"} ${name}`);
      button.setAttribute("aria-expanded", String(!collapsed));
    }
    requestAnimationFrame(resizeCanvasToDisplaySize);
  }

  function fitPanelsToViewport() {
    if (dom.gameScreen.classList.contains("hidden")) return;
    const short = window.innerHeight < 760;
    const narrow = window.innerWidth < 1050;
    document.querySelectorAll(".collapsible-panel").forEach(panel => {
      if (!panel.dataset.autoPrepared) {
        panel.dataset.autoPrepared = "true";
        if (panel.dataset.panel === "log") togglePanel(panel, true);
        if (short && panel.dataset.panel === "telemetry") togglePanel(panel, true);
        if ((short || narrow) && panel.dataset.panel === "battlefield") togglePanel(panel, true);
        if (window.innerWidth <= 720 && panel.dataset.panel === "chat") togglePanel(panel, true);
      }
    });
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    dom.soundButton.classList.toggle("active", soundEnabled);
    dom.soundButton.textContent = soundEnabled ? "♪" : "×";
    if (soundEnabled) playIncomingChatSound();
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
  dom.worldSizeSelect.addEventListener("change", updateSettingOutputs);
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
  dom.locatorButton.addEventListener("click", toggleInspectionMode);
  dom.fullscreenButton.addEventListener("click", toggleFullscreen);
  dom.restartRoundButton.addEventListener("click", () => requestRoundAction("restart"));
  dom.regenerateMapButton.addEventListener("click", () => requestRoundAction("regenerate"));
  dom.replayRequestButton.addEventListener("click", () => requestRoundAction("replay"));
  dom.returnMenuButton.addEventListener("click", resetAll);
  dom.modalCloseButton.addEventListener("click", dismissEndModal);
  dom.replayAcceptButton.addEventListener("click", acceptActionRequest);
  dom.replayDeclineButton.addEventListener("click", declineActionRequest);
  dom.leaveGameButton.addEventListener("click", resetAll);
  document.addEventListener("keydown", keyboardControls);
  document.addEventListener("fullscreenchange", updateFullscreenButton);
  document.addEventListener("pointerdown", ensureAudio, { once: true });
  document.addEventListener("click", event => {
    if (event.target.closest("button") && event.target !== dom.soundButton) playUiSound();
  });
  dom.canvas.addEventListener("pointerdown", handleCanvasPointerDown);
  dom.canvas.addEventListener("pointermove", handleCanvasPointerMove);
  dom.canvas.addEventListener("pointerup", handleCanvasPointerUp);
  dom.canvas.addEventListener("pointercancel", handleCanvasPointerUp);
  dom.canvas.addEventListener("wheel", handleCanvasWheel, { passive: false });
  document.querySelectorAll(".collapse-button").forEach(button => {
    button.addEventListener("click", () => togglePanel(button.closest(".collapsible-panel")));
  });
  window.addEventListener("resize", () => {
    resizeCanvasToDisplaySize();
    fitPanelsToViewport();
  });
  window.addEventListener("beforeunload", safelyDestroyPeer);

  updateSettingOutputs();
  setScreen("home");
  requestAnimationFrame(renderFrame);
})();
