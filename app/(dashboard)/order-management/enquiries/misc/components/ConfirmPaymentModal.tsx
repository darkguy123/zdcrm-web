import React, { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { X } from 'lucide-react';
import { z } from "zod";
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogClose,
  Button,
  Input,
  SelectSingleCombo,
  Spinner,
  FilePicker,
} from "@/components/ui";
import { OrderTimeLine } from '@/icons/sidebar';
import { extractErrorMessage, formatAxiosErrorMessage } from '@/utils/errors';
import { ENQUIRY_PAYMENT_OPTIONS } from '@/constants';
import { useLoading } from "@/contexts";


import { useConfirmEnquiry } from '../api';
import { MAX_FILE_SIZE } from '../../../misc/utils/schema';
import useCloudinary from '@/hooks/useCloudinary';


export const paymentFormSchema = z.object({
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
    "not_received_paid"
  ]),
  // payment_proof: z.string().url().optional().nullable(),
  payment_receipt_name: z.string().optional(),
  payment_currency: z.enum(["NGN", "USD"]),
  amount_paid_in_usd: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  initial_amount_paid: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  payment_proof: z
    .any()
    .optional()
    .nullable()
    .refine(
      (file) => {
        if (!file) return true; // allow empty

        const validType =
          file.type?.startsWith("application/pdf") ||
          file.type?.startsWith("image/");

        return validType;
      },
      { message: "Please select a PDF or image file." }
    )
    .refine(
      (file) => {
        if (!file) return true; // allow empty
        return file.size <= MAX_FILE_SIZE;
      },
      { message: "Max file size is 10MB." }
    ),
}).superRefine((data, ctx) => {
  if ((data.payment_options === "part_payment_cash" || data.payment_options === "part_payment_transfer") && !data.initial_amount_paid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Enter initial amount paid",
      path: ["initial_amount_paid"]
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
      path: ["amount_paid_in_usd"]
    });
  }
});

export type ConfirmPaymentFormData = z.infer<typeof paymentFormSchema>;


interface ConfirmPaymentModalProps {
  isModalOpen: boolean;
  closeModal: () => void;
  enquiryId: string;
  total_amount_due: number;
}

