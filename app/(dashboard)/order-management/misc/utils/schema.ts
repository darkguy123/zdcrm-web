import { z } from "zod";

const propertiesSchema = z
  .object({
    layers: z.string().optional(),
    toppings: z.string().optional(),
    bouquet: z.string().optional(),
    glass_vase: z.string().optional(),
    whipped_cream_upgrade: z.string().optional(),
  })
  .optional();

const variationSchema = z
  .object({
    stock_variation_id: z.number().optional(),
    product_inventory_variation_id: z.number().optional(),
    quantity: z.number().min(1),
  })
  .superRefine((data, ctx) => {
    if (!data.stock_variation_id && !data.product_inventory_variation_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Either stock variation ID or product inventory variation ID is required",
        path: ["stock_variation_id", "product_inventory_variation_id"],
      });
    }
    return true;
  });

const inventorySchema = z
  .object({
    stock_inventory_id: z.number().optional(),
    product_inventory_id: z.number().optional(),
    message: z.string().optional(),
    instruction: z.string().optional(),
    quantity_used: z.number().optional(),
    variations: z.array(variationSchema),
  })
  .nullable();

export const orderItemSchema = z
  .object({
    category: z.number({ message: "Category is required" }),
    product_id: z.number({ message: "Product Name is required" }),
    product_variation_id: z
      .string()
      .min(1, { message: "Product Variation is required" }),
    quantity: z.number().min(1),
    inventories: z.array(inventorySchema),
    properties: propertiesSchema,
    custom_image: z.any().nullable(),
    is_custom_order: z.boolean().optional(),
    miscellaneous: z
      .array(
        z.object({
          description: z
            .string()
            .min(1, { message: "Description is required" }),
          cost: z
            .number()
            .min(1, { message: "Miscellaneous cost is required" }),
          selling_price: z
            .number()
            .min(1, { message: "Miscellaneous selling price is required" }),
        }),
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.is_custom_order) {
      if (!data.custom_image.type.startsWith("image/")) {
        throw z.ZodError.create([
          {
            path: ["custom_image"],
            message: "Please select an image file.",
            code: "custom",
          },
        ]);
      }
      if (data.custom_image.size > MAX_FILE_SIZE) {
        throw z.ZodError.create([
          {
            path: ["custom_image"],
            message: "Please select a file smaller than 10MB.",
            code: "custom",
          },
        ]);
      }
    }
    if (data.product_id && data.product_id == 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Product Name is required",
      });
    }

    if (data.category === 8 && data.properties) {
      if (!data.properties.toppings) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Toppings must be provided for Cakes",
          path: [`inventories.properties.toppings`],
        });
      }
    }
    data.inventories.forEach((inventory, index) => {
      if (inventory === null) return; // Skip validation for null inventories

      if ([8, 9, 10].includes(data.category)) {
        if (inventory?.stock_inventory_id == null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Stock inventory ID is required for this category",
            path: [`inventories.${index}.stock_inventory_id`],
          });
        }
      } else {
        if (inventory?.product_inventory_id == null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Product inventory ID is required for this category",
            path: [`inventories.${index}.product_inventory_id`],
          });
        }
      }
    });
  });
export const MAX_FILE_SIZE = 10000000;

export const NewOrderSchema = z
  .object({
    customer: z.object({
      name: z.string().min(1, { message: "Client's name is required" }),
      phone: z
        .string()
        .min(1, { message: "Client's phone number is required" }),
      alternative_phone: z.string().optional(),
      email: z.string().optional(),
    }),

    delivery: z.object({
      residence_type: z.string({ required_error: "Delivery type is required" }),
      zone: z.enum(["LM", "LC", "LI", "PU", "IS", "OT", "ND"], {
        message: "Delivery zone is required",
      }),
      note: z.string().optional(),
      delivery_time: z.string(),
      delivery_date: z.string({ message: "Delivery date is required" }),
      method: z.enum(["Dispatch", "Pickup"], {
        message: "Delivery method is required",
      }),
      dispatch: z.string().optional(),
      address: z.string().optional(),
      recipient_name: z
        .string()
        .min(1, { message: "Recipient's name is required" }),
      recipient_alternative_phone: z.string().optional(),
      recipient_phone: z.string().optional(),
      fee: z.number().optional(),
      is_custom_delivery: z.boolean().optional(),
    }),
    discount_id: z.number().optional(),
    custom_discount_amount: z.number().optional(),
    enquiry_channel: z
      .string()
      .min(1, { message: "Enquiry channel is required" }),
    social_media_details: z.string().optional(),
    enquiry_occasion: z.string().optional(),
    business: z.number({ message: "Select a branch" }),
    message: z.string().optional(),
    items: z
      .array(orderItemSchema)
      .min(1, { message: "At least one item is required" }),
    payment_status: z.enum(["UP", "FP", "PP"]),
    payment_options: z.enum([
      "not_paid_go_ahead",
      "paid_website_card",
      "paid_naira_transfer",
      "paid_pos",
      "paid_usd_transfer",
      "paid_paypal",
      "cash_paid",
      "part_payment_cash",
      "part_payment_transfer",
      "paid_bitcoin",
      "not_received_paid",
    ]),
    // payment_proof: z.string().url().optional().nullable(),
    payment_proof: z.any().optional().nullable(),
    payment_receipt_name: z.string().optional(),
    payment_currency: z.enum(["NGN", "USD"]),
    amount_paid_in_usd: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/)
      .optional(),
    initial_amount_paid: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/)
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.payment_options !== "not_paid_go_ahead") {
      // Only validate proof IF user provided one
      if (data.payment_proof) {
        if (
          !data.payment_proof.type.startsWith("application/pdf") &&
          !data.payment_proof.type.startsWith("image/")
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please select a PDF or image file.",
            path: ["payment_proof"],
          });
        }

        if (data.payment_proof.size > MAX_FILE_SIZE) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please select a file smaller than 10MB.",
            path: ["payment_proof"],
          });
        }
      }

      // Make receipt name optional too
      if (data.payment_receipt_name && !data.payment_receipt_name.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter name on receipt.",
          path: ["payment_receipt_name"],
        });
      }
    }

    if (data.delivery.method === "Dispatch") {
      if (data.delivery.is_custom_delivery) {
        if (!data.delivery.fee) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Enter delivery fee",
            path: ["delivery.fee"],
          });
        }
      }
      if (!data.delivery.address || !data.delivery.address.trim().length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter address for dispatch delivery",
          path: ["delivery.address"],
        });
      }
    }
    if (
      (data.payment_options === "part_payment_cash" ||
        data.payment_options === "part_payment_transfer") &&
      !data.initial_amount_paid
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter initial amount paid",
        path: ["initial_amount_paid"],
      });
    }
    if (
      (data.payment_options === "paid_usd_transfer" ||
        data.payment_options === "paid_paypal" ||
        data.payment_options === "paid_bitcoin") &&
      !data.amount_paid_in_usd
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter amount paid in USD",
        path: ["amount_paid_in_usd"],
      });
    }
  });

export type NewOrderFormValues = z.infer<typeof NewOrderSchema>;
