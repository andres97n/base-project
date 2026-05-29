import { ApiProperty } from '@nestjs/swagger';

/**
 * Pagination metadata returned under `meta` for offset-paginated endpoints.
 * Mirrors `SuccessMeta` from src/common/interfaces.
 */
export class PaginationMetaDto {
  @ApiProperty({ example: 42, description: 'Total matching records.' })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page (1-indexed).' })
  page: number;

  @ApiProperty({ example: 10, description: 'Records per page.' })
  limit: number;

  @ApiProperty({ example: 5, description: 'Total number of pages.' })
  totalPages: number;
}
