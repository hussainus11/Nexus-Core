import { Module } from '@nestjs/common';
import { DocketManagementService } from './docket-management.service';
import { DocketManagementController } from './docket-management.controller';
import { DocketsService } from './dockets.service';
import { DocketsController } from './dockets.controller';
import { SharingService } from './sharing.service';
import { SharingController } from './sharing.controller';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  // SharingController is listed first so its static-segment routes
  // (e.g. GET dockets/external-reviews, DELETE dockets/share-links/:linkId)
  // are registered before the dynamic GET dockets/:id route in DocketsController.
  controllers: [
    SharingController,
    DocketManagementController,
    DocketsController,
    ReportsController,
  ],
  providers: [
    DocketManagementService,
    DocketsService,
    SharingService,
    ReportsService,
  ],
})
export class DocketManagementModule {}
