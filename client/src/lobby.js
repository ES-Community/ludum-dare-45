"use strict";

// Require Node.js Dependencies
const { join } = require("path");
const { spawn } = require("child_process");
const { hostname } = require("os");

// Require Third-party Dependencies
const { remote, shell } = require("electron");
const isDev = require("electron-is-dev");
const { get } = require("httpie");
const { lookup } = require("dns").promises;

const grpc = require("../src/grpc");

// Variables & Loaders
let isServerStarted = false;
let connectTriggered = false;
let errorTriggered = null;

async function createGameServer() {
  const playerName = document.getElementById("nickname").value.trim();
  if (playerName === "") {
    return showError("<p>player name <b>must not</b> be empty!</p>");
  }
  sessionStorage.setItem("cachedPlayerName", playerName);

  if (isServerStarted) {
    return;
  }
  isServerStarted = true;

  const currentWindow = remote.getCurrentWindow();
  const serverPath = join(__dirname, isDev ? "../.." : "..", "server", "src", "server.js");

  const cp = spawn(isDev ? "node" : process.execPath, [serverPath], { stdio: ["ignore", "pipe", "pipe", "ipc"] });
  const stopServerBtn = setupServerInfo(cp);

  const closeWin = () => {
    cp.kill();
    isServerStarted = false;
  };
  currentWindow.on("close", closeWin);

  let gameWindow = new remote.BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true
    }
  });

  gameWindow.setFullScreen(true);

  cp.on("exit", () => {
    isServerStarted = false;
    if (gameWindow !== null && !gameWindow.isDestroyed()) {
      gameWindow.close();
    }
    currentWindow.removeListener("close", closeWin);
  });

  const stopServer = () => {
    gameWindow.close();
  };
  stopServerBtn.addEventListener("click", stopServer);
  gameWindow.on("closed", () => {
    cp.kill();
    isServerStarted = false;
    gameWindow = null;
    stopServerBtn.removeEventListener("click", stopServer);
  });

  gameWindow.webContents.openDevTools();
  gameWindow.loadURL(`file://${__dirname}/game.html?server=127.0.0.1&name=${playerName}`);
}

function setupServerInfo(cp) {
  const mainElement = document.getElementById("main");
  const serverInfoElement = document.getElementById("server-info");
  const serverInfoPlayersElement = document.getElementById("server-info-players");
  const serverInfoTimeElement = document.getElementById("server-info-time");
  const stopServerBtn = document.getElementById("stop-server");

  lookup(hostname(), "ipv4")
    .then((ip) => {
      console.log(ip);
      document.getElementById("ip-ipv4").innerHTML = `<b>local</b> ${ip.address}`;
    })
    .catch(console.error);

  get("https://api.ipify.org/?format=json")
    .then(({ data }) => {
      document.getElementById("ip-internet").innerHTML = `<b>ip</b> ${data.ip}`;
    })
    .catch(console.error);

  mainElement.style.display = "none";
  serverInfoElement.style.display = "flex";

  const exitListener = () => {
    cp.kill();
    mainElement.style.display = "flex";
    serverInfoElement.style.display = "none";
  };
  stopServerBtn.addEventListener("click", exitListener);

  // cp.stdout.on("data", (d) => console.log(d.toString()));
  cp.stderr.on("data", (d) => console.error(d.toString()));

  cp.on("message", (msg) => {
    serverInfoPlayersElement.innerHTML = "";
    for (const player of msg.players) {
      const li = document.createElement("li");
      li.innerText = `${player.name} (${player.ip})`;
      serverInfoPlayersElement.appendChild(li);
    }
    serverInfoTimeElement.innerText = `${Math.round(msg.time)} seconds (${msg.ticks} ticks) | ${msg.tps} TPS`;
  });

  cp.on("exit", () => {
    mainElement.style.display = "flex";
    serverInfoElement.style.display = "none";
    stopServerBtn.removeEventListener("click", exitListener);
  });

  return stopServerBtn;
}

function connectPlayerToServer() {
  if (connectTriggered) {
    return;
  }

  event.preventDefault();
  const playerName = document.getElementById("nickname").value.trim();
  if (playerName === "") {
    return showError("<p>player name <b>must not</b> be empty!</p>");
  }
  const submitBtn = document.getElementById("join-submit");
  submitBtn.disabled = true;
  connectTriggered = true;

  // Retrieve ip in form
  const ipInputElement = document.getElementById("ip-to-join");
  let ipValue = ipInputElement.value.trim();
  if (ipValue === "") {
    ipValue = "127.0.0.1";
  }

  if (errorTriggered) {
    hideError();
  }

  const client = grpc.createClient(ipValue);
  client.connect({ name: playerName }, function(err) {
    if (err) {
      showError(`<p>Connection to <b>${ipValue}</b> failed!</p>`);
      submitBtn.disabled = false;
      connectTriggered = false;
    } else {
      sessionStorage.setItem("cachedPlayerName", playerName);

      const currentWindow = remote.getCurrentWindow();
      currentWindow.loadURL(`file://${__dirname}/game.html?server=${ipValue}&name=${playerName}`);
    }
  });
}

function showError(content = "") {
  if (errorTriggered !== null) {
    clearTimeout(errorTriggered);
  }
  const error = document.querySelector(".error");
  error.classList.remove("hide");
  error.innerHTML = content;
  errorTriggered = setTimeout(hideError, 5000);
}

function hideError() {
  const error = document.querySelector(".error");

  error.classList.add("hide");
  errorTriggered = null;
}

document.addEventListener("DOMContentLoaded", () => {
  const localName = sessionStorage.getItem("cachedPlayerName");
  if (localName !== null) {
    const nickNameInput = document.getElementById("nickname");
    nickNameInput.value = localName;
  }

  const githubIcon = document.getElementById("github-icon");
  githubIcon.addEventListener("click", () => {
    shell.openExternal("https://github.com/ES-Community/ludum-dare-45");
  });

  document.getElementById("host-game").addEventListener("click", createGameServer);
  document.getElementById("join-game").addEventListener("submit", connectPlayerToServer);
});
