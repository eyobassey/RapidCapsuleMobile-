import api from './api';

export const prescriptionsService = {
  // ── Unified fetch: all 6 sources, merged & deduped ──
  async fetchAll() {
    const results = await Promise.allSettled([
      api.get('prescriptions/specialist'),
      api.get('prescriptions/internal'),
      api.get('prescriptions/external'),
      api.get('pharmacy-orders/my-orders?page=1&limit=100'),
      api.get('patient/prescriptions'),
      api.get('pharmacy/prescriptions/my-uploads'),
    ]);

    const extract = (r: PromiseSettledResult<any>) =>
      r.status === 'fulfilled' ? (r.value.data.data || r.value.data.result || []) : [];

    // Specialist prescriptions
    const specialistData = (Array.isArray(extract(results[0])) ? extract(results[0]) : []).map(
      (p: any) => ({...p, type: 'INTERNAL', prescription_source: 'specialist'}),
    );

    // Internal (old format)
    const internalData = (Array.isArray(extract(results[1])) ? extract(results[1]) : []).map(
      (p: any) => ({...p, type: 'INTERNAL', prescription_source: 'internal'}),
    );

    // External prescriptions
    const externalData = (Array.isArray(extract(results[2])) ? extract(results[2]) : []).map(
      (p: any) => ({...p, type: 'EXTERNAL', prescription_source: 'external'}),
    );

    // Pharmacy orders
    const ordersRaw = extract(results[3]);
    const ordersList = Array.isArray(ordersRaw) ? ordersRaw : ordersRaw?.orders || [];
    const ordersData = ordersList.map((o: any) => ({
      ...o,
      prescription_number: o.order_number,
      type: 'ORDER',
      prescription_source: 'pharmacy_order',
      items: (o.items || []).map((item: any) => ({
        drug_name: item.drug?.name || item.drug_name || 'Unknown Drug',
        drug_id: item.drug?._id || item.drug,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      })),
      created_at: o.createdAt || o.created_at,
    }));

    // Patient self-service prescriptions
    const patientRaw = extract(results[4]);
    const patientList = Array.isArray(patientRaw) ? patientRaw : patientRaw?.docs || [];
    const patientData = patientList.map((p: any) => ({
      ...p,
      type: 'INTERNAL',
      prescription_source: 'specialist_self_service',
      is_self_service: true,
    }));

    // Patient uploads (verification system)
    const uploadsRaw = extract(results[5]);
    const uploadsList = Array.isArray(uploadsRaw)
      ? uploadsRaw
      : uploadsRaw?.uploads || [];
    const VSTATUS_MAP: Record<string, string> = {
      PENDING: 'pending',
      TIER1_PROCESSING: 'verifying',
      TIER1_PASSED: 'verified',
      TIER1_FAILED: 'verification_failed',
      TIER2_PROCESSING: 'verifying',
      TIER2_PASSED: 'verified',
      TIER2_FAILED: 'verification_failed',
      PHARMACIST_REVIEW: 'under_review',
      APPROVED: 'approved',
      REJECTED: 'rejected',
      EXPIRED: 'expired',
    };
    const uploadsData = uploadsList.map((p: any) => {
      const displayStatus = VSTATUS_MAP[p.verification_status] || p.verification_status?.toLowerCase() || 'pending';
      const usedInOrders = p.used_in_orders || [];
      const prescriptionNumber =
        p.prescription_number ||
        p.digital_signature?.reference_number ||
        `RX-${(p.created_at ? new Date(p.created_at).toISOString().slice(0, 10).replace(/-/g, '') : '00000000')}-${(p._id?.slice(-4) || '0000').toUpperCase()}`;
      return {
        ...p,
        type: 'EXTERNAL',
        prescription_source: 'patient_upload',
        prescription_number: prescriptionNumber,
        status: usedInOrders.length > 0 ? 'used_in_order' : displayStatus,
        verification_status: p.verification_status,
        items: (p.ocr_data?.medications || p.verified_medications || []).map((med: any) => ({
          drug_name: med.name || med.matched_drug_name || med.prescription_medication_name,
          dosage: med.dosage,
          quantity: med.quantity,
          instructions: med.instructions,
        })),
      };
    });

    // Combine, dedup by _id, sort newest first
    const all = [
      ...specialistData,
      ...internalData,
      ...externalData,
      ...ordersData,
      ...patientData,
      ...uploadsData,
    ];
    const seen = new Set<string>();
    const unique = all.filter((p: any) => {
      const key = p._id || p.prescription_number;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    unique.sort(
      (a: any, b: any) =>
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
    );
    return unique;
  },

  // Single-source list (legacy, for status filtering)
  async list(params?: Record<string, any>) {
    const res = await api.get('/patient/prescriptions', {params});
    return res.data.data || res.data.result;
  },

  async getById(id: string) {
    const res = await api.get(`/patient/prescriptions/${id}`);
    return res.data.data || res.data.result;
  },

  async accept(id: string) {
    const res = await api.post(`/patient/prescriptions/${id}/accept`);
    return res.data.data || res.data.result;
  },

  async decline(id: string) {
    const res = await api.post(`/patient/prescriptions/${id}/decline`);
    return res.data.data || res.data.result;
  },

  async requestRefill(id: string) {
    const res = await api.post(`/patient/prescriptions/${id}/refill`);
    return res.data.data || res.data.result;
  },

  async initializeCardPayment(id: string) {
    const res = await api.post(`/patient/prescriptions/${id}/pay/card/initialize`);
    return res.data.data || res.data.result;
  },

  async verifyCardPayment(id: string, reference: string) {
    const res = await api.post(`/patient/prescriptions/${id}/pay/card/verify`, {reference});
    return res.data.data || res.data.result;
  },

  async payWithWallet(id: string) {
    const res = await api.post(`/patient/prescriptions/${id}/pay/wallet`);
    return res.data.data || res.data.result;
  },

  async ratePrescription(id: string, payload: {rating: number; review?: string}) {
    const res = await api.post(`/patient/prescriptions/${id}/rate`, payload);
    return res.data.data || res.data.result;
  },

  async getPdf(id: string) {
    const res = await api.get(`/patient/prescriptions/${id}/pdf`);
    return res.data.data || res.data.result;
  },

  async getRefillEligibility(id: string) {
    const res = await api.get(`/patient/prescriptions/${id}/refill/eligibility`);
    return res.data.data || res.data.result;
  },

  async getRefillHistory(id: string) {
    const res = await api.get(`/patient/prescriptions/${id}/refill/history`);
    return res.data.data || res.data.result;
  },
};
