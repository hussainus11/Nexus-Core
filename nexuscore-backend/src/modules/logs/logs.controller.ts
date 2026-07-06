import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LogsService } from './logs.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Logs')
@Controller('logs')
export class LogsController {
  constructor(private readonly svc: LogsService) {}

  @Get('login-history/me')
  @ApiOperation({ summary: 'Get own login history' })
  getMyHistory(@CurrentUser() u: any, @Query('limit') limit?: string) {
    return this.svc.getLoginHistory(u.id, u.companyId, limit ? +limit : 50);
  }

  @Get('login-history')
  @ApiOperation({ summary: 'Get company login history' })
  getCompanyHistory(@CurrentUser() u: any, @Query('limit') limit?: string) {
    return this.svc.getCompanyLoginHistory(u.companyId, limit ? +limit : 200);
  }

  @Get('exceptions')
  @ApiOperation({ summary: 'Get exception logs' })
  getExceptions(@CurrentUser() u: any, @Query('limit') limit?: string) {
    return this.svc.getExceptionLogs(u.companyId, limit ? +limit : 100);
  }

  @Post('exceptions')
  createException(@Body() dto: any, @CurrentUser() u: any) {
    return this.svc.createExceptionLog(dto, u.companyId);
  }

  @Delete('exceptions/clear')
  clearExceptions(@CurrentUser() u: any) {
    return this.svc.clearExceptionLogs(u.companyId);
  }
}
