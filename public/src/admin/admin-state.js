// Yönetim uygulamasının durumu (katılımcı uygulamasının durumundan ayrıdır).

export const adminState = {
  user: null, // oturum açmış araştırmacı (Firebase kullanıcısı) ya da null
  connectionError: '',
  adminError: '',
  allocationCache: null, // randomizasyon listesi: { kod: { grp, order, no, block } }
  enrollmentProgress: null, // { claimed, next }
  withdrawnCount: null,
  dashboard: null,
  dashboardBusy: false,
  dashboardAutoRefresh: false,
  participantUrlInput: '',
  landingUrlInput: '',
  posterEmail: '',
  posterFooter: '',
  selfTestResults: [],
};
