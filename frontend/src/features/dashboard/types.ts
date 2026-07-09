export interface DoctorDashboardData {
  totalPatients: number;
  totalPrescriptions: number;
  monthlyAppointments: number;
  monthlyPrescriptions: number;
  todaysPrescriptions: number;
  todaysPatients: number;
  monthlyData: number[];
}

export interface AdminDashboardData {
  totalDoctors: number;
  activeDoctors: number;
  totalPatients: number;
  totalPrescriptions: number;
  totalRevenue: number;
  pendingSubscriptions: number;
  pendingVerification: number;
  planDistribution: Array<{ plan: string; _count: number }>;
  subscriptionStatusDistribution: Array<{ status: string; _count: number }>;
}
