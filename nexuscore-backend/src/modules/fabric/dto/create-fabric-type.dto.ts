import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateFabricTypeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  weightGsm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  waterPerMeter?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  carbonFactor?: number;
}
