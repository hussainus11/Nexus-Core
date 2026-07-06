import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AddLineDto {
  @ApiProperty()
  @IsString()
  pieceName: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  lengthCm: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  widthCm: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ enum: ['inventory', 'production'] })
  @IsOptional()
  @IsIn(['inventory', 'production'])
  destination?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  destinationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sequence?: number;
}
