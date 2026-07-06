import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendWhatsappMessageDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({ description: 'Recipient phone in E.164 format (e.g. +923001234567)' })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message: string;
}