const ConfirmPaymentModal: React.FC<ConfirmPaymentModalProps> = React.memo(({
  isModalOpen,
  closeModal,
  enquiryId,
  total_amount_due
}) => {
  const { control, handleSubmit, watch, formState: { errors }, setValue, setError, clearErrors } = useForm<ConfirmPaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      payment_status: "UP",
      payment_options: "not_paid_go_ahead",
      payment_currency: "NGN",
    }
  });


  const router = useRouter();
  const { uploadToCloudinary } = useCloudinary()
  const { isUploading } = useLoading();

  const selectedPaymentOption = watch("payment_options");
  const { mutate, isPending } = useConfirmEnquiry()
  const onSubmit = async (data: ConfirmPaymentFormData) => {
    if (parseFloat(data.initial_amount_paid || '0') > total_amount_due) {
      toast.error("Initial amount paid cannot be greater than total amount due")
      setError("initial_amount_paid", {
        type: 'manual',
        message: "Initial amount paid cannot be greater than total amount due"
      })
      return
    }
    clearErrors("initial_amount_paid")

    let payment_proof: string | undefined
    const PdfFile = data.payment_proof
    if (data.payment_proof) {
      const data = await uploadToCloudinary(PdfFile)
      payment_proof = data.secure_url
    }
    const dataToSubmit = {
      ...data,
      payment_proof: PdfFile ? payment_proof : undefined,
    }

    mutate({ id: enquiryId, data: dataToSubmit }, {
      onSuccess: (data) => {
        closeModal()
        toast.success('Payment Confirmed')
        router.push(`/order-management/orders/${data?.data?.order_id}/order-summary`)
      },
      onError: (error) => {
        const errorMessage = extractErrorMessage((error as any).response?.data)
        toast.error(errorMessage, { duration: 10000 })
      }
    })
  };

  React.useEffect(() => {
    if (selectedPaymentOption == "paid_usd_transfer" || selectedPaymentOption == "paid_naira_transfer" || selectedPaymentOption == "cash_paid" || selectedPaymentOption == "paid_website_card"
      || selectedPaymentOption == "paid_pos" || selectedPaymentOption == "paid_paypal" || selectedPaymentOption == "paid_bitcoin") {
      setValue('payment_status', 'FP')
    }
    else if (selectedPaymentOption == "part_payment_cash" || selectedPaymentOption == "part_payment_transfer") {
      setValue('payment_status', 'PP')
    }
    else {
      setValue('payment_status', 'UP')
    }
  }, [selectedPaymentOption, setValue])


  const memoizedENQUIRY_PAYMENT_OPTIONS = useMemo(() => ENQUIRY_PAYMENT_OPTIONS, []);
  console.log(errors)



  return (
    <Dialog open={isModalOpen}>
      <DialogContent
        onPointerDownOutside={closeModal}
        className="p-0 !rounded-2xl sm:max-w-[465px] overflow-y-auto"
      >
        <div className="border-b border-[#E6E6E6] p-6 xl:p-8 !pb-4 xl:pb-5">
          <DialogTitle>Confirm Payment</DialogTitle>
          <DialogClose asChild>
            <Button className="absolute right-4 top-4" variant="ghost" size="icon" onClick={closeModal}>
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>

          <div className="flex flex-col gap-2.5 items-center p-6 my-0 xl:p-8 pb-0">
            <OrderTimeLine className="text-[#4A9725]" height={55} width={55} />
            <h3 className="text-[#194A7A] text-xl font-semibold mt-2">
              Confirm Payment
            </h3>
            <p className="text-[#828282] text-xs">
              This action converts Enquiries to Order
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
              <Controller
                name="payment_options"
                control={control}
                render={({ field }) => (
                  <SelectSingleCombo
                    {...field}
                    label="Payment Option"
                    valueKey="value"
                    labelKey="label"
                    options={memoizedENQUIRY_PAYMENT_OPTIONS}
                    placeholder="Select Payment Option"
                    hasError={!!errors.payment_options}
                    errorMessage={errors.payment_options?.message}
                  />
                )}
              />

              {(selectedPaymentOption === "paid_usd_transfer" || selectedPaymentOption === "paid_paypal" || selectedPaymentOption === "paid_bitcoin") && (
                <Controller
                  name="amount_paid_in_usd"
                  control={control}
                  render={({ field }) => (
                    <Input
                      label="Amount Paid (USD)"
                      id="amount_paid_in_usd"
                      className="col-span-3"
                      {...field}
                      hasError={!!errors.amount_paid_in_usd}
                      errorMessage={errors.amount_paid_in_usd?.message}
                    />
                  )}
                />
              )}

              {(selectedPaymentOption === "part_payment_cash" || selectedPaymentOption === "part_payment_transfer") && (
                <Controller
                  name="initial_amount_paid"
                  control={control}
                  render={({ field }) => (
                    <Input
                      label="Initial Amount Paid"
                      id="initial_amount_paid"
                      className=""
                      {...field}
                      hasError={!!errors.initial_amount_paid}
                      errorMessage={errors.initial_amount_paid?.message}
                    />
                  )}
                />
              )}

              {!(selectedPaymentOption === "paid_usd_transfer" || selectedPaymentOption === "paid_paypal" || selectedPaymentOption === "paid_bitcoin") && (
                <Controller
                  name="payment_currency"
                  control={control}
                  render={({ field }) => (
                    <SelectSingleCombo
                      {...field}
                      label="Currency"
                      valueKey="value"
                      labelKey="label"
                      options={[
                        { value: "NGN", label: "NGN" },
                        { value: "USD", label: "USD" },
                      ]}
                      placeholder="Select Currency"
                      hasError={!!errors.payment_currency}
                      errorMessage={errors.payment_currency?.message}
                    />
                  )}
                />
              )}

              <FilePicker
                onFileSelect={(file) => setValue("payment_proof", file!)}
                hasError={!!errors.payment_proof}
                errorMessage={errors.payment_proof?.message as string}
                maxSize={10}
                title="Upload Payment Proof"
              />

              <Controller
                name="payment_receipt_name"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Payment Receipt Name"
                    id="payment_receipt_name"
                    placeholder="Enter name in payment receipt"
                    className="col-span-3"
                    {...field}
                    hasError={!!errors.payment_receipt_name}
                    errorMessage={errors.payment_receipt_name?.message}
                  />
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type="submit" className='flex items-center justify-center gap-2 w-full h-14 mt-10'
                disabled={isPending || isUploading}
              >
                Confirm Payment
                {
                  (isPending || isUploading) && <Spinner size={20} />
                }
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
});

ConfirmPaymentModal.displayName = 'ConfirmPaymentModal';

export default ConfirmPaymentModal;

