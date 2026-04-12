export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: PaginationMeta;
  error?: ApiError;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}
