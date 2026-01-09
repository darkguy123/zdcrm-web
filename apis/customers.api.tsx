import { customerUrl } from "@/constants/apiUrls";
import { CustomerBehaviourResponse } from "@/types/customer.type";
import { get } from "@/utils/axios";

export const getCustomerBehaviourStats = async () => {
    const response = await get<CustomerBehaviourResponse>(
        customerUrl.getBehaviorStats()
    );

    return response.data;
};