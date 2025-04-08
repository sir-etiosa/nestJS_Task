import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { ConfigModule } from '@nestjs/config';

interface RegisterResponse {
  data: {
    register: {
      id: string;
      email: string;
      createdAt: string;
      updatedAt: string;
    };
  };
}

interface LoginResponse {
  data: {
    login: {
      token: string;
      user: {
        id: string;
        email: string;
        createdAt: string;
        updatedAt: string;
      };
    };
  };
}

interface ErrorResponse {
  errors: Array<{
    message: string;
    extensions?: Record<string, any>;
  }>;
}

interface GraphQLResponse {
  body: RegisterResponse | LoginResponse | ErrorResponse;
}

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  beforeEach(async () => {
    // Clean up the database before each test
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('Register', () => {
    it('should register a new user', () => {
      const registerMutation = {
        query: `mutation Register($email: String!, $password: String!, $biometricKey: String) {
          register(email: $email, password: $password, biometricKey: $biometricKey) {
            id
            email
            createdAt
            updatedAt
          }
        }`,
        variables: {
          email: 'test@example.com',
          password: 'password123',
          biometricKey: 'optionalBiometricKey',
        },
      };

      return request(app.getHttpServer())
        .post('/graphql')
        .send(registerMutation)
        .expect(200)
        .expect((res: GraphQLResponse) => {
          expect('errors' in res.body).toBeFalsy();
          const response = res.body as RegisterResponse;
          expect(response.data.register).toHaveProperty('id');
          expect(response.data.register).toHaveProperty(
            'email',
            'test@example.com',
          );
          expect(response.data.register).toHaveProperty('createdAt');
          expect(response.data.register).toHaveProperty('updatedAt');
        });
    });

    it('should not register a user with existing email', async () => {
      // First create a user
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: await bcrypt.hash('password123', 10),
        },
      });

      const registerMutation = {
        query: `mutation Register($email: String!, $password: String!, $biometricKey: String) {
          register(email: $email, password: $password, biometricKey: $biometricKey) {
            id
            email
            createdAt
            updatedAt
          }
        }`,
        variables: {
          email: 'test@example.com',
          password: 'password123',
          biometricKey: 'optionalBiometricKey',
        },
      };

      return request(app.getHttpServer())
        .post('/graphql')
        .send(registerMutation)
        .expect(200)
        .expect((res: GraphQLResponse) => {
          const response = res.body as ErrorResponse;
          expect('errors' in response).toBeTruthy();
          expect(response.errors[0].message).toContain(
            'Unique constraint failed',
          );
        });
    });
  });

  describe('Login', () => {
    beforeEach(async () => {
      // Create a test user before each login test
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: await bcrypt.hash('password123', 10),
        },
      });
    });

    it('should login with valid credentials', () => {
      const loginMutation = {
        query: `mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password) {
            token
            user {
              id
              email
              createdAt
              updatedAt
            }
          }
        }`,
        variables: {
          email: 'test@example.com',
          password: 'password123',
        },
      };

      return request(app.getHttpServer())
        .post('/graphql')
        .send(loginMutation)
        .expect(200)
        .expect((res: GraphQLResponse) => {
          expect('errors' in res.body).toBeFalsy();
          const response = res.body as LoginResponse;
          expect(response.data.login).toHaveProperty('token');
          expect(response.data.login.user).toHaveProperty(
            'email',
            'test@example.com',
          );
        });
    });

    it('should not login with invalid credentials', () => {
      const loginMutation = {
        query: `mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password) {
            token
            user {
              id
              email
              createdAt
              updatedAt
            }
          }
        }`,
        variables: {
          email: 'test@example.com',
          password: 'wrongpassword',
        },
      };

      return request(app.getHttpServer())
        .post('/graphql')
        .send(loginMutation)
        .expect(200)
        .expect((res: GraphQLResponse) => {
          const response = res.body as ErrorResponse;
          expect('errors' in response).toBeTruthy();
          expect(response.errors[0].message).toBe('Invalid password');
        });
    });
  });
});
