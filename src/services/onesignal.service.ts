import { OneSignal, NotificationClickEvent } from 'react-native-onesignal';
import { navigateFromOutside } from '../navigation/navigationRef';

const ONESIGNAL_APP_ID = '3cb7d355-8cb3-492a-9fdd-116469b658c5';

/**
 * Map notification type → navigation target.
 * The backend sends `additionalData.type` and optional entity IDs.
 */
function handleNotificationClick(event: NotificationClickEvent) {
  const data = event.notification.additionalData as Record<string, any> | undefined;

  if (!data?.type) {
    // No routing info — just open the app (default behaviour)
    return;
  }

  switch (data.type) {
    case 'appointment':
      if (data.appointmentId) {
        navigateFromOutside('Main', {
          screen: 'Bookings',
          params: { screen: 'AppointmentDetail', params: { id: data.appointmentId } },
        });
      } else {
        navigateFromOutside('Main', { screen: 'Bookings' });
      }
      break;

    case 'prescription':
      if (data.prescriptionId) {
        navigateFromOutside('Main', {
          screen: 'Profile',
          params: { screen: 'PrescriptionDetail', params: { id: data.prescriptionId } },
        });
      } else {
        navigateFromOutside('Main', {
          screen: 'Profile',
          params: { screen: 'PrescriptionsList' },
        });
      }
      break;

    case 'health_checkup':
      if (data.checkupId) {
        navigateFromOutside('Main', {
          screen: 'Home',
          params: { screen: 'HealthCheckupDetail', params: { id: data.checkupId } },
        });
      }
      break;

    case 'message':
      navigateFromOutside('Main', {
        screen: 'Home',
        params: { screen: 'ConversationsList' },
      });
      break;

    case 'order':
      if (data.orderId) {
        navigateFromOutside('Main', {
          screen: 'Pharmacy',
          params: { screen: 'OrderDetail', params: { orderId: data.orderId } },
        });
      }
      break;

    case 'health_insight_new':
    case 'health_insight_urgent':
    case 'health_insight':
      navigateFromOutside('Main', {
        screen: 'Home',
        params: { screen: 'HealthInsights' },
      });
      break;

    default:
      // Fall back to notifications screen
      navigateFromOutside('Main', {
        screen: 'Home',
        params: { screen: 'Notifications' },
      });
      break;
  }
}

/**
 * Initialise OneSignal SDK. Call once at app startup (before React tree mounts).
 */
export function initOneSignal() {
  OneSignal.initialize(ONESIGNAL_APP_ID);

  // Request push permission (iOS prompts the native dialog; Android auto-grants)
  OneSignal.Notifications.requestPermission(true);

  // Handle notification taps (foreground + background)
  OneSignal.Notifications.addEventListener('click', handleNotificationClick);
}

/**
 * Associate the logged-in user with their OneSignal player.
 * Call after successful login / token hydration.
 */
export function identifyOneSignalUser(userId: string) {
  OneSignal.login(userId);
}

/**
 * Disassociate the user on logout.
 */
export function clearOneSignalUser() {
  OneSignal.logout();
}
