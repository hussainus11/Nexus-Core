import { Module } from '@nestjs/common';
import { StyleExtrasService } from './style-extras.service';
import { StyleExtrasController } from './style-extras.controller';

@Module({
  controllers: [StyleExtrasController],
  providers: [StyleExtrasService],
  exports: [StyleExtrasService],
})
export class StyleExtrasModule {}
