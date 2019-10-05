"use strict";

const path = require("path");

const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");

const protoPath = path.join(__dirname, "../../protos/game.proto");

const packageDefinition = protoLoader.loadSync(protoPath, {
  keepCase: true,
  enums: String,
  defaults: true,
  oneofs: true
});

const proto = grpc.loadPackageDefinition(packageDefinition).exluminous;

function sayHello(call, callback) {
  callback(null, { message: `Hello ${call.request.name}` });
}

const address = "0.0.0.0:50051";

const server = new grpc.Server();
server.addService(proto.Test.service, { sayHello });
server.bind(address, grpc.ServerCredentials.createInsecure());
server.start();
console.log(`Server listening on ${address}`);
