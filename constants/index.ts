export const PRODUCT_TYPES_OPTIONS = {
  Cakes: {
    sizes: [
      { label: "4 inches", value: "4" },
      { label: "6 inches", value: "6" },
      { label: "8 inches", value: "8" },
      { label: "9 inches", value: "9" },
      { label: "10 inches", value: "10" },
      { label: "12 inches", value: "12" },
    ],
    layers: [
      { label: "2 layers", value: "2" },
      { label: "3 layers", value: "3" },
      { label: "4 layers", value: "4" },
      { label: "5 layers", value: "5" },
    ],
    flavours: [
      { label: "Vanilla", value: "Vanilla" },
      { label: "Chocolate", value: "Chocolate" },
      { label: "Red Velvet", value: "Red Velvet" },
      { label: "None", value: "None" },
    ],
    whippedCreamUpgrade: [
      { label: "1 Layer", value: "0" },
      { label: "2 Layers", value: "5000" },
      { label: "3 Layers", value: "7000" },
      { label: "5 Layers", value: "7000" },
      { label: "Tiered", value: "15000" },
    ],
    toppings: [
      { label: "None", value: "none" },
      { label: "Chocolate Cookies", value: "chocolate" },
      { label: "Fruits", value: "fruits" },
      { label: "Fruits & Chocolate Cookies", value: "mixed" },
    ],
  },
  Flowers: {
    glass_vase: [
      { label: "25cm", value: "25cm" },
      { label: "50cm", value: "50cm" },
    ],
    bouquets: [
      { name: "Medium (8*10)", value: "Medium" },
      { name: "Small (8*8)", value: "Small" },
      { name: "Standard (8*14)", value: "Standard" },
      { name: "Standard Plus (10*10)", value: "Standard Plus" },
      { name: "Xsmall (6*10)", value: "Xsmall" },
      { name: "24cm Small Box", value: "24cm Small Box" },
      { name: "27cm Moyenne Box", value: "27cm Moyenne Box" },
      { name: "30cm Luxe Moyenne Box", value: "30cm Luxe Moyenne Box" },
      { name: "33cm Standard Box", value: "33cm Standard Box" },
      { name: "36cm Luxe Standard Box", value: "36cm Luxe Standard Box" },
      { name: "39cm Deluxe Box", value: "39cm Deluxe Box" },
      { name: "42cm Deluxe Plus Box", value: "42cm Deluxe Plus Box" },
      { name: "45cm Deluxe Premium", value: "45cm Deluxe Premium" },
      { name: "48cm First Class Box", value: "48cm First Class Box" },
      { name: "Deluxe Bouquet", value: "Deluxe Bouquet" },
      { name: "Deluxe Plus Bouquet", value: "Deluxe Plus Bouquet" },
      { name: "Deluxe Premium Bouquet", value: "Deluxe Premium Bouquet" },
      { name: "Entry Bouquet", value: "Entry Bouquet" },
      { name: "First Class Bouquet", value: "First Class Bouquet" },
      { name: "Moyenne Bouquet", value: "Moyenne Bouquet" },
      { name: "Small Bouquet", value: "Small Bouquet" },
      { name: "Standard Bouquet", value: "Standard Bouquet" },
      { name: "Xsmall Bouquet", value: "Xsmall Bouquet" },
      { name: "Large Bouquet", value: "Large Bouquet" },
      { name: "Vip Deluxe", value: "Vip Deluxe" },
      { name: "Vip Deluxe Plus", value: "Vip Deluxe Plus" },
      { name: "Vip Moyenne", value: "Vip Moyenne" },
      { name: "Vip Standard", value: "Vip Standard" },
    ],
  },
  Teddies: {
    sizes: [
      { label: "25cm (Entry)", value: "25cm", price: 20000 },
      { label: "30cm (X-Small)", value: "30cm", price: 45000 },
      { label: "40cm (Small)", value: "40cm", price: 52000 },
      { label: "60cm (Medium)", value: "60cm", price: 72000 },
    ],
    bouquets: [
      { label: "Entry", value: "Entry" },
      { label: "X-Small", value: "Xsmall" },
      { label: "Small", value: "Small" },
      { label: "Moyenne", value: "Moyenne" },
      { label: "Standard", value: "Standard" },
      { label: "Human-sized", value: "Human-sized" },
    ],
  },
};

