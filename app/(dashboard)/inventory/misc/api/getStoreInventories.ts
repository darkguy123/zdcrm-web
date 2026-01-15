import { APIAxios } from "@/utils/axios";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { TStoreInventoryItem } from "../types/store";

interface StoreInventoryResponse {
  count: number;
  next_page: number;
  previous_page: number;
  number_of_pages: number;
  data: TStoreInventoryItem[];
}

interface FetchOptions {
  page?: number;
  size?: number;
  search?: string;
  category?: number;
  location?: string;
  period?: "today" | "week" | "month" | "year" | "custom";
  date_from?: string;
  date_to?: string;
}

const fetchStoreInventory = async (
  options: FetchOptions = {}
): Promise<StoreInventoryResponse> => {
  const params = new URLSearchParams();
  if (options.page) params.append("page", options.page.toString());
  if (options.size) params.append("size", options.size.toString());
  if (options.search) params.append("search", options.search);
  if (options.category) params.append("category", options.category.toString());
  if (options.location) params.append("location", options.location);
  if (options.period) params.append("period", options.period);
  if (options.date_from) params.append("date_from", options.date_from);
  if (options.date_to) params.append("date_to", options.date_to);

  const res = await APIAxios.get("/inventory/store-inventories/", { params });
  return res.data;
};

export const useGetStoreInventory = (options: FetchOptions = {}) => {
  return useQuery({
    queryKey: ["storeInventory", options],
    placeholderData: keepPreviousData,
    queryFn: () => fetchStoreInventory(options),
  });
};
