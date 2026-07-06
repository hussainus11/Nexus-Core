export enum CuttingEvent {
  ORDER_CREATED = 'nexuscore.cutting.order.created',
  ORDER_STATUS_CHANGED = 'nexuscore.cutting.order.status_changed',
  ORDER_SUBMITTED = 'nexuscore.cutting.order.submitted',
  ORDER_APPROVED = 'nexuscore.cutting.order.approved',
  ORDER_REJECTED = 'nexuscore.cutting.order.rejected',
  ORDER_COMPLETED = 'nexuscore.cutting.order.completed',
  BATCH_STARTED = 'nexuscore.cutting.batch.started',
  BATCH_COMPLETED = 'nexuscore.cutting.batch.completed',
  HIGH_WASTAGE = 'nexuscore.cutting.high_wastage',
  DEFECT_THRESHOLD = 'nexuscore.cutting.defect_threshold',
}
