import { z } from "zod";
import { MAX_FILE_SIZE } from "../../../misc/utils/schema";
import { ZONES_OPTIONS } from "@/constants";

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
    if (
      data.stock_variation_id == null &&
      data.product_inventory_variation_id == null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A variation must be selected",
        path: ["stock_variation_id"],
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
    variations: z.array(variationSchema).optional(),
    custom_image: z.string().url().optional(),
  })
  .nullable();

const ItemSchema = z
  .object({
    category: z.number({ message: "Category is required" }).optional(),
    product_id: z.number({ message: "Product Name is required" }).optional(),
    product_variation_id: z
      .string()
      .min(1, { message: "Product Variation is required" })
      .optional(),
    quantity: z.number().min(1).optional(),
    inventories: z.array(inventorySchema),
    properties: propertiesSchema,
    miscellaneous: z
      .array(
        z.object({
          description: z
            .string()
            .min(1, { message: "Description is required" }),
          cost: z
            .number()
            .min(1, { message: "Miscellaneous cost is required" }),
        }),
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
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
      if (!inventory) return;

      const variations = inventory.variations ?? [];

      if (data.category && [8, 9, 10].includes(data.category)) {
        // Stock categories

        const hasStockSelected =
          variations.length > 0 &&
          variations.some((v) => v?.stock_variation_id != null);

        if (!hasStockSelected) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Stock is required",
            path: ["inventories", index, "variations"],
          });
        }
      } else {
        // Product inventory categories

        const hasProductSelected =
          variations.length > 0 &&
          variations.some((v) => v?.product_inventory_variation_id != null);

        if (!hasProductSelected) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Inventory is required",
            path: ["inventories", index, "variations"],
          });
        }
      }
    });
  });

export const enquiryItemSchema = z
  .object({
    category: z.number({ message: "Category is required" }).optional(),
    product_id: z.number({ message: "Product Name is required" }).optional(),

    product_variation_id: z
      .string()
      .optional()
      .transform((val) => (val === "" ? undefined : val)),

    quantity: z.number().min(1).optional(),
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

    if (!data.product_id) return;
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

      if (data.category && [8, 9, 10].includes(data.category)) {
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

export const NewEnquirySchema = z.object({
  customer: z.object({
    name: z.string().min(1, { message: "Client's name is required" }),
    phone: z.string().min(1, { message: "Client's phone number is required" }),
    alternative_phone: z.string().optional(),
    email: z.string().optional(),
  }),
  delivery: z.object({
    zone: z.enum(
      ZONES_OPTIONS.map((zone) => zone.value) as [string, ...string[]],
      { message: "Delivery zone is required" },
    ),
    note: z.string().optional(),
    delivery_time: z.string().optional(),
    // residence_type: z.enum(["Home", "Office "], { message: "Delivery type is required" }).optional(),
    residence_type: z.string({ required_error: "Delivery type is required" }),
    delivery_date: z
      .string({ message: "Delivery date is required" })
      .optional(),
    method: z
      .enum(["Dispatch", "Pickup"], { message: "Delivery method is required" })
      .optional(),
    dispatch: z.string().optional(),
    address: z.string().optional(),
    recipient_name: z.string().optional(),
    recipient_phone: z.string().optional(),
    recipient_alternative_phone: z.string().optional(),
    fee: z.number().optional(),
    is_custom_delivery: z.boolean().optional(),
  }),
  enquiry_channel: z.string().optional(),
  social_media_details: z.string().optional(),
  enquiry_occasion: z.string().optional(),
  business: z.number({ message: "Select a business" }),
  message: z.string().optional(),
  items: z.array(enquiryItemSchema).optional().nullable(),
  discount_id: z.number().optional(),
  custom_discount_amount: z.number().optional(),
});

export const ConvertiblEnquirySchema = z
  .object({
    customer: z.object({
      name: z.string().min(1, { message: "Client's name is required" }),
      phone: z
        .string()
        .min(1, { message: "Client's phone number is required" }),
      email: z.string().email().optional(),
    }),
    delivery: z.object({
      zone: z.enum(["LM", "LC", "LI", "ND"], {
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
      recipient_phone: z
        .string()
        .min(1, { message: "Recipient's phone number is required" }),
    }),
    enquiry_channel: z
      .string()
      .min(1, { message: "Enquiry channel is required" }),
    social_media_details: z.string().optional(),
    enquiry_occasion: z.string().optional(),
    business: z.number({ message: "Select a business" }),
    message: z.string().optional(),
    items: z
      .array(ItemSchema)
      .min(1, { message: "At least one item is required" }),
  })
  .superRefine((data, ctx) => {
    if (
      data.delivery.method === "Dispatch" &&
      (!data.delivery.address || !data.delivery.address.trim().length)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter address for dispatch delivery",
        path: ["delivery.address"],
      });
    }
  });

export type NewEnquiryFormValues = z.infer<typeof NewEnquirySchema>;
export type ConvertibleEnquiryFormValues = z.infer<
  typeof ConvertiblEnquirySchema
>;