export const ENQUIRY_PAYMENT_OPTIONS = [
  { value: "not_paid_go_ahead", label: "Not Paid (Go Ahead)" },
  { value: "paid_website_card", label: "Paid (Website Card)" },
  { value: "paid_naira_transfer", label: "Paid (Naira Transfer)" },
  { value: "paid_pos", label: "Paid (POS)" },
  { value: "paid_usd_transfer", label: "Paid (USD Transfer)" },
  { value: "paid_paypal", label: "Paid (PayPal)" },
  { value: "cash_paid", label: "Cash Paid" },
  { value: "part_payment_cash", label: "Part Payment(Cash)" },
  { value: "part_payment_transfer", label: "Part Payment(Transfer)" },
  { value: "paid_bitcoin", label: "Paid (Bitcoin)" },
  { value: "not_received_paid", label: "Not Received (Paid)" },
];

// export const ENQUIRY_PAYMENT_VALUES = ";

export const ORDER_STATUS_OPTIONS = [
  { value: "PND", label: "Pending" },
  { value: "SOA", label: "Start Order Arrangement" },
  { value: "SOR", label: "Sorted" },
  { value: "STD", label: "Quality Check Passed" },
  { value: "CAN", label: "Cancelled" },
];

export const ORDER_DELIVERY_STATUS_OPTIONS = [
  { value: "PENDING", label: "Quality Check Passed" },
  { value: "DISPATCHED", label: "Dispatched" },
  { value: "DISPATCHED_CL", label: "Dispatched Client Notified" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "DELIVERED_CL", label: "Delivered Client Notified" },
  { value: "CANCELLED", label: "Cancelled" },
];

export const DELIVERY_ZONES_ENUMS: Record<string, string> = {
  LM: "Lagos Mainland",
  LI: "Lagos Island",
  LC: "Lagos Central",
  ND: "No Destination",
  OT: "Others",
};

export const CATEGORIES_ENUMS: Record<string, string> = {
  Cake: "C",
  Flower: "F",
  Cupcake: "CC",
  Wine: "W",
  "Teddy Bear": "TB",
  Teddybear: "TB",
  "Gift Card": "GC",
  Vase: "V",
  Chocolates: "CH",
  Baloon: "B",
  Perfume: "P",
  Handbag: "HB",
  "Hand bag": "HB",
  Combo: "CO",
};
export const ORDER_STATUS_ENUMS: Record<string, string> = {
  PND: "PENDING",
  SOA: "START ORDER ARRANGEMENT",
  SOR: "SORTED",
  STD: "SENT TO DELIVERY",
  COM: "DELIVERED",
  CAN: "CANCELLED",
};

export const ORDER_DELIVERY_STATUS_ENUMS: Record<string, string> = {
  PENDING: "QUALITY CHECK PASSED",
  DISPATCHED: "DISPATCHED",
  DISPATCHED_CL: "DISPATCHED CLIENT NOTIFIED",
  DELIVERED: "DELIVERED",
  DELIVERED_CL: "DELIVERED CLIENT NOTIFIED",
  CANCELLED: "CANCELLED",
};

export const PRODUCT_CATEGORIES_OPTIONS = [
  { value: "W", label: "Wine" },
  { value: "TB", label: "Teddy Bear" },
  { value: "GC", label: "Gift Card" },
  { value: "V", label: "Vase" },
  { value: "CH", label: "Chocolate" },
  { value: "B", label: "Baloon" },
  { value: "P", label: "Perfume" },
  { value: "HB", label: "Hand Bag" },
  { value: "CO", label: "Combo" },
];

