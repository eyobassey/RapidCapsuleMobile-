import {LinkingOptions} from '@react-navigation/native';

const linking: LinkingOptions<any> = {
  prefixes: ['rapidcapsule://', 'https://rapidcapsule.com'],
  config: {
    screens: {
      Main: {
        screens: {
          Home: {
            screens: {
              HomeScreen: 'home',
              Notifications: 'notifications',
              Vitals: 'vitals',
              HealthCheckupHistory: 'health-checkup/history',
              HealthCheckupDetail: 'health-checkup/:id',
            },
          },
          Bookings: {
            screens: {
              AppointmentsList: 'bookings',
              AppointmentDetail: 'appointments/:id',
            },
          },
          Eka: 'eka',
          Pharmacy: {
            screens: {
              PharmacyHome: 'pharmacy',
              DrugDetail: 'pharmacy/drug/:drugId',
              OrderDetail: 'pharmacy/order/:orderId',
            },
          },
          Profile: {
            screens: {
              ProfileHome: 'profile',
              PrescriptionsList: 'prescriptions',
              PrescriptionDetail: 'prescriptions/:id',
            },
          },
        },
      },
      Auth: {
        screens: {
          Login: 'login',
        },
      },
      Onboarding: {
        screens: {
          ProfileBridge: 'onboarding',
        },
      },
    },
  },
};

export default linking;
