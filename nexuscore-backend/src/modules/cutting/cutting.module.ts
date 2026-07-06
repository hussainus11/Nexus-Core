import { Module } from '@nestjs/common';
import { CuttingService } from './cutting.service';
import { CuttingController } from './cutting.controller';

@Module({
  controllers: [CuttingController],
  providers: [CuttingService],
  exports: [CuttingService],
})
export class CuttingModule {}
