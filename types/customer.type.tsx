export interface CustomerBehaviourStat {
    behaviour: string;
    count: number;
    percentage: string;
}

export interface CustomerBehaviourResponse {
    total_customers: number;
    stats: CustomerBehaviourStat[];
}
