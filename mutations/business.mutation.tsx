import { getAllBranches } from "@/apis/business.api"
import { useQuery } from "@tanstack/react-query"

export const useGetAllBusiness = () => {
    return useQuery({
        queryKey: ['getAllbusiness'],
        queryFn: getAllBranches,
        staleTime: Infinity,
        gcTime: 1000 * 60 * 60,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
    })
}
