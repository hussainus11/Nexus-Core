import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class MoveStageDto {
  @ApiProperty()
  @IsString()
  toStageId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}
