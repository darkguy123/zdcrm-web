import { APIAxios } from "@/utils/axios"
import { keepPreviousData, useQuery } from "@tanstack/react-query"


interface FetchOptions {
  page?: number;
  size?: number;
  branch?: string;
  period?: "today" | "week" | "month" | "year" | "custom";
  date_from?: string;
  date_to?: string;
  period_type?: "daily" | "weekly" | "monthly";
}


interface APIResponse {
  data: Data;
  status: number;
  message: null;
}

interface Data {
  delivery_stats: Deliverystat[];
}

interface Deliverystat {
  name: string;
  code: string;
  type: string;
  order_count: number;
  enquiry_count: number;
}



const getStats = async (options: FetchOptions = {}): Promise<APIResponse> => {
  const params = new URLSearchParams();

  if (options.page) params.append('page', options.page.toString());
  if (options.size) params.append('size', options.size.toString());
  if (options.branch && options.branch !== "all") params.append('branch', options.branch);
  if (options.period) params.append('period', options.period);
  if (options.date_from) params.append('date_from', options.date_from);
  if (options.date_to) params.append('date_to', options.date_to);

  const res = await APIAxios.get('/order/delivery-zone-stats/', { params });
  return res.data;
}

export const useGeTOrderDeliveryStats = (options: FetchOptions = {}) => {
  return useQuery({
    queryKey: ['orders-delivery-zone-statistics', options],
    placeholderData: keepPreviousData,
    queryFn: () => getStats(options),
  });
}

