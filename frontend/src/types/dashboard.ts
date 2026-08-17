export interface DashboardStats {
  totalClients: number;
  totalCases: number;
  enAttente: number;
  enTraitement: number;
  rdvOk: number;
  incomplete: number;
  livree: number;
}

export interface MonthlyApplications {
  month: string;
  applications: number;
}

export interface CountryStat {
  country: string;
  count: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
}

export interface DashboardAnalytics {
  applicationsPerMonth: MonthlyApplications[];
  topCountries: CountryStat[];
  statusDistribution: StatusDistribution[];
}
