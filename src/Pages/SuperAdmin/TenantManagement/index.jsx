import TenantsPage from "../../SuperAdmin/TenantManagement/TenantsPage";

export const PaidTenants = () => <TenantsPage planFilter="PAID" />;
export const FreeTenants = () => <TenantsPage planFilter="FREE" />;