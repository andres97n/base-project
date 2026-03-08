import { IsJWT, IsNotEmpty, IsString } from 'class-validator';


export class CheckStatusTokenDto {
  @IsString()
  @IsNotEmpty()
  @IsJWT()
  token: string;
}
