import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type Scope = { companyId: string; branchId?: string };

@Injectable()
export class LookupService {
  constructor(private readonly prisma: PrismaService) {}

  private scope(companyId: string, branchId?: string) {
    return { companyId, ...(branchId ? { branchId } : {}) };
  }

  // Generic CRUD helpers
  private async list(model: string, companyId: string, branchId?: string, extra?: any) {
    return (this.prisma as any)[model].findMany({
      where: { ...this.scope(companyId, branchId), ...extra },
      orderBy: { order: 'asc' },
    });
  }

  private async create(model: string, dto: any, companyId: string, branchId?: string) {
    return (this.prisma as any)[model].create({
      data: { ...dto, ...this.scope(companyId, branchId) },
    });
  }

  private async update(model: string, id: string, dto: any) {
    return (this.prisma as any)[model].update({ where: { id }, data: dto });
  }

  private async remove(model: string, id: string) {
    return (this.prisma as any)[model].delete({ where: { id } });
  }

  // ── Lead Stages ────────────────────────────────────────────────────────────
  getLeadStages(s: Scope) { return this.list('leadStage', s.companyId, s.branchId); }
  createLeadStage(dto: any, s: Scope) { return this.create('leadStage', dto, s.companyId, s.branchId); }
  updateLeadStage(id: string, dto: any) { return this.update('leadStage', id, dto); }
  deleteLeadStage(id: string) { return this.remove('leadStage', id); }

  // ── Document Stages ────────────────────────────────────────────────────────
  getDocumentStages(s: Scope) { return this.list('documentStage', s.companyId, s.branchId); }
  createDocumentStage(dto: any, s: Scope) { return this.create('documentStage', dto, s.companyId, s.branchId); }
  updateDocumentStage(id: string, dto: any) { return this.update('documentStage', id, dto); }
  deleteDocumentStage(id: string) { return this.remove('documentStage', id); }

  // ── Invoice Stages ─────────────────────────────────────────────────────────
  getInvoiceStages(s: Scope) { return this.list('invoiceStage', s.companyId, s.branchId); }
  createInvoiceStage(dto: any, s: Scope) { return this.create('invoiceStage', dto, s.companyId, s.branchId); }
  updateInvoiceStage(id: string, dto: any) { return this.update('invoiceStage', id, dto); }
  deleteInvoiceStage(id: string) { return this.remove('invoiceStage', id); }

  // ── Estimate Stages ────────────────────────────────────────────────────────
  getEstimateStages(s: Scope) { return this.list('estimateStage', s.companyId, s.branchId); }
  createEstimateStage(dto: any, s: Scope) { return this.create('estimateStage', dto, s.companyId, s.branchId); }
  updateEstimateStage(id: string, dto: any) { return this.update('estimateStage', id, dto); }
  deleteEstimateStage(id: string) { return this.remove('estimateStage', id); }

  // ── Sources ────────────────────────────────────────────────────────────────
  getSources(s: Scope) { return this.list('source', s.companyId, s.branchId); }
  createSource(dto: any, s: Scope) { return this.create('source', dto, s.companyId, s.branchId); }
  updateSource(id: string, dto: any) { return this.update('source', id, dto); }
  deleteSource(id: string) { return this.remove('source', id); }

  // ── Contact Types ──────────────────────────────────────────────────────────
  getContactTypes(s: Scope) { return this.list('contactType', s.companyId, s.branchId); }
  createContactType(dto: any, s: Scope) { return this.create('contactType', dto, s.companyId, s.branchId); }
  updateContactType(id: string, dto: any) { return this.update('contactType', id, dto); }
  deleteContactType(id: string) { return this.remove('contactType', id); }

  // ── Salutations ────────────────────────────────────────────────────────────
  getSalutations(s: Scope) { return this.list('salutation', s.companyId, s.branchId); }
  createSalutation(dto: any, s: Scope) { return this.create('salutation', dto, s.companyId, s.branchId); }
  updateSalutation(id: string, dto: any) { return this.update('salutation', id, dto); }
  deleteSalutation(id: string) { return this.remove('salutation', id); }

  // ── Call Statuses ──────────────────────────────────────────────────────────
  getCallStatuses(s: Scope) { return this.list('callStatus', s.companyId, s.branchId); }
  createCallStatus(dto: any, s: Scope) { return this.create('callStatus', dto, s.companyId, s.branchId); }
  updateCallStatus(id: string, dto: any) { return this.update('callStatus', id, dto); }
  deleteCallStatus(id: string) { return this.remove('callStatus', id); }

