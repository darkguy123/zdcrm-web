import { APIAxios } from "@/utils/axios";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { TProductInventoryItem } from "../types/products";

interface ProductInventoryResponse {
  count: number;
  next_page: number;
  previous_page: number;
  number_of_pages: number;
  data: TProductInventoryItem[];
}

interface FetchOptions {
  page?: number;
  size?: number;
  search?: string;
  category?: number;
  business?: number;
  location?: string;
  period?: "today" | "week" | "month" | "year" | "custom";
  date_from?: string;
  date_to?: string;
}

const fetchProductInventory = async (
  options: FetchOptions = {}
): Promise<ProductInventoryResponse> => {
  const params = new URLSearchParams();
  if (options.page) params.append("page", options.page.toString());
  if (options.size) params.append("size", options.size.toString());
  if (options.search) params.append("search", options.search);
  if (options.category) params.append("category", options.category.toString());
  if (options.business) params.append("business", options.business.toString());
  if (options.location) params.append("location", options.location);
  if (options.period) params.append("period", options.period);
  if (options.date_from) params.append("date_from", options.date_from);
  if (options.date_to) params.append("date_to", options.date_to);

  const res = await APIAxios.get("/inventory/product-inventories/", { params });
  return res.data;
};

export const useGetProductsInventory = (options: FetchOptions = {}) => {
  return useQuery({
    queryKey: ["products-inventory-list", options],
    placeholderData: keepPreviousData,
    queryFn: () => fetchProductInventory(options),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};
