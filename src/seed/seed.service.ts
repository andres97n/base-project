import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ResourceNotFoundException } from 'src/common/exceptions';
import { UserRepository } from 'src/modules/auth/repositories';
import { UserRoles } from 'src/modules/auth/enums';
import { User } from 'src/modules/auth/entities';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {}

  async seedAdmin(): Promise<void> {
    const email = this.configService.get<string>('SEED_ADMIN_EMAIL');
    const password = this.configService.get<string>('SEED_ADMIN_PASSWORD');
    const fullName =
      this.configService.get<string>('SEED_ADMIN_FULL_NAME') ?? 'Admin';

    if (!email || !password) {
      this.logger.warn(
        'SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are not set — skipping admin seed.',
      );
      return;
    }

    try {
      await this.userRepository.findByEmail(email);
      this.logger.log(`Admin user ${email} already exists — skipping.`);
    } catch (err) {
      if (!(err instanceof ResourceNotFoundException)) throw err;

      await this.userRepository.create({
        email,
        password,
        fullName,
        roles: [UserRoles.ADMIN],
      } as Partial<User>);

      this.logger.log(`Admin user ${email} created successfully.`);
    }
  }
}
