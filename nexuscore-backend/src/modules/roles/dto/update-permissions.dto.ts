import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class UpdateRolePermissionsDto {
  @ApiProperty({ type: [String], description: 'Full list of permission IDs to assign' })
  @IsArray()
  @IsString({ each: true })
  permissionIds: string[];
}
