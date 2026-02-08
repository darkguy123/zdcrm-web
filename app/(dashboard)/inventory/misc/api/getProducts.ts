import { APIAxios } from "@/utils/axios";
import { useQuery } from "@tanstack/react-query";
import { TProductCategory } from "../types";
import { Createdby } from "../types/stock";

interface FetchOptions {
  category?: number;
  business?: number;
}
const fetchProducts = async (
  options: FetchOptions = {}
): Promise<ProductsAPIReponse[]> => {
  const params = new URLSearchParams();
  if (options.category) params.append("category", options.category.toString());
  if (options.business) params.append("business", options.business.toString());
  const res = await APIAxios.get("/inventory/products/", { params });
  return res.data.data;
};

export const useGetProducts = (options: FetchOptions = {}) => {
  return useQuery({
    queryKey: ["products", options],
    queryFn: () => fetchProducts(options),
  });
};

interface RootObject {
  data: ProductsAPIReponse[];
  status: number;
  message: null;
}

export interface ProductsAPIReponse {
  id: number;
  name: string;
  category: TProductCategory;
  external_id: string;
  is_active: boolean;
  image: string;
  variations: Variation[];
  created_by: null;
  create_date: string;
  update_date: string;
}

interface Variation {
  id: number;
  size: string;
  layer: null;
  max_flowers: null;
  cost_price: string;
  selling_price: string;
  quantity: number;
  recently_updated_by: Createdby;
}
