import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateCostDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  fabricCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  laborCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  machineCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  wastageCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  overheadPct?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;
}
