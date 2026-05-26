import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

import { SettingRepository } from '../repositories';
import { Setting } from '../schemas';

@Injectable()
export class SettingService implements OnModuleInit {
  private readonly CACHE_PREFIX = 'setting:';

  constructor(
    private readonly settingRepository: SettingRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async onModuleInit() {
    await this.preloadCache();
  }

  private async preloadCache(): Promise<void> {
    const { data } = await this.settingRepository.getInitialSettings();

    for (const setting of data) {
      await this.cacheManager.set(
        `${this.CACHE_PREFIX}${setting.key}`,
        setting.value,
      );
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    const cacheKey = `${this.CACHE_PREFIX}${key}`;

    const cached = await this.cacheManager.get<T>(cacheKey);
    if (cached !== undefined && cached !== null) return cached;

    const setting = await this.settingRepository.findOne({ key });
    if (!setting) return null;

    await this.cacheManager.set(cacheKey, setting.value);
    return setting.value as T;
  }

  async set(key: string, value: any, description?: string): Promise<Setting> {
    const updated = await this.settingRepository.update(
      { key },
      { value, description },
      { upsert: true, new: true },
    );

    await this.cacheManager.del(`${this.CACHE_PREFIX}${key}`);
    await this.cacheManager.set(`${this.CACHE_PREFIX}${key}`, value);

    return updated;
  }

  async delete(key: string): Promise<void> {
    await this.settingRepository.remove({ key });
    await this.cacheManager.del(`${this.CACHE_PREFIX}${key}`);
  }
}