export const PAYMENT_STATUS_OPTIONS = [
  { label: "Not Paid", value: "not_paid" },
  { label: "Paid", value: "paid" },
  { label: "Part Payment", value: "part_payment" },
  { label: "Not Received(Paid)", value: "not_received" },
];

export const DELIVERY_LOCATION_OPTIONS = [
  { value: "YABA", label: "Yaba N5,000" },
  { value: "SHOMOLU_BARIGA", label: "Shomolu/Bariga N5,000" },
  { value: "IYANA-IPAJA", label: "Iyana Ipaja (N8,500)" },
];

export const PAYMENT_METHODS = [
  { label: "Website Card", value: "website_card" },
  { label: "Naira Transfer", value: "naira_transfer" },
  { label: "POS", value: "pos" },
  { label: "USD Transfer", value: "usd_transfer" },
  { label: "Paypal", value: "paypal" },
  { label: "Cash Paid", value: "cash_paid" },
  { label: "Part Payment", value: "part_payment" },
  { label: "Bitcoin", value: "bitcoin" },
];

export const ENQUIRY_CHANNEL_OPTIONS = [
  { value: "Email", label: "Email" },
  { value: "Website", label: "Website" },
  { value: "Store Walk In", label: "Store Walk In" },
  { value: "Instagram", label: "Instagram" },
  { value: "WhatsApp 1", label: "WhatsApp - Line 1" },
  { value: "WhatsApp 2", label: "WhatsApp - Line 2" },
  { value: "WhatsApp 3", label: "WhatsApp - Line 3" },
  { value: "Line 1", label: "Phone Call - Line 1" },
  { value: "Line 2", label: "Phone Call - Line 2" },
  { value: "Line 3", label: "Phone Call - Line 3" },
];

export const ENQUIRY_OCCASION_OPTIONS = [
  { value: "Easter", label: "Easter" },
  { value: "Valentines", label: "Valentines" },
  { value: "Christmas", label: "Christmas" },
  { value: "Birthday", label: "Birthday" },
  { value: "Wedding", label: "Wedding" },
  { value: "Anniversary", label: "Anniversary" },
  { value: "Sorry", label: "Sorry" },
  { value: "Get well", label: "Get well" },
  { value: "Love & Romance", label: "Love & Romance" },
  { value: "Sympathy", label: "Sympathy" },
  { value: "Others", label: "Others" },
  { value: "Mother's Day", label: "Mother's Day" },
  { value: "Int. Women's Day", label: "Int. Women's Day" },
  { value: "Children's Day", label: "Children's Day" },
  { value: "Bridal", label: "Bridal" },
  { value: "Congrats", label: "Congrats" },
  { value: "Father's Day", label: "Father's Day" },
  { value: "Girlfriend's Day", label: "Girlfriend's Day" },
];

export const DISPATCH_METHOD_OPTIONS = [
  { value: "Dispatch", label: "Dispatch" },
  { value: "Pickup", label: "Pickup" },
];

export const ZONES_OPTIONS = [
  {
    value: "LM",
    label: "Lagos Mainland",
  },
  {
    value: "LC",
    label: "Lagos Central",
  },
  {
    value: "LI",
    label: "Lagos Island",
  },
  {
    value: "OT",
    label: "Others",
  },
  {
    value: "PU",
    label: "Pickup",
  },
  {
    value: "IS",
    label: "Interstate",
  },
  {
    value: "ND",
    label: "No Destination",
  },
];

export const STORAGE_LOCATION_OPTIONS = [
  { value: "Reception Shelf", label: "Reception Shelf" },
  { value: "Main Store", label: "Main Store" },
  { value: "Mini Store", label: "Mini Store" },
  { value: "Processing Room", label: "Processing Room" },
  { value: "Kitchen", label: "Kitchen" },
  { value: "Cold Room", label: "Cold Room" },
];


