"use strict";

// Require Third-party Dependencies
const THREE = require("three");
window.THREE = THREE;
require("three/examples/js/controls/OrbitControls");

// Require Internal Dependencies
const GameRenderer = require("./class/GameRenderer.js");
const Scene = require("./class/Scene");
const Actor = require("./class/Actor");
const grpc = require("./grpc.js");

// Require Behaviors
const PlayerBehavior = require("./behaviors/PlayerBehavior");
const FogBehavior = require("./behaviors/FogBehavior");
const GridBehavior = require("./behaviors/GridBehavior");

async function start(server, name) {
  const grpcClient = grpc.createClient(server);
  grpcClient.connect({ name }, function(err) {
    if (err) {
      // TODO: retry connection ?
    }

    const gameDataStream = grpcClient.gameData({});
    initializeGameRenderer(gameDataStream);

    // setInterval(() => {
    //   gameDataStream.write({ type: "player-moved", data: JSON.stringify({ x: 1, z: 2 }) });
    // }, 1000);
  });
}

function initializeGameRenderer(gameDataStream) {
  const game = new GameRenderer();
  window.game = game;

  // Initialize Camera & Controls
  const Player = new Actor("Player");
  Player.addScriptedBehavior(new PlayerBehavior());

  const currentScene = new Scene();
  currentScene.add(Player);
  currentScene.scene.background = new THREE.Color(0xf0f0f0);

  const mask = [
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    0,
    1,
    1,
    0,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    0,
    1,
    1
  ];
  let plane = FogBehavior.createOrUpdate(mask);
  currentScene.add(plane);

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
  camera.name = "Camera";
  camera.position.set(50, 50, 0);

  camera.lookAt(Player.threeObject.position);
  game.init(currentScene, camera);
  gameDataStream.on("data", (data) => {
    const parsedData = JSON.parse(data.data);
    console.log("received data from server", parsedData);
    game.emit("server-data", data.type, parsedData);
  });

  const offsetCam = new THREE.Vector3(0).add(camera.position).sub(Player.threeObject.position);

  GridBehavior.generateGrid(10, 10, currentScene.scene);

  game.on("update", () => {
    if (game.input.wasMouseButtonJustReleased(0)) {
      currentScene.scene.remove(plane);
      plane = FogBehavior.createOrUpdate(mask);
      currentScene.add(plane);
      //mySound.play();
    }

    const playerPos = Player.threeObject.position;
    const playerAngleY = Player.threeObject.rotation.y;
    const newPos = new THREE.Vector3(0).add(playerPos).add(offsetCam);
    camera.position.set(newPos.x, newPos.y, newPos.z);
    camera.lookAt(Player.threeObject.position);
  });

  return game;
}

module.exports = {
  start
};
