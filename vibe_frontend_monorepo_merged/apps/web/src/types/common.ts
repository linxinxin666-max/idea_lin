export interface ApiResponse<T = unknown> {
  statusCode: number;
  msg: string;
  data: T;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}
