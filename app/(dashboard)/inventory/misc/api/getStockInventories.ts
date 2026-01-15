import { APIAxios } from "@/utils/axios"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { TStockInventoryItem } from "../types/stock";

interface StockInventoryResponse {
  count: number;
  next_page: number;
  previous_page: number;
  number_of_pages: number;
  data: TStockInventoryItem[];
}

interface FetchOptions {
  page?: number;
  size?: number;
  search?: string;
  category?: number;
  variation?: string;  
  location?: string;
  period?: "today" | "week" | "month" | "year" | "custom";
  date_from?: string;
  date_to?: string;
}

const fetchStockInventory = async (options: FetchOptions = {}): Promise<StockInventoryResponse> => {
  const params = new URLSearchParams();
  if (options.page) params.append('page', options.page.toString());
  if (options.size) params.append('size', options.size.toString());
  if (options.search) params.append('search', options.search);
  if (options.category) params.append('category', options.category.toString());
  if (options.location) params.append('location', options.location);
  if (options.variation) params.append('variation', options.variation);
  if (options.period) params.append('period', options.period);
  if (options.date_from) params.append('date_from', options.date_from);
  if (options.date_to) params.append('date_to', options.date_to);
  
  const res = await APIAxios.get('/inventory/stock-inventories/', { params });
  return res.data;
}

export const useGetStockInventory = (options: FetchOptions = {}) => {
  return useQuery({
    queryKey: ['stock-inventory-list', options],
    placeholderData: keepPreviousData,
    queryFn: () => fetchStockInventory(options),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}

