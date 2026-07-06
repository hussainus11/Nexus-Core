import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { UserSettingsService } from './user-settings.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('User Settings')
@Controller('settings')
export class UserSettingsController {
  constructor(private readonly svc: UserSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user settings' })
  getSettings(@CurrentUser() u: any) { return this.svc.getSettings(u.id); }

  @Get('notifications')
  getNotificationPrefs(@CurrentUser() u: any) { return this.svc.getNotificationPreferences(u.id); }

  @Get(':userId')
  @ApiOperation({ summary: 'Get settings by user ID' })
  getSettingsById(@Param('userId') userId: string) { return this.svc.getSettings(userId); }

  @Patch()
  @ApiOperation({ summary: 'Update user settings' })
  updateSettings(@Body() dto: any, @CurrentUser() u: any) { return this.svc.updateSettings(u.id, dto); }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  updateProfile(@Body() dto: any, @CurrentUser() u: any) { return this.svc.updateProfile(u.id, dto); }

  @Public()
  @Post('password-reset/request')
  @ApiOperation({ summary: 'Request password reset' })
  requestReset(@Body() dto: { email: string }) { return this.svc.createPasswordResetToken(dto.email); }

  @Public()
  @Post('password-reset/consume')
  @ApiOperation({ summary: 'Consume password reset token' })
  consumeReset(@Body() dto: { token: string; newPassword: string }) {
    return this.svc.consumePasswordResetToken(dto.token, dto.newPassword);
  }
}
