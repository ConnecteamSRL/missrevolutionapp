import React from 'react';

import DocumentoLegaleScreen from '@components/core/DocumentoLegaleScreen';
import { useDocumentiLegali } from '@/src/hooks/content/useDocumentiLegali';

export default function TerminiScreen() {
  const { data, loading, error, refetch } = useDocumentiLegali();

  return (
    <DocumentoLegaleScreen
      title="Termini d’uso"
      html={data?.terms_html ?? null}
      loading={loading}
      hasError={!!error}
      onRetry={refetch}
      errorText="Impossibile caricare i Termini d’uso. Riprova."
      emptyText="I Termini d’uso non sono ancora disponibili."
    />
  );
}
