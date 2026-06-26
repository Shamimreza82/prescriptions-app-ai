import axios from 'axios';

const medicineApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_MEDICINE_API_URL || 'http://localhost:4000/api/v1',
});

interface PaginationMeta {
  page: number | null;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

interface Brand {
  id: number;
  name: string;
  form: string;
  strength: string;
  price: string;
  packSize: string;
  isSponsored: boolean;
  company: { id: number; name: string };
  generic: { id: number; name: string };
}

interface Generic {
  id: number;
  name: string;
  indication: string;
  adultDose: string;
  childDose: string;
}

interface MedicineSearchResult {
  brands: Brand[];
  generics: Generic[];
  indications: Indication[];
}

interface Indication {
  id: number;
  name: string;
  _count: { indicationGenerics: number };
}

interface LabTest {
  id: string;
  name: string;
  slug: string;
  shortName: string;
  category: string;
  description: string;
  specimen: string;
}

export const searchMedicines = (q: string, limit = 10) =>
  medicineApi.get<ApiResponse<MedicineSearchResult>>('/medicines/search', { params: { q, limit } }).then((r) => r.data.data);

export const searchLabTests = (q: string, limit = 10) =>
  medicineApi.get<ApiResponse<LabTest[]>>('/lab-tests/search', { params: { q, limit } }).then((r) => r.data.data);

export const searchIndications = (q: string) =>
  medicineApi.get<ApiResponse<MedicineSearchResult>>('/medicines/search', { params: { q, limit: 1 } }).then((r) => r.data.data.indications || []);

export interface Company {
  id: number;
  name: string;
}

export const searchCompanies = (q: string) =>
  medicineApi.get<ApiResponse<Company[]>>('/medicines/companies', { params: { q } }).then((r) => r.data.data);
