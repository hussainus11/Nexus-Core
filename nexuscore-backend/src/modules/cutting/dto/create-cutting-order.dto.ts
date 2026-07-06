import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCuttingOrderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @ApiPropertyOptional({ enum: ['manual', 'sales_order', 'production_plan'] })
  @IsOptional()
  @IsIn(['manual', 'sales_order', 'production_plan'])
  triggeredBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  salesOrderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shiftId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
