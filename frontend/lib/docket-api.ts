import { api } from './nexuscore-api';

// Helper for query string
const qs = (p?: Record<string, any>) => {
  if (!p) return '';
  const filtered = Object.entries(p).filter(([, v]) => v != null && v !== '');
  if (!filtered.length) return '';
  return '?' + new URLSearchParams(filtered.map(([k, v]) => [k, String(v)])).toString();
};

export const docketSetupApi = {
  documentTypes: {
    list: (q?: any) => api.get(`/docket-setup/document-types${qs(q)}`),
    create: (d: any) => api.post('/docket-setup/document-types', d),
    get: (id: string) => api.get(`/docket-setup/document-types/${id}`),
    update: (id: string, d: any) => api.put(`/docket-setup/document-types/${id}`, d),
    delete: (id: string) => api.delete(`/docket-setup/document-types/${id}`),
    toggle: (id: string) => api.patch(`/docket-setup/document-types/${id}/toggle`, {}),
  },
  templates: {
    list: (q?: any) => api.get(`/docket-setup/templates${qs(q)}`),
    create: (d: any) => api.post('/docket-setup/templates', d),
    get: (id: string) => api.get(`/docket-setup/templates/${id}`),
    update: (id: string, d: any) => api.put(`/docket-setup/templates/${id}`, d),
    delete: (id: string) => api.delete(`/docket-setup/templates/${id}`),
    addItem: (id: string, d: any) => api.post(`/docket-setup/templates/${id}/items`, d),
    updateItem: (id: string, itemId: string, d: any) => api.put(`/docket-setup/templates/${id}/items/${itemId}`, d),
    removeItem: (id: string, itemId: string) => api.delete(`/docket-setup/templates/${id}/items/${itemId}`),
    duplicate: (id: string, d: any) => api.post(`/docket-setup/templates/${id}/duplicate`, d),
    setDefault: (id: string) => api.patch(`/docket-setup/templates/${id}/set-default`, {}),
  },
  approvalWorkflows: {
    list: () => api.get('/docket-setup/approval-workflows'),
    create: (d: any) => api.post('/docket-setup/approval-workflows', d),
    get: (id: string) => api.get(`/docket-setup/approval-workflows/${id}`),
    update: (id: string, d: any) => api.put(`/docket-setup/approval-workflows/${id}`, d),
    delete: (id: string) => api.delete(`/docket-setup/approval-workflows/${id}`),
  },
};

export const docketApi = {
  list: (q?: any) => api.get(`/dockets${qs(q)}`),
  get: (id: string) => api.get(`/dockets/${id}`),
  create: (d: any) => api.post('/dockets', d),
  getByEntity: (entityType: string, entityId: string) => api.get(`/dockets/entity/${entityType}/${entityId}`),
  updateStatus: (id: string, d: any) => api.patch(`/dockets/${id}/status`, d),
  recalculate: (id: string) => api.post(`/dockets/${id}/recalculate`, {}),
  delete: (id: string) => api.delete(`/dockets/${id}`),

  items: {
    list: (docketId: string) => api.get(`/dockets/${docketId}/items`),
    create: (docketId: string, d: any) => api.post(`/dockets/${docketId}/items`, d),
    get: (id: string) => api.get(`/docket-items/${id}`),
    update: (id: string, d: any) => api.patch(`/docket-items/${id}`, d),
    delete: (id: string) => api.delete(`/docket-items/${id}`),
    history: (id: string) => api.get(`/docket-items/${id}/history`),
    approve: (id: string, d: any) => api.patch(`/docket-items/${id}/approve`, d),
    reject: (id: string, d: any) => api.patch(`/docket-items/${id}/reject`, d),
    requestRevision: (id: string, d: any) => api.patch(`/docket-items/${id}/request-revision`, d),
  },

  documents: {
    list: (itemId: string) => api.get(`/docket-items/${itemId}/documents`),
    upload: (itemId: string, d: any) => api.post(`/docket-items/${itemId}/documents`, d),
    get: (id: string) => api.get(`/docket-documents/${id}`),
    delete: (id: string) => api.delete(`/docket-documents/${id}`),
    download: (id: string) => api.get(`/docket-documents/${id}/download`),
  },

  sharing: {
    createLink: (docketId: string, d: any) => api.post(`/dockets/${docketId}/share-links`, d),
    listLinks: (docketId: string) => api.get(`/dockets/${docketId}/share-links`),
    deleteLink: (linkId: string) => api.delete(`/dockets/share-links/${linkId}`),
    updateLink: (linkId: string, d: any) => api.patch(`/dockets/share-links/${linkId}`, d),
    accessLog: (docketId: string) => api.get(`/dockets/${docketId}/buyer-access-log`),
    createExternalReview: (docketId: string, d: any) => api.post(`/dockets/${docketId}/external-review`, d),
    listExternalReviews: () => api.get('/dockets/external-reviews'),
  },
};

export const docketReportApi = {
  completeness: (q?: any) => api.get(`/docket-reports/completeness${qs(q)}`),
  missingDocuments: (q?: any) => api.get(`/docket-reports/missing-documents${qs(q)}`),
  approvalStatus: (q?: any) => api.get(`/docket-reports/approval-status${qs(q)}`),
  documentExpiry: (q?: any) => api.get(`/docket-reports/document-expiry${qs(q)}`),
};
