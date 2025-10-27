// src/database/prisma.js - PrismaClient singleton
import { PrismaClient } from '../generated/prisma/index.js';

let prisma;

if (!global.__PRISMA__) {
  global.__PRISMA__ = new PrismaClient();
}

prisma = global.__PRISMA__;

export default prisma;
