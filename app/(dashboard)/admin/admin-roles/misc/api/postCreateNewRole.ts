import { APIAxios } from "@/utils/axios"
import { useMutation, useQueryClient } from "@tanstack/react-query"



interface CreateRoleData {
  name	: string;
}

const createRoleFn = async (data: CreateRoleData) => {
  const res = await APIAxios.post('/auth/create-role/', data)
  return res.data
}

export const useCreateRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createRoleFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['getAllRoles']
      })
    },
  })
}

