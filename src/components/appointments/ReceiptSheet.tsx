import { Download, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  Share,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generatePDF } from 'react-native-html-to-pdf';
import { colors } from '../../theme/colors';
import { buildReceiptHtml } from '../../utils/appointmentReceiptHtml';
import { Text } from '../ui';

interface ReceiptSheetProps {
  visible: boolean;
  onClose: () => void;
  data: {
    appointmentId: string;
    specialistName: string;
    specialty: string;
    date: string;
    time: string;
    appointmentType: string;
    consultationFee: string;
  };
}

function ReceiptRow({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: object;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
      }}
    >
      <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600', ...valueStyle }}>
        {value}
      </Text>
    </View>
  );
}

function Divider({ dashed }: { dashed?: boolean }) {
  return (
    <View
      style={{
        height: 1,
        borderWidth: 0,
        borderTopWidth: dashed ? 0 : 1,
        borderTopColor: colors.border,
        // dashed not natively supported; approximated with marginH
        marginHorizontal: dashed ? 0 : 0,
        opacity: dashed ? 0.6 : 1,
        borderStyle: dashed ? 'dashed' : 'solid',
      }}
    />
  );
}

export default function ReceiptSheet({ visible, onClose, data }: ReceiptSheetProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const receiptNumber = `RC-${(data.appointmentId || 'UNKNOWN').slice(-8).toUpperCase()}`;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const html = buildReceiptHtml({
        specialistName: data.specialistName,
        specialty: data.specialty,
        date: data.date,
        time: data.time,
        appointmentType: data.appointmentType,
        consultationFee: data.consultationFee,
        receiptNumber,
      });

      const result = await generatePDF({
        html,
        fileName: `receipt_${data.appointmentId}`,
        directory: Platform.OS === 'android' ? 'Downloads' : 'Documents',
      });

      if (!result.filePath) throw new Error('PDF generation failed');

      await Share.share(
        Platform.OS === 'ios'
          ? { url: `file://${result.filePath}` }
          : { title: `Receipt ${receiptNumber}`, message: `Receipt ${receiptNumber}` },
        Platform.OS === 'android' ? { dialogTitle: 'Share Receipt' } : undefined
      );
      // Note: On Android, file sharing via Share.share is limited.
      // For full file sharing support, consider react-native-share.
    } catch (err: any) {
      if (err?.message !== 'The user did not share') {
        Alert.alert('Download Failed', 'Could not generate the receipt PDF. Please try again.');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={['top', 'bottom']}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.foreground }}>
            Appointment Receipt
          </Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Brand + PAID badge */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: `${colors.primary}20`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '800', color: colors.primary }}>RC</Text>
              </View>
              <View>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.foreground }}>
                  RapidCapsule
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
                  Healthcare Platform
                </Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor: colors.success,
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 5,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
                PAID
              </Text>
            </View>
          </View>

          <Divider dashed />

          {/* Receipt number */}
          <View style={{ marginVertical: 20 }}>
            <Text style={{ fontSize: 19, fontWeight: '700', color: colors.foreground }}>
              Appointment Receipt
            </Text>
            <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 3 }}>
              Receipt #{receiptNumber}
            </Text>
          </View>

          {/* Appointment Details */}
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 16,
              marginBottom: 14,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                color: colors.mutedForeground,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                paddingTop: 14,
                paddingBottom: 4,
              }}
            >
              Appointment Details
            </Text>

            <ReceiptRow label="Date" value={data.date} />
            <Divider />
            <ReceiptRow label="Time" value={data.time} />
            <Divider />
            <ReceiptRow label="Specialist" value={data.specialistName} />
            <Divider />
            <ReceiptRow label="Category" value={data.specialty} />
            <Divider />
            <ReceiptRow
              label="Type"
              value={data.appointmentType}
              valueStyle={{ paddingBottom: 2 }}
            />
            <View style={{ height: 4 }} />
          </View>

          {/* Payment Details */}
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 16,
              marginBottom: 14,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                color: colors.mutedForeground,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                paddingTop: 14,
                paddingBottom: 4,
              }}
            >
              Payment Details
            </Text>

            <ReceiptRow label="Consultation Fee" value={data.consultationFee} />
            <Divider />

            {/* Total row */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 14,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.foreground }}>
                Total Paid
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.primary }}>
                {data.consultationFee}
              </Text>
            </View>
          </View>

          {/* Notice */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 10,
              backgroundColor: `${colors.primary}08`,
              borderRadius: 10,
              padding: 14,
              marginBottom: 14,
            }}
          >
            <Text style={{ fontSize: 15, color: colors.mutedForeground, lineHeight: 22 }}>ⓘ</Text>
            <Text style={{ flex: 1, fontSize: 12, color: colors.mutedForeground, lineHeight: 20 }}>
              This is your digital receipt for the consultation. For any queries, please contact
              support.
            </Text>
          </View>

          <Text
            style={{
              textAlign: 'center',
              fontSize: 11,
              color: colors.mutedForeground,
              opacity: 0.6,
              marginBottom: 8,
            }}
          >
            Generated by RapidCapsule · rapidcapsule.com
          </Text>
        </ScrollView>

        {/* Footer buttons */}
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 8,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            style={{
              flex: 1,
              height: 50,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground }}>Close</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDownload}
            disabled={isDownloading}
            style={{
              flex: 2,
              height: 50,
              borderRadius: 14,
              backgroundColor: isDownloading ? `${colors.primary}80` : colors.primary,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Download size={18} color="#fff" />
            )}
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>
              {isDownloading ? 'Generating…' : 'Download PDF'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
