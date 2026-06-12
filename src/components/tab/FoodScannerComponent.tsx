import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FoodIcon from '@components/ui/icons/FoodIcon';
import BarCodeIcon from '@components/ui/icons/BarCodeIcon';
import { colors, GraphitFonts } from '@/src/theme';
import { ScanCheck, ScanNutrient, ScanResponse, ScanStatus } from '@mr-types/barcode.types';
import { useProductScanner } from '@/src/hooks/content/useProductScanner';

// Colori verdetto (coerenti col resto dell'app)
const ALLOWED_COLOR = '#4CAF50'; // Verde
const REJECTED_COLOR = '#EF4444'; // Rosso
const WARNING_COLOR = '#F59E0B'; // Ambra (non valutabile)

const NUTRIENT_ROWS: { key: ScanNutrient; label: string }[] = [
  { key: 'carbs', label: 'Carboidrati' },
  { key: 'fat', label: 'Grassi' },
  { key: 'sugar', label: 'Zuccheri' },
  { key: 'protein', label: 'Proteine' },
];

type SimpleStatus = Exclude<ScanStatus, 'ok' | 'not_evaluable'>;

// Stati senza scheda prodotto: icona, titolo e messaggio
const SIMPLE_STATES: Record<SimpleStatus, { icon: string; title: string; message: string }> = {
  product_not_found: {
    icon: '🔍',
    title: 'Prodotto non trovato',
    message: 'Questo prodotto non è presente nel nostro archivio. Prova a scansionarlo di nuovo.',
  },
  no_objective: {
    icon: '🎯',
    title: 'Nessun obiettivo impostato',
    message:
      'Non risulta un obiettivo di fitness sul tuo profilo. Chiedi al tuo coach in palestra di impostarlo per usare lo scanner.',
  },
  invalid_barcode: {
    icon: '❓',
    title: 'Codice non riconosciuto',
    message: 'Inquadra il codice a barre del prodotto e riprova.',
  },
  error: {
    icon: '⚠️',
    title: 'Si è verificato un problema',
    message: 'Riprova più tardi.',
  },
};

// Arrotonda a 1 decimale e usa la virgola italiana
const formatNumber = (value: number): string =>
  String(Math.round(value * 10) / 10).replace('.', ',');

const formatGrams = (value: number | null | undefined): string =>
  value == null ? '—' : `${formatNumber(value)} g`;

const thresholdLabel = (check: ScanCheck): string =>
  `${check.comparator === 'max' ? 'max' : 'min'} ${formatNumber(check.threshold)}g`;

