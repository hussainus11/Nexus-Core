import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateBatchDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  batchNumber: number;

  @ApiProperty()
  @IsString()
  cutterId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  machineId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shiftId?: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  plannedPieces: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
