export interface DashboardStats {
  totalClients: number;
  totalCases: number;
  enAttente: number;
  enTraitement: number;
  rdvOk: number;
  visaOk: number;
  refuse: number;
}

export interface MonthlyApplications {
  month: string;
  applications: number;
  approved: number;
  refused: number;
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
  approvalRate: number;
}
