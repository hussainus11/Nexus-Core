const BASE = process.env.NEXT_PUBLIC_NEXUSCORE_API_URL || 'http://localhost:4000/api/v1';

async function request<T = any>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    ...init,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    const error = new Error(err.message || 'Request failed');
    (error as any).status = res.status;
    throw error;
  }

  const json = await res.json();
  // Unwrap NexusCore's global response envelope { success, data, message }
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return json.data as T;
  }
  return json as T;
}

export const api = {
  get: <T = any>(path: string) => request<T>(path),
  post: <T = any>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T = any>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  put: <T = any>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T = any>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// Auth helpers for the login page
export const nexuscoreAuth = {
  login: (credentials: { email: string; password: string; [key: string]: any }) =>
    api.post<{
      user: { id: string; email: string; companyId: string; mustChangePassword?: boolean; [key: string]: any };
      accessToken: string;
      refreshToken: string;
    }>('/auth/login', credentials),

  changePassword: (payload: { newPassword: string }) =>
    api.post('/auth/change-password', payload),
};

// Custom Entity Pages (backed by NexusCore /api/v1/entities/pages)
export const customEntityPageApi = {
  getCustomEntityPages: (companyId?: string | number, branchId?: string | number) => {
    const params = new URLSearchParams();
    if (companyId) params.append('companyId', String(companyId));
    if (branchId) params.append('branchId', String(branchId));
    const qs = params.toString();
    return api.get(`/entities/pages${qs ? `?${qs}` : ''}`);
  },

  getCustomEntityPageBySlug: (slug: string) => api.get(`/entities/pages/slug/${slug}`),

  createCustomEntityPage: (dto: any) => api.post('/entities/pages', dto),
  updateCustomEntityPage: (id: string, dto: any) => api.patch(`/entities/pages/${id}`, dto),
  deleteCustomEntityPage: (id: string) => api.delete(`/entities/pages/${id}`),
};

// PLM helpers
const plm = (path: string, q?: Record<string, string>) => {
  const qs = q ? '?' + new URLSearchParams(q).toString() : '';
  return `/plm${path}${qs}`;
};

export const plmApi = {
  // Definitions
  sampleTypes: { list: () => api.get(plm('/style-sample-types')), create: (d: any) => api.post(plm('/style-sample-types'), d), update: (id: string, d: any) => api.put(plm(`/style-sample-types/${id}`), d), delete: (id: string) => api.delete(plm(`/style-sample-types/${id}`)) },
  designDetailTypes: { list: () => api.get(plm('/design-detail-types')), create: (d: any) => api.post(plm('/design-detail-types'), d), update: (id: string, d: any) => api.put(plm(`/design-detail-types/${id}`), d), delete: (id: string) => api.delete(plm(`/design-detail-types/${id}`)) },
  measurementDefs: { list: () => api.get(plm('/measurement-definitions')), create: (d: any) => api.post(plm('/measurement-definitions'), d), update: (id: string, d: any) => api.put(plm(`/measurement-definitions/${id}`), d), delete: (id: string) => api.delete(plm(`/measurement-definitions/${id}`)) },
  departments: { list: (q?: any) => api.get(plm('/department-cards', q)), create: (d: any) => api.post(plm('/department-cards'), d), get: (id: string) => api.get(plm(`/department-cards/${id}`)), update: (id: string, d: any) => api.put(plm(`/department-cards/${id}`), d), delete: (id: string) => api.delete(plm(`/department-cards/${id}`)), employees: (id: string) => api.get(plm(`/department-cards/${id}/employees`)) },
  processCards: { list: (q?: any) => api.get(plm('/process-cards', q)), create: (d: any) => api.post(plm('/process-cards'), d), get: (id: string) => api.get(plm(`/process-cards/${id}`)), update: (id: string, d: any) => api.put(plm(`/process-cards/${id}`), d), delete: (id: string) => api.delete(plm(`/process-cards/${id}`)) },
  employees: { list: (q?: any) => api.get(plm('/employee-cards', q)), create: (d: any) => api.post(plm('/employee-cards'), d), get: (id: string) => api.get(plm(`/employee-cards/${id}`)), update: (id: string, d: any) => api.put(plm(`/employee-cards/${id}`), d), delete: (id: string) => api.delete(plm(`/employee-cards/${id}`)) },
  resources: { list: (q?: any) => api.get(plm('/resource-cards', q)), create: (d: any) => api.post(plm('/resource-cards'), d), get: (id: string) => api.get(plm(`/resource-cards/${id}`)), update: (id: string, d: any) => api.put(plm(`/resource-cards/${id}`), d), delete: (id: string) => api.delete(plm(`/resource-cards/${id}`)) },
  studyTemplates: { list: (q?: any) => api.get(plm('/study-templates', q)), create: (d: any) => api.post(plm('/study-templates'), d), get: (id: string) => api.get(plm(`/study-templates/${id}`)), update: (id: string, d: any) => api.put(plm(`/study-templates/${id}`), d), delete: (id: string) => api.delete(plm(`/study-templates/${id}`)), upsertLines: (id: string, lines: any[]) => api.put(plm(`/study-templates/${id}/lines`), lines), deleteLine: (id: string, lineId: string) => api.delete(plm(`/study-templates/${id}/lines/${lineId}`)) },
  templates: { list: (q?: any) => api.get(plm('/templates', q)), create: (d: any) => api.post(plm('/templates'), d), get: (id: string) => api.get(plm(`/templates/${id}`)), update: (id: string, d: any) => api.put(plm(`/templates/${id}`), d), delete: (id: string) => api.delete(plm(`/templates/${id}`)), duplicate: (id: string) => api.post(plm(`/templates/${id}/duplicate`)) },
  // Cards
  moodBoards: { list: (q?: any) => api.get(plm('/mood-boards', q)), create: (d: any) => api.post(plm('/mood-boards'), d), get: (id: string) => api.get(plm(`/mood-boards/${id}`)), update: (id: string, d: any) => api.put(plm(`/mood-boards/${id}`), d), delete: (id: string) => api.delete(plm(`/mood-boards/${id}`)), addImages: (id: string, images: string[]) => api.post(plm(`/mood-boards/${id}/images`), { images }) },
  styleCards: {
    list: (q?: any) => api.get(plm('/style-cards', q)),
    create: (d: any) => api.post(plm('/style-cards'), d),
    get: (id: string) => api.get(plm(`/style-cards/${id}`)),
    update: (id: string, d: any) => api.put(plm(`/style-cards/${id}`), d),
    delete: (id: string) => api.delete(plm(`/style-cards/${id}`)),
    changeStatus: (id: string, d: any) => api.patch(plm(`/style-cards/${id}/status`), d),
    updateStatus: (id: string, status: string) => api.patch(plm(`/style-cards/${id}/status`), { status }),
    addDetail: (id: string, d: any) => api.post(plm(`/style-cards/${id}/details`), d),
    getDetails: (id: string) => api.get(plm(`/style-cards/${id}/details`)),
    upsertDetails: (id: string, details: any[]) => api.put(plm(`/style-cards/${id}/details`), details),
    getSamples: (id: string) => api.get(plm(`/style-cards/${id}/samples`)),
    getProducts: (id: string) => api.get(plm(`/style-cards/${id}/products`)),
    duplicate: (id: string) => api.post(plm(`/style-cards/${id}/duplicate`)),
  },
  sampleCards: {
    list: (q?: any) => api.get(plm('/sample-cards', q)),
    create: (d: any) => api.post(plm('/sample-cards'), d),
    get: (id: string) => api.get(plm(`/sample-cards/${id}`)),
    update: (id: string, d: any) => api.put(plm(`/sample-cards/${id}`), d),
    delete: (id: string) => api.delete(plm(`/sample-cards/${id}`)),
    changeStatus: (id: string, d: any) => api.patch(plm(`/sample-cards/${id}/status`), d),
    updateStatus: (id: string, status: string, notes?: string) => api.patch(plm(`/sample-cards/${id}/status`), { status, notes }),
    getHistory: (id: string) => api.get(plm(`/sample-cards/${id}/history`)),
    duplicate: (id: string) => api.post(plm(`/sample-cards/${id}/duplicate`)),
  },
  swatchCards: {
    list: (q?: any) => api.get(plm('/swatch-cards', q)),
    create: (d: any) => api.post(plm('/swatch-cards'), d),
    get: (id: string) => api.get(plm(`/swatch-cards/${id}`)),
    update: (id: string, d: any) => api.put(plm(`/swatch-cards/${id}`), d),
    delete: (id: string) => api.delete(plm(`/swatch-cards/${id}`)),
    linkProduct: (id: string, productCardId: string, isPrimary?: boolean) => api.post(plm(`/swatch-cards/${id}/link-product`), { productCardId, isPrimary }),
  },
  productCards: {
    list: (q?: any) => api.get(plm('/product-cards', q)),
    create: (d: any) => api.post(plm('/product-cards'), d),
    get: (id: string) => api.get(plm(`/product-cards/${id}`)),
    update: (id: string, d: any) => api.put(plm(`/product-cards/${id}`), d),
    delete: (id: string) => api.delete(plm(`/product-cards/${id}`)),
    changeStatus: (id: string, d: any) => api.patch(plm(`/product-cards/${id}/status`), d),
    updateStatus: (id: string, status: string) => api.patch(plm(`/product-cards/${id}/status`), { status }),
    getMeasurements: (id: string) => api.get(plm(`/product-cards/${id}/measurements`)),
    addMeasurement: (id: string, d: any) => api.post(plm(`/product-cards/${id}/measurements`), d),
    upsertMeasurements: (id: string, data: any[]) => api.put(plm(`/product-cards/${id}/measurements`), data),
    getSwatches: (id: string) => api.get(plm(`/product-cards/${id}/swatches`)),
    addSwatch: (id: string, d: any) => api.post(plm(`/product-cards/${id}/swatches`), d),
    removeSwatch: (id: string, swatchId: string) => api.delete(plm(`/product-cards/${id}/swatches/${swatchId}`)),
    getSamples: (id: string) => api.get(plm(`/product-cards/${id}/samples`)),
    duplicate: (id: string, createdBy?: string) => api.post(plm(`/product-cards/${id}/duplicate`), { createdBy }),
  },
  // Operations
  orders: {
    list: (q?: any) => api.get(plm('/orders', q)),
    create: (d: any) => api.post(plm('/orders'), d),
    get: (id: string) => api.get(plm(`/orders/${id}`)),
    update: (id: string, d: any) => api.put(plm(`/orders/${id}`), d),
    delete: (id: string) => api.delete(plm(`/orders/${id}`)),
    changeStatus: (id: string, d: any) => api.patch(plm(`/orders/${id}/status`), d),
    updateStatus: (id: string, status: string, notes?: string) => api.patch(plm(`/orders/${id}/status`), { status, notes }),
    getTasks: (id: string) => api.get(plm(`/orders/${id}/tasks`)),
    createTask: (id: string, d: any) => api.post(plm(`/orders/${id}/tasks`), d),
  },
  tasks: {
    list: (q?: any) => api.get(plm('/tasks', q)),
    create: (d: any) => api.post(plm('/tasks'), d),
    myTasks: (userId?: string) => api.get(plm('/tasks/my-tasks', userId ? { userId } : undefined)),
    overdue: () => api.get(plm('/tasks/overdue')),
    get: (id: string) => api.get(plm(`/tasks/${id}`)),
    update: (id: string, d: any) => api.put(plm(`/tasks/${id}`), d),
    delete: (id: string) => api.delete(plm(`/tasks/${id}`)),
    changeStatus: (id: string, d: any) => api.patch(plm(`/tasks/${id}/status`), d),
    updateStatus: (id: string, status: string, actualHrs?: number, notes?: string) => api.patch(plm(`/tasks/${id}/status`), { status, actualHrs, notes }),
  },
  criticalPath: {
    list: (q?: any) => api.get(plm('/critical-path', q)),
    create: (d: any) => api.post(plm('/critical-path'), d),
    get: (id: string) => api.get(plm(`/critical-path/${id}`)),
    gantt: (cpId: string) => api.get(plm(`/critical-path/${cpId}/gantt`)),
    getGantt: (cpId: string) => api.get(plm(`/critical-path/${cpId}/gantt`)),
    addTask: (cpId: string, d: any) => api.post(plm(`/critical-path/${cpId}/tasks`), d),
    updateTask: (cpId: string, taskId: string, d: any) => api.put(plm(`/critical-path/${cpId}/tasks/${taskId}`), d),
    updateTaskStatus: (cpId: string, taskId: string, status: string) => api.patch(plm(`/critical-path/${cpId}/tasks/${taskId}/status`), { status }),
    deleteTask: (cpId: string, taskId: string) => api.delete(plm(`/critical-path/${cpId}/tasks/${taskId}`)),
  },
  documents: {
    list: (q?: any) => api.get(plm('/documents', q)),
    create: (d: any) => api.post(plm('/documents'), d),
    upload: (d: any) => api.post(plm('/documents'), d),
    get: (id: string) => api.get(plm(`/documents/${id}`)),
    update: (id: string, d: any) => api.put(plm(`/documents/${id}`), d),
    delete: (id: string) => api.delete(plm(`/documents/${id}`)),
    newVersion: (id: string, d: any) => api.post(plm(`/documents/${id}/new-version`), d),
    versions: (id: string) => api.get(plm(`/documents/${id}/versions`)),
  },
  measurementCharts: {
    list: (q?: any) => api.get(plm('/measurement-charts', q)),
    create: (d: any) => api.post(plm('/measurement-charts'), d),
    get: (id: string) => api.get(plm(`/measurement-charts/${id}`)),
    update: (id: string, d: any) => api.put(plm(`/measurement-charts/${id}`), d),
    delete: (id: string) => api.delete(plm(`/measurement-charts/${id}`)),
    addLine: (id: string, d: any) => api.post(plm(`/measurement-charts/${id}/lines`), d),
    upsertLines: (id: string, lines: any[]) => api.put(plm(`/measurement-charts/${id}/lines`), lines),
    deleteLine: (id: string, lineId: string) => api.delete(plm(`/measurement-charts/${id}/lines/${lineId}`)),
  },
  // Reports
  reports: {
    delayedTasks: (q?: any) => api.get(plm('/reports/delayed-tasks', q)),
    dailyTasks: (q?: any) => api.get(plm('/reports/daily-tasks', q)),
    cancelledTasks: (q?: any) => api.get(plm('/reports/cancelled-tasks', q)),
    sampleCost: (q?: any) => api.get(plm('/reports/sample-cost', q)),
    sampleHistory: (q?: any) => api.get(plm('/reports/sample-history', q)),
    analyseCubes: (q?: any) => api.get(plm('/reports/analyse-cubes', q)),
  },
};

// BPM helpers
export const bpmApi = {
  getTasks: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get(`/bpm/tasks${qs}`);
  },
  getTask: (id: string) => api.get(`/bpm/tasks/${id}`),
  moveStage: (id: string, toStageId: string, comment?: string) =>
    api.patch(`/bpm/tasks/${id}/move-stage`, { toStageId, comment }),
  assignTask: (id: string, assignedTo: string) =>
    api.post(`/bpm/tasks/${id}/assign`, { assignedTo }),
  getProcesses: () => api.get('/bpm/processes'),
};
