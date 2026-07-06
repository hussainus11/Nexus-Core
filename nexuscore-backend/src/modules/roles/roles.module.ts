import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController, PermissionsController, PermissionSettingsController } from './roles.controller';

@Module({
  controllers: [RolesController, PermissionsController, PermissionSettingsController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
