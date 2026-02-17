import { IsJWT, IsNotEmpty, IsString } from 'class-validator';


export class RenewTokenDto {
  @IsString()
  @IsNotEmpty()
  @IsJWT()
  token: string;

  @IsString()
  @IsNotEmpty()
  @IsJWT()
  refreshToken: string;

}
