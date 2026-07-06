import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AddRollDto {
  @ApiProperty()
  @IsString()
  fabricRollId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  metersAllocated: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  rollSequence: number;
}
