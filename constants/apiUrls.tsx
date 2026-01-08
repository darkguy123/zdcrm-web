
export const orderUrl = {
    getFinancialStats: (queryString = "") =>
        `/order/financial-stats/${queryString}`,
    getPaymentStatusStats: (queryString = "") =>
        `/order/payment-status-stats/${queryString}`,
    getPartPaymentStats: (queryString = "") =>
        `/order/part-payment-stats/${queryString}`,
};

export const inventoryUrl = {
    getInventoryChart: (queryString = "") =>
        `/inventory/alerts/${queryString}`,
}

export const businessUrl = {
    getAllBranches: () =>
        `/business/list`,
}

export const customerUrl = {
    getBehaviorStats: (queryString = "") =>
        `/customer/behaviour-stats/${queryString}`,
}