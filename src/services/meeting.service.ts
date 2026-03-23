import { Alert, Linking, Platform } from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MeetingChannel =
  | 'zoom'
  | 'google_meet'
  | 'microsoft_teams'
  | 'whatsapp'
  | 'phone'
  | 'in_person';

export interface MeetingDetails {
  channel: MeetingChannel | string;
  /** Direct join URL (Zoom join link, Meet URL, Teams link, etc.) */
  joinUrl?: string;
  /** Zoom-specific numeric meeting ID */
  meetingId?: string | number;
  /** Zoom meeting password */
  password?: string;
  /** Host / participant display name */
  displayName?: string;
  /** Physical address for in-person appointments */
  address?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extracts the numeric meeting ID from a Zoom join URL.
 * e.g. "https://zoom.us/j/12345678901?pwd=abc" → "12345678901"
 */
function extractZoomMeetingId(url: string): string | null {
  const match = url.match(/zoom\.us\/j\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Extracts the password from a Zoom join URL.
 * e.g. "https://zoom.us/j/123?pwd=abcXYZ" → "abcXYZ"
 */
function extractZoomPassword(url: string): string | null {
  const match = url.match(/[?&]pwd=([^&]+)/);
  return match ? match[1] : null;
}

/**
 * Builds the Zoom native app deep link.
 * Zoom will handle authentication internally when the user has the app installed.
 */
function buildZoomDeepLink(meetingId: string, password?: string, displayName?: string): string {
  // iOS uses zoommtg://, Android uses zoomus://
  const scheme = Platform.OS === 'android' ? 'zoomus' : 'zoommtg';
  const name = encodeURIComponent(displayName ?? 'Guest');
  const confno = meetingId.replace(/\D/g, ''); // strip any formatting
  let url = `${scheme}://zoom.us/join?confno=${confno}&uname=${name}&zc=0&browser=chrome`;
  if (password) {
    url += `&pwd=${encodeURIComponent(password)}`;
  }
  return url;
}

/**
 * Builds the Zoom web fallback URL.
 */
function buildZoomWebUrl(meetingId: string, password?: string): string {
  let url = `https://zoom.us/j/${meetingId.replace(/\D/g, '')}`;
  if (password) {
    url += `?pwd=${encodeURIComponent(password)}`;
  }
  return url;
}

// ─── Main service ─────────────────────────────────────────────────────────────

export const meetingService = {
  /**
   * Launches the appropriate meeting app or URL for the given appointment.
   * Priority order for Zoom:
   *   1. Native Zoom app via deep link (best experience — no re-auth if logged in)
   *   2. Zoom web URL in browser (fallback)
   */
  async join(details: MeetingDetails): Promise<void> {
    const { channel, joinUrl, meetingId, password, displayName, address } = details;

    switch (channel) {
      case 'zoom': {
        // Resolve meeting ID and password from dedicated fields or by parsing the URL.
        const numericId =
          meetingId != null
            ? String(meetingId)
            : joinUrl
            ? extractZoomMeetingId(joinUrl) ?? null
            : null;

        const resolvedPwd =
          password ?? (joinUrl ? extractZoomPassword(joinUrl) ?? undefined : undefined);

        if (numericId) {
          const deepLink = buildZoomDeepLink(numericId, resolvedPwd, displayName);
          try {
            // Attempt native Zoom app deep link first.
            await Linking.openURL(deepLink);
          } catch {
            // Zoom app not installed — fall back to web URL.
            const webUrl = buildZoomWebUrl(numericId, resolvedPwd);
            await Linking.openURL(webUrl);
          }
          return;
        }

        // No meeting ID — use join_url directly as last resort.
        if (joinUrl) {
          await Linking.openURL(joinUrl);
          return;
        }

        Alert.alert('Meeting unavailable', 'The Zoom meeting details are not available yet.');
        break;
      }

      case 'google_meet':
      case 'microsoft_teams': {
        if (joinUrl) {
          await Linking.openURL(joinUrl);
        } else {
          Alert.alert('Meeting unavailable', 'The meeting link is not available yet.');
        }
        break;
      }

      case 'whatsapp': {
        const url = joinUrl ?? 'https://wa.me/';
        try {
          const native = joinUrl
            ? joinUrl.replace('https://wa.me', 'whatsapp://send')
            : 'whatsapp://';
          await Linking.openURL(native);
        } catch {
          await Linking.openURL(url);
        }
        break;
      }

      case 'phone': {
        const phone = joinUrl?.replace(/[^+\d]/g, '');
        if (phone) {
          await Linking.openURL(`tel:${phone}`);
        } else {
          Alert.alert('No phone number', 'A phone number was not provided for this appointment.');
        }
        break;
      }

      case 'in_person': {
        const query = encodeURIComponent(address ?? 'appointment location');
        const mapsUrl =
          Platform.OS === 'ios' ? `maps://?q=${query}` : `https://maps.google.com/?q=${query}`;
        const canOpen = await Linking.canOpenURL(mapsUrl);
        await Linking.openURL(canOpen ? mapsUrl : `https://maps.google.com/?q=${query}`);
        break;
      }

      default: {
        if (joinUrl) {
          await Linking.openURL(joinUrl);
        } else {
          Alert.alert('Meeting unavailable', 'No meeting link is available for this appointment.');
        }
      }
    }
  },

  /** Returns true if this channel type requires a link to be opened. */
  isLaunchable(channel: string): boolean {
    return channel !== 'in_person';
  },

  /**
   * Resolves the best available join URL from an appointment object.
   * Checks all known field name variants the backend may return.
   */
  resolveJoinUrl(appointment: any): string | undefined {
    return (
      appointment?.join_url ||
      appointment?.zoom_meeting_url ||
      appointment?.meeting_link ||
      appointment?.zoom_link ||
      appointment?.meeting_url ||
      undefined
    );
  },

  resolvePhone(appointment: any): string | undefined {
    return appointment?.phone_number || appointment?.contact_phone || undefined;
  },
};
