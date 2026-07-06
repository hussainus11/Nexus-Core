import { Module } from '@nestjs/common';
import { BpmService } from './bpm.service';
import { BpmController } from './bpm.controller';

@Module({
  controllers: [BpmController],
  providers: [BpmService],
  exports: [BpmService],
})
export class BpmModule {}
