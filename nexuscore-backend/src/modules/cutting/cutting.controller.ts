import {
  Body, Controller, Delete, Get, Param, Patch, Post, Put, Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CuttingService } from './cutting.service';
import { CreateCuttingOrderDto } from './dto/create-cutting-order.dto';
import { AddRollDto } from './dto/add-roll.dto';
import { AddLineDto } from './dto/add-line.dto';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateMarkerPlanDto } from './dto/update-marker-plan.dto';
import { UpdateCostDto } from './dto/update-cost.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Cutting Orders')
@Controller('cutting-orders')
export class CuttingController {
  constructor(private readonly cuttingService: CuttingService) {}

  @Post()
  @ApiOperation({ summary: 'Create cutting order' })
  create(@Body() dto: CreateCuttingOrderDto, @CurrentUser('id') actorId: string) {
    return this.cuttingService.create(dto, actorId);
  }

  @Get()
  @ApiOperation({ summary: 'List cutting orders' })
  findAll(
    @Query('branchId') branchId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.cuttingService.findAll(branchId, status, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cutting order by ID' })
  findOne(@Param('id') id: string) {
    return this.cuttingService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update cutting order' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateCuttingOrderDto>, @CurrentUser('id') actorId: string) {
    return this.cuttingService.update(id, dto, actorId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete cutting order' })
  remove(@Param('id') id: string) {
    return this.cuttingService.remove(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Change order status' })
  changeStatus(@Param('id') id: string, @Body('status') status: string, @CurrentUser('id') actorId: string) {
    return this.cuttingService.changeStatus(id, status, actorId);
  }

  @Post(':id/submit-approval')
  @ApiOperation({ summary: 'Submit order for approval' })
  submitApproval(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    return this.cuttingService.submitApproval(id, actorId);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve cutting order' })
  approve(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    return this.cuttingService.approve(id, actorId);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject cutting order' })
  reject(@Param('id') id: string, @CurrentUser('id') actorId: string, @Body('reason') reason: string) {
    return this.cuttingService.reject(id, actorId, reason);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete cutting order' })
  complete(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    return this.cuttingService.complete(id, actorId);
  }

  @Get(':id/qr')
  @ApiOperation({ summary: 'Get QR code for cutting order' })
  getQr(@Param('id') id: string) {
    return this.cuttingService.getQr(id);
  }

  @Get(':id/audit-trail')
  @ApiOperation({ summary: 'Get audit trail for cutting order' })
  getAuditTrail(@Param('id') id: string) {
    return this.cuttingService.getAuditTrail(id);
  }

  // ── Rolls
  @Post(':id/rolls')
  addRoll(@Param('id') id: string, @Body() dto: AddRollDto) {
    return this.cuttingService.addRoll(id, dto);
  }

  @Get(':id/rolls')
  getRolls(@Param('id') id: string) {
    return this.cuttingService.getRolls(id);
  }

  @Delete(':id/rolls/:rollId')
  removeRoll(@Param('id') id: string, @Param('rollId') rollId: string) {
    return this.cuttingService.removeRoll(id, rollId);
  }

  // ── Lines
  @Post(':id/lines')
  addLine(@Param('id') id: string, @Body() dto: AddLineDto) {
    return this.cuttingService.addLine(id, dto);
  }

  @Get(':id/lines')
  getLines(@Param('id') id: string) {
    return this.cuttingService.getLines(id);
  }

  @Delete(':id/lines/:lineId')
  removeLine(@Param('id') id: string, @Param('lineId') lineId: string) {
    return this.cuttingService.removeLine(id, lineId);
  }

  // ── Batches
  @Post(':id/batches')
  createBatch(@Param('id') id: string, @Body() dto: CreateBatchDto) {
    return this.cuttingService.createBatch(id, dto);
  }

  @Get(':id/batches')
  getBatches(@Param('id') id: string) {
    return this.cuttingService.getBatches(id);
  }

  @Patch(':id/batches/:bId/start')
  startBatch(@Param('id') id: string, @Param('bId') bId: string) {
    return this.cuttingService.startBatch(id, bId);
  }

  @Patch(':id/batches/:bId/complete')
  completeBatch(
    @Param('id') id: string,
    @Param('bId') bId: string,
    @Body('actualPieces') actualPieces: number,
    @Body('defectPieces') defectPieces: number,
    @Body('notes') notes?: string,
  ) {
    return this.cuttingService.completeBatch(id, bId, actualPieces, defectPieces, notes);
  }

  // ── Marker Plan
  @Get(':id/marker-plan')
  getMarkerPlan(@Param('id') id: string) {
    return this.cuttingService.getMarkerPlan(id);
  }

  @Put(':id/marker-plan')
  upsertMarkerPlan(@Param('id') id: string, @Body() dto: UpdateMarkerPlanDto, @CurrentUser('id') actorId: string) {
    return this.cuttingService.upsertMarkerPlan(id, dto, actorId);
  }

  // ── Cost
  @Get(':id/cost')
  getCost(@Param('id') id: string) {
    return this.cuttingService.getCost(id);
  }

  @Put(':id/cost')
  upsertCost(@Param('id') id: string, @Body() dto: UpdateCostDto) {
    return this.cuttingService.upsertCost(id, dto);
  }

  // ── Documents
  @Get(':id/documents')
  getDocuments(@Param('id') id: string) {
    return this.cuttingService.getDocuments(id);
  }

  @Post(':id/documents')
  addDocument(@Param('id') id: string, @Body() body: any, @CurrentUser('id') actorId: string) {
    return this.cuttingService.addDocument(id, body, actorId);
  }

  @Delete(':id/documents/:docId')
  removeDocument(@Param('id') id: string, @Param('docId') docId: string) {
    return this.cuttingService.removeDocument(id, docId);
  }

  // ── Approval History
  @Get(':id/approval-history')
  getApprovalHistory(@Param('id') id: string) {
    return this.cuttingService.getApprovalHistory(id);
  }
}
