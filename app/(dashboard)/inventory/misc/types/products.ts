import { TBranch, TCategory } from ".";

export interface TProductInventoryItemm {
  id: number;
  name: string;
  category: TCategory;
  branch: TBranch;
  image_one: string;
  cost_price: string;
  selling_price: string;
  quantity: number;
  inventory_number: string;
  created_by: Createdby;
  last_updated_by: Createdby | null;
  create_date: string;
  update_date: string;
  quantity_sold: number;
}






export interface TProductInventoryItem {
  id: number;
  name: string;
  category: TCategory;
  branch: Branch;
  image_one:  string;
  inventory_number: string;
  created_by: Createdby;
  create_date: string;
  update_date: string;
  variations: TProductVariation[];
}

export interface TProductVariation {
  id: number;
  size: string;
  quantity: number;
  quantity_sold: number;
  last_updated_by: Createdby;
  create_date: string;
  update_date: string;
  location: string;
}

interface Createdby {
  id: number;
  email: string;
  name: string;
  phone: string;
  image: null;
}

interface Branch {
  id: number;
  name: string;
  country: string;
  create_date: string;
  update_date: string;
}
