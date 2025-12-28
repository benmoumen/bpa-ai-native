import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import type { AuthUser } from '@bpa/types';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = module.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('getMe', () => {
    it('should return the authenticated user', () => {
      const mockUser: AuthUser = {
        sub: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        roles: ['user'],
        countryCode: 'US',
      };

      const result = appController.getMe(mockUser);

      expect(result).toEqual(mockUser);
      expect(result.sub).toBe('user-123');
      expect(result.email).toBe('test@example.com');
    });

    it('should return user with admin roles', () => {
      const adminUser: AuthUser = {
        sub: 'admin-456',
        email: 'admin@example.com',
        name: 'Admin User',
        roles: ['admin', 'user'],
        countryCode: 'SV',
      };

      const result = appController.getMe(adminUser);

      expect(result.roles).toContain('admin');
      expect(result.countryCode).toBe('SV');
    });
  });
});
