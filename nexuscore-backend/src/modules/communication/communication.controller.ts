import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommunicationService } from './communication.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Communication')
@Controller('communication')
export class CommunicationController {
  constructor(private readonly svc: CommunicationService) {}

  // Chats
  @Get('chats')
  @ApiOperation({ summary: 'Get user chats' })
  getChats(@CurrentUser() u: any) { return this.svc.getChats(u.id, u.companyId); }

  @Get('chats/:id')
  getChat(@Param('id') id: string, @CurrentUser() u: any) { return this.svc.getChat(id, u.companyId); }

  @Post('chats')
  @ApiOperation({ summary: 'Create chat' })
  createChat(@Body() dto: any, @CurrentUser() u: any) { return this.svc.createChat(dto, u.id, u.companyId, u.branchId); }

  @Get('chats/:id/messages')
  getChatMessages(@Param('id') id: string, @Query('skip') skip?: string, @Query('take') take?: string) {
    return this.svc.getChatMessages(id, skip ? +skip : 0, take ? +take : 50);
  }

  @Post('chats/:id/messages')
  sendMessage(@Param('id') id: string, @Body() dto: any, @CurrentUser() u: any) {
    return this.svc.sendMessage(id, dto, u.id);
  }

  @Delete('messages/:id')
  deleteMessage(@Param('id') id: string) { return this.svc.deleteMessage(id); }

  // Mail
  @Get('mails')
  getMails(@CurrentUser() u: any, @Query('folder') folder?: string) {
    return this.svc.getMails(u.id, u.companyId, folder);
  }

  @Get('mails/:id')
  getMail(@Param('id') id: string, @CurrentUser() u: any) { return this.svc.getMail(id, u.id); }

  @Post('mails')
  createMail(@Body() dto: any, @CurrentUser() u: any) { return this.svc.createMail(dto, u.id, u.companyId); }

  @Patch('mails/:id')
  updateMail(@Param('id') id: string, @Body() dto: any) { return this.svc.updateMail(id, dto); }

  @Delete('mails/:id')
  deleteMail(@Param('id') id: string) { return this.svc.deleteMail(id); }

  // SMTP Settings
  @Get('smtp')
  getSmtp(@CurrentUser() u: any) { return this.svc.getSmtpSettings(u.companyId); }

  @Post('smtp')
  createSmtp(@Body() dto: any, @CurrentUser() u: any) { return this.svc.createSmtpSetting(dto, u.companyId); }

  @Patch('smtp/:id')
  updateSmtp(@Param('id') id: string, @Body() dto: any) { return this.svc.updateSmtpSetting(id, dto); }

  @Delete('smtp/:id')
  deleteSmtp(@Param('id') id: string) { return this.svc.deleteSmtpSetting(id); }

  // Email Templates
  @Get('email-templates')
  getEmailTemplates(@CurrentUser() u: any, @Query('category') category?: string) {
    return this.svc.getEmailTemplates(u.companyId, u.branchId, category);
  }

  @Post('email-templates')
  createEmailTemplate(@Body() dto: any, @CurrentUser() u: any) { return this.svc.createEmailTemplate(dto, u.companyId, u.branchId); }

  @Patch('email-templates/:id')
  updateEmailTemplate(@Param('id') id: string, @Body() dto: any) { return this.svc.updateEmailTemplate(id, dto); }

  @Delete('email-templates/:id')
  deleteEmailTemplate(@Param('id') id: string) { return this.svc.deleteEmailTemplate(id); }

  // Email Notifications
  @Get('email-notifications')
  getEmailNotifications(@CurrentUser() u: any) { return this.svc.getEmailNotifications(u.companyId); }

  @Post('email-notifications')
  createEmailNotification(@Body() dto: any, @CurrentUser() u: any) { return this.svc.createEmailNotification(dto, u.companyId); }

  @Patch('email-notifications/:id')
  updateEmailNotification(@Param('id') id: string, @Body() dto: any) { return this.svc.updateEmailNotification(id, dto); }

  // Email Signatures
  @Get('email-signatures')
  getEmailSignatures(@CurrentUser() u: any) { return this.svc.getEmailSignatures(u.id, u.companyId); }

  @Post('email-signatures')
  createEmailSignature(@Body() dto: any, @CurrentUser() u: any) { return this.svc.createEmailSignature(dto, u.id, u.companyId); }

  @Patch('email-signatures/:id')
  updateEmailSignature(@Param('id') id: string, @Body() dto: any) { return this.svc.updateEmailSignature(id, dto); }

  @Delete('email-signatures/:id')
  deleteEmailSignature(@Param('id') id: string) { return this.svc.deleteEmailSignature(id); }
}
