import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import {
  API_SUB_PATH,
  DEFAULT_APP_VERSION,
  DEFAULT_PREFFIX_VERSION,
} from '../src/common/constants';

describe('HealthController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix(API_SUB_PATH);
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: DEFAULT_APP_VERSION,
      prefix: DEFAULT_PREFFIX_VERSION,
    });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api/v1/health (GET)', () => {
    return request(app.getHttpServer()).get('/api/v1/health').expect(200);
  });
});
