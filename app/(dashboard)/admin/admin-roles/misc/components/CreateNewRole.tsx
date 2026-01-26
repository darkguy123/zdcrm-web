import React, { useState } from 'react'
import { GoPlus } from 'react-icons/go'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'

import {
    Button,
    Input,
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui'
import { Label } from '@radix-ui/react-label'

import { useCreateRole } from '../api/postCreateNewRole'

const schema = z.object({
    name: z
        .string()
        .min(1, 'Role name is required')
        .max(50, 'Role name must be 50 characters or less'),
})

type FormData = z.infer<typeof schema>

const CreateNewRole = () => {
    const [open, setOpen] = useState(false)
    const queryClient = useQueryClient()

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<FormData>({
        resolver: zodResolver(schema),
    })

    const createRole = useCreateRole()

    const onSubmit = (data: FormData) => {
        createRole.mutate(data, {
            onSuccess: () => {
                // 1️⃣ clear form
                reset()

                // 2️⃣ close modal
                setOpen(false)

                // 3️⃣ invalidate roles list
                queryClient.invalidateQueries({
                    queryKey: ['getAllRoles'],
                })

                toast.success('Role created successfully')
            },
            onError: () => {
                toast.error('Failed to create role')
            },
        })
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button className="h-12 flex gap-4 bg-[#111827] rounded-lg text-[16px] px-7">
                    <GoPlus size={24} /> Add New Role
                </Button>
            </SheetTrigger>

            <SheetContent className="w-[80vw] max-w-[400px]">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <SheetHeader>
                        <SheetTitle className="text-2xl font-bold pb-8">
                            Add New Role
                        </SheetTitle>

                        <SheetDescription className="flex flex-col gap-3">
                            <Label htmlFor="name" className="text-[#111827]">
                                Role Name <span className="text-red-500">*</span>
                            </Label>

                            <Input
                                id="name"
                                {...register('name')}
                                className="h-14"
                            />

                            {errors.name && (
                                <p className="text-red-500 text-sm">
                                    {errors.name.message}
                                </p>
                            )}
                        </SheetDescription>
                    </SheetHeader>

                    <SheetFooter className="mt-20">
                        <SheetClose asChild>
                            <Button
                                type="button"
                                className="w-full bg-white text-black border border-solid h-14"
                            >
                                Cancel
                            </Button>
                        </SheetClose>

                        <Button
                            type="submit"
                            className="w-full bg-[#111827] h-14"
                            disabled={createRole.isPending}
                        >
                            {createRole.isPending ? 'Creating...' : 'Create'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}

export default CreateNewRole
