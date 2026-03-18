export {
  appointmentKeys,
  useAppointmentsQuery,
  useSpecialistsQuery,
  useAvailableTimesQuery,
  useCategoriesQuery,
  useBookAppointmentMutation,
  useRescheduleAppointmentMutation,
  useCancelAppointmentMutation,
} from './useAppointmentsQuery';

export {
  vitalKeys,
  useVitalsQuery,
  useRecentVitalsQuery,
  useVitalChartQuery,
  useLogVitalMutation,
} from './useVitalsQuery';

export {
  walletKeys,
  useWalletBalanceQuery,
  useTransactionsQuery,
  useFundWalletMutation,
} from './useWalletQuery';

export { healthScoreKeys, useHealthScoreQuery } from './useHealthScoreQuery';

export {
  prescriptionKeys,
  usePrescriptionsQuery,
  usePrescriptionQuery,
  useAcceptPrescriptionMutation,
  useDeclinePrescriptionMutation,
} from './usePrescriptionsQuery';

export {
  notificationKeys,
  useNotificationsQuery,
  useUnreadCountQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
} from './useNotificationsQuery';

export {
  notificationPreferencesKeys,
  useNotificationPreferencesQuery,
  useUpdatePreferenceMutation,
} from './useNotificationPreferencesQuery';

export {
  pharmacyKeys,
  usePharmacyCategoriesQuery,
  useFeaturedDrugsQuery,
  useDrugSearchQuery,
  useDrugsByCategoryQuery,
  useDrugQuery,
  useSimilarDrugsQuery,
  useMyOrdersQuery,
  useOrderQuery,
  useTrackOrderQuery,
  useAddressesQuery,
  usePharmacyQuery,
  usePharmacyWalletBalanceQuery,
  useAddAddressMutation,
  useSetDefaultAddressMutation,
  useCancelOrderMutation,
  useRateOrderMutation,
} from './usePharmacyQuery';

export {
  recoveryKeys,
  useRecoveryProfileQuery,
  useRecoveryDashboardQuery,
  useRecoveryStatsQuery,
  useRecoveryMilestonesQuery,
  useRecoveryEnrollmentsQuery,
  useRecoveryChartQuery,
  useCheckInMutation,
  useCelebrateMilestoneMutation,
} from './useRecoveryQuery';
