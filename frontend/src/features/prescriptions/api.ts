import { api } from '@/lib/axios';
import { Prescription, CreatePrescriptionInput } from './types';

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const getPrescriptions = (params?: Record<string, string>) =>
  api.get<PaginatedResponse<Prescription>>('/prescriptions', { params }).then((r) => r.data);

export const getPrescription = (id: string) =>
  api.get<{ success: boolean; data: Prescription }>(`/prescriptions/${id}`).then((r) => r.data.data);

export const createPrescription = (data: CreatePrescriptionInput) =>
  api.post<{ success: boolean; data: Prescription }>('/prescriptions', data).then((r) => r.data.data);

export const updatePrescription = (id: string, data: Partial<CreatePrescriptionInput>) =>
  api.put<{ success: boolean; data: Prescription }>(`/prescriptions/${id}`, data).then((r) => r.data.data);

export const deletePrescription = (id: string) =>
  api.delete(`/prescriptions/${id}`);

export const downloadPrescriptionPDF = async (id: string): Promise<void> => {
  const response = await api.get(`/prescriptions/${id}/pdf`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `prescription-${id}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const printPrescriptionPDF = async (id: string): Promise<void> => {
  const response = await api.get(`/prescriptions/${id}/print`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.print();
    }, 500);
  };
};
