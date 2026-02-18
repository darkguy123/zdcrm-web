"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { FaDotCircle } from "react-icons/fa";

import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SelectSingleCombo, Spinner, SuccessModal } from "@/components/ui";
import SelectBranchMultiCombo from '@/components/ui/selectBranchMultiCombo'
import { useBooleanStateControl } from "@/hooks";
import useErrorModalState from "@/hooks/useErrorModalState";

import { useGetRoles, UseSendInviteToEmployee } from "./misc/api";
import ErrorModal from "@/components/ui/modal-error";
import { extractErrorMessage } from "@/utils/errors";
import { cn } from "@/lib/utils";


const inviteEmployeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z
    .string({
      message: "Select role",
    })
    .min(1, "Role is required"),
  // business_ids: z
  //   .array(
  //     z.coerce.number({
  //       required_error: "At least one branch must be selected",
  //       invalid_type_error: "Branch ID must be a number",
  //     })
  //   )
  //   .min(1, "At least one branch must be selected"),
});

type InviteEmployeeFormData = z.infer<typeof inviteEmployeeSchema>;

const InviteEmployeePage = () => {
  const {
    state: isSuccessModalOpen,
    setTrue: openSuccessModal,
    setFalse: closeSuccessModal,
  } = useBooleanStateControl();

  const {
    handleSubmit, control,
    reset, setValue,
    register, watch,
    formState: { errors },
  } = useForm<InviteEmployeeFormData>({
    resolver: zodResolver(inviteEmployeeSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "",
      // business_ids: [],
    },
  });
  const { data, isLoading: isLoadingRoles } = useGetRoles()
  const { mutate, isPending } = UseSendInviteToEmployee()
  const {
    isErrorModalOpen,
    errorModalMessage,
    openErrorModalWithMessage,
    closeErrorModal,
    setErrorModalState
  } = useErrorModalState()

  const onSubmit = (data: InviteEmployeeFormData) => {
    mutate({
      role: data.role,
      email: data.email,
      // business_ids: data.business_ids
    }, {
      onSuccess(data, variables, context) {
        openSuccessModal();
        reset();
      },
      onError(error: unknown) {
        const errorMessage = extractErrorMessage(error as any)
        openErrorModalWithMessage(errorMessage)
      },
    })
  };

  return (
    <section className="mt-7 mx-10 rounded-xl bg-white border-[1px] border-[#0F172B1A]">
      <div className="border-b-[1px] border-[#E0E0E0] pl-6 pt-9 pb-5 relative">
        <p className="font-medium">Invite New Employee</p>
        <div className="bg-[#194A7A] w-[156px] h-[3px] absolute bottom-0" />
      </div>
      <div className="mx-6 my-10 bg-[#FCFCFC] h-auto flex flex-col gap-16 items-center pt-[73px] pb-[52px]">
        <div className="flex flex-col gap-2 items-center">
          <FaDotCircle color="#2463EB" />
          <p className="font-semibold">Employee Details</p>
          <p className="text-[#194A7A]">Please provide employee’s details</p>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 w-[392px] bg-white px-4 py-6"
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="text"
                className="h-16"
                placeholder="Enter employee's name"
                hasError={!!errors.name}
                errorMessage={errors?.name?.message}
              />
            )}
          />

          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="email"
                className="h-16"
                placeholder="Enter email address"
                hasError={!!errors.email}
                errorMessage={errors?.email?.message}
              />
            )}
          />

          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <>
                {
                  (isLoadingRoles || !data) ?
                    <Button
                      variant="inputButton"
                      size="inputButton"
                      className={cn('flex w-full items-center justify-between gap-2 text-left text-sm transition duration-300')}
                      type="button"
                    >
                      <span>
                        Loading roles...
                      </span>
                      <svg
                        className={"ml-2  shrink-0 opacity-70 transition-transform duration-300"}
                        fill="none"
                        height={7}
                        viewBox="0 0 12 7"
                        width={12}
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          className={'fill-label-text'}
                          clipRule="evenodd"
                          d="M8.357 5.522a3.333 3.333 0 0 1-4.581.126l-.133-.126L.41 2.089A.833.833 0 0 1 1.51.84l.078.07L4.82 4.342c.617.617 1.597.65 2.251.098l.106-.098L10.411.91a.833.833 0 0 1 1.248 1.1l-.07.079-3.232 3.433Z"
                          fill={"#032282"}
                          fillRule="evenodd"
                        />
                      </svg>
                    </Button>
                    :
                    <SelectSingleCombo
                      isLoadingOptions={isLoadingRoles}
                      valueKey="name"
                      labelKey="name"
                      options={data!}
                      onChange={(e) => setValue('role', e)}
                      name="role"
                      placeholder="Select role"
                      value={watch('role')}
                      hasError={!!errors.role}
                      errorMessage={errors?.role?.message}
                    />
                }
              </>
            )}
          />

          {/* <Controller
            name="business_ids"
            control={control}
            render={({ field }) => (
              <SelectBranchMultiCombo
                value={field.value.map((v) => String(v))}
                onChange={(vals) =>
                  field.onChange(vals.map((v: string | number) => Number(v)))
                }
                name="business_ids"
                placeholder="Select branch(es)"
                hasError={!!errors.business_ids}
                errorMessage={
                  errors?.business_ids
                    ? String(
                      (errors.business_ids as any)?.message ??
                      (errors.business_ids as any)
                    )
                    : undefined
                }
              />
            )}
          /> */}

          <div className="flex flex-col gap-6">
            <p className="text-sm text-center mt-4">
              Recipient will receive an invite email notification and must
              accept notification prompt on or before 3days
            </p>
            <Button
              type="submit"
              className="h-14 flex gap-4 bg-[#090909] rounded-xl text-[18px] px-7"
            >
              Invite
              {
                isPending && <Spinner size={18} />
              }
            </Button>
          </div>
        </form>
      </div>

      <SuccessModal
        isModalOpen={isSuccessModalOpen}
        closeModal={closeSuccessModal}
        heading="New Invitation Sent Successfully"
      />
      <ErrorModal
        heading='An error Occured'
        subheading={errorModalMessage || "Check your inputs"}
        isErrorModalOpen={isErrorModalOpen}
        setErrorModalState={setErrorModalState}
      >
        <div className="p-5 rounded-t-2xl rounded-b-3xl bg-red-200">
          <Button variant="destructive" className='w-full' onClick={closeErrorModal}>
            Okay
          </Button>
        </div>
      </ErrorModal>
    </section>
  );
};

export default InviteEmployeePage;
