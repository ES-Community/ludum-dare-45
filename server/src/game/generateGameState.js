"use strict";

const { MAP_SIZE_X, MAP_SIZE_Z, INIT_SHADOW_COUNT, INIT_GRASS_COUNT } = require("../config");
const Grass = require("../behaviors/Grass");
const Shadow = require("../behaviors/Shadow");
const { randomPosition } = require("../utils/random");

function generateGameState() {
  return {
    gameTicks: 0,
    mapSize: {
      x: MAP_SIZE_X,
      z: MAP_SIZE_Z
    },
    gameStep: 1,
    shadows: generateShadows(),
    orbs: [],
    grass: generateGrass()
  };
}

function generateShadows() {
  const shadows = [];
  for (let i = 0; i < INIT_SHADOW_COUNT; i++) {
    const shadow = new Shadow(randomPosition());

    while (coordinatesAreUsed(shadow, shadows)) {
      shadow.position = randomPosition();
    }

    shadows.push(shadow);
  }
  return shadows;
}

function generateGrass() {
  const grasses = [];
  for (let i = 0; i < INIT_GRASS_COUNT; i++) {
    const grass = new Grass(randomPosition());

    while (coordinatesAreUsed(grass, grasses)) {
      grass.position = randomPosition();
    }

    grasses.push(grass);
  }
  return grasses;
}

function coordinatesAreUsed(object, objects) {
  for (const other of objects) {
    if (object.isTouching(other)) {
      return true;
    }
  }
  return false;
}

module.exports = generateGameState;
