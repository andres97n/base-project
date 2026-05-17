import { IsOptional, IsString } from 'class-validator';

import { PaginationDto } from 'src/common/dto';


export class FindUsersDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search: string = '';
}