  // ── Company Types ──────────────────────────────────────────────────────────
  getCompanyTypes(s: Scope) { return this.list('companyType', s.companyId, s.branchId); }
  createCompanyType(dto: any, s: Scope) { return this.create('companyType', dto, s.companyId, s.branchId); }
  updateCompanyType(id: string, dto: any) { return this.update('companyType', id, dto); }
  deleteCompanyType(id: string) { return this.remove('companyType', id); }

  // ── Employees ──────────────────────────────────────────────────────────────
  getEmployees(s: Scope) { return this.list('employee', s.companyId, s.branchId); }
  createEmployee(dto: any, s: Scope) { return this.create('employee', dto, s.companyId, s.branchId); }
  updateEmployee(id: string, dto: any) { return this.update('employee', id, dto); }
  deleteEmployee(id: string) { return this.remove('employee', id); }

  // ── Industries ─────────────────────────────────────────────────────────────
  getIndustries(s: Scope) { return this.list('industry', s.companyId, s.branchId); }
  createIndustry(dto: any, s: Scope) { return this.create('industry', dto, s.companyId, s.branchId); }
  updateIndustry(id: string, dto: any) { return this.update('industry', id, dto); }
  deleteIndustry(id: string) { return this.remove('industry', id); }

  // ── Deal Types ─────────────────────────────────────────────────────────────
  getDealTypes(s: Scope) { return this.list('dealType', s.companyId, s.branchId); }
  createDealType(dto: any, s: Scope) { return this.create('dealType', dto, s.companyId, s.branchId); }
  updateDealType(id: string, dto: any) { return this.update('dealType', id, dto); }
  deleteDealType(id: string) { return this.remove('dealType', id); }

  // ── Currencies ─────────────────────────────────────────────────────────────
  getCurrencies(s: Scope) {
    return this.prisma.currency.findMany({ where: this.scope(s.companyId, s.branchId), orderBy: { code: 'asc' } });
  }
  createCurrency(dto: any, s: Scope) { return this.create('currency', dto, s.companyId, s.branchId); }
  updateCurrency(id: string, dto: any) { return this.update('currency', id, dto); }
  deleteCurrency(id: string) { return this.remove('currency', id); }

  // ── Locations ──────────────────────────────────────────────────────────────
  getLocations(s: Scope) {
    return this.prisma.location.findMany({ where: this.scope(s.companyId, s.branchId), orderBy: { name: 'asc' } });
  }
  createLocation(dto: any, s: Scope) { return this.create('location', dto, s.companyId, s.branchId); }
  updateLocation(id: string, dto: any) { return this.update('location', id, dto); }
  deleteLocation(id: string) { return this.remove('location', id); }

  // ── Taxes ──────────────────────────────────────────────────────────────────
  getTaxes(s: Scope) {
    return this.prisma.tax.findMany({ where: this.scope(s.companyId, s.branchId), orderBy: { name: 'asc' } });
  }
  createTax(dto: any, s: Scope) { return this.create('tax', dto, s.companyId, s.branchId); }
  updateTax(id: string, dto: any) { return this.update('tax', id, dto); }
  deleteTax(id: string) { return this.remove('tax', id); }

  // ── Units of Measurement ───────────────────────────────────────────────────
  getUnits(s: Scope) {
    return this.prisma.unitOfMeasurement.findMany({ where: this.scope(s.companyId, s.branchId), orderBy: { name: 'asc' } });
  }
  createUnit(dto: any, s: Scope) { return this.create('unitOfMeasurement', dto, s.companyId, s.branchId); }
  updateUnit(id: string, dto: any) { return this.update('unitOfMeasurement', id, dto); }
  deleteUnit(id: string) { return this.remove('unitOfMeasurement', id); }

  // ── Product Properties ─────────────────────────────────────────────────────
  getProductProperties(s: Scope) {
    return this.prisma.productProperty.findMany({ where: this.scope(s.companyId, s.branchId), orderBy: { name: 'asc' } });
  }
  createProductProperty(dto: any, s: Scope) { return this.create('productProperty', dto, s.companyId, s.branchId); }
  updateProductProperty(id: string, dto: any) { return this.update('productProperty', id, dto); }
  deleteProductProperty(id: string) { return this.remove('productProperty', id); }
}
