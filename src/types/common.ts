export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SelectOption {
  value: string | number;
  label: string;
}
