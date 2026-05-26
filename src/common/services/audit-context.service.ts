import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class AuditContextService {
  constructor(private readonly cls: ClsService) {}

  getUserId(): string | null {
    return this.cls.get<string | null>('userId') ?? null;
  }
}
