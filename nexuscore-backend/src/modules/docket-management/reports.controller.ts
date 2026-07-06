import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Docket Reports')
@Controller('docket-reports')
export class ReportsController {
  constructor(private readonly svc: ReportsService) {}

  @Get('completeness')
  completeness(@CurrentUser() u: any, @Query() q: any) {
    return this.svc.completenessReport(u.branchId, q);
  }

  @Get('missing-documents')
  missingDocuments(@CurrentUser() u: any, @Query() q: any) {
    return this.svc.missingDocumentsReport(u.branchId, q);
  }

  @Get('approval-status')
  approvalStatus(@CurrentUser() u: any, @Query() q: any) {
    return this.svc.approvalStatusReport(u.branchId, q);
  }

  @Get('version-history')
  versionHistory(@CurrentUser() u: any, @Query() q: any) {
    return this.svc.versionHistoryReport(u.branchId, q);
  }

  @Get('buyer-access-log')
  buyerAccessLog(@CurrentUser() u: any, @Query() q: any) {
    return this.svc.buyerAccessLogReport(u.branchId, q);
  }

  @Get('document-expiry')
  documentExpiry(@CurrentUser() u: any, @Query() q: any) {
    return this.svc.documentExpiryReport(u.branchId, q);
  }
}
