import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

// Load test environment variables
const result = dotenv.config({ path: '.env.test' });
if (result.error) {
  throw new Error('Error loading test environment variables');
}

const prisma = new PrismaClient();

beforeAll(async () => {
  try {
    // Reset database
    execSync('npx prisma migrate reset --force');
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});
