import { TProductCategory } from "@/app/(dashboard)/inventory/misc/types";

export interface TOrder {
  id: number;
  order_id: number;
  customer: Customer;
  created_by: Createdby;
  approved_by: Createdby | null;
  completed_by: Createdby | null;
  discount: Discount | null;
  is_external_order: boolean;
  order_number: string;
  enquiry_channel: string;
  enquiry_occasion: string;
  business: Business;
  branch: Business;
  message: string | null;
  metadata: WebsiteMetadata;
  status: string;
  payment_status: string;
  payment_options: string;
  initial_amount_paid: null | number;
  payment_currency: string;
  payment_proof: null | string;
  payment_verified: boolean;
  payment_verified_by: Createdby | null;
  payment_verified_at: string | null;
  amount_paid_in_usd: null | number;
  payment_receipt_name: null | string;
  total_production_cost: string;
  total_selling_price: string;
  total_amount: string;
  delivery: Delivery;
  items: OrderItem[];
  discussions: TOrderDiscussion[];
  part_payments: Partpayment[];
  create_date: string;
  update_date: string;
}

export interface WebsiteMetaDataItem {
  id: number;
  key: string;
  value: string;
}

export interface WebsiteLineItem {
  id: number;
  name: string;
  product_id: number;
  quantity: number;
  subtotal: string;
  total: string;
  meta_data: WebsiteMetaDataItem[];
}

export interface WebsiteMetadata {
  line_items: WebsiteLineItem[];
}

// Merged order item type (moved to bottom after all referenced types)
export interface OrderItem {
  id: number;
  product: Product;
  product_name: string;
  product_variation: Productvariation | Productvariation2 | Productvariation3;
  quantity: number;
  miscellaneous: Array<any>;
  inventories: Array<Inventory>;
  custom_image: null;
  create_date: string;
  update_date: string;
  price_at_order: string;
  is_sorted: boolean;
  properties: Array<Property>;
}

interface Partpayment {
  id: number;
  payment_options: string;
  payment_proof: string;
  payment_currency: string;
  amount_paid: string;
  payment_receipt_name: string;
  recorded_by: Createdby;
  create_date: string;
}

export interface TOrderDiscussion {
  id: number;
  user: Createdby;
  message: string;
  create_date: string;
  update_date: string;
}

interface Productvariation3 {
  id: number;
  is_active: boolean;
  size: string;
  layer: string;
  max_flowers: null;
  cost_price: string;
  selling_price: string;
  quantity: number;
  recently_updated_by: Createdby;
}

interface Items2 {
  id: number;
  product: Product;
  product_variation: Productvariation2;
  quantity: number;
  miscellaneous: any[];
  inventories: Inventory[];
  custom_image: null;
  create_date: string;
  update_date: string;
  price_at_order: string;
  is_sorted: boolean;
  properties: Property[];
}

interface Property {
  id: number;
  toppings: PropertyItem | null;
  toppings_cost_at_order: number | null;
  toppings_selling_at_order: number | null;
  glass_vase: PropertyItem | null;
  glass_vase_cost_at_order: number | null;
  glass_vase_selling_at_order: number | null;
  whipped_cream: PropertyItem | null;
  whipped_cream_cost_at_order: number | null;
  whipped_cream_selling_at_order: number | null;
}

export interface PropertyItem {
  id: number;
  name: string;
  type: string;
  type_display: string;
  category: null;
  category_display: null;
  cost_price: string;
  selling_price: string;
  is_active: boolean;
  create_date: string;
  update_date: string;
}

export interface Inventory {
  id: number;
  stock_inventory: Stockinventory | null;
  product_inventory: Productinventory | null;
  message: string | null;
  instruction: string | null;
  variations: Variation[];
}

interface Variation {
  id: number;
  variation_details: Variationdetails;
  quantity: number;
  price_at_order: number | null;
  selling_price_at_order: number | null;
}

interface Variationdetails {
  id: number;
  size: string | null;
  color: string | null;
  flavour: string | null;
  quantity: number;
  max_quantity_required: number | null;
  minimum_quantity_required: number | null;
  location: string | null;
  last_updated_by: Createdby | null;
  create_date: string;
  update_date: string;
}

interface Stockinventory {
  id: number;
  name: string;
  category: Category;
  image_one: null;
  inventory_number: string;
}

interface Productvariation2 {
  id: number;
  is_active: boolean;
  size: string;
  layer: null;
  max_flowers: number;
  cost_price: string;
  selling_price: string;
  quantity: number;
  recently_updated_by: Createdby;
}

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
  price_at_order: string;
  is_sorted: boolean;
  properties: any[];
}

interface Productinventory {
  id: number;
  name: string;
  category: Category;
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
  category: Category;
  image: string;
}

interface Category {
  id: number;
  name: string;
  type: string;
  create_date: string;
  update_date: string;
}

interface Delivery {
  id: number;
  zone: string;
  note: null | string;
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
  driver: DeliveryDriver | null;
  tracking_link: null;
  fee: null;
  is_custom_delivery: boolean;
}

export interface DeliveryDriver {
  id: number;
  phone_number: string;
  name: string;
  email: string;
  delivery_platform: string;
  create_date: string;
  update_date: string;
}
interface Dispatch {
  id: number;
  state: string;
  location: string;
  zone: string;
  zone_display: string;
  delivery_price: string;
}

interface Business {
  id: number;
  name: string;
  phone_number: null;
  address: null;
  business: null;
  create_date: string;
  update_date: string;
}

interface Discount {
  id: number;
  type: string;
  amount: string;
}

interface Createdby {
  id: number;
  email: string;
  name: string;
  phone: string;
  image: null;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: null | string;
}
