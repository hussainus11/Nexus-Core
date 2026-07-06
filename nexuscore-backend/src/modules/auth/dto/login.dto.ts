import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@nexuscore.io' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  // Optional geolocation / device fields forwarded by the frontend
  @ApiPropertyOptional() @IsOptional() @IsNumber() latitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() longitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() region?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() country?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() timezone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() device?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() browser?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() os?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() userAgent?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ipAddress?: string;
}
