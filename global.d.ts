// global.d.ts
import { MongoClient } from "mongodb";
import { Server as IOServer } from "socket.io";
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  var _io: IOServer | undefined;
}

export {};
