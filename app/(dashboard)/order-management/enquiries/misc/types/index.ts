import { TProductCategory } from "@/app/(dashboard)/inventory/misc/types";

export interface TEnquiry {
  id: number;
  enquiry_number: string | null;
  customer: Customer;
  created_by: Createdby;
  discount: string | null;
  custom_discount_amount: string | null;
  finalized_by: Createdby | null;
  converted_by: Createdby | null;
  deleted_by: Createdby | null;
  enquiry_channel: string;
  social_media_details: string;
  enquiry_occasion: string;
  branch: Branch;
  message: string;
  status: string;
  payment_status: string;
  payment_options: string;
  payment_currency: string;
  initial_amount_paid: null;
  amount_paid_in_usd: null;
  total_production_cost: string;
  total_selling_price: string;
  total_amount: string;
  payment_proof: null;
  payment_receipt_name: null;
  delivery: Delivery;
  items: Item[];
  discussions: TEnquiryDiscussion[];
  create_date: string;
  update_date: string;
}

// interface Product {
//   id: 276;
//   name: string;
//   category: {
//     id: 8;
//     name: "Cake";
//     type: "STOCK";
//     create_date: "2025-01-28T13:56:54.471031+01:00";
//     update_date: "2025-12-29T12:05:21.745309+01:00";
//   };
//   image: "https://res.cloudinary.com/dk4cqoxcp/image/upload/v1749912729/ei6lkgemb54v95mxwnzr.jpg";
// }

interface Item {
  id: number;
  product: Product;
  product_variation: Productvariation;
  quantity: number;
  miscellaneous: any[];
  inventories: Inventory[];
  custom_image: null;
  create_date: string;
  update_date: string;
  properties: Property[];
}

interface Property {
  id: number;
  layers: PropertyItem | null;
  layers_cost_at_order: string | null;
  layers_selling_at_order: string | null;
  toppings: PropertyItem | null;
  toppings_cost_at_order: string | null;
  toppings_selling_at_order: string | null;
  glass_vase: PropertyItem | null;
  glass_vase_cost_at_order: string;
  glass_vase_selling_at_order: string;
  bouquet: PropertyItem | null;
  bouquet_cost_at_order: string;
  bouquet_selling_at_order: string;
  whipped_cream: PropertyItem | null;
  whipped_cream_cost_at_order: string | null;
  whipped_cream_selling_at_order: string | null;
}
export interface TEnquiryDiscussion {
  id: number;
  user: Createdby;
  message: string;
  create_date: string;
  update_date: string;
}

interface PropertyItem {
  id: number;
  name: string;
  type: string;
  type_display: string;
  cost_price: string;
  selling_price: string;
  is_active: boolean;
  create_date: string;
  update_date: string;
}

interface Inventory {
  id: number;
  stock_inventory: Stockinventory | null;
  product_inventory: Productinventory | null;
  message: null;
  instruction: string;
  variations: Variation[];
}

interface Variation {
  id: number;
  variation_details: Variationdetails;
  quantity: number;
}

interface Variationdetails {
  id: number;
  size: string;
  color: string | null;
  flavour: string | null;
  selling_price: string;
  cost_price: string;
  quantity: number;
  last_updated_by: number;
  create_date: string;
  update_date: string;
}

interface Productinventory {
  id: number;
  name: string;
  category: TProductCategory;
  image_one: string;
  inventory_number: string;
}
interface Stockinventory {
  id: number;
  name: string;
  category: TProductCategory;
  image_one: string;
  inventory_number: string;
}
interface Productvariation {
  id: number;
  is_active: boolean;
  size: string;
  layer: null;
  max_flowers: null;
  cost_price: string;
  selling_price: string;
  quantity: number;
  recently_updated_by: Createdby;
}

interface Product {
  id: number;
  name: string;
  category: TProductCategory;
  image: string;
}

interface Delivery {
  id: number;
  zone: string;
  note: null;
  delivery_time: string;
  delivery_date: string;
  method: string;
  dispatch: Dispatch;
  address: string;
  residence_type: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_alternative_phone: string;
  status: string;
  driver_name: string | null;
  driver_phone: string | null;
  tracking_link: string | null;
  delivery_platform: string | null;
  fee: string | null;
  is_custom_delivery: boolean;
}

interface Dispatch {
  id: number;
  state: string;
  location: string;
  delivery_price: string;
}

interface Branch {
  id: number;
  name: string;
  country: string;
  create_date: string;
  update_date: string;
}

interface Createdby {
  id: number;
  email: string;
  name: string;
  phone: string;
  image: string | null;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
}
