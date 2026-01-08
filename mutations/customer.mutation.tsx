import { getCustomerBehaviourStats } from "@/apis/customers.api"
import { useQuery } from "@tanstack/react-query"


export const useGetCustomerBehaviourStats = () => {
    return useQuery({
        queryKey: ['customer-behavior-stats'],
        queryFn: getCustomerBehaviourStats,
        staleTime: Infinity,
        gcTime: 1000 * 60 * 60,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
    })
}