export default function FoodScannerComponent() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();

  const [cameraVisible, setCameraVisible] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const { scanProduct, isLoading } = useProductScanner();

  // Guard SINCRONO contro le scansioni multiple: la camera può emettere
  // decine di eventi per frame e lo state React è asincrono.
  const scanGuardRef = useRef(false);

  const handleOpenCamera = useCallback(async () => {
    if (!permission || !permission.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert('Permesso negato', 'Non puoi aprire la fotocamera senza autorizzazione.');
        return;
      }
    }
    scanGuardRef.current = false;
    setCameraVisible(true);
  }, [permission, requestPermission]);

  const handleBarcodeScanned = useCallback(
    async (result: { data: string; type: string }) => {
      if (scanGuardRef.current) return;
      scanGuardRef.current = true;

      const response = await scanProduct(result.data);

      setScanResult(response);
      setCameraVisible(false);
      setResultVisible(true);
    },
    [scanProduct],
  );

  const closeResult = useCallback(() => {
    setResultVisible(false);
    setScanResult(null);
  }, []);

  const handleScanAgain = useCallback(() => {
    setResultVisible(false);
    setScanResult(null);
    // su iOS presentare un Modal mentre un altro si sta chiudendo può far
    // fallire la presentazione del secondo: piccola attesa tra i due
    setTimeout(() => {
      void handleOpenCamera();
    }, 400);
  }, [handleOpenCamera]);

  // Tabella valori nutrizionali: colonne "per 100 g" / "per porzione",
  // righe in rosso per i check falliti con la soglia violata accanto al valore.
  const renderNutritionTable = (result: ScanResponse) => {
    const nutritionalValues = result.nutritional_values;
    if (!nutritionalValues) return null;

    const checks = result.checks ?? [];
    const servingDerived = nutritionalValues.per_serving?.derived === true;

    let showDerivedNote = false;

    const rows = NUTRIENT_ROWS.map(({ key, label }) => {
      const failed100 = checks.find(
        (c) => c.nutrient === key && c.basis === 'per_100g' && c.passed === false,
      );
      const failedServing = checks.find(
        (c) => c.nutrient === key && c.basis === 'per_serving' && c.passed === false,
      );
      const isFailed = Boolean(failed100 || failedServing);

      const value100 = nutritionalValues.per_100g?.[key];
      const valueServing = nutritionalValues.per_serving?.[key];
      const isDerived =
        valueServing != null &&
        (servingDerived ||
          checks.some((c) => c.nutrient === key && c.basis === 'per_serving' && c.value_derived));
      if (isDerived) showDerivedNote = true;

      return (
        <View key={key} style={[styles.tableRow, isFailed && styles.tableRowFailed]}>
          <View style={styles.tableColLabel}>
            <Text style={[styles.tableLabelText, isFailed && styles.tableTextFailed]}>{label}</Text>
          </View>
          <View style={styles.tableColValue}>
            <Text style={[styles.tableValueText, isFailed && styles.tableTextFailed]}>
              {formatGrams(value100)}
            </Text>
            {failed100 && <Text style={styles.thresholdText}>{thresholdLabel(failed100)}</Text>}
          </View>
          <View style={styles.tableColValue}>
            <Text style={[styles.tableValueText, isFailed && styles.tableTextFailed]}>
              {formatGrams(valueServing)}
              {isDerived ? ' *' : ''}
            </Text>
            {failedServing && (
              <Text style={styles.thresholdText}>{thresholdLabel(failedServing)}</Text>
            )}
          </View>
        </View>
      );
    });

    return (
      <>
        <View style={styles.tableContainer}>
          <View style={styles.tableHeaderRow}>
            <View style={styles.tableColLabel}>
              <Text style={styles.tableHeaderText}>Valori</Text>
            </View>
            <View style={styles.tableColValue}>
              <Text style={styles.tableHeaderText}>per 100 g</Text>
            </View>
            <View style={styles.tableColValue}>
              <Text style={[styles.tableHeaderText, styles.tableHeaderRight]} numberOfLines={1}>
                per porzione
              </Text>
            </View>
          </View>
          {rows}
        </View>
        {showDerivedNote && <Text style={styles.derivedNote}>* stimato dal peso porzione</Text>}
      </>
    );
  };

  // Stati con scheda prodotto: 'ok' (consentito/non adatto) e 'not_evaluable'
  const renderProductResult = (result: ScanResponse) => {
    const isOk = result.status === 'ok';
    const allowed = result.is_allowed === true;
    const header = isOk
      ? allowed
        ? { color: ALLOWED_COLOR, icon: '✅', title: 'Prodotto Consentito' }
        : { color: REJECTED_COLOR, icon: '🚫', title: 'Prodotto Non Adatto' }
      : { color: WARNING_COLOR, icon: '⚠️', title: 'Non valutabile' };

    const product = result.product;
    const productName = product?.name ?? result.product_name ?? 'Prodotto senza nome';
    // peso porzione normalizzato ("50 gr" → "50 g"), mostrato nella scheda prodotto
    const servingGrams = product?.serving_quantity_g ?? null;
    const servingLabel =
      servingGrams != null
        ? `${formatNumber(servingGrams)} g`
        : (result.nutritional_values?.per_serving?.serving_size ?? product?.serving_size ?? null);
    // motivi mostrati sia per il verdetto negativo sia per "non valutabile"
    // (in quel caso dicono esattamente quale dato manca)
    const showReasons = (isOk && !allowed) || !isOk;
    const failedReasons = showReasons ? (result.reasons ?? []) : [];

    return (
      <View style={styles.resultCard}>
        <View style={[styles.resultHeader, { backgroundColor: header.color }]}>
          <Text style={styles.resultHeaderIcon}>{header.icon}</Text>
          <Text style={styles.resultHeaderTitle}>{header.title}</Text>
          {!isOk && (
            <Text style={styles.resultHeaderSubtitle}>
              Mancano alcuni dati nutrizionali necessari per dare un verdetto su questo prodotto.
            </Text>
          )}
        </View>

        <ScrollView style={styles.resultScroll} contentContainerStyle={styles.resultScrollContent}>
          <View style={styles.productRow}>
            {product?.image_url ? (
              <Image
                source={{ uri: product.image_url }}
                style={styles.productImage}
                contentFit="contain"
              />
            ) : (
              <View style={[styles.productImage, styles.productImageFallback]}>
                <FoodIcon size={28} color={colors.secondary} />
              </View>
            )}
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={2}>
                {productName}
              </Text>
              {product?.brand ? <Text style={styles.productBrand}>{product.brand}</Text> : null}
              {servingLabel ? (
                <Text style={styles.productServing}>Porzione: {servingLabel}</Text>
              ) : null}
            </View>
          </View>

          {renderNutritionTable(result)}

          {failedReasons.length > 0 && (
            <View style={[styles.reasonsContainer, !isOk && styles.reasonsContainerWarning]}>
              {failedReasons.map((reason, index) => (
                <Text key={index} style={[styles.reasonText, !isOk && styles.reasonTextWarning]}>
                  • {reason}
                </Text>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={styles.resultActions}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleScanAgain}>
            <Text style={styles.primaryButtonText}>Scansiona un altro</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={closeResult}>
            <Text style={styles.secondaryButtonText}>Chiudi</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Stati senza prodotto: product_not_found / no_objective / invalid_barcode / error
  const renderSimpleResult = (result: ScanResponse) => {
    const info =
      result.status in SIMPLE_STATES
        ? SIMPLE_STATES[result.status as SimpleStatus]
        : SIMPLE_STATES.error;

    return (
      <View style={styles.resultCard}>
        <View style={styles.simpleBody}>
          <Text style={styles.simpleIcon}>{info.icon}</Text>
          <Text style={styles.simpleTitle}>{info.title}</Text>
          <Text style={styles.simpleMessage}>{info.message}</Text>
          {result.status === 'product_not_found' && result.barcode ? (
            <Text style={styles.simpleBarcode}>Codice scansionato: {result.barcode}</Text>
          ) : null}
        </View>

        <View style={styles.resultActions}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleScanAgain}>
            <Text style={styles.primaryButtonText}>Riprova</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={closeResult}>
            <Text style={styles.secondaryButtonText}>Chiudi</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderResultContent = () => {
    if (!scanResult) return null;

    if (scanResult.status === 'ok' || scanResult.status === 'not_evaluable') {
      return renderProductResult(scanResult);
    }
    return renderSimpleResult(scanResult);
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleWrapper}>
        <FoodIcon size={36} color="#ED5192" />
        <Text style={styles.title}>Scanner alimenti</Text>
      </View>

      <TouchableOpacity style={styles.scanButton} activeOpacity={0.9} onPress={handleOpenCamera}>
        <View style={styles.buttonContent}>
          <BarCodeIcon size={18} color="#000" />
          <Text style={styles.scanButtonText}>Scansiona prodotto</Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={cameraVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setCameraVisible(false)}
      >
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'],
            }}
            onBarcodeScanned={handleBarcodeScanned}
          />

          {/* Overlay Caricamento durante la scansione */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#ED5192" />
              <Text style={{ color: 'white', marginTop: 10 }}>Analisi in corso...</Text>
            </View>
          )}

          <View
            style={[
              styles.cameraOverlay,
              {
                paddingTop: 24 + insets.top,
                paddingBottom: 16 + insets.bottom,
              },
            ]}
          >
            {/* UI Camera esistente */}
            {!isLoading && (
              <>
                <View style={styles.overlayTop}>
                  <Text style={styles.overlayTitle}>Inquadra il codice a barre</Text>
                </View>
                <View style={styles.scanFrame} />
                <View style={styles.overlayBottom}>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setCameraVisible(false)}
                  >
                    <Text style={styles.closeButtonText}>Chiudi</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* --- Modale Risultato --- */}
      <Modal
        visible={resultVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={closeResult}
      >
        <View style={styles.modalBackground}>{renderResultContent()}</View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: '100%',
    minHeight: 140,
    flexGrow: 0,
    flexShrink: 0,
    alignSelf: 'stretch',
  },
  titleWrapper: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontFamily: GraphitFonts.GraphitRegular,
    color: colors.white,
  },
  scanButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 26,
    paddingVertical: 18,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 8,
  },
  scanButtonText: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 16,
    color: '#000',
  },
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  overlayTop: { alignItems: 'center', marginTop: 12 },
  overlayTitle: { fontFamily: GraphitFonts.GraphitRegular, fontSize: 18, color: '#FFFFFF' },
  scanFrame: {
    alignSelf: 'center',
    width: '100%',
    height: '20%',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ED5192',
    backgroundColor: 'transparent',
  },
  overlayBottom: { alignItems: 'center' },
  closeButton: {
    backgroundColor: 'rgba(237, 81, 146, 0.4)',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
  },
  closeButtonText: { fontFamily: GraphitFonts.GraphitBold, color: '#FFF', fontSize: 16 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultCard: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: 24,
    backgroundColor: colors.white,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  resultHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  resultHeaderIcon: { fontSize: 44, marginBottom: 8 },
  resultHeaderTitle: {
    fontFamily: GraphitFonts.GraphitBold,
    fontSize: 22,
    color: colors.white,
    textAlign: 'center',
  },
  resultHeaderSubtitle: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    marginTop: 6,
  },
  resultScroll: { flexGrow: 0 },
  resultScrollContent: { padding: 20 },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F7F2FA',
  },
  productImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: { flex: 1 },
  productName: {
    fontFamily: GraphitFonts.GraphitBold,
    fontSize: 16,
    color: colors.text,
  },
  productBrand: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 13,
    color: '#6B6B6B',
    marginTop: 2,
  },
  productServing: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 12,
    color: '#6B6B6B',
    marginTop: 2,
  },
  tableContainer: {
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F7F2FA',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableHeaderText: {
    fontFamily: GraphitFonts.GraphitBold,
    fontSize: 12,
    color: colors.text,
  },
  tableHeaderRight: { textAlign: 'right' },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray,
  },
  tableRowFailed: { backgroundColor: 'rgba(239, 68, 68, 0.08)' },
  tableColLabel: { flex: 1.1, justifyContent: 'center' },
  tableColValue: { flex: 1, alignItems: 'flex-end' },
  tableLabelText: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 14,
    color: colors.text,
  },
  tableValueText: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 14,
    color: colors.text,
  },
  tableTextFailed: {
    fontFamily: GraphitFonts.GraphitBold,
    color: REJECTED_COLOR,
  },
  thresholdText: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 11,
    color: REJECTED_COLOR,
    marginTop: 2,
  },
  derivedNote: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 11,
    color: '#6B6B6B',
    marginTop: 8,
  },
  reasonsContainer: {
    marginTop: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 12,
    padding: 12,
  },
  reasonsContainerWarning: { backgroundColor: 'rgba(245, 158, 11, 0.1)' },
  reasonText: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 13,
    color: '#B91C1C',
    marginBottom: 4,
  },
  reasonTextWarning: { color: '#92400E' },
  simpleBody: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 8,
  },
  simpleIcon: { fontSize: 44, marginBottom: 12 },
  simpleTitle: {
    fontFamily: GraphitFonts.GraphitBold,
    fontSize: 20,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  simpleMessage: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 14,
    color: '#6B6B6B',
    textAlign: 'center',
    lineHeight: 20,
  },
  simpleBarcode: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 13,
    color: colors.text,
    marginTop: 10,
  },
  resultActions: {
    padding: 20,
    paddingTop: 8,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: colors.secondary,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: GraphitFonts.GraphitBold,
    fontSize: 16,
    color: colors.white,
  },
  secondaryButton: {
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: GraphitFonts.GraphitBold,
    fontSize: 15,
    color: '#6B6B6B',
  },
});
