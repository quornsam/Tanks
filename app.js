(() => {
  "use strict";

  const APP_VERSION = 14;
  const PREFIX = "sam-red-blue-tanks-";
  const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const WORLD_HEIGHT = 100;
  const MIN_TERRAIN_SAMPLES = 560;
  const NETWORK_CHUNK_SIZE = 4000;
  const NETWORK_TRANSFER_TTL = 30000;
  const ACTIVE_RENDER_FPS = 30;
  const MAX_POWER = 200;
  const STANDARD_POWER = 80;
  const OFFSCREEN_RETURN_SECONDS = 5;
  const WEAPON_COSTS = { parachute: 10, bigBertha: 10, teleport: 10, engine: 10, repair: 20 };
  const ACTIVE_FRAME_INTERVAL = 1000 / ACTIVE_RENDER_FPS;
  const TEAM_NAMES = { blue: "Blue", red: "Red" };
  const OTHER_TEAM = { blue: "red", red: "blue" };
  const WIND_LABELS = ["None", "Low", "Medium", "High", "Wild"];
  const WIND_LIMITS = [0, 1.5, 3.25, 5.5, 8.5];
  const WORLD_WIDTHS = { compact: 130, standard: 180, wide: 270, massive: 430, epic: 680 };
  const LOCATION_PRESETS = {
    earth: { label: "Earth", gravity: 9.81, wind: 2, terrainBase: 26 },
    moon: { label: "Moon", gravity: 1.62, wind: 0, terrainBase: 22 },
    mars: { label: "Mars", gravity: 3.71, wind: 2, terrainBase: 25 },
    space: { label: "Space asteroid", gravity: 0.65, wind: 1, terrainBase: 21 },
    cave: { label: "Cave", gravity: 9.81, wind: 0, terrainBase: 20 }
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
    connectedMenuBar: $("connectedMenuBar"),
    connectedMenuTitle: $("connectedMenuTitle"),
    connectedMenuText: $("connectedMenuText"),
    resumeBattleButton: $("resumeBattleButton"),
    disconnectSessionButton: $("disconnectSessionButton"),
    menuChatDock: $("menuChatDock"),
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
    blueTankCard: $("blueTankCard"),
    redTankCard: $("redTankCard"),
    blueRoleLabel: $("blueRoleLabel"),
    redRoleLabel: $("redRoleLabel"),
    blueLoadout: $("blueLoadout"),
    redLoadout: $("redLoadout"),
    blueHits: $("blueHits"),
    redHits: $("redHits"),
    blueCredits: $("blueCredits"),
    redCredits: $("redCredits"),
    blueStatusTankCanvas: $("blueStatusTankCanvas"),
    redStatusTankCanvas: $("redStatusTankCanvas"),
    blueIntegrityLabel: $("blueIntegrityLabel"),
    redIntegrityLabel: $("redIntegrityLabel"),
    blueIntegrityFill: $("blueIntegrityFill"),
    redIntegrityFill: $("redIntegrityFill"),
    turnLabel: $("turnLabel"),
    windLabel: $("windLabel"),
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
    purchaseConfirmButton: $("purchaseConfirmButton"),
    canvasViewLabel: $("canvasViewLabel"),
    locatorButton: $("locatorButton"),
    fullscreenButton: $("fullscreenButton"),
    roundOverDock: $("roundOverDock"),
    roundOverReplayButton: $("roundOverReplayButton"),
    moveLeftButton: $("moveLeftButton"),
    moveRightButton: $("moveRightButton"),
    moveStatus: $("moveStatus"),
    angleInput: $("angleInput"),
    angleOutput: $("angleOutput"),
    angleDecreaseButton: $("angleDecreaseButton"),
    angleIncreaseButton: $("angleIncreaseButton"),
    powerInput: $("powerInput"),
    powerOutput: $("powerOutput"),
    powerDecreaseButton: $("powerDecreaseButton"),
    powerIncreaseButton: $("powerIncreaseButton"),
    fireButton: $("fireButton"),
    doubleStrikeButton: $("doubleStrikeButton"),
    armouryToolButton: $("armouryToolButton"),
    localCreditsLabel: $("localCreditsLabel"),
    armouryTeamBadge: $("armouryTeamBadge"),
    weaponStatus: $("weaponStatus"),
    standardWeaponButton: $("standardWeaponButton"),
    parachuteWeaponButton: $("parachuteWeaponButton"),
    berthaWeaponButton: $("berthaWeaponButton"),
    teleportWeaponButton: $("teleportWeaponButton"),
    engineUpgradeButton: $("engineUpgradeButton"),
    repairKitButton: $("repairKitButton"),
    parachuteCount: $("parachuteCount"),
    berthaCount: $("berthaCount"),
    teleportCount: $("teleportCount"),
    engineStatus: $("engineStatus"),
    repairCount: $("repairCount"),
    telemetryWind: $("telemetryWind"),
    telemetryGravity: $("telemetryGravity"),
    telemetryMove: $("telemetryMove"),
    telemetryHits: $("telemetryHits"),
    connectionBadge: $("connectionBadge"),
    soundButton: $("soundButton"),
    worldToolButton: $("worldToolButton"),
    sideColumn: $("sideColumn"),
    chatPanel: $("chatPanel"),
    chatLog: $("chatLog"),
    chatForm: $("chatForm"),
    chatInput: $("chatInput"),
    eventLog: $("eventLog"),
    restartRoundButton: $("restartRoundButton"),
    regenerateMapButton: $("regenerateMapButton"),
    gameLocationSelect: $("gameLocationSelect"),
    changeWorldButton: $("changeWorldButton"),
    roundControlBadge: $("roundControlBadge"),
    roundControlNote: $("roundControlNote"),
    leaveGameButton: $("leaveGameButton")
  };

  let ctx = dom.canvas.getContext("2d");
  const staticCanvas = document.createElement("canvas");
  const staticCtx = staticCanvas.getContext("2d", { alpha: false });

  let peer = null;
  let connection = null;
  let pendingConnection = null;
  let role = null;
  let accepted = false;
  let acceptRequested = false;
  let guestReadyTimer = null;
  let initialGameToken = null;
  let receivedInitialGameToken = null;
  let lastInitialGameSendAt = 0;
  let outboundTransferCounter = 0;
  const incomingTransfers = new Map();
  let isResetting = false;
  let gameState = null;
  let animation = null;
  let movementAnimation = null;
  let localInputPending = false;
  let botTimer = null;
  let pendingActionRequest = null;
  let localActionRequest = null;
  let soundEnabled = true;
  let audioContext = null;
  let renderDirty = true;
  let staticLayerDirty = true;
  let resizePending = true;
  let renderRequestId = null;
  let renderTimerId = null;
  let lastRenderedAt = 0;
  let activeCanvasMetrics = null;
  let hiddenAt = null;
  let visibilityWarningActive = false;
  let winnerModalDismissed = false;
  let doubleStrikeSelected = false;
  let selectedWeapon = "standard";
  let activeCanvasMessageMode = null;
  let pendingArmAfterPurchase = null;
  let teleportMode = false;
  let currentScreen = "home";
  const aimDrag = { active: false, pointerId: null };
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

  // Network messages never carry the large terrain arrays. Every fresh map is
  // recreated deterministically from its seed and settings on both computers.
  function compactStateMetadata(state) {
    const packet = deepClone(state);
    delete packet.terrain;
    delete packet.baseTerrain;
    delete packet.ceiling;
    delete packet.baseCeiling;
    return packet;
  }

  function inflateFreshState(metadata) {
    if (!metadata || !metadata.settings || !Number.isFinite(metadata.seed)) return null;
    const packet = deepClone(metadata);
    const settings = packet.settings;
    const terrain = generateTerrain(settings, packet.seed);
    const spawnPositions = packet.spawnPositions
      ? deepClone(packet.spawnPositions)
      : chooseSpawnPositions(terrain, settings, packet.seed);
    guaranteeSpawnHeightDifference(terrain, spawnPositions, settings);
    const padRadius = Math.max(6.5, 9.2 * (settings.tankSize / 100));
    flattenTerrain(terrain, spawnPositions.blue, settings.worldWidth, padRadius);
    flattenTerrain(terrain, spawnPositions.red, settings.worldWidth, padRadius);
    const ceiling = settings.location === "cave"
      ? generateCaveCeiling(terrain, settings, packet.seed)
      : null;

    packet.spawnPositions = spawnPositions;
    packet.terrain = terrain.map(value => round(value, 3));
    packet.baseTerrain = packet.terrain.slice();
    packet.ceiling = ceiling ? ceiling.map(value => round(value, 3)) : null;
    packet.baseCeiling = packet.ceiling ? packet.ceiling.slice() : null;
    return normalizeGameState(packet);
  }

  function mergeRuntimeMetadata(metadata, sourceState = gameState) {
    if (!metadata || !sourceState) return null;
    const packet = deepClone(metadata);
    packet.terrain = sourceState.terrain.slice();
    packet.baseTerrain = sourceState.baseTerrain.slice();
    packet.ceiling = sourceState.ceiling ? sourceState.ceiling.slice() : null;
    packet.baseCeiling = sourceState.baseCeiling ? sourceState.baseCeiling.slice() : null;
    return normalizeGameState(packet);
  }

  function sendNetwork(payload, targetConnection = connection) {
    if (!targetConnection || !targetConnection.open) return false;

    let encoded;
    try {
      encoded = JSON.stringify(payload);
    } catch (error) {
      console.error("Unable to encode network message", error);
      return false;
    }

    if (encoded.length <= NETWORK_CHUNK_SIZE) {
      try {
        targetConnection.send(payload);
        return true;
      } catch (error) {
        console.error("Unable to send network message", { error, type: payload?.type, characters: encoded.length });
        return false;
      }
    }

    const transferId = `${Date.now().toString(36)}-${(++outboundTransferCounter).toString(36)}-${makeCode(3)}`;
    const total = Math.ceil(encoded.length / NETWORK_CHUNK_SIZE);

    try {
      for (let index = 0; index < total; index += 1) {
        const start = index * NETWORK_CHUNK_SIZE;
        targetConnection.send({
          type: "network-chunk",
          transferId,
          index,
          total,
          payloadType: payload.type || "message",
          chunk: encoded.slice(start, start + NETWORK_CHUNK_SIZE)
        });
      }
      return true;
    } catch (error) {
      console.error("Unable to send blocked network message", error);
      return false;
    }
  }

  function receiveNetworkChunk(packet) {
    if (typeof packet.transferId !== "string" || !Number.isInteger(packet.index) || !Number.isInteger(packet.total)) return;
    if (packet.total < 1 || packet.total > 2000 || packet.index < 0 || packet.index >= packet.total || typeof packet.chunk !== "string") return;

    const now = Date.now();
    for (const [transferId, transfer] of incomingTransfers) {
      if (now - transfer.startedAt > NETWORK_TRANSFER_TTL) incomingTransfers.delete(transferId);
    }

    let transfer = incomingTransfers.get(packet.transferId);
    if (!transfer) {
      transfer = {
        chunks: new Array(packet.total),
        received: 0,
        total: packet.total,
        payloadType: packet.payloadType || "message",
        startedAt: now
      };
      incomingTransfers.set(packet.transferId, transfer);
    }

    if (transfer.total !== packet.total) {
      incomingTransfers.delete(packet.transferId);
      return;
    }

    if (transfer.chunks[packet.index] === undefined) {
      transfer.chunks[packet.index] = packet.chunk;
      transfer.received += 1;
    }

    if (role === "guest" && currentScreen === "lobby" && transfer.payloadType === "game-init") {
      const percent = Math.round((transfer.received / transfer.total) * 100);
      dom.lobbyMessage.textContent = `Receiving battlefield… ${percent}%`;
    }

    if (transfer.received !== transfer.total) return;
    incomingTransfers.delete(packet.transferId);

    try {
      const restored = JSON.parse(transfer.chunks.join(""));
      handleNetworkData(restored);
    } catch (error) {
      console.error("Unable to rebuild network message", error);
      const message = "Battlefield transfer was incomplete. Retrying…";
      if (currentScreen === "lobby") addLobbyLog(message);
      else addEvent(message, "error");
    }
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
    currentScreen = name;
    dom.homeScreen.classList.toggle("hidden", name !== "home");
    dom.lobbyScreen.classList.toggle("hidden", name !== "lobby");
    dom.gameScreen.classList.toggle("hidden", name !== "game");
    document.body.classList.toggle("game-active", name === "game");
    placePersistentChat(name);
    updateMenuSessionUI();
    if (name === "game") {
      markCanvasResize();
      fitPanelsToViewport();
      requestRender();
    }
  }

  function hasLiveSession() {
    return Boolean(gameState && (role === "bot" || (accepted && connection && connection.open)));
  }

  function placePersistentChat(screenName = currentScreen) {
    if (!dom.chatPanel || !dom.sideColumn || !dom.menuChatDock) return;
    if (screenName === "home" && hasLiveSession()) {
      if (dom.chatPanel.parentElement !== dom.menuChatDock) dom.menuChatDock.appendChild(dom.chatPanel);
      dom.menuChatDock.classList.remove("hidden");
      togglePanel(dom.chatPanel, false);
    } else {
      if (dom.chatPanel.parentElement !== dom.sideColumn) {
        const battlefieldPanel = dom.sideColumn.querySelector('[data-panel="battlefield"]');
        dom.sideColumn.insertBefore(dom.chatPanel, battlefieldPanel || dom.sideColumn.children[1] || null);
      }
      dom.menuChatDock.classList.add("hidden");
    }
  }

  function updateMenuSessionUI() {
    const live = hasLiveSession();
    dom.connectedMenuBar.classList.toggle("hidden", !(currentScreen === "home" && live));
    dom.hostButton.disabled = live;
    dom.botButton.disabled = live;
    dom.joinButton.disabled = live;
    if (!live) return;
    const opponent = role === "bot" ? "computer opponent" : "other player";
    dom.connectedMenuTitle.textContent = role === "bot" ? "Bot match paused" : "Still connected";
    dom.connectedMenuText.textContent = `Your ${opponent} and battle chat remain available.`;
    dom.resumeBattleButton.disabled = !gameState;
  }

  function returnToMenuPreservingSession() {
    if (!gameState) {
      setScreen("home");
      return;
    }
    if (animation) finishShotAnimation();
    movementAnimation = null;
    updateGameControls();
    hideCanvasMessage();
    setScreen("home");
    setConnectionStatus(role === "bot" ? "Bot match paused" : "Connected · in menu", "online");
    addEvent("Returned to the main menu; the session remains connected.");
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
      dom.visibilityWarningText.textContent = `${tankSize}% tanks on ${article} ${worldLabel} map will be tiny in the whole-map view. Use terrain inspection or drag directly on the battlefield to aim.`;
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

  // The slider is an absolute left/right control. Negative aims left, positive
  // aims right, and zero points straight up.
  function worldAngleForTeam(_team, aim) {
    return 90 - clamp(Number(aim) || 0, -85, 85);
  }

  function normaliseAimAngle(team, angle, version = 10) {
    const value = Number(angle);
    if (!Number.isFinite(value)) return team === "red" ? -45 : 45;
    if (version < 10 && value >= 0 && value <= 180) return team === "red" ? -Math.abs(value) : Math.abs(value);
    return clamp(value, -85, 85);
  }

  function formatAimAngle(value) {
    const aim = Math.round(Number(value) || 0);
    const elevation = 90 - Math.abs(aim);
    if (aim === 0) return "90° UP";
    return `${aim < 0 ? "L" : "R"} ${elevation}°`;
  }

  function describeAim(value) {
    const aim = clamp(Number(value) || 0, -85, 85);
    return {
      direction: aim < -0.01 ? "left" : aim > 0.01 ? "right" : "up",
      elevation: round(90 - Math.abs(aim), 1)
    };
  }

  function angleFromAimDescriptor(descriptor, fallback) {
    if (!descriptor || typeof descriptor.direction !== "string") return clamp(Number(fallback) || 0, -85, 85);
    const elevation = clamp(Number(descriptor.elevation) || 90, 5, 90);
    const magnitude = 90 - elevation;
    if (descriptor.direction === "left") return -magnitude;
    if (descriptor.direction === "right") return magnitude;
    return 0;
  }

  function locationSettings(location, existing = {}) {
    const preset = LOCATION_PRESETS[location] || LOCATION_PRESETS.earth;
    return {
      ...existing,
      location,
      gravity: preset.gravity,
      windVariability: preset.wind
    };
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
        serialization: "binary",
        metadata: { application: "red-blue-tanks", version: APP_VERSION, request: "join" }
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
      clearGuestReadyHandshake();
      accepted = false;
      connection = null;
      pendingConnection = null;
      setConnectionStatus("Other player left", "error");
      updateMenuSessionUI();
      placePersistentChat(currentScreen);
      if (currentScreen === "game") {
        addEvent("The other player disconnected.", "error");
        showCanvasMessage("OPPONENT DISCONNECTED");
        updateGameControls();
      } else if (currentScreen === "home") {
        addChatMessage("System", "The other player disconnected.", false);
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
    if (data.type === "network-chunk") {
      receiveNetworkChunk(data);
      return;
    }

    switch (data.type) {
      case "accepted":
        if (role !== "guest") return;
        accepted = true;
        initialGameToken = data.token || null;
        receivedInitialGameToken = null;
        renderRulesSummary(data.settings);
        dom.lobbyTitle.textContent = "Host accepted";
        dom.lobbyMessage.textContent = "Preparing the battlefield…";
        setConnectionStatus("Connected directly", "online");
        addLobbyLog("Host accepted the connection. Confirming battlefield transfer…");
        beginGuestReadyHandshake();
        break;

      case "declined":
        if (role !== "guest") return;
        dom.lobbyTitle.textContent = "Join request declined";
        dom.lobbyMessage.textContent = "The host did not accept this connection.";
        setConnectionStatus("Request declined", "error");
        addLobbyLog("The host declined the join request.");
        break;

      case "guest-ready":
        if (role !== "host" || !accepted || !connection?.open || !gameState) return;
        if (data.token && initialGameToken && data.token !== initialGameToken) return;
        sendInitialGameState();
        break;

      case "game-init":
        if (role !== "guest") return;
        if (initialGameToken && data.token && data.token !== initialGameToken) return;
        clearGuestReadyHandshake();
        if (receivedInitialGameToken && receivedInitialGameToken === data.token) {
          sendNetwork({ type: "game-init-ack", token: data.token });
          return;
        }
        receivedInitialGameToken = data.token || "legacy";
        accepted = true;
        const initialState = inflateFreshState(data.state);
        if (!initialState) {
          addLobbyLog("The battlefield descriptor was invalid. Requesting it again…");
          receivedInitialGameToken = null;
          return;
        }
        enterGame(initialState);
        sendNetwork({ type: "game-init-ack", token: data.token || null });
        addEvent("Battlefield received from host.");
        break;

      case "game-init-ack":
        if (role !== "host") return;
        if (data.token && initialGameToken && data.token !== initialGameToken) return;
        lastInitialGameSendAt = 0;
        addEvent("Guest battlefield confirmed.");
        break;

      case "input":
        if (role !== "host" || !accepted) return;
        handleGuestInput(data);
        break;

      case "state":
        if (role !== "guest") return;
        gameState = mergeRuntimeMetadata(data.state, gameState);
        if (!gameState) return;
        localInputPending = false;
        animation = null;
        if (data.movement) startMovementAnimation(data.movement.team, data.movement.fromX, data.movement.toX, false);
        if (pendingArmAfterPurchase) {
          const arm = pendingArmAfterPurchase;
          pendingArmAfterPurchase = null;
          if ((gameState.inventory?.[localTeam()]?.[arm] || 0) > 0) armWeapon(arm);
        }
        updateGameUI(true);
        if (data.message) {
          addEvent(data.message);
          if (/ moved /.test(` ${data.message} `)) playMoveSound();
          const purchase = parsePurchaseMessage(data.message);
          if (purchase) handlePurchaseFeedback(purchase.team, purchase.name, purchase.cost);
        }
        break;

      case "shot":
        if (role !== "guest") return;
        localInputPending = false;
        beginShotAnimation(data.packet);
        break;

      case "shot-replace":
        if (role !== "guest") return;
        replaceShotAnimation(data.packet);
        addEvent(`${TEAM_NAMES[data.packet.shooter]} deployed the parachute.`);
        break;

      case "round-start":
        if (role !== "guest") return;
        {
          const freshState = inflateFreshState(data.state);
          if (!freshState) return;
          enterGame(freshState, true);
        }
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
    initialGameToken = `${Date.now().toString(36)}-${makeCode(4)}`;
    receivedInitialGameToken = null;
    dom.acceptButton.disabled = false;
    dom.acceptButton.textContent = "Accept";
    dom.incomingRequest.classList.add("hidden");

    const settings = readSettings();
    const state = createGameState(settings);
    enterGame(state);
    sendNetwork({ type: "accepted", settings, token: initialGameToken });
    addEvent("Guest accepted. Waiting for battlefield confirmation…");
  }

  function compactInitialGameState(state) {
    return compactStateMetadata(state);
  }

  function sendInitialGameState() {
    if (role !== "host" || !connection?.open || !gameState) return;
    const now = Date.now();
    if (now - lastInitialGameSendAt < 1800) return;
    lastInitialGameSendAt = now;
    const payload = {
      type: "game-init",
      token: initialGameToken,
      state: compactInitialGameState(gameState)
    };
    const sent = sendNetwork(payload);
    if (sent) {
      const bytes = new TextEncoder().encode(JSON.stringify(payload)).length;
      addEvent(`Sending compact battlefield instructions (${bytes.toLocaleString()} bytes)…`);
    }
  }

  function beginGuestReadyHandshake() {
    clearGuestReadyHandshake();
    const announceReady = () => {
      if (role !== "guest" || !accepted || !connection?.open || gameState) {
        clearGuestReadyHandshake();
        return;
      }
      sendNetwork({ type: "guest-ready", token: initialGameToken });
    };
    announceReady();
    guestReadyTimer = setInterval(announceReady, 2500);
  }

  function clearGuestReadyHandshake() {
    if (guestReadyTimer) clearInterval(guestReadyTimer);
    guestReadyTimer = null;
  }

  function declineGuest() {
    if (!pendingConnection) return;
    acceptRequested = false;
    dom.acceptButton.disabled = false;
    dom.acceptButton.textContent = "Accept";
    if (pendingConnection.open) sendNetwork({ type: "declined" }, pendingConnection);
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
    const ceiling = settings.location === "cave" ? generateCaveCeiling(terrain, settings, seed) : null;

    const scores = session.scores ? deepClone(session.scores) : { blue: 0, red: 0 };
    const roundNumber = Number.isFinite(session.round) ? session.round : 1;
    const state = {
      version: APP_VERSION,
      seed,
      settings,
      terrain: terrain.map(value => round(value, 3)),
      baseTerrain: terrain.map(value => round(value, 3)),
      ceiling: ceiling ? ceiling.map(value => round(value, 3)) : null,
      baseCeiling: ceiling ? ceiling.map(value => round(value, 3)) : null,
      spawnPositions: deepClone(spawnPositions),
      tanks: {
        blue: { x: round(spawnPositions.blue, 3), hits: 0, alive: true, angle: 45, power: STANDARD_POWER },
        red: { x: round(spawnPositions.red, 3), hits: 0, alive: true, angle: -45, power: STANDARD_POWER }
      },
      credits: { blue: 0, red: 0 },
      inventory: {
        blue: { parachute: 0, bigBertha: 0, teleport: 0, engine: 0, repair: 0 },
        red: { parachute: 0, bigBertha: 0, teleport: 0, engine: 0, repair: 0 }
      },
      upgrades: { blue: { engine: false }, red: { engine: false } },
      scores,
      round: roundNumber,
      turn: "blue",
      turnsRemaining: 1,
      bonusFromDouble: false,
      movedThisTurn: false,
      movesUsedThisTurn: 0,
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

  function generateCaveCeiling(terrain, settings, seed) {
    const random = mulberry32(seed ^ 0x7f4a7c15);
    const values = [];
    let drift = 0;
    const count = terrain.length;
    for (let i = 0; i < count; i += 1) {
      const t = i / (count - 1);
      drift = drift * .94 + (random() - .5) * 1.2;
      const ground = terrain[i];
      const roof = 79
        + Math.sin(t * Math.PI * 2 * (1.1 + random() * .05) + 1.7) * 7
        + Math.sin(t * Math.PI * 6.2 + .4) * 4
        + Math.sin(t * Math.PI * 17.5 + 2.1) * 1.8
        + drift;
      values.push(clamp(Math.max(ground + 23, roof), 58, 94));
    }
    smoothArray(values, 1);
    const formationCount = 4 + Math.floor(random() * 7);
    for (let formation = 0; formation < formationCount; formation += 1) {
      const center = random();
      const width = .008 + random() * .032;
      const depth = 4 + random() * 13;
      for (let i = 0; i < values.length; i += 1) {
        const t = i / (values.length - 1);
        const d = Math.abs(t - center);
        if (d > width) continue;
        const shape = 1 - d / width;
        values[i] -= depth * shape * shape;
        values[i] = Math.max(values[i], terrain[i] + 18);
      }
    }
    return values;
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
    movementAnimation = null;
    doubleStrikeSelected = false;
    selectedWeapon = "standard";
    activeCanvasMessageMode = null;
    teleportMode = false;
    updateDoubleStrikeButton();
    updateArmouryUI();
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
    prepareGameplayPanels();

    dom.blueRoleLabel.textContent = role === "guest" ? "HOST" : "YOU";
    dom.redRoleLabel.textContent = role === "guest" ? "YOU" : role === "bot" ? "BOT" : "GUEST";
    dom.connectionBadge.textContent = role === "bot" ? "LOCAL" : "P2P";
    dom.roundControlBadge.textContent = role === "bot" ? "LOCAL" : role === "guest" ? "REQUEST" : "HOST";
    dom.roundControlNote.textContent = role === "bot"
      ? "World changes and map resets happen immediately against the bot."
      : "World changes, restart and regenerate require both players to agree.";
    dom.gameLocationSelect.value = gameState.settings.location;
    setConnectionStatus(role === "bot" ? "Computer opponent" : "Connected directly", "online");
    updateGameUI(true);
    ensureAudio();
  }

  function normalizeGameState(state) {
    const incomingVersion = Number.isFinite(state.version) ? state.version : 8;
    if (!state.scores) state.scores = { blue: 0, red: 0 };
    if (!state.credits) state.credits = { blue: 0, red: 0 };
    if (!state.inventory) state.inventory = { blue: { parachute: 0, bigBertha: 0, teleport: 0, engine: 0, repair: 0 }, red: { parachute: 0, bigBertha: 0, teleport: 0, engine: 0, repair: 0 } };
    if (!state.upgrades) state.upgrades = { blue: { engine: false }, red: { engine: false } };
    for (const team of ["blue", "red"]) {
      state.credits[team] = Math.max(0, Math.floor(Number(state.credits[team]) || 0));
      state.inventory[team] = { parachute: 0, bigBertha: 0, teleport: 0, engine: 0, repair: 0, ...(state.inventory[team] || {}) };
      state.upgrades[team] = { engine: false, ...(state.upgrades[team] || {}) };
    }
    if (!Number.isFinite(state.round)) state.round = 1;
    if (!Number.isFinite(state.turnsRemaining)) state.turnsRemaining = 1;
    if (!Number.isFinite(state.movesUsedThisTurn)) state.movesUsedThisTurn = state.movedThisTurn ? 1 : 0;
    if (typeof state.bonusFromDouble !== "boolean") state.bonusFromDouble = false;
    if (!state.spawnPositions) {
      state.spawnPositions = { blue: state.tanks.blue.x, red: state.tanks.red.x };
    }
    if (!state.baseTerrain) state.baseTerrain = state.terrain.slice();
    if (state.settings.location === "cave" && !state.ceiling) {
      state.ceiling = generateCaveCeiling(state.terrain, state.settings, state.seed || 1);
      state.baseCeiling = state.ceiling.slice();
    }
    if (!state.baseCeiling && state.ceiling) state.baseCeiling = state.ceiling.slice();
    for (const team of ["blue", "red"]) {
      state.tanks[team].angle = normaliseAimAngle(team, state.tanks[team].angle, incomingVersion);
      state.tanks[team].power = clamp(Number(state.tanks[team].power) || STANDARD_POWER, 18, MAX_POWER);
    }
    state.movedThisTurn = state.movesUsedThisTurn >= maxMovesForTeam(state.turn, state);
    state.version = APP_VERSION;
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
      !movementAnimation &&
      !localInputPending &&
      gameState.turn === localTeam() &&
      (role === "bot" || accepted)
    );
  }

  function updateGameUI(syncControls = false) {
    if (!gameState) return;
    const { settings, tanks } = gameState;
    const turnName = TEAM_NAMES[gameState.turn].toUpperCase();
    const turnSuffix = gameState.turnsRemaining > 1 ? ` · ${gameState.turnsRemaining} SHOTS` : "";
    dom.turnLabel.textContent = gameState.winner ? `${TEAM_NAMES[gameState.winner].toUpperCase()} WINS` : `${turnName} TURN${turnSuffix}`;
    dom.windLabel.textContent = formatWind(gameState.wind);
    dom.telemetryWind.textContent = signed(gameState.wind);
    dom.telemetryGravity.textContent = settings.gravity.toFixed(2);
    dom.telemetryMove.textContent = moveStep().toFixed(1);
    dom.telemetryHits.textContent = String(settings.hitsToDestroy);
    dom.blueScore.textContent = String(gameState.scores.blue);
    dom.redScore.textContent = String(gameState.scores.red);
    dom.roundNumber.textContent = String(gameState.round);
    dom.blueCredits.textContent = `${gameState.credits.blue} CR`;
    dom.redCredits.textContent = `${gameState.credits.red} CR`;
    dom.blueTankCard?.classList.toggle("active-turn", !gameState.winner && gameState.turn === "blue");
    dom.redTankCard?.classList.toggle("active-turn", !gameState.winner && gameState.turn === "red");
    updateTeamLoadout("blue");
    updateTeamLoadout("red");
    updateArmouryUI();
    renderHitPips(dom.blueHits, tanks.blue.hits, settings.hitsToDestroy);
    renderHitPips(dom.redHits, tanks.red.hits, settings.hitsToDestroy);
    updateIntegrityReadout("blue");
    updateIntegrityReadout("red");
    drawStatusTankPanels(performance.now());

    if (syncControls) {
      const tank = tanks[localTeam()];
      dom.angleInput.value = tank.angle;
      dom.powerInput.value = tank.power;
      dom.angleOutput.textContent = formatAimAngle(tank.angle);
      dom.powerOutput.textContent = Math.round(tank.power);
    }

    updateGameControls();

    if (gameState.winner && !pendingActionRequest && !localActionRequest && !winnerModalDismissed) {
      showCanvasMessage(
        `${TEAM_NAMES[gameState.winner].toUpperCase()} WINS`,
        `Match score ${gameState.scores.blue}–${gameState.scores.red}`,
        "winner"
      );
    } else if (!pendingActionRequest && !localActionRequest && !gameState.winner && activeCanvasMessageMode !== "purchase") {
      hideCanvasMessage();
    }

    updateRoundOverDock();
    if (role === "bot" && gameState.turn === "red" && !gameState.winner && !animation) scheduleBotTurn();
    invalidateStaticLayer();
    requestRender();
  }

  function updateIntegrityReadout(team) {
    if (!gameState) return;
    const hitsNeeded = Math.max(1, gameState.settings.hitsToDestroy);
    const hits = clamp(gameState.tanks[team].hits || 0, 0, hitsNeeded);
    const integrity = Math.max(0, Math.round((1 - hits / hitsNeeded) * 100));
    const label = team === "blue" ? dom.blueIntegrityLabel : dom.redIntegrityLabel;
    const fill = team === "blue" ? dom.blueIntegrityFill : dom.redIntegrityFill;
    if (label) label.textContent = `${integrity}%`;
    if (fill) {
      fill.style.width = `${integrity}%`;
      fill.dataset.level = integrity <= 25 ? "critical" : integrity <= 55 ? "damaged" : "sound";
    }
  }

  function statusTankAngle(team, now) {
    if (!animation || animation.packet?.shooter !== team) return gameState?.tanks?.[team]?.angle || (team === "blue" ? 45 : -45);
    if (animation.phase === "aim") {
      const p = clamp((now - animation.phaseStart) / animation.aimDuration, 0, 1);
      const eased = p < .5 ? 2 * p * p : 1 - ((-2 * p + 2) ** 2) / 2;
      return animation.fromAngle + (animation.packet.angle - animation.fromAngle) * eased;
    }
    return animation.packet.angle;
  }

  function drawStatusTankPanels(now = performance.now()) {
    if (!gameState) return;
    drawStatusTank("blue", dom.blueStatusTankCanvas, now);
    drawStatusTank("red", dom.redStatusTankCanvas, now);
  }

  function drawStatusTank(team, canvas, now) {
    if (!canvas) return;
    const context = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const tank = gameState.tanks[team];
    const hitsNeeded = Math.max(1, gameState.settings.hitsToDestroy);
    const integrity = Math.max(0, 1 - (tank.hits || 0) / hitsNeeded);
    const angle = statusTankAngle(team, now);
    const directionAngle = worldAngleForTeam(team, angle) * Math.PI / 180;
    const recoil = animation?.packet?.shooter === team && animation.phase === "recoil"
      ? Math.sin(Math.PI * clamp((now - animation.phaseStart) / animation.recoilDuration, 0, 1)) * 5
      : 0;
    const bodyX = team === "blue" ? 48 - Math.cos(directionAngle) * recoil : width - 48 - Math.cos(directionAngle) * recoil;
    const bodyY = height - 14 + Math.sin(directionAngle) * recoil * .25;
    const accent = team === "blue" ? "#4f9ed0" : "#c75452";
    const darkAccent = team === "blue" ? "#254e65" : "#642a29";

    context.clearRect(0, 0, width, height);
    context.save();
    context.globalAlpha = tank.alive ? .98 : .72;
    context.strokeStyle = "rgba(255,255,255,.08)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(3, height - 5.5);
    context.lineTo(width - 3, height - 5.5);
    context.stroke();

    context.fillStyle = "#111514";
    roundedRect(context, bodyX - 33, bodyY - 7, 66, 13, 4);
    context.fill();
    context.strokeStyle = "#626861";
    context.stroke();
    for (let i = -25; i <= 25; i += 10) {
      context.fillStyle = "#333936";
      context.beginPath();
      context.arc(bodyX + i, bodyY, 4, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = "#777b72";
      context.stroke();
    }

    context.fillStyle = darkAccent;
    context.beginPath();
    context.moveTo(bodyX - 27, bodyY - 9);
    context.lineTo(bodyX - 18, bodyY - 19);
    context.lineTo(bodyX + 22, bodyY - 18);
    context.lineTo(bodyX + 30, bodyY - 9);
    context.closePath();
    context.fill();
    context.strokeStyle = accent;
    context.stroke();

    const turretX = bodyX + (team === "blue" ? 4 : -4);
    const turretY = bodyY - 20;
    context.save();
    context.translate(turretX, turretY);
    context.rotate(-directionAngle);
    context.fillStyle = "#777b72";
    context.fillRect(0, -2.1, 42, 4.2);
    context.fillStyle = "#242825";
    context.fillRect(35, -4, 9, 8);
    context.restore();
    context.fillStyle = accent;
    context.beginPath();
    context.ellipse(turretX, turretY, 15, 7, 0, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#202421";
    context.stroke();

    if (integrity < .72) {
      context.strokeStyle = "rgba(20,20,18,.9)";
      context.lineWidth = 1.5;
      const cracks = integrity < .35 ? 4 : 2;
      for (let i = 0; i < cracks; i += 1) {
        const x = bodyX - 15 + i * 10;
        context.beginPath();
        context.moveTo(x, bodyY - 16);
        context.lineTo(x + 5, bodyY - 10);
        context.lineTo(x + 1, bodyY - 5);
        context.stroke();
      }
    }

    if (!tank.alive) {
      context.fillStyle = "rgba(20,20,18,.52)";
      context.fillRect(bodyX - 30, bodyY - 20, 60, 25);
      context.strokeStyle = "#ddd9cd";
      context.lineWidth = 1.4;
      context.beginPath();
      context.moveTo(bodyX, bodyY - 23);
      context.lineTo(bodyX, bodyY - 44);
      context.stroke();
      context.fillStyle = "#ece9df";
      context.beginPath();
      context.moveTo(bodyX, bodyY - 44);
      context.lineTo(bodyX + (team === "blue" ? 15 : -15), bodyY - 39);
      context.lineTo(bodyX, bodyY - 34);
      context.closePath();
      context.fill();
    }
    context.restore();
  }

  function updateTeamLoadout(team) {
    if (!gameState) return;
    const container = team === "blue" ? dom.blueLoadout : dom.redLoadout;
    if (!container) return;
    const inventory = gameState.inventory?.[team] || {};
    const items = [];
    const add = (label, count, className = "") => {
      if (!count) return;
      items.push({ label: count > 1 ? `${label}×${count}` : label, className });
    };
    add("PARA", inventory.parachute || 0, "parachute");
    add("BERTHA", inventory.bigBertha || 0, "bertha");
    add("TELE", inventory.teleport || 0, "teleport");
    if (gameState.upgrades?.[team]?.engine) items.push({ label: "ENGINE✓", className: "engine" });
    else add("ENGINE", inventory.engine || 0, "engine");
    add("REPAIR", inventory.repair || 0, "repair");
    container.replaceChildren();
    if (!items.length) {
      const empty = document.createElement("span");
      empty.className = "loadout-empty";
      empty.textContent = "NO PURCHASES";
      container.appendChild(empty);
      container.setAttribute("aria-label", `${TEAM_NAMES[team]} has no purchased equipment`);
      return;
    }
    for (const item of items) {
      const chip = document.createElement("span");
      chip.className = `loadout-chip ${item.className}`.trim();
      chip.textContent = item.label;
      container.appendChild(chip);
    }
    container.setAttribute("aria-label", `${TEAM_NAMES[team]} equipment: ${items.map(item => item.label).join(", ")}`);
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
    if (!gameState) return;
    const enabled = canLocalAct();
    const deployReady = canDeployParachute();
    const movesRemaining = Math.max(0, maxMovesForTeam(localTeam()) - gameState.movesUsedThisTurn);
    const moveAvailable = enabled && movesRemaining > 0;
    dom.moveLeftButton.disabled = !moveAvailable;
    dom.moveRightButton.disabled = !moveAvailable;
    dom.angleInput.disabled = !enabled;
    dom.angleDecreaseButton.disabled = !enabled;
    dom.angleIncreaseButton.disabled = !enabled;
    dom.powerInput.disabled = !enabled;
    dom.powerDecreaseButton.disabled = !enabled;
    dom.powerIncreaseButton.disabled = !enabled;
    dom.fireButton.disabled = !(enabled || deployReady);
    dom.fireButton.classList.toggle("deploy-ready", deployReady);
    dom.fireButton.querySelector("span").textContent = deployReady ? "DEPLOY PARACHUTE" : selectedWeapon === "bigBertha" ? "BIG BERTHA" : selectedWeapon === "parachute" ? "PARACHUTE BOMB" : selectedWeapon === "teleport" ? "PLACE TANK" : "FIRE";
    dom.fireButton.querySelector("small").textContent = deployReady ? "Spacebar again" : "Spacebar";
    dom.doubleStrikeButton.disabled = !enabled || selectedWeapon !== "standard";
    dom.locatorButton.disabled = Boolean(animation || movementAnimation);
    const roundControlBusy = Boolean(animation || movementAnimation || pendingActionRequest || localActionRequest);
    dom.restartRoundButton.disabled = roundControlBusy;
    dom.regenerateMapButton.disabled = roundControlBusy;
    dom.changeWorldButton.disabled = roundControlBusy || dom.gameLocationSelect.value === gameState.settings.location;

    if (gameState.winner) dom.moveStatus.textContent = "Battle complete";
    else if (deployReady) dom.moveStatus.textContent = "Press Space to deploy parachute";
    else if (animation) dom.moveStatus.textContent = "Projectile in flight";
    else if (movementAnimation) dom.moveStatus.textContent = "Tank moving";
    else if (localInputPending) dom.moveStatus.textContent = "Waiting for host";
    else if (gameState.turn !== localTeam()) dom.moveStatus.textContent = "Opponent's turn";
    else if (movesRemaining <= 0) dom.moveStatus.textContent = "Movement used";
    else dom.moveStatus.textContent = `${movesRemaining} move${movesRemaining === 1 ? "" : "s"} available`;
    updateArmouryUI();
  }

  function updateArmouryUI() {
    if (!gameState || !dom.localCreditsLabel) return;
    const team = localTeam();
    const credits = gameState.credits?.[team] || 0;
    const inventory = gameState.inventory?.[team] || { parachute: 0, bigBertha: 0, teleport: 0, engine: 0, repair: 0 };
    dom.localCreditsLabel.textContent = `${credits} CR`;
    if (dom.armouryTeamBadge) {
      dom.armouryTeamBadge.textContent = team.toUpperCase();
      dom.armouryTeamBadge.classList.toggle("red-supply", team === "red");
      dom.armouryTeamBadge.classList.toggle("blue-supply", team === "blue");
    }
    dom.parachuteCount.textContent = String(inventory.parachute || 0);
    dom.berthaCount.textContent = String(inventory.bigBertha || 0);
    dom.teleportCount.textContent = String(inventory.teleport || 0);
    dom.repairCount.textContent = String(inventory.repair || 0);
    dom.engineStatus.textContent = gameState.upgrades?.[team]?.engine ? "INSTALLED · three moves" : `${inventory.engine || 0 ? "INSTALL" : "10 CR"} · owned ${inventory.engine || 0}`;

    const labels = {
      standard: "Standard shell armed",
      parachute: "Parachute bomb armed — Space launches, Space again deploys",
      bigBertha: "Big Bertha armed — large circular terrain blast",
      teleport: "Teleport armed — click or touch a destination"
    };
    dom.weaponStatus.textContent = labels[selectedWeapon] || labels.standard;
    const buttons = {
      standard: dom.standardWeaponButton,
      parachute: dom.parachuteWeaponButton,
      bigBertha: dom.berthaWeaponButton,
      teleport: dom.teleportWeaponButton
    };
    Object.entries(buttons).forEach(([weapon, button]) => button.classList.toggle("active", selectedWeapon === weapon));
    const busy = Boolean(animation || movementAnimation || pendingActionRequest || localActionRequest || gameState.winner);
    dom.standardWeaponButton.disabled = busy;
    dom.parachuteWeaponButton.disabled = busy || ((inventory.parachute || 0) < 1 && credits < WEAPON_COSTS.parachute);
    dom.berthaWeaponButton.disabled = busy || ((inventory.bigBertha || 0) < 1 && credits < WEAPON_COSTS.bigBertha);
    dom.teleportWeaponButton.disabled = busy || ((inventory.teleport || 0) < 1 && credits < WEAPON_COSTS.teleport);
    dom.engineUpgradeButton.disabled = busy || gameState.upgrades?.[team]?.engine || ((inventory.engine || 0) < 1 && credits < WEAPON_COSTS.engine);
    dom.repairKitButton.disabled = busy || ((inventory.repair || 0) < 1 && credits < WEAPON_COSTS.repair);
  }

  function armWeapon(weapon) {
    if (!gameState) return;
    const safe = ["standard", "parachute", "bigBertha", "teleport"].includes(weapon) ? weapon : "standard";
    selectedWeapon = safe;
    teleportMode = safe === "teleport";
    dom.canvasFrame.classList.toggle("teleport-active", teleportMode);
    if (safe !== "standard") {
      doubleStrikeSelected = false;
      updateDoubleStrikeButton();
    }
    updateArmouryUI();
    updateGameControls();
    requestRender();
  }

  function requestArmouryItem(item) {
    if (!gameState || gameState.winner || animation || movementAnimation) return;
    const team = localTeam();
    if (["parachute", "bigBertha", "teleport"].includes(item) && (gameState.inventory[team][item] || 0) > 0) {
      armWeapon(item);
      return;
    }
    if (["engine", "repair"].includes(item) && (gameState.inventory[team][item] || 0) > 0) {
      if (!canLocalAct()) {
        dom.weaponStatus.textContent = `${item === "engine" ? "Bigger engine" : "Repair kit"} owned — activate it on your turn`;
        return;
      }
      if (role === "guest") {
        localInputPending = true;
        sendNetwork({ type: "input", action: "use-item", item });
        updateGameControls();
      } else {
        authoritativeUseUtility(team, item);
      }
      return;
    }
    pendingArmAfterPurchase = ["parachute", "bigBertha", "teleport"].includes(item) ? item : null;
    if (role === "guest") {
      sendNetwork({ type: "input", action: "purchase", item });
      dom.weaponStatus.textContent = "Purchase request sent…";
    } else {
      authoritativePurchase(team, item);
    }
  }

  function authoritativePurchase(team, item, announce = true) {
    if (!gameState || gameState.winner || animation || movementAnimation) return false;
    const cost = WEAPON_COSTS[item];
    if (!Number.isFinite(cost)) return false;
    if (item === "engine" && gameState.upgrades[team].engine) return false;
    if (gameState.credits[team] < cost) {
      if (announce) rejectGuestInput(`${TEAM_NAMES[team]} does not have enough credits.`);
      return false;
    }
    gameState.credits[team] -= cost;
    gameState.inventory[team][item] += 1;
    const name = item === "engine" ? "bigger engine" : item === "repair" ? "repair kit" : weaponLabel(item);
    const message = `${TEAM_NAMES[team]} bought ${name} for ${cost} credits.`;
    if (team === localTeam() && pendingArmAfterPurchase && ["parachute", "bigBertha", "teleport"].includes(item)) {
      const arm = pendingArmAfterPurchase;
      pendingArmAfterPurchase = null;
      armWeapon(arm);
    }
    if (announce) addEvent(message);
    broadcastState(message);
    updateGameUI(true);
    handlePurchaseFeedback(team, name, cost);
    return true;
  }

  function authoritativeUseUtility(team, item) {
    if (!gameState || gameState.winner || animation || movementAnimation || gameState.turn !== team) return false;
    if (!["engine", "repair"].includes(item) || (gameState.inventory?.[team]?.[item] || 0) < 1) return false;
    if (item === "engine" && gameState.upgrades[team].engine) return false;
    if (item === "repair" && gameState.tanks[team].hits < 1) {
      rejectGuestInput(`${TEAM_NAMES[team]}'s tank does not need repair.`);
      return false;
    }
    gameState.inventory[team][item] -= 1;
    let message;
    if (item === "engine") {
      gameState.upgrades[team].engine = true;
      message = `${TEAM_NAMES[team]} installed a bigger engine and now has three moves per turn.`;
    } else {
      gameState.tanks[team].hits = Math.max(0, gameState.tanks[team].hits - 1);
      message = `${TEAM_NAMES[team]} used a repair kit and removed one hit.`;
    }
    gameState.movesUsedThisTurn = 0;
    gameState.movedThisTurn = false;
    advanceTurnAfterShot(gameState, team, true);
    gameState.wind = randomWind(gameState.settings);
    localInputPending = false;
    message += ` ${TEAM_NAMES[gameState.turn]} receives a double turn.`;
    addEvent(message);
    broadcastState(message);
    updateGameUI(true);
    playRoundSound();
    return true;
  }

  function requestTeleport(worldX) {
    if (!gameState || selectedWeapon !== "teleport" || !canLocalAct()) return;
    const team = localTeam();
    if ((gameState.inventory[team].teleport || 0) < 1) return;
    teleportMode = false;
    selectedWeapon = "standard";
    dom.canvasFrame.classList.remove("teleport-active");
    if (role === "guest") {
      localInputPending = true;
      sendNetwork({ type: "input", action: "teleport", x: worldX });
      updateGameControls();
    } else {
      authoritativeTeleport(team, worldX);
    }
  }

  function authoritativeTeleport(team, worldX) {
    if (!gameState || gameState.winner || animation || movementAnimation || gameState.turn !== team) return false;
    if ((gameState.inventory?.[team]?.teleport || 0) < 1) {
      rejectGuestInput(`${TEAM_NAMES[team]} does not own a teleport.`);
      return false;
    }
    const minX = gameState.settings.worldWidth * 0.035;
    const maxX = gameState.settings.worldWidth * 0.965;
    let destination = clamp(Number(worldX) || gameState.tanks[team].x, minX, maxX);
    const otherX = gameState.tanks[OTHER_TEAM[team]].x;
    const separation = tankWorldWidth() * 1.35;
    if (Math.abs(destination - otherX) < separation) destination = clamp(otherX + (destination < otherX ? -separation : separation), minX, maxX);
    gameState.inventory[team].teleport -= 1;
    gameState.tanks[team].x = round(destination, 3);
    gameState.movesUsedThisTurn = 0;
    gameState.movedThisTurn = false;
    advanceTurnAfterShot(gameState, team, true);
    gameState.wind = randomWind(gameState.settings);
    localInputPending = false;
    const message = `${TEAM_NAMES[team]} teleported across the battlefield. ${TEAM_NAMES[gameState.turn]} receives a double turn.`;
    addEvent(message);
    broadcastState(message);
    updateGameUI(true);
    playRoundSound();
    return true;
  }

  function maxMovesForTeam(team, state = gameState) {
    return state?.upgrades?.[team]?.engine ? 3 : 1;
  }

  function moveStep() {
    if (!gameState) return 2.8;
    const base = { compact: 2.3, standard: 2.9, wide: 3.8, massive: 5.2, epic: 7.2 }[gameState.settings.worldSize];
    return base * (100 / gameState.settings.tankSize) ** 0.2;
  }

  function requestMove(direction) {
    if (!canLocalAct() || gameState.movesUsedThisTurn >= maxMovesForTeam(localTeam())) return;
    const team = localTeam();
    if (role === "guest") {
      localInputPending = true;
      sendNetwork({ type: "input", action: "move", direction });
      updateGameControls();
    } else {
      authoritativeMove(team, direction);
    }
  }

  function authoritativeMove(team, direction) {
    if (!gameState || animation || gameState.winner || gameState.turn !== team || gameState.movesUsedThisTurn >= maxMovesForTeam(team)) return false;
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
    const fromX = tank.x;
    tank.x = round(candidate, 3);
    gameState.movesUsedThisTurn += 1;
    gameState.movedThisTurn = gameState.movesUsedThisTurn >= maxMovesForTeam(team);
    localInputPending = false;
    const remaining = Math.max(0, maxMovesForTeam(team) - gameState.movesUsedThisTurn);
    const message = `${TEAM_NAMES[team]} moved ${direction < 0 ? "left" : "right"}${remaining ? ` (${remaining} move${remaining === 1 ? "" : "s"} left)` : ""}.`;
    startMovementAnimation(team, fromX, tank.x, true);
    playMoveSound();
    addEvent(message);
    broadcastState(message, { team, fromX, toX: tank.x });
    updateGameUI(true);
    return true;
  }

  function rejectGuestInput(message) {
    if (role === "host" && connection && connection.open) {
      sendNetwork({ type: "state", state: compactStateMetadata(gameState), message });
    }
    addEvent(message);
  }

  function canDeployParachute() {
    return Boolean(
      animation &&
      animation.phase === "travel" &&
      animation.packet?.weapon === "parachute" &&
      !animation.packet.parachuteDeployed &&
      !animation.packet.deployRequested &&
      animation.packet.shooter === localTeam()
    );
  }

  function requestFire() {
    if (canDeployParachute()) {
      requestParachuteDeploy();
      return;
    }
    if (!canLocalAct()) return;
    if (selectedWeapon === "teleport") {
      teleportMode = true;
      dom.canvasFrame.classList.add("teleport-active");
      dom.weaponStatus.textContent = "Teleport armed — click or touch a destination on the battlefield";
      updateGameControls();
      return;
    }

    const angle = Number(dom.angleInput.value);
    const power = Number(dom.powerInput.value);
    const team = localTeam();
    const weapon = selectedWeapon;
    if (weapon !== "standard" && (gameState.inventory?.[team]?.[weapon] || 0) < 1) {
      addEvent(`No ${weaponLabel(weapon)} is available.`, "error");
      selectedWeapon = "standard";
      updateArmouryUI();
      return;
    }
    const doubleStrike = weapon === "standard" && doubleStrikeSelected;
    doubleStrikeSelected = false;
    selectedWeapon = "standard";
    teleportMode = false;
    dom.canvasFrame.classList.remove("teleport-active");
    updateDoubleStrikeButton();
    updateArmouryUI();

    if (role === "guest") {
      localInputPending = true;
      sendNetwork({ type: "input", action: "fire", angle, aim: describeAim(angle), power, doubleStrike, weapon, appVersion: APP_VERSION });
      updateGameControls();
    } else {
      authoritativeFire(team, angle, power, doubleStrike, weapon);
    }
  }

  function requestParachuteDeploy() {
    if (!canDeployParachute()) return;
    const packet = animation.packet;
    const elapsed = performance.now() - animation.start;
    const progress = clamp(elapsed / Math.max(1, animation.travelDuration), 0.03, 0.97);
    if (role === "guest") {
      sendNetwork({ type: "input", action: "deploy-parachute", progress });
      packet.deployRequested = true;
      dom.moveStatus.textContent = "Deploy request sent";
    } else {
      authoritativeDeployParachute(packet.shooter, progress);
    }
  }

  function handleGuestInput(data) {
    if (!gameState) return;
    if (data.action === "purchase") {
      authoritativePurchase("red", String(data.item || ""));
      return;
    }
    if (data.action === "deploy-parachute") {
      authoritativeDeployParachute("red", Number(data.progress));
      return;
    }
    if (data.action === "use-item") {
      authoritativeUseUtility("red", String(data.item || ""));
      return;
    }
    if (!gameState || gameState.turn !== "red" || animation || movementAnimation || gameState.winner) {
      rejectGuestInput("Input ignored because it is not Red's active turn.");
      return;
    }
    if (data.action === "move") {
      authoritativeMove("red", Number(data.direction));
    } else if (data.action === "fire") {
      const redAngle = angleFromAimDescriptor(data.aim, Number(data.angle));
      authoritativeFire("red", redAngle, Number(data.power), Boolean(data.doubleStrike), String(data.weapon || "standard"));
    } else if (data.action === "teleport") {
      authoritativeTeleport("red", Number(data.x));
    }
  }

  function weaponLabel(weapon) {
    return ({ parachute: "parachute bomb", bigBertha: "Big Bertha", teleport: "teleport" })[weapon] || "standard shell";
  }

  function authoritativeFire(team, angle, power, doubleStrike = false, weapon = "standard") {
    if (!gameState || animation || movementAnimation || gameState.winner || gameState.turn !== team) return;
    const safeWeapon = ["standard", "parachute", "bigBertha"].includes(weapon) ? weapon : "standard";
    if (safeWeapon !== "standard" && (gameState.inventory?.[team]?.[safeWeapon] || 0) < 1) {
      rejectGuestInput(`${TEAM_NAMES[team]} does not own that weapon.`);
      return;
    }
    const safeAngle = clamp(Number.isFinite(angle) ? angle : (team === "red" ? -45 : 45), -85, 85);
    const safePower = clamp(Number.isFinite(power) ? power : STANDARD_POWER, 18, MAX_POWER);
    gameState.tanks[team].angle = round(safeAngle, 1);
    gameState.tanks[team].power = round(safePower, 1);

    const packet = createShotPacket(gameState, team, safeAngle, safePower, doubleStrike, safeWeapon, null);
    if (role === "host" && connection && connection.open) sendNetwork({ type: "shot", packet });
    beginShotAnimation(packet);
  }

  function createShotPacket(baseState, team, angle, power, doubleStrike, weapon, parachuteDeployTime) {
    const result = simulateShot(baseState, team, angle, power, true, { weapon, parachuteDeployTime });
    const resultingState = deepClone(baseState);
    resultingState.shotNumber += 1;
    if (weapon !== "standard") resultingState.inventory[team][weapon] = Math.max(0, resultingState.inventory[team][weapon] - 1);
    const blastRadius = shotBlastRadius(resultingState, doubleStrike, weapon);

    const hitTeams = result.impact && result.impact.type !== "out"
      ? blastHitTeams(baseState, result.impact, blastRadius)
      : [];
    if (result.hitTeam && !hitTeams.includes(result.hitTeam)) hitTeams.push(result.hitTeam);

    if (result.impact && result.impact.type !== "out") {
      if (result.impact.type === "ceiling") applyCeilingCrater(resultingState, result.impact.x, result.impact.y, blastRadius, weapon === "bigBertha" ? "circular" : "standard");
      else applyCrater(resultingState, result.impact.x, result.impact.y, blastRadius, weapon === "bigBertha" ? "circular" : "standard");
    }

    for (const hitTeam of hitTeams) {
      resultingState.tanks[hitTeam].hits += 1;
      if (resultingState.tanks[hitTeam].hits >= resultingState.settings.hitsToDestroy) resultingState.tanks[hitTeam].alive = false;
    }
    if (hitTeams.includes(OTHER_TEAM[team])) resultingState.credits[team] += 3;

    const aliveTeams = ["blue", "red"].filter(candidate => resultingState.tanks[candidate].alive);
    if (aliveTeams.length === 1) {
      resultingState.winner = aliveTeams[0];
      resultingState.scores[resultingState.winner] += 1;
    } else if (aliveTeams.length === 0) {
      resultingState.winner = OTHER_TEAM[team];
      resultingState.scores[resultingState.winner] += 1;
    }

    const doubleTurnPenalty = doubleStrike || weapon !== "standard";
    if (!resultingState.winner) {
      advanceTurnAfterShot(resultingState, team, doubleTurnPenalty);
      resultingState.movesUsedThisTurn = 0;
      resultingState.movedThisTurn = false;
      resultingState.wind = randomWind(resultingState.settings);
    }

    return {
      shooter: team,
      angle: round(angle, 1),
      power: round(power, 1),
      weapon,
      doubleStrike,
      doubleTurnPenalty,
      parachuteDeployed: Number.isFinite(parachuteDeployTime),
      parachuteDeployTime: Number.isFinite(parachuteDeployTime) ? round(parachuteDeployTime, 3) : null,
      parachuteDeployIndex: result.parachuteDeployIndex,
      flightTime: round(result.flightTime, 3),
      blastRadius: round(blastRadius, 3),
      trajectory: result.trajectory,
      impact: result.impact,
      hitTeam: hitTeams[0] || null,
      hitTeams,
      resultingState: compactStateMetadata(resultingState)
    };
  }

  function authoritativeDeployParachute(team, progress) {
    if (!animation || animation.phase !== "travel") return;
    const oldPacket = animation.packet;
    if (oldPacket.shooter !== team || oldPacket.weapon !== "parachute" || oldPacket.parachuteDeployed) return;
    const safeProgress = clamp(Number(progress) || 0.25, 0.03, 0.97);
    const deployTime = clamp(oldPacket.flightTime * safeProgress, 0.12, Math.max(0.14, oldPacket.flightTime - 0.04));
    const packet = createShotPacket(gameState, team, oldPacket.angle, oldPacket.power, false, "parachute", deployTime);
    if (role === "host" && connection && connection.open) sendNetwork({ type: "shot-replace", packet, progress: safeProgress });
    replaceShotAnimation(packet);
    addEvent(`${TEAM_NAMES[team]} deployed the parachute.`);
  }

  function replaceShotAnimation(packet) {
    const deployIndex = Math.max(1, Number(packet.parachuteDeployIndex) || 1);
    const progress = clamp(deployIndex / Math.max(1, packet.trajectory.length - 1), 0, 0.96);
    const travelDuration = clamp(packet.trajectory.length * 9.5, 1050, 5200);
    animation = {
      packet,
      start: performance.now() - progress * travelDuration,
      travelDuration,
      explosionDuration: packet.impact && packet.impact.type !== "out" ? 620 : 180,
      phase: "travel"
    };
    updateGameControls();
    requestRender();
  }

  function advanceTurnAfterShot(state, shooter, doubleTurnPenalty) {
    const opponent = OTHER_TEAM[shooter];
    if (doubleTurnPenalty && state.bonusFromDouble) {
      state.turn = opponent;
      state.turnsRemaining = 1;
      state.bonusFromDouble = false;
    } else if (!doubleTurnPenalty && state.turnsRemaining > 1) {
      state.turn = shooter;
      state.turnsRemaining -= 1;
    } else {
      state.turn = opponent;
      state.turnsRemaining = doubleTurnPenalty ? 2 : 1;
      state.bonusFromDouble = doubleTurnPenalty;
    }
    state.credits[state.turn] += 1;
  }

  function shotBlastRadius(state, doubleStrike = false, weapon = "standard") {
    if (weapon === "bigBertha") return craterRadius(state) * 5;
    return craterRadius(state) * (doubleStrike ? 2 : 1);
  }

  function blastHitTeams(state, impact, radius) {
    const hitTeams = [];
    for (const team of ["blue", "red"]) {
      if (!state.tanks[team].alive) continue;
      const center = tankCenter(state, team);
      if (Math.hypot(impact.x - center.x, impact.y - center.y) <= radius + tankCollisionRadius(state)) {
        hitTeams.push(team);
      }
    }
    return hitTeams;
  }

  function simulateShot(state, team, angle, power, recordTrajectory, options = {}) {
    const origin = muzzlePosition(state, team, angle);
    const radians = worldAngleForTeam(team, angle) * Math.PI / 180;
    const speed = power * 0.60;
    let x = origin.x;
    let y = origin.y;
    let vx = Math.cos(radians) * speed;
    let vy = Math.sin(radians) * speed;
    const dt = 0.035;
    let elapsed = 0;
    let aboveTopFor = 0;
    let parachuteDeployed = false;
    let parachuteDeployIndex = null;
    const deployTime = Number.isFinite(options.parachuteDeployTime) ? options.parachuteDeployTime : null;
    const trajectory = [{ x: round(x), y: round(y) }];
    const maxSteps = 9000;

    for (let step = 0; step < maxSteps; step += 1) {
      elapsed += dt;
      if (!parachuteDeployed && options.weapon === "parachute" && deployTime !== null && elapsed >= deployTime) {
        parachuteDeployed = true;
        parachuteDeployIndex = trajectory.length;
      }

      if (parachuteDeployed) {
        const targetVx = state.wind * 0.55;
        const terminalDown = -(2.8 + Math.sqrt(Math.max(0.4, state.settings.gravity)) * 0.42);
        vx += (targetVx - vx) * Math.min(1, dt * 2.8);
        vy += (terminalDown - vy) * Math.min(1, dt * 4.2);
      } else {
        vx += state.wind * 0.2 * dt;
        vy -= state.settings.gravity * dt;
      }
      x += vx * dt;
      y += vy * dt;

      if (recordTrajectory && step % 2 === 0) trajectory.push({ x: round(x), y: round(y) });

      // Horizontal exits are always lost. Above the visible sky is not a ceiling:
      // the shell receives five simulated seconds to fall back into view.
      if (x < 0 || x > state.settings.worldWidth || y < -8) {
        if (recordTrajectory) trajectory.push({ x: round(x), y: round(y) });
        return { trajectory, impact: { x: round(x), y: round(y), type: "out" }, hitTeam: null, flightTime: elapsed, parachuteDeployIndex };
      }
      if (!state.ceiling && y > WORLD_HEIGHT + 5) aboveTopFor += dt;
      else aboveTopFor = 0;
      if (aboveTopFor >= OFFSCREEN_RETURN_SECONDS) {
        if (recordTrajectory) trajectory.push({ x: round(x), y: round(y) });
        return { trajectory, impact: { x: round(x), y: round(y), type: "out" }, hitTeam: null, flightTime: elapsed, parachuteDeployIndex };
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
            hitTeam: checkedTeam,
            flightTime: elapsed,
            parachuteDeployIndex
          };
        }
      }

      const ground = terrainAt(x, state);
      if (step > 4 && y <= ground) {
        if (recordTrajectory) trajectory.push({ x: round(x), y: round(ground) });
        return {
          trajectory,
          impact: { x: round(x), y: round(ground), type: "terrain" },
          hitTeam: null,
          flightTime: elapsed,
          parachuteDeployIndex
        };
      }

      if (state.ceiling) {
        const roof = ceilingAt(x, state);
        if (step > 4 && y >= roof) {
          if (recordTrajectory) trajectory.push({ x: round(x), y: round(roof) });
          return {
            trajectory,
            impact: { x: round(x), y: round(roof), type: "ceiling" },
            hitTeam: null,
            flightTime: elapsed,
            parachuteDeployIndex
          };
        }
      }

      if (elapsed > 30) break;
    }

    return { trajectory, impact: { x: round(x), y: round(y), type: "out" }, hitTeam: null, flightTime: elapsed, parachuteDeployIndex };
  }

  function muzzlePosition(state, team, angle = state.tanks[team].angle) {
    const center = tankCenter(state, team);
    const radians = worldAngleForTeam(team, angle) * Math.PI / 180;
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

  function ceilingAt(x, state = gameState) {
    if (!state?.ceiling) return WORLD_HEIGHT + 20;
    const position = clamp(x / state.settings.worldWidth, 0, 1) * (state.ceiling.length - 1);
    const index = Math.floor(position);
    const fraction = position - index;
    const a = state.ceiling[index];
    const b = state.ceiling[Math.min(index + 1, state.ceiling.length - 1)];
    return a + (b - a) * fraction;
  }

  function terrainSlopeAt(x, state = gameState) {
    const delta = state.settings.worldWidth / state.terrain.length * 2;
    return (terrainAt(x + delta, state) - terrainAt(x - delta, state)) / (delta * 2);
  }

  function applyCrater(state, impactX, impactY, radius, shape = "standard") {
    const centerIndex = (impactX / state.settings.worldWidth) * (state.terrain.length - 1);
    const radiusIndex = Math.ceil((radius / state.settings.worldWidth) * state.terrain.length);
    for (let offset = -radiusIndex; offset <= radiusIndex; offset += 1) {
      const index = Math.round(centerIndex + offset);
      if (index < 0 || index >= state.terrain.length) continue;
      const worldX = (index / (state.terrain.length - 1)) * state.settings.worldWidth;
      const distance = Math.abs(worldX - impactX);
      if (distance > radius) continue;
      if (shape === "circular") {
        const circleDepth = Math.sqrt(Math.max(0, radius * radius - distance * distance));
        const circularSurface = impactY - circleDepth;
        state.terrain[index] = round(clamp(Math.min(state.terrain[index], circularSurface), 3, WORLD_HEIGHT - 5), 3);
      } else {
        const normal = distance / radius;
        const depth = radius * 0.72 * (1 - normal * normal);
        const rim = radius * 0.12 * Math.exp(-((normal - 0.9) ** 2) / 0.02);
        state.terrain[index] = round(clamp(state.terrain[index] - depth + rim, 3, WORLD_HEIGHT - 5), 3);
      }
    }
    if (shape !== "circular") smoothLocalTerrain(state.terrain, Math.round(centerIndex), radiusIndex + 2);
  }

  function applyCeilingCrater(state, impactX, impactY, radius, shape = "standard") {
    if (!state.ceiling) return;
    const centerIndex = (impactX / state.settings.worldWidth) * (state.ceiling.length - 1);
    const radiusIndex = Math.ceil((radius / state.settings.worldWidth) * state.ceiling.length);
    for (let offset = -radiusIndex; offset <= radiusIndex; offset += 1) {
      const index = Math.round(centerIndex + offset);
      if (index < 0 || index >= state.ceiling.length) continue;
      const worldX = index / (state.ceiling.length - 1) * state.settings.worldWidth;
      const distance = Math.abs(worldX - impactX);
      if (distance > radius) continue;
      if (shape === "circular") {
        const circleDepth = Math.sqrt(Math.max(0, radius * radius - distance * distance));
        const circularSurface = impactY + circleDepth;
        state.ceiling[index] = round(clamp(Math.max(state.ceiling[index], circularSurface), state.terrain[index] + 15, WORLD_HEIGHT - 2), 3);
      } else {
        const normal = distance / radius;
        const depth = radius * .62 * (1 - normal * normal);
        state.ceiling[index] = round(clamp(state.ceiling[index] + depth, state.terrain[index] + 15, WORLD_HEIGHT - 2), 3);
      }
    }
    if (shape !== "circular") smoothLocalTerrain(state.ceiling, Math.round(centerIndex), radiusIndex + 2);
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
    const now = performance.now();
    const currentTank = gameState?.tanks?.[packet.shooter];
    const fromAngle = Number.isFinite(currentTank?.angle) ? currentTank.angle : packet.angle;
    const fromPower = Number.isFinite(currentTank?.power) ? currentTank.power : packet.power;
    animation = {
      packet,
      start: now,
      phaseStart: now,
      fromAngle,
      fromPower,
      aimDuration: Math.abs(packet.angle - fromAngle) > 0.5
        ? clamp(900 + Math.abs(packet.angle - fromAngle) * 9, 1000, 1700)
        : 520,
      chargeDuration: Math.abs(packet.power - fromPower) > 0.5
        ? clamp(560 + Math.abs(packet.power - fromPower) * 2.4, 650, 1050)
        : 420,
      recoilDuration: 680,
      travelDuration: clamp(packet.trajectory.length * 11.5, 1350, 6200),
      explosionDuration: packet.impact && packet.impact.type !== "out" ? (packet.weapon === "bigBertha" ? 1100 : 720) : 220,
      phase: "aim",
      fireSoundPlayed: false,
      powerSoundPlayed: false
    };
    if (Math.abs(packet.angle - fromAngle) > 0.5) {
      playTurretCrankSound(animation.aimDuration, packet.angle - fromAngle);
    }
    const weaponText = packet.weapon && packet.weapon !== "standard" ? ` ${weaponLabel(packet.weapon)}` : packet.doubleStrike ? " a DOUBLE STRIKE" : "";
    addEvent(`${TEAM_NAMES[packet.shooter]} prepared${weaponText}: ${formatAimAngle(packet.angle)}, power ${Math.round(packet.power)}.`);
    updateGameControls();
    requestRender();
  }

  function beginTravelPhase(now) {
    if (!animation) return;
    const packet = animation.packet;
    animation.phase = "travel";
    animation.phaseStart = now;
    animation.start = now;
    if (role === "bot" && packet.shooter === "red" && packet.weapon === "parachute" && !packet.parachuteDeployed) {
      setTimeout(() => {
        if (animation?.packet === packet && animation.phase === "travel") authoritativeDeployParachute("red", .52);
      }, 620);
    }
  }

  function finishShotAnimation() {
    if (!animation) return;
    const packet = animation.packet;
    const nextState = mergeRuntimeMetadata(packet.resultingState, gameState);
    if (!nextState) {
      animation = null;
      addEvent("Unable to apply the remote shot state.", "error");
      return;
    }
    if (packet.impact && packet.impact.type !== "out") {
      if (packet.impact.type === "ceiling") applyCeilingCrater(nextState, packet.impact.x, packet.impact.y, packet.blastRadius, packet.weapon === "bigBertha" ? "circular" : "standard");
      else applyCrater(nextState, packet.impact.x, packet.impact.y, packet.blastRadius, packet.weapon === "bigBertha" ? "circular" : "standard");
    }
    gameState = nextState;
    animation = null;

    const hitTeams = Array.isArray(packet.hitTeams) ? packet.hitTeams : (packet.hitTeam ? [packet.hitTeam] : []);
    if (hitTeams.length) {
      hitTeams.forEach(team => addEvent(`BLAST HIT on ${TEAM_NAMES[team]}!`, "hit"));
      playHitSound();
    } else if (packet.impact && packet.impact.type === "terrain") {
      addEvent("Ground impact.");
    } else if (packet.impact && packet.impact.type === "ceiling") {
      addEvent("Cave roof impact.");
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

  function broadcastState(message = "", movement = null) {
    if (role === "host" && connection && connection.open) {
      sendNetwork({ type: "state", state: compactStateMetadata(gameState), message, movement });
    }
  }

  function startMovementAnimation(team, fromX, toX, local = false) {
    if (!gameState || !Number.isFinite(fromX) || !Number.isFinite(toX)) return;
    movementAnimation = {
      team,
      fromX,
      toX,
      start: performance.now(),
      duration: clamp(360 + Math.abs(toX - fromX) * 38, 420, 850),
      local
    };
    updateGameControls();
    requestRender();
  }

  function displayTankX(team, now = performance.now()) {
    if (!movementAnimation || movementAnimation.team !== team) return gameState.tanks[team].x;
    const progress = clamp((now - movementAnimation.start) / movementAnimation.duration, 0, 1);
    const eased = progress < .5 ? 2 * progress * progress : 1 - ((-2 * progress + 2) ** 2) / 2;
    return movementAnimation.fromX + (movementAnimation.toX - movementAnimation.fromX) * eased;
  }

  function scheduleBotTurn() {
    if (botTimer || role !== "bot" || !gameState || gameState.turn !== "red" || animation || gameState.winner) return;
    botTimer = setTimeout(() => {
      botTimer = null;
      if (!gameState || gameState.turn !== "red" || animation || gameState.winner) return;

      if (gameState.movesUsedThisTurn < maxMovesForTeam("red") && Math.random() < 0.42) {
        const direction = gameState.tanks.red.x > gameState.settings.worldWidth * 0.76 ? -1 : (Math.random() < 0.5 ? -1 : 1);
        authoritativeMove("red", direction);
      }

      botTimer = setTimeout(() => {
        botTimer = null;
        if (!gameState || gameState.turn !== "red" || animation || gameState.winner) return;
        const aim = calculateBotAim();
        dom.angleInput.value = aim.angle;
        dom.powerInput.value = aim.power;
        const botWeapon = chooseBotWeapon();
        authoritativeFire("red", aim.angle, aim.power, botWeapon === "standard" && Math.random() < .18, botWeapon);
      }, 650);
    }, 700);
  }

  function chooseBotWeapon() {
    if (gameState.credits.red >= 10 && Math.random() < .18) authoritativePurchase("red", Math.random() < .65 ? "bigBertha" : "parachute", false);
    if (gameState.credits.red >= 10 && !gameState.upgrades.red.engine && !gameState.inventory.red.engine && Math.random() < .08) authoritativePurchase("red", "engine", false);
    if (gameState.inventory.red.engine > 0 && !gameState.upgrades.red.engine && Math.random() < .45) { authoritativeUseUtility("red", "engine"); return "standard"; }
    if (gameState.tanks.red.hits > 0 && gameState.credits.red >= 20 && !gameState.inventory.red.repair && Math.random() < .16) authoritativePurchase("red", "repair", false);
    if (gameState.tanks.red.hits > 0 && gameState.inventory.red.repair > 0 && Math.random() < .45) { authoritativeUseUtility("red", "repair"); return "standard"; }
    if (gameState.inventory.red.bigBertha > 0 && Math.random() < .35) return "bigBertha";
    if (gameState.inventory.red.parachute > 0 && Math.random() < .20) return "parachute";
    return "standard";
  }

  function calculateBotAim() {
    let best = { angle: -45, power: STANDARD_POWER, score: Infinity };
    const target = tankCenter(gameState, "blue");
    const shooter = "red";

    for (let angle = -85; angle <= -5; angle += 4) {
      for (let power = 28; power <= MAX_POWER; power += 7) {
        const score = quickShotScore(shooter, angle, power, target);
        if (score < best.score) best = { angle, power, score };
        if (score < 0.4) break;
      }
    }

    const errorAngle = (Math.random() - 0.5) * 2.2;
    const errorPower = (Math.random() - 0.5) * 5.5;
    return {
      angle: round(clamp(best.angle + errorAngle, -85, 85), 1),
      power: round(clamp(best.power + errorPower, 20, MAX_POWER), 1)
    };
  }

  function quickShotScore(team, angle, power, target) {
    const origin = muzzlePosition(gameState, team, angle);
    const radians = worldAngleForTeam(team, angle) * Math.PI / 180;
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
      if (x < 0 || x > gameState.settings.worldWidth || y < -8) break;
      if (step > 3 && y <= terrainAt(x, gameState)) break;
      if (gameState.ceiling && step > 3 && y >= ceilingAt(x, gameState)) break;
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
      sendNetwork({ type: "chat", sender: team, text });
    }
    playOutgoingChatSound();
  }

  function parsePurchaseMessage(message) {
    const match = /^(Blue|Red) bought (.+) for (\d+) credits\.$/.exec(String(message || ""));
    if (!match) return null;
    return { team: match[1].toLowerCase(), name: match[2], cost: Number(match[3]) };
  }

  function handlePurchaseFeedback(team, name, cost) {
    playPurchaseSound();
    if (team !== localTeam() || dom.gameScreen.classList.contains("hidden")) return;
    showCanvasMessage("PURCHASE CONFIRMED", `${name} added to the ${TEAM_NAMES[team]} armoury · ${cost} credits`, "purchase");
  }

  function updateRoundOverDock() {
    if (!dom.roundOverDock) return;
    const visible = Boolean(
      gameState?.winner &&
      winnerModalDismissed &&
      !pendingActionRequest &&
      !localActionRequest &&
      activeCanvasMessageMode === null
    );
    dom.roundOverDock.classList.toggle("hidden", !visible);
  }

  function showCanvasMessage(message, subtitle = "", mode = "notice") {
    activeCanvasMessageMode = mode;
    updateRoundOverDock();
    dom.canvasMessage.dataset.mode = mode;
    dom.canvasMessageTitle.textContent = message;
    dom.canvasMessageSub.textContent = subtitle;
    dom.canvasMessageSub.classList.toggle("hidden", !subtitle);
    const hasActions = mode === "winner" || mode === "request" || mode === "purchase";
    dom.canvasMessageActions.classList.toggle("hidden", !hasActions);
    dom.modalCloseButton.classList.toggle("hidden", mode !== "winner" && mode !== "purchase");
    dom.replayRequestButton.classList.toggle("hidden", mode !== "winner");
    dom.returnMenuButton.classList.toggle("hidden", mode !== "winner");
    dom.replayAcceptButton.classList.toggle("hidden", mode !== "request");
    dom.replayDeclineButton.classList.toggle("hidden", mode !== "request");
    dom.purchaseConfirmButton.classList.toggle("hidden", mode !== "purchase");
    dom.replayRequestButton.textContent = "Play again";
    dom.canvasMessage.classList.remove("hidden");
  }

  function hideCanvasMessage() {
    activeCanvasMessageMode = null;
    delete dom.canvasMessage.dataset.mode;
    dom.canvasMessage.classList.add("hidden");
    dom.canvasMessageActions.classList.add("hidden");
    dom.modalCloseButton.classList.add("hidden");
    dom.replayRequestButton.classList.add("hidden");
    dom.returnMenuButton.classList.add("hidden");
    dom.replayAcceptButton.classList.add("hidden");
    dom.replayDeclineButton.classList.add("hidden");
    dom.purchaseConfirmButton.classList.add("hidden");
    updateRoundOverDock();
  }

  function closeCanvasModal() {
    if (activeCanvasMessageMode === "winner") winnerModalDismissed = true;
    hideCanvasMessage();
  }

  function dismissEndModal() {
    winnerModalDismissed = true;
    hideCanvasMessage();
  }

  function actionLabel(action, payload = {}) {
    if (action === "restart") return "restart this battlefield";
    if (action === "regenerate") return "generate a new battlefield";
    if (action === "change-world") return `change the world to ${LOCATION_PRESETS[payload.location]?.label || "another world"}`;
    return "play another round";
  }

  function requestRoundAction(action, payload = {}) {
    if (!gameState || animation || movementAnimation || pendingActionRequest || localActionRequest) return;

    if (role === "bot") {
      executeRoundAction(action, payload);
      return;
    }

    if (!connection || !connection.open || !accepted) return;
    localActionRequest = { action, payload };
    sendNetwork({ type: "action-request", action, payload, sender: localTeam() });
    showCanvasMessage(
      `${action === "replay" ? "REPLAY" : "BATTLEFIELD"} REQUESTED`,
      `Waiting for ${TEAM_NAMES[OTHER_TEAM[localTeam()]]} to accept.`,
      "waiting"
    );
    addEvent(`You requested to ${actionLabel(action, payload)}.`);
    updateGameControls();
  }

  function requestWorldChange() {
    if (!gameState) return;
    const location = dom.gameLocationSelect.value;
    if (location === gameState.settings.location) return;
    requestRoundAction("change-world", { location });
  }

  function receiveActionRequest(data) {
    if (!gameState || !accepted || !["restart", "regenerate", "replay", "change-world"].includes(data.action)) return;
    if (pendingActionRequest || localActionRequest) {
      sendNetwork({ type: "action-response", action: data.action, accepted: false, reason: "busy" });
      return;
    }
    pendingActionRequest = { action: data.action, payload: data.payload || {}, sender: data.sender };
    const requester = TEAM_NAMES[data.sender] || "Opponent";
    if (currentScreen !== "game") setScreen("game");
    showCanvasMessage(
      `${requester.toUpperCase()} REQUESTS A CHANGE`,
      `${requester} wants to ${actionLabel(data.action, data.payload || {})}.`,
      "request"
    );
    addEvent(`${requester} requested to ${actionLabel(data.action, data.payload || {})}.`);
    updateGameControls();
  }

  function acceptActionRequest() {
    if (!pendingActionRequest) return;
    const { action, payload } = pendingActionRequest;
    pendingActionRequest = null;
    sendNetwork({ type: "action-response", action, accepted: true });

    if (role === "host") {
      executeRoundAction(action, payload);
    } else {
      showCanvasMessage("REQUEST ACCEPTED", "The host is preparing the battlefield.", "waiting");
    }
  }

  function declineActionRequest() {
    if (!pendingActionRequest) return;
    const { action } = pendingActionRequest;
    pendingActionRequest = null;
    sendNetwork({ type: "action-response", action, accepted: false });
    addEvent("Replay or battlefield request declined.");
    dom.gameLocationSelect.value = gameState.settings.location;
    if (gameState?.winner) updateGameUI(false);
    else hideCanvasMessage();
    updateGameControls();
  }

  function receiveActionResponse(data) {
    if (!localActionRequest || data.action !== localActionRequest.action) return;
    const request = localActionRequest;
    if (!data.accepted) {
      localActionRequest = null;
      addEvent("Your request was declined.", "error");
      dom.gameLocationSelect.value = gameState.settings.location;
      if (gameState?.winner) updateGameUI(false);
      else hideCanvasMessage();
      updateGameControls();
      return;
    }

    addEvent("Your request was accepted.");
    if (role === "host") {
      localActionRequest = null;
      executeRoundAction(request.action, request.payload);
    } else {
      showCanvasMessage("REQUEST ACCEPTED", "The host is preparing the battlefield.", "waiting");
    }
  }

  function executeRoundAction(action, payload = {}) {
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
    } else if (action === "change-world") {
      const location = LOCATION_PRESETS[payload.location] ? payload.location : gameState.settings.location;
      const settings = locationSettings(location, gameState.settings);
      state = createGameState(settings, { scores, round: nextRound });
      message = `Round ${nextRound}: world changed to ${LOCATION_PRESETS[location].label}.`;
    } else {
      state = createGameState(gameState.settings, { scores, round: nextRound });
      message = `Round ${nextRound}: a new battlefield was generated.`;
    }

    pendingActionRequest = null;
    localActionRequest = null;
    if (role === "host" && connection && connection.open) {
      sendNetwork({ type: "round-start", state: compactStateMetadata(state), message });
    }
    enterGame(state, true);
    playRoundSound();
    addEvent(message);
  }

  function createRestartedState(previous, roundNumber) {
    const state = deepClone(previous);
    state.terrain = state.baseTerrain.slice();
    state.ceiling = state.baseCeiling ? state.baseCeiling.slice() : null;
    state.tanks = {
      blue: { x: round(state.spawnPositions.blue, 3), hits: 0, alive: true, angle: 45, power: STANDARD_POWER },
      red: { x: round(state.spawnPositions.red, 3), hits: 0, alive: true, angle: -45, power: STANDARD_POWER }
    };
    state.credits = { blue: 0, red: 0 };
    state.inventory = { blue: { parachute: 0, bigBertha: 0, teleport: 0, engine: 0, repair: 0 }, red: { parachute: 0, bigBertha: 0, teleport: 0, engine: 0, repair: 0 } };
    state.upgrades = { blue: { engine: false }, red: { engine: false } };
    state.round = roundNumber;
    state.turn = "blue";
    state.turnsRemaining = 1;
    state.bonusFromDouble = false;
    state.movedThisTurn = false;
    state.movesUsedThisTurn = 0;
    state.wind = randomWind(state.settings);
    state.winner = null;
    state.shotNumber = 0;
    return state;
  }

  function resetTransientState(clearLobby = true) {
    clearTimeout(botTimer);
    botTimer = null;
    animation = null;
    movementAnimation = null;
    gameState = null;
    localInputPending = false;
    pendingActionRequest = null;
    localActionRequest = null;
    acceptRequested = false;
    clearGuestReadyHandshake();
    incomingTransfers.clear();
    lastInitialGameSendAt = 0;
    initialGameToken = null;
    receivedInitialGameToken = null;
    winnerModalDismissed = false;
    doubleStrikeSelected = false;
    selectedWeapon = "standard";
    pendingArmAfterPurchase = null;
    teleportMode = false;
    dom.canvasFrame.classList.remove("teleport-active");
    updateDoubleStrikeButton();
    resetInspectionView(false);
    dom.homeNotice.textContent = "";
    dom.chatLog.replaceChildren();
    dom.eventLog.replaceChildren();
    hideCanvasMessage();
    if (clearLobby) dom.lobbyLog.replaceChildren();
  }

  function safelyDestroyPeer() {
    incomingTransfers.clear();
    lastInitialGameSendAt = 0;
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
    clearGuestReadyHandshake();
    incomingTransfers.clear();
    lastInitialGameSendAt = 0;
    initialGameToken = null;
    receivedInitialGameToken = null;
    gameState = null;
    animation = null;
    movementAnimation = null;
    localInputPending = false;
    pendingActionRequest = null;
    localActionRequest = null;
    winnerModalDismissed = false;
    doubleStrikeSelected = false;
    updateDoubleStrikeButton();
    resetInspectionView(false);
    dom.lobbyLog.replaceChildren();
    dom.chatLog.replaceChildren();
    dom.eventLog.replaceChildren();
    dom.roomCodeWrap.classList.add("hidden");
    dom.incomingRequest.classList.add("hidden");
    dom.joinCode.value = "";
    dom.hostButton.disabled = false;
    dom.botButton.disabled = false;
    dom.joinButton.disabled = false;
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
    markCanvasResize();
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
    invalidateStaticLayer();
    requestRender();
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
    invalidateStaticLayer();
    requestRender();
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

  function updateAimFromPointer(clientX, clientY) {
    if (!gameState || !canLocalAct()) return;
    const team = localTeam();
    const point = canvasToWorld(clientX, clientY);
    const center = tankCenter(gameState, team);
    const dx = point.x - center.x;
    const rise = Math.max(0.1, point.y - center.y);
    const worldAngle = clamp(Math.atan2(rise, dx) * 180 / Math.PI, 5, 175);
    const aim = clamp(90 - worldAngle, -85, 85);
    const distance = Math.hypot(dx, rise);
    const power = clamp(18 + distance / Math.max(1, gameState.settings.worldWidth * .58) * (MAX_POWER - 18), 18, MAX_POWER);
    dom.angleInput.value = String(Math.round(aim));
    dom.powerInput.value = String(Math.round(power));
    gameState.tanks[team].angle = round(aim, 1);
    gameState.tanks[team].power = round(power, 1);
    updateAimOutputs();
    requestRender();
  }

  function handleCanvasPointerDown(event) {
    if (!gameState) return;
    if (!inspectionCamera.active && teleportMode && canLocalAct()) {
      requestTeleport(canvasToWorld(event.clientX, event.clientY).x);
      event.preventDefault();
      return;
    }
    if (!inspectionCamera.active && canLocalAct()) {
      dom.canvas.setPointerCapture?.(event.pointerId);
      aimDrag.active = true;
      aimDrag.pointerId = event.pointerId;
      dom.canvasFrame.classList.add("aim-drag-active");
      updateAimFromPointer(event.clientX, event.clientY);
      event.preventDefault();
      return;
    }
    if (!inspectionCamera.active) return;
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
    invalidateStaticLayer();
    requestRender();
    event.preventDefault();
  }

  function handleCanvasPointerMove(event) {
    if (aimDrag.active && aimDrag.pointerId === event.pointerId) {
      updateAimFromPointer(event.clientX, event.clientY);
      event.preventDefault();
      return;
    }
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
    invalidateStaticLayer();
    requestRender();
    event.preventDefault();
  }

  function handleCanvasPointerUp(event) {
    if (aimDrag.pointerId === event.pointerId) {
      aimDrag.active = false;
      aimDrag.pointerId = null;
      dom.canvasFrame.classList.remove("aim-drag-active");
    }
    inspectionCamera.pointers.delete(event.pointerId);
    inspectionCamera.dragging = inspectionCamera.pointers.size > 0;
    if (inspectionCamera.pointers.size < 2) inspectionCamera.pinchDistance = 0;
    requestRender();
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
    invalidateStaticLayer();
    requestRender();
  }

  function markCanvasResize() {
    resizePending = true;
    requestRender();
  }

  function resizeCanvasToDisplaySize() {
    const rect = dom.canvas.getBoundingClientRect();
    const width = Math.max(320, Math.round(rect.width));
    const height = Math.max(180, Math.round(rect.height));
    if (dom.canvas.width === width && dom.canvas.height === height) return false;
    dom.canvas.width = width;
    dom.canvas.height = height;
    staticCanvas.width = width;
    staticCanvas.height = height;
    return true;
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

  function playTurretCrankSound(durationMs, angleDelta) {
    if (!soundEnabled || Math.abs(angleDelta) < .5) return;
    const duration = Math.max(.25, durationMs / 1000);
    const steps = Math.min(18, Math.max(5, Math.round(Math.abs(angleDelta) / 5)));
    const interval = duration / steps;
    const directionLift = angleDelta >= 0 ? 18 : -12;
    for (let i = 0; i < steps; i += 1) {
      const delay = i * interval;
      tone(116 + directionLift + (i % 3) * 9, Math.min(.055, interval * .68), "square", .009, delay);
      tone(64 + (i % 2) * 6, Math.min(.045, interval * .55), "triangle", .007, delay + .012);
    }
  }

  function playPowerSetSound(durationMs, powerDelta) {
    if (!soundEnabled || Math.abs(powerDelta) < .5) return;
    const duration = Math.max(.25, durationMs / 1000);
    const steps = Math.min(12, Math.max(4, Math.round(Math.abs(powerDelta) / 14)));
    const interval = duration / steps;
    for (let i = 0; i < steps; i += 1) {
      const delay = i * interval;
      const rise = powerDelta >= 0 ? i * 5 : (steps - i) * 5;
      tone(180 + rise, Math.min(.045, interval * .62), "sawtooth", .0065, delay);
    }
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

  function playPurchaseSound() {
    tone(270, .055, "square", .026);
    tone(540, .08, "triangle", .035, .045);
    tone(810, .14, "triangle", .04, .115);
    noiseBurst(.045, .012);
  }

  function playButtonClickSound(button) {
    if (!button || button.disabled || !soundEnabled) return;
    const id = button.id || "";
    if (id === "fireButton" || id === "doubleStrikeButton") {
      tone(118, .045, "square", .022);
      tone(72, .07, "triangle", .018, .025);
    } else if (id === "moveLeftButton" || id === "moveRightButton") {
      tone(160, .035, "square", .017);
      noiseBurst(.025, .006);
    } else if (button.classList.contains("armoury-button") || id === "armouryToolButton") {
      tone(310, .035, "square", .018);
      tone(420, .045, "triangle", .014, .03);
    } else if (button.classList.contains("range-step-button")) {
      tone(id.includes("Increase") ? 610 : 520, .025, "square", .01);
    } else if (button.classList.contains("collapse-button") || button.classList.contains("canvas-tool")) {
      tone(390, .03, "triangle", .009);
    } else if (button.classList.contains("danger-button") || id === "disconnectSessionButton" || id === "replayDeclineButton") {
      tone(210, .045, "square", .015);
    } else if (button.classList.contains("primary-button") || button.classList.contains("join-button") || id === "acceptButton" || id === "replayAcceptButton" || id === "purchaseConfirmButton") {
      tone(440, .035, "triangle", .014);
      tone(620, .05, "triangle", .012, .025);
    } else {
      playUiSound();
    }
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

  function computeCanvasMetrics() {
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

  function canvasMetrics() {
    return activeCanvasMetrics || computeCanvasMetrics();
  }

  function worldToCanvas(x, y) {
    const metrics = canvasMetrics();
    return {
      x: (x - metrics.minX) * metrics.sx,
      y: (metrics.maxY - y) * metrics.sy
    };
  }

  function invalidateStaticLayer() {
    staticLayerDirty = true;
    renderDirty = true;
  }

  function hasActiveVisualAnimation() {
    return Boolean(animation || movementAnimation);
  }

  function clearScheduledRender() {
    if (renderRequestId !== null) cancelAnimationFrame(renderRequestId);
    if (renderTimerId !== null) clearTimeout(renderTimerId);
    renderRequestId = null;
    renderTimerId = null;
  }

  function scheduleRender() {
    if (document.hidden || renderRequestId !== null || renderTimerId !== null) return;
    const elapsed = performance.now() - lastRenderedAt;
    const delay = lastRenderedAt > 0 ? Math.max(0, ACTIVE_FRAME_INTERVAL - elapsed) : 0;
    if (delay > 1) {
      renderTimerId = setTimeout(() => {
        renderTimerId = null;
        if (!document.hidden && renderRequestId === null) {
          renderRequestId = requestAnimationFrame(renderFrame);
        }
      }, delay);
    } else {
      renderRequestId = requestAnimationFrame(renderFrame);
    }
  }

  function requestRender() {
    renderDirty = true;
    scheduleRender();
  }

  function rebuildStaticLayer(now) {
    if (!gameState) return;
    if (staticCanvas.width !== dom.canvas.width || staticCanvas.height !== dom.canvas.height) {
      staticCanvas.width = dom.canvas.width;
      staticCanvas.height = dom.canvas.height;
    }

    const screenCtx = ctx;
    ctx = staticCtx;
    activeCanvasMetrics = computeCanvasMetrics();
    ctx.clearRect(0, 0, staticCanvas.width, staticCanvas.height);
    drawSky(now);
    drawDistantLandscape();
    drawTerrain();
    if (gameState.ceiling) drawCaveCeiling();
    drawTankPads();
    activeCanvasMetrics = null;
    ctx = screenCtx;
    staticLayerDirty = false;
  }

  function renderFrame(now) {
    renderRequestId = null;
    if (document.hidden) return;

    if (resizePending) {
      resizePending = false;
      if (resizeCanvasToDisplaySize()) invalidateStaticLayer();
    }

    if (movementAnimation && now - movementAnimation.start >= movementAnimation.duration) {
      movementAnimation = null;
      updateGameControls();
      renderDirty = true;
      if (role === "bot" && gameState?.turn === "red") scheduleBotTurn();
    }

    const animating = hasActiveVisualAnimation();
    if (!renderDirty && !animating) return;

    renderDirty = false;
    lastRenderedAt = now;

    if (currentScreen === "game") {
      if (gameState) drawGame(now);
      else drawIdleCanvas();
    }

    if (renderDirty || hasActiveVisualAnimation()) scheduleRender();
  }

  function drawIdleCanvas() {
    ctx.clearRect(0, 0, dom.canvas.width, dom.canvas.height);
  }

  function drawGame(now) {
    if (staticLayerDirty) rebuildStaticLayer(now);
    activeCanvasMetrics = computeCanvasMetrics();
    ctx.clearRect(0, 0, dom.canvas.width, dom.canvas.height);
    ctx.drawImage(staticCanvas, 0, 0);
    drawAimGuide();
    drawTank("blue", now);
    drawTank("red", now);
    drawInspectionReticle(now);
    drawProjectileAnimation(now);
    drawVignette();
    drawStatusTankPanels(now);
    activeCanvasMetrics = null;
  }

  function drawSky(now) {
    const width = dom.canvas.width;
    const height = dom.canvas.height;
    const location = gameState.settings.location;
    const palettes = {
      earth: ["#263746", "#65727a", "#a29d8e"],
      mars: ["#4b2925", "#8a5545", "#b28366"],
      moon: ["#020407", "#0c1118", "#252a2e"],
      space: ["#020307", "#090c16", "#151321"],
      cave: ["#070807", "#151714", "#24241f"]
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
    if (location === "cave") drawCaveAtmosphere();

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

  function drawCaveAtmosphere() {
    const width = dom.canvas.width;
    const height = dom.canvas.height;
    const random = mulberry32(gameState.seed ^ 0x4cf5ad43);
    ctx.save();
    const glow = ctx.createRadialGradient(width * .5, height * .56, 10, width * .5, height * .56, height * .72);
    glow.addColorStop(0, "rgba(128,118,82,.12)");
    glow.addColorStop(.45, "rgba(66,62,47,.06)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = .13;
    for (let i = 0; i < 90; i += 1) {
      const x = random() * width;
      const y = height * (.2 + random() * .62);
      ctx.fillStyle = random() > .65 ? "#b8a978" : "#5b5849";
      ctx.fillRect(x, y, .5 + random() * 1.5, .5 + random() * 1.5);
    }
    ctx.restore();
  }

  function drawCaveCeiling() {
    if (!gameState.ceiling) return;
    const metrics = canvasMetrics();
    const random = mulberry32(gameState.seed ^ 0x9d4b3a21);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    forEachVisibleTerrainSample(gameState.ceiling, (heightValue, index) => {
      const worldX = index / (gameState.ceiling.length - 1) * gameState.settings.worldWidth;
      const point = worldToCanvas(worldX, heightValue);
      ctx.lineTo(point.x, point.y);
    });
    ctx.lineTo(metrics.width, 0);
    ctx.closePath();
    const rock = ctx.createLinearGradient(0, 0, 0, metrics.height * .45);
    rock.addColorStop(0, "#11120f");
    rock.addColorStop(.5, "#29291f");
    rock.addColorStop(1, "#56513d");
    ctx.fillStyle = rock;
    ctx.fill();
    ctx.clip();

    ctx.globalAlpha = .18;
    for (let i = 0; i < 240; i += 1) {
      const x = random() * metrics.width;
      const y = random() * metrics.height * .43;
      const size = .5 + random() * 3.4;
      ctx.fillStyle = random() > .5 ? "#080906" : "#9b8f69";
      ctx.beginPath();
      ctx.ellipse(x, y, size * (1 + random()), size, random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = .22;
    ctx.strokeStyle = "#060705";
    for (let i = 0; i < 48; i += 1) {
      const x = random() * metrics.width;
      const y = random() * metrics.height * .28;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (random() - .5) * 22, y + 10 + random() * 35);
      ctx.stroke();
    }
    ctx.restore();

    ctx.beginPath();
    forEachVisibleTerrainSample(gameState.ceiling, (heightValue, index, first) => {
      const worldX = index / (gameState.ceiling.length - 1) * gameState.settings.worldWidth;
      const point = worldToCanvas(worldX, heightValue);
      if (first) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y);
    });
    ctx.strokeStyle = "#918765";
    ctx.lineWidth = 2;
    ctx.stroke();
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
    const layers = location === "earth" ? 3 : location === "cave" ? 1 : 2;
    ctx.save();
    for (let layer = 0; layer < layers; layer += 1) {
      const baseline = height * (.65 + layer * .07);
      const amplitude = height * (.07 + layer * .025);
      ctx.globalAlpha = .16 - layer * .035;
      ctx.fillStyle = location === "earth" ? ["#202b2d", "#293337", "#3a4140"][layer] : location === "mars" ? ["#432a26", "#5a3930"][layer] : location === "cave" ? "#141612" : ["#292d31", "#3b3d40"][layer];
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

  function forEachVisibleTerrainSample(values, callback) {
    const metrics = canvasMetrics();
    const bounds = currentViewBounds();
    const lastIndex = values.length - 1;
    const worldWidth = gameState.settings.worldWidth;
    const startIndex = Math.max(0, Math.floor(bounds.minX / worldWidth * lastIndex) - 2);
    const endIndex = Math.min(lastIndex, Math.ceil(bounds.maxX / worldWidth * lastIndex) + 2);
    const targetPoints = Math.max(320, Math.ceil(metrics.width * 1.25));
    const step = Math.max(1, Math.ceil((endIndex - startIndex) / targetPoints));
    let first = true;
    let finalIndex = startIndex;

    for (let index = startIndex; index <= endIndex; index += step) {
      callback(values[index], index, first);
      first = false;
      finalIndex = index;
    }
    if (finalIndex !== endIndex) callback(values[endIndex], endIndex, false);
  }

  function terrainSurfacePath() {
    ctx.beginPath();
    forEachVisibleTerrainSample(gameState.terrain, (heightValue, index, first) => {
      const worldX = index / (gameState.terrain.length - 1) * gameState.settings.worldWidth;
      const point = worldToCanvas(worldX, heightValue);
      if (first) ctx.moveTo(point.x, point.y);
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
      space: ["#5f565c", "#393139", "#1b171d"],
      cave: ["#5c5846", "#353329", "#171814"]
    }[location];

    const gradient = ctx.createLinearGradient(0, metrics.height * .38, 0, metrics.height);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(.34, colors[1]);
    gradient.addColorStop(1, colors[2]);

    ctx.beginPath();
    ctx.moveTo(0, metrics.height);
    forEachVisibleTerrainSample(gameState.terrain, (heightValue, index) => {
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
    forEachVisibleTerrainSample(gameState.terrain, (heightValue, index) => {
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
    ctx.strokeStyle = location === "earth" ? "#74745b" : location === "mars" ? "#9a6447" : location === "cave" ? "#817a5d" : "#999a94";
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

  function firingVisualForTank(team, now) {
    if (!animation || animation.packet?.shooter !== team) {
      const liveLocalAngle = team === localTeam() && canLocalAct() ? Number(dom.angleInput.value) : NaN;
      return {
        angle: Number.isFinite(liveLocalAngle) ? liveLocalAngle : gameState.tanks[team].angle,
        offsetX: 0,
        offsetY: 0,
        shake: 0
      };
    }
    const packet = animation.packet;
    if (animation.phase === "aim") {
      const p = clamp((now - animation.phaseStart) / animation.aimDuration, 0, 1);
      const eased = p < .5 ? 2 * p * p : 1 - ((-2 * p + 2) ** 2) / 2;
      return { angle: animation.fromAngle + (packet.angle - animation.fromAngle) * eased, offsetX: 0, offsetY: 0, shake: 0 };
    }
    if (animation.phase === "recoil") {
      const p = clamp((now - animation.phaseStart) / animation.recoilDuration, 0, 1);
      const worldAngle = worldAngleForTeam(team, packet.angle) * Math.PI / 180;
      const kick = Math.sin(Math.PI * p) * Math.max(2.2, tankWorldWidth() * canvasMetrics().sx * .075);
      const shake = (1 - p) * Math.sin(p * 18) * .55;
      return {
        angle: packet.angle,
        offsetX: -Math.cos(worldAngle) * kick + shake,
        offsetY: Math.sin(worldAngle) * kick + shake * .28,
        shake
      };
    }
    return { angle: packet.angle, offsetX: 0, offsetY: 0, shake: 0 };
  }

  function drawTank(team, now) {
    const tank = gameState.tanks[team];
    const displayX = displayTankX(team, now);
    const ground = terrainAt(displayX);
    const baseGroundPoint = worldToCanvas(displayX, ground);
    const firingVisual = firingVisualForTank(team, now);
    const groundPoint = {
      x: baseGroundPoint.x + firingVisual.offsetX,
      y: baseGroundPoint.y + firingVisual.offsetY
    };
    const metrics = canvasMetrics();
    const bodyWidth = Math.max(0.45, tankWorldWidth() * metrics.sx);
    const bodyHeight = Math.max(0.28, tankWorldHeight() * metrics.sy);
    const slope = terrainSlopeAt(displayX);
    const bodyAngle = clamp(-Math.atan(slope * metrics.sy / metrics.sx), -1.08, 1.08);
    const accent = team === "blue" ? "#176fa8" : "#a72d31";
    const accentLight = team === "blue" ? "#55a9d8" : "#e05a5d";
    const accentDark = team === "blue" ? "#123b55" : "#561b1d";
    const steel = "#434840";
    const steelLight = "#666b61";
    const steelDark = "#1e221f";
    const detail = bodyWidth >= 9 && bodyHeight >= 4;
    const fineDetail = bodyWidth >= 18 && bodyHeight >= 8;
    const movementProgress = movementAnimation && movementAnimation.team === team
      ? clamp((now - movementAnimation.start) / movementAnimation.duration, 0, 1)
      : 0;
    const rollDirection = movementAnimation && movementAnimation.team === team
      ? Math.sign(movementAnimation.toX - movementAnimation.fromX)
      : 0;
    const rollPhase = movementProgress * Math.PI * 8 * rollDirection;

    const center = { x: displayX, y: terrainAt(displayX) + tankWorldHeight() * .80 };
    const baseTurretPoint = worldToCanvas(center.x, center.y);
    const turretPoint = {
      x: baseTurretPoint.x + firingVisual.offsetX,
      y: baseTurretPoint.y + firingVisual.offsetY
    };
    const barrelAngle = -(worldAngleForTeam(team, firingVisual.angle) * Math.PI / 180);
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
        ctx.save();
        ctx.translate(wheelX, wheelY);
        ctx.rotate(rollPhase + i * .35);
        ctx.strokeStyle = "rgba(206,210,196,.42)";
        ctx.lineWidth = Math.max(.35, bodyHeight * .022);
        ctx.beginPath();
        ctx.moveTo(-wheelRadius * .72, 0);
        ctx.lineTo(wheelRadius * .72, 0);
        ctx.moveTo(0, -wheelRadius * .72);
        ctx.lineTo(0, wheelRadius * .72);
        ctx.stroke();
        ctx.restore();
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
    hull.addColorStop(0, accentLight);
    hull.addColorStop(.34, accent);
    hull.addColorStop(.72, accentDark);
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
    ctx.globalAlpha = .92;
    ctx.strokeStyle = accentLight;
    ctx.lineWidth = Math.max(.65, bodyHeight * .045);
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
    turretGradient.addColorStop(0, accentLight);
    turretGradient.addColorStop(.48, accent);
    turretGradient.addColorStop(1, accentDark);
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
    if (!tank.alive) drawDestroyedTank(turretPoint.x, turretPoint.y, bodyWidth, bodyHeight, now);
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

  function drawDestroyedTank(x, y, bodyWidth, bodyHeight, now) {
    const scale = Math.max(0.7, Math.min(2.2, bodyWidth / 28));
    ctx.save();

    // Charred metal and soot remain over the original vehicle silhouette.
    ctx.globalAlpha = .58;
    ctx.fillStyle = "#090b0a";
    ctx.beginPath();
    ctx.ellipse(x, y + bodyHeight * .18, Math.max(7, bodyWidth * .42), Math.max(3, bodyHeight * .34), -.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = .82;
    ctx.strokeStyle = "#0b0d0c";
    ctx.lineWidth = Math.max(1.2, bodyHeight * .12);
    ctx.beginPath();
    ctx.moveTo(x - bodyWidth * .32, y + bodyHeight * .12);
    ctx.lineTo(x + bodyWidth * .28, y - bodyHeight * .11);
    ctx.moveTo(x - bodyWidth * .20, y - bodyHeight * .18);
    ctx.lineTo(x + bodyWidth * .35, y + bodyHeight * .18);
    ctx.stroke();

    // Dense black smoke plume. It is deliberately static while the turn is idle.
    const smokeSeed = Math.floor(now / 900);
    const random = mulberry32((gameState?.seed || 1) ^ smokeSeed ^ Math.round(x * 97));
    for (let i = 0; i < 8; i += 1) {
      const rise = i * (7 + scale * 2.5);
      const drift = Math.sin(i * 1.7 + x * .03) * (3 + i * .8) + (random() - .5) * 4;
      const radius = (5 + i * 1.7) * scale;
      ctx.globalAlpha = Math.max(.12, .72 - i * .07);
      ctx.fillStyle = i < 3 ? "#050606" : "#111414";
      ctx.beginPath();
      ctx.arc(x + drift, y - bodyHeight * .65 - rise, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Surrender flag, sized to remain visible even when tanks are tiny.
    const poleX = x + Math.max(8, bodyWidth * .33);
    const poleBottom = y - bodyHeight * .05;
    const poleTop = poleBottom - Math.max(32, bodyHeight * 3.2);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#d7d4c9";
    ctx.lineWidth = Math.max(1.2, bodyHeight * .08);
    ctx.beginPath();
    ctx.moveTo(poleX, poleBottom);
    ctx.lineTo(poleX, poleTop);
    ctx.stroke();
    const flagW = Math.max(15, bodyWidth * .48);
    const flagH = Math.max(9, bodyHeight * .72);
    ctx.fillStyle = "#f1efe7";
    ctx.strokeStyle = "#a8a69f";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(poleX, poleTop);
    ctx.lineTo(poleX + flagW, poleTop + flagH * .18);
    ctx.lineTo(poleX + flagW * .78, poleTop + flagH);
    ctx.lineTo(poleX, poleTop + flagH * .78);
    ctx.closePath();
    ctx.fill();
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
    const origin = muzzlePosition(gameState, team, angle);
    const radians = worldAngleForTeam(team, angle) * Math.PI / 180;
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
      if (x < 0 || x > gameState.settings.worldWidth || y <= terrainAt(x) || (gameState.ceiling && y >= ceilingAt(x))) break;
      const point = worldToCanvas(x, y);
      ctx.globalAlpha = 1 - i / 12;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFiringSequenceLabel(packet, text, progress = 1) {
    const tank = gameState.tanks[packet.shooter];
    const center = worldToCanvas(tank.x, terrainAt(tank.x) + tankWorldHeight() * 2.45);
    const alpha = Math.sin(Math.PI * clamp(progress, .08, .92));
    ctx.save();
    ctx.globalAlpha = .35 + alpha * .65;
    ctx.font = `900 ${Math.max(10, Math.min(18, dom.canvas.width / 70))}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const width = ctx.measureText(text).width + 20;
    ctx.fillStyle = "rgba(8,13,22,.84)";
    roundedRect(ctx, center.x - width / 2, center.y - 15, width, 30, 5);
    ctx.fill();
    ctx.strokeStyle = packet.shooter === "blue" ? "rgba(79,164,255,.85)" : "rgba(255,92,99,.85)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = "#f3f6fb";
    ctx.fillText(text, center.x, center.y + 1);
    ctx.restore();
  }

  function drawMuzzleFlash(packet, progress) {
    if (progress > .46) return;
    const muzzle = muzzlePosition(gameState, packet.shooter, packet.angle);
    const p = worldToCanvas(muzzle.x, muzzle.y);
    const worldAngle = worldAngleForTeam(packet.shooter, packet.angle) * Math.PI / 180;
    const forwardX = Math.cos(worldAngle);
    const forwardY = -Math.sin(worldAngle);
    const intensity = 1 - progress / .46;
    ctx.save();
    ctx.globalAlpha = .35 + intensity * .45;
    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 10 + 13 * intensity);
    glow.addColorStop(0, "rgba(255,244,190,.88)");
    glow.addColorStop(.4, "rgba(238,139,52,.55)");
    glow.addColorStop(1, "rgba(180,72,24,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 11 + 13 * intensity, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(242,167,70,.72)";
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + forwardX * (22 + 18 * intensity) + forwardY * 5, p.y + forwardY * (22 + 18 * intensity) - forwardX * 5);
    ctx.lineTo(p.x + forwardX * (34 + 22 * intensity), p.y + forwardY * (34 + 22 * intensity));
    ctx.lineTo(p.x + forwardX * (22 + 18 * intensity) - forwardY * 5, p.y + forwardY * (22 + 18 * intensity) + forwardX * 5);
    ctx.closePath();
    ctx.fill();

    const smokeProgress = clamp(progress / .46, 0, 1);
    ctx.globalAlpha = .24 * (1 - smokeProgress);
    ctx.fillStyle = "#a7aaa3";
    for (let i = 0; i < 4; i += 1) {
      const drift = 9 + i * 7 + smokeProgress * 14;
      ctx.beginPath();
      ctx.arc(
        p.x + forwardX * drift + forwardY * (i - 1.5) * 3,
        p.y + forwardY * drift - forwardX * (i - 1.5) * 3 - smokeProgress * 5,
        3 + i * 1.15 + smokeProgress * 3,
        0, Math.PI * 2
      );
      ctx.fill();
    }
    ctx.restore();
  }

  function drawProjectileAnimation(now) {
    if (!animation) return;
    const packet = animation.packet;

    if (animation.phase === "aim") {
      const progress = clamp((now - animation.phaseStart) / animation.aimDuration, 0, 1);
      if (progress >= 1) {
        gameState.tanks[packet.shooter].angle = packet.angle;
        animation.phase = "charge";
        animation.phaseStart = now;
        if (!animation.powerSoundPlayed && Math.abs(packet.power - animation.fromPower) > 0.5) {
          animation.powerSoundPlayed = true;
          playPowerSetSound(animation.chargeDuration, packet.power - animation.fromPower);
        }
      }
      return;
    }

    if (animation.phase === "charge") {
      const progress = clamp((now - animation.phaseStart) / animation.chargeDuration, 0, 1);
      if (progress >= 1) {
        gameState.tanks[packet.shooter].power = packet.power;
        animation.phase = "recoil";
        animation.phaseStart = now;
        if (!animation.fireSoundPlayed) {
          animation.fireSoundPlayed = true;
          playFireSound();
        }
      }
      return;
    }

    if (animation.phase === "recoil") {
      const progress = clamp((now - animation.phaseStart) / animation.recoilDuration, 0, 1);
      drawMuzzleFlash(packet, progress);
      if (progress >= 1) beginTravelPhase(now);
      return;
    }

    const elapsed = now - animation.start;
    if (animation.phase === "travel") {
      const rawProgress = clamp(elapsed / animation.travelDuration, 0, 1);
      const progress = packet.deployRequested ? Math.min(rawProgress, .96) : rawProgress;
      const exactIndex = progress * (packet.trajectory.length - 1);
      const index = Math.floor(exactIndex);
      const nextIndex = Math.min(index + 1, packet.trajectory.length - 1);
      const blend = exactIndex - index;
      const a = packet.trajectory[index];
      const b = packet.trajectory[nextIndex];
      const x = a.x + (b.x - a.x) * blend;
      const y = a.y + (b.y - a.y) * blend;
      drawProjectileTrail(packet.trajectory, index);
      const parachuteOpen = packet.weapon === "parachute" && packet.parachuteDeployed && index >= (packet.parachuteDeployIndex || 0);
      drawProjectile(x, y, packet, parachuteOpen);

      if (progress >= 1) {
        animation.phase = "explosion";
        animation.explosionStart = now;
        if (packet.impact && packet.impact.type !== "out") {
          playExplosionSound(Boolean(packet.hitTeam || packet.hitTeams?.length));
        }
      }
    } else {
      const explosionProgress = clamp((now - animation.explosionStart) / animation.explosionDuration, 0, 1);
      if (packet.impact && packet.impact.type !== "out") drawExplosion(packet.impact.x, packet.impact.y, explosionProgress, packet);
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

  function drawProjectile(x, y, packet, parachuteOpen = false) {
    const p = worldToCanvas(x, y);
    const team = packet.shooter;
    const scale = packet.weapon === "bigBertha" ? 2.35 : packet.doubleStrike ? 2 : 1;
    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 18 * scale);
    glow.addColorStop(0, "rgba(255,255,255,1)");
    glow.addColorStop(.24, team === "blue" ? "rgba(79,164,255,.95)" : "rgba(255,92,99,.95)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 18 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = packet.weapon === "bigBertha" ? "#322c25" : "white";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4.3 * scale, 0, Math.PI * 2);
    ctx.fill();

    if (parachuteOpen) {
      ctx.save();
      ctx.strokeStyle = "rgba(230,220,190,.92)";
      ctx.fillStyle = team === "blue" ? "rgba(45,88,130,.95)" : "rgba(132,48,50,.95)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(p.x - 3, p.y - 3);
      ctx.lineTo(p.x - 12, p.y - 24);
      ctx.moveTo(p.x + 3, p.y - 3);
      ctx.lineTo(p.x + 12, p.y - 24);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(p.x, p.y - 24, 13, Math.PI, 0);
      ctx.lineTo(p.x + 13, p.y - 24);
      ctx.quadraticCurveTo(p.x, p.y - 15, p.x - 13, p.y - 24);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawExplosion(x, y, progress, packet) {
    const p = worldToCanvas(x, y);
    const hitTeam = packet.hitTeam || packet.hitTeams?.[0];
    const radiusWorldPx = Math.max(35, packet.blastRadius * activeCanvasMetrics.sx);
    const radius = (12 + Math.sin(progress * Math.PI) * radiusWorldPx);
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

    const particleCount = packet.weapon === "bigBertha" ? 80 : packet.doubleStrike ? 42 : 24;
    const particleScale = packet.weapon === "bigBertha" ? 4 : packet.doubleStrike ? 2 : 1;
    const random = mulberry32((gameState.shotNumber + 1) * 1299709);
    for (let i = 0; i < particleCount; i += 1) {
      const angle = random() * Math.PI * 2;
      const distance = progress * (30 + random() * 90) * particleScale;
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

    // The right-hand cockpit is an accordion for detailed windows. This keeps
    // every button readable without allowing panels to overlap or leave the viewport.
    if (!collapsed && panel.parentElement === dom.sideColumn && panel.dataset.panel !== "chat") {
      dom.sideColumn.querySelectorAll(".collapsible-panel").forEach(other => {
        if (other !== panel && other.dataset.panel !== "chat") setPanelCollapsed(other, true);
      });
    }
    setPanelCollapsed(panel, collapsed);
    markCanvasResize();
  }

  function setPanelCollapsed(panel, collapsed) {
    if (!panel) return;
    panel.classList.toggle("collapsed", collapsed);
    const button = panel.querySelector(".collapse-button");
    if (button) {
      button.textContent = collapsed ? "+" : "−";
      const name = panel.dataset.panel || "panel";
      button.title = collapsed ? "Expand panel" : "Collapse panel";
      button.setAttribute("aria-label", `${collapsed ? "Expand" : "Collapse"} ${name}`);
      button.setAttribute("aria-expanded", String(!collapsed));
    }
    if (panel.dataset.panel === "armoury") dom.armouryToolButton?.classList.toggle("active", !collapsed);
    if (panel.dataset.panel === "battlefield") dom.worldToolButton?.classList.toggle("active", !collapsed);
  }

  function prepareGameplayPanels() {
    if (!dom.sideColumn) return;
    const armoury = dom.sideColumn.querySelector('[data-panel="armoury"]');
    dom.sideColumn.querySelectorAll(".collapsible-panel").forEach(panel => {
      delete panel.dataset.autoPrepared;
      if (panel.dataset.panel === "armoury") setPanelCollapsed(panel, false);
      else if (panel.dataset.panel === "chat") setPanelCollapsed(panel, window.innerWidth <= 720);
      else setPanelCollapsed(panel, true);
    });
    armoury?.classList.remove("mobile-open");
    dom.armouryToolButton?.classList.toggle("active", Boolean(armoury && !armoury.classList.contains("collapsed")));
  }

  function fitPanelsToViewport() {
    if (dom.gameScreen.classList.contains("hidden")) return;
    const short = window.innerHeight < 760;
    const narrow = window.innerWidth < 1050;
    document.querySelectorAll(".collapsible-panel").forEach(panel => {
      if (!panel.dataset.autoPrepared) {
        panel.dataset.autoPrepared = "true";
        if (panel.dataset.panel === "log" || panel.dataset.panel === "telemetry" || panel.dataset.panel === "battlefield") setPanelCollapsed(panel, true);
        if (panel.dataset.panel === "armoury") setPanelCollapsed(panel, false);
        if ((short || narrow) && panel.dataset.panel === "chat") setPanelCollapsed(panel, true);
      }
    });
  }

  function toggleArmouryPanel() {
    const panel = dom.sideColumn.querySelector('[data-panel="armoury"]');
    if (!panel) return;
    const opening = panel.classList.contains("collapsed");
    if (window.innerWidth <= 720) {
      panel.classList.toggle("mobile-open", opening);
      const chat = dom.sideColumn.querySelector('[data-panel="chat"]');
      if (opening && chat) setPanelCollapsed(chat, true);
    }
    togglePanel(panel, !opening);
    dom.armouryToolButton.classList.toggle("active", opening);
  }

  function toggleBattlefieldPanel() {
    const panel = dom.sideColumn.querySelector('[data-panel="battlefield"]');
    if (!panel) return;
    if (window.innerWidth <= 720) {
      const opening = !panel.classList.contains("mobile-open");
      panel.classList.toggle("mobile-open", opening);
      togglePanel(panel, !opening);
      dom.worldToolButton.classList.toggle("active", opening);
      return;
    }
    togglePanel(panel);
    dom.worldToolButton.classList.toggle("active", !panel.classList.contains("collapsed"));
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    dom.soundButton.classList.toggle("active", soundEnabled);
    dom.soundButton.textContent = soundEnabled ? "♪" : "×";
    if (soundEnabled) playButtonClickSound(dom.soundButton);
  }

  function updateDoubleStrikeButton() {
    dom.doubleStrikeButton.classList.toggle("active", doubleStrikeSelected);
    dom.doubleStrikeButton.setAttribute("aria-pressed", String(doubleStrikeSelected));
    dom.doubleStrikeButton.querySelector("span").innerHTML = doubleStrikeSelected ? "DOUBLE<br>ARMED" : "DOUBLE<br>STRIKE";
  }

  function toggleDoubleStrike() {
    if (!canLocalAct() || selectedWeapon !== "standard") return;
    doubleStrikeSelected = !doubleStrikeSelected;
    updateDoubleStrikeButton();
  }

  function updateAimOutputs() {
    dom.angleOutput.textContent = formatAimAngle(dom.angleInput.value);
    dom.powerOutput.textContent = dom.powerInput.value;
    requestRender();
  }

  function nudgeAimControl(input, delta) {
    if (!input || input.disabled) return;
    const min = Number(input.min);
    const max = Number(input.max);
    input.value = String(clamp(Number(input.value) + delta, min, max));
    updateAimOutputs();
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
  dom.angleDecreaseButton.addEventListener("click", () => nudgeAimControl(dom.angleInput, -1));
  dom.angleIncreaseButton.addEventListener("click", () => nudgeAimControl(dom.angleInput, 1));
  dom.powerInput.addEventListener("input", updateAimOutputs);
  dom.powerDecreaseButton.addEventListener("click", () => nudgeAimControl(dom.powerInput, -1));
  dom.powerIncreaseButton.addEventListener("click", () => nudgeAimControl(dom.powerInput, 1));
  dom.fireButton.addEventListener("click", requestFire);
  dom.doubleStrikeButton.addEventListener("click", toggleDoubleStrike);
  dom.standardWeaponButton.addEventListener("click", () => armWeapon("standard"));
  dom.parachuteWeaponButton.addEventListener("click", () => requestArmouryItem("parachute"));
  dom.berthaWeaponButton.addEventListener("click", () => requestArmouryItem("bigBertha"));
  dom.teleportWeaponButton.addEventListener("click", () => requestArmouryItem("teleport"));
  dom.engineUpgradeButton.addEventListener("click", () => requestArmouryItem("engine"));
  dom.repairKitButton.addEventListener("click", () => requestArmouryItem("repair"));
  dom.chatForm.addEventListener("submit", submitChat);
  dom.soundButton.addEventListener("click", toggleSound);
  dom.armouryToolButton.addEventListener("click", toggleArmouryPanel);
  dom.worldToolButton.addEventListener("click", toggleBattlefieldPanel);
  dom.locatorButton.addEventListener("click", toggleInspectionMode);
  dom.fullscreenButton.addEventListener("click", toggleFullscreen);
  dom.restartRoundButton.addEventListener("click", () => requestRoundAction("restart"));
  dom.regenerateMapButton.addEventListener("click", () => requestRoundAction("regenerate"));
  dom.gameLocationSelect.addEventListener("change", updateGameControls);
  dom.changeWorldButton.addEventListener("click", requestWorldChange);
  dom.replayRequestButton.addEventListener("click", () => requestRoundAction("replay"));
  dom.roundOverReplayButton.addEventListener("click", () => requestRoundAction("replay"));
  dom.returnMenuButton.addEventListener("click", returnToMenuPreservingSession);
  dom.modalCloseButton.addEventListener("click", closeCanvasModal);
  dom.purchaseConfirmButton.addEventListener("click", closeCanvasModal);
  dom.replayAcceptButton.addEventListener("click", acceptActionRequest);
  dom.replayDeclineButton.addEventListener("click", declineActionRequest);
  dom.leaveGameButton.addEventListener("click", returnToMenuPreservingSession);
  dom.resumeBattleButton.addEventListener("click", () => {
    if (!gameState) return;
    setScreen("game");
    setConnectionStatus(role === "bot" ? "Computer opponent" : "Connected directly", "online");
    updateGameUI(true);
  });
  dom.disconnectSessionButton.addEventListener("click", resetAll);
  document.addEventListener("keydown", keyboardControls);
  document.addEventListener("fullscreenchange", updateFullscreenButton);
  document.addEventListener("pointerdown", ensureAudio, { once: true });
  document.addEventListener("pointerdown", event => {
    const button = event.target.closest("button");
    if (button) playButtonClickSound(button);
  }, true);
  dom.canvas.addEventListener("pointerdown", handleCanvasPointerDown);
  dom.canvas.addEventListener("pointermove", handleCanvasPointerMove);
  dom.canvas.addEventListener("pointerup", handleCanvasPointerUp);
  dom.canvas.addEventListener("pointercancel", handleCanvasPointerUp);
  dom.canvas.addEventListener("wheel", handleCanvasWheel, { passive: false });
  document.querySelectorAll(".collapse-button").forEach(button => {
    button.addEventListener("click", () => {
      const panel = button.closest(".collapsible-panel");
      togglePanel(panel);
      if (panel?.dataset.panel === "armoury") dom.armouryToolButton.classList.toggle("active", !panel.classList.contains("collapsed"));
      if (panel?.dataset.panel === "battlefield") dom.worldToolButton.classList.toggle("active", !panel.classList.contains("collapsed"));
    });
  });
  const canvasResizeObserver = typeof ResizeObserver === "function"
    ? new ResizeObserver(() => {
        markCanvasResize();
        fitPanelsToViewport();
      })
    : null;
  canvasResizeObserver?.observe(dom.canvasFrame);

  window.addEventListener("resize", () => {
    markCanvasResize();
    fitPanelsToViewport();
  });
  document.addEventListener("visibilitychange", () => {
    const now = performance.now();
    if (document.hidden) {
      hiddenAt = now;
      clearScheduledRender();
      if (botTimer) {
        clearTimeout(botTimer);
        botTimer = null;
      }
      return;
    }

    if (hiddenAt !== null) {
      const pausedFor = now - hiddenAt;
      if (animation) {
        animation.start += pausedFor;
        if (animation.phaseStart) animation.phaseStart += pausedFor;
        if (animation.explosionStart) animation.explosionStart += pausedFor;
      }
      if (movementAnimation) movementAnimation.start += pausedFor;
      hiddenAt = null;
    }
    markCanvasResize();
    if (role === "bot" && gameState?.turn === "red" && !gameState.winner && !animation) scheduleBotTurn();
  });
  window.addEventListener("beforeunload", safelyDestroyPeer);

  updateSettingOutputs();
  setScreen("home");
})();
