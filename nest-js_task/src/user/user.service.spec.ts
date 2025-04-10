import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;
  let jwt: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
    jwt = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const email = 'test@example.com';
      const password = 'password';
      const hashedPassword = 'hashed';
      const user = {
        id: '1',
        email,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(jest.fn(() => Promise.resolve('hashedPassword')));
      jest.spyOn(prisma.user, 'create').mockResolvedValue({
        id: '1',
        email,
        password: hashedPassword,
        biometricKey: 'bio123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.register(email, password);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { email, password: hashedPassword },
        select: { id: true, email: true, createdAt: true, updatedAt: true },
      });
      expect(result).toEqual(user);
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      const email = 'test@example.com';
      const password = 'password';
      const hashedPassword = 'hashed';
      const user = {
        id: '1',
        email,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const token = 'token';
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: '1',
        email,
        password: hashedPassword,
        biometricKey: 'bio123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(jest.fn(() => Promise.resolve(true)));
      jest.spyOn(jwt, 'sign').mockImplementation(jest.fn(() => token));

      const result = await service.login(email, password);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email } });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(jwt.sign).toHaveBeenCalledWith({ email, sub: user.id });
      expect(result).toEqual({
        token,
        user: {
          id: user.id,
          email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    });

    it('should throw an error if user not found', async () => {
      jest
        .spyOn(prisma.user, 'findUnique')
        .mockImplementation(jest.fn(() => Promise.resolve(null)));
      await expect(
        service.login('test@example.com', 'password'),
      ).rejects.toThrow('User not found');
    });

    it('should throw an error if password is invalid', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest
        .spyOn(prisma.user, 'findUnique')
        .mockImplementation(jest.fn(() => Promise.resolve(user)));
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(jest.fn(() => Promise.resolve(false)));
      await expect(
        service.login('test@example.com', 'password'),
      ).rejects.toThrow('Invalid password');
    });
  });
});
