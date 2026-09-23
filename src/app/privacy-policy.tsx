import React from 'react';

import DocumentoLegaleScreen from '@components/core/DocumentoLegaleScreen';
import { usePrivacyPolicy } from '@/src/hooks/content/usePrivacyPolicy';

export default function PrivacyPolicyScreen() {
  const { html, loading, error, refetch } = usePrivacyPolicy();

  return (
    <DocumentoLegaleScreen
      title="Informativa privacy"
      html={html}
      loading={loading}
      hasError={!!error}
      onRetry={refetch}
      errorText="Impossibile caricare l’Informativa privacy. Riprova."
      emptyText="L’Informativa privacy non è ancora disponibile."
    />
  );
}
