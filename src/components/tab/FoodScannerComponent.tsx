import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { SaveFormat } from 'expo-image-manipulator';
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

type ScanMode = 'barcode' | 'photo';

const NUTRIENT_ROWS: { key: ScanNutrient; label: string }[] = [
  { key: 'carbs', label: 'Carboidrati' },
  { key: 'fat', label: 'Grassi' },
  { key: 'sugar', label: 'Zuccheri' },
  { key: 'protein', label: 'Proteine' },
];

type SimpleStatus = Exclude<ScanStatus, 'ok' | 'not_evaluable'>;

// Stati senza scheda prodotto: icona, titolo e messaggio di default.
// Il messaggio reale, quando la edge function lo fornisce (campo `error`),
// ha la precedenza -> testi/logica modificabili lato backend senza aggiornare l'app.
const SIMPLE_STATES: Record<SimpleStatus, { icon: string; title: string; message: string }> = {
  product_not_found: {
    icon: '🔍',
    title: 'Prodotto non trovato',
    message:
      'Questo prodotto non è presente nel nostro archivio. Puoi fotografare la sua tabella nutrizionale per analizzarlo lo stesso.',
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

// Interpreta i grammi digitati dall'utente (accetta la virgola italiana).
const parseGrams = (text: string): number | null => {
  const n = Number(text.trim().replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
};

const thresholdLabel = (check: ScanCheck): string =>
  `${check.comparator === 'max' ? 'max' : 'min'} ${formatNumber(check.threshold)}g`;

// Cattura -> ridimensiona/comprime -> base64. Tabelle: testo piccolo, non
// scendere troppo come risoluzione; più tentativi per stare sotto un tetto di
// dimensione (la edge function rifiuta payload troppo grandi).
async function compressToBase64(uri: string): Promise<string> {
  const attempts = [
    { width: 1600, compress: 0.7 },
    { width: 1280, compress: 0.6 },
    { width: 1024, compress: 0.5 },
  ];
  let last = '';
  for (const a of attempts) {
    const ctx = ImageManipulator.ImageManipulator.manipulate(uri);
    ctx.resize({ width: a.width });
    const ref = await ctx.renderAsync();
    const out = await ref.saveAsync({
      format: SaveFormat.JPEG,
      compress: a.compress,
      base64: true,
    });
    const b64 = out.base64 ?? '';
    last = b64;
    if (b64.length > 0 && b64.length <= 4_500_000) return b64; // ~3.4 MB binari
  }
  return last;
}

export default function FoodScannerComponent() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();

  const [cameraVisible, setCameraVisible] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [scanMode, setScanMode] = useState<ScanMode>('barcode');
  const [isCapturing, setIsCapturing] = useState(false);
  // Grammi della porzione digitati dall'utente.
  const [gramsInput, setGramsInput] = useState('');
  // Popup dedicato per l'inserimento dei grammi (posizionato in alto: la
  // tastiera non lo copre mai; numero come display grande e centrato).
  const [gramsDialogVisible, setGramsDialogVisible] = useState(false);
  const { scanProduct, scanProductPhoto, recomputeWithGrams, isLoading } = useProductScanner();

  const cameraRef = useRef<CameraView>(null);
  const gramsInputRef = useRef<TextInput>(null);
  // Guard SINCRONO contro le scansioni multiple: la camera può emettere
  // decine di eventi per frame e lo state React è asincrono.
  const scanGuardRef = useRef(false);

  const busy = isLoading || isCapturing;

  // Mostra un risultato nel modale e pre-compila il campo grammi col peso
  // porzione noto (se presente): così "mezza barretta" parte dal valore reale.
  const presentResult = useCallback((response: ScanResponse) => {
    const g = response.product?.serving_quantity_g;
    setGramsInput(g != null ? formatNumber(g) : '');
    setGramsDialogVisible(false);
    setScanResult(response);
    setCameraVisible(false);
    setResultVisible(true);
  }, []);

  // Ricalcola il verdetto con i grammi inseriti dall'utente (conferma manuale).
  // Mantiene nome/marca/immagine della scansione originale e aggiorna solo il
  // verdetto e i valori: la edge function non rilegge OFF né rifà l'OCR.
  const handleRecompute = useCallback(async () => {
    Keyboard.dismiss();
    const values = scanResult?.nutritional_values;
    if (!values) return;
    const grams = parseGrams(gramsInput);
    if (grams == null) {
      Alert.alert(
        'Peso non valido',
        'Inserisci i grammi della porzione che stai mangiando (es. 30).',
      );
      return;
    }
    const updated = await recomputeWithGrams({
      per100: values.per_100g,
      grams,
      scanMode: scanResult?.scan_mode,
      servingSizeRaw: scanResult?.product?.serving_size ?? null,
    });
    if (updated.status === 'error' || updated.status === 'no_objective') {
      Alert.alert('Ricalcolo non riuscito', updated.error ?? 'Riprova.');
      return;
    }
    setGramsDialogVisible(false);
    setScanResult((prev) =>
      prev
        ? {
            ...prev,
            status: updated.status,
            is_allowed: updated.is_allowed,
            needs_serving_grams: updated.needs_serving_grams,
            user_objective: updated.user_objective ?? prev.user_objective,
            nutritional_values: updated.nutritional_values ?? prev.nutritional_values,
            checks: updated.checks ?? prev.checks,
            reasons: updated.reasons ?? prev.reasons,
            product: {
              ...prev.product,
              name: prev.product?.name ?? null,
              brand: prev.product?.brand ?? null,
              image_url: prev.product?.image_url ?? null,
              quantity: prev.product?.quantity ?? null,
              serving_size: prev.product?.serving_size ?? null,
              serving_quantity_g:
                updated.product?.serving_quantity_g ?? prev.product?.serving_quantity_g ?? null,
            },
          }
        : updated,
    );
  }, [scanResult, gramsInput, recomputeWithGrams]);

  const handleOpenCamera = useCallback(
    async (mode?: ScanMode) => {
      if (!permission || !permission.granted) {
        const res = await requestPermission();
        if (!res.granted) {
          Alert.alert('Permesso negato', 'Non puoi aprire la fotocamera senza autorizzazione.');
          return;
        }
      }
      if (mode) setScanMode(mode);
      scanGuardRef.current = false;
      setCameraVisible(true);
    },
    [permission, requestPermission],
  );

  const switchMode = useCallback((mode: ScanMode) => {
    scanGuardRef.current = false;
    setScanMode(mode);
  }, []);

  const handleBarcodeScanned = useCallback(
    async (result: { data: string; type: string }) => {
      if (scanGuardRef.current) return;
      scanGuardRef.current = true;

      const response = await scanProduct(result.data);
      presentResult(response);
    },
    [scanProduct, presentResult],
  );

  const handleTakePhoto = useCallback(async () => {
    if (busy || scanGuardRef.current || !cameraRef.current) return;
    scanGuardRef.current = true;
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo?.uri) throw new Error('uri mancante');
      const base64 = await compressToBase64(photo.uri);
      if (!base64) throw new Error('base64 vuoto');
      const response = await scanProductPhoto(base64);
      presentResult(response);
    } catch (err) {
      if (__DEV__) console.error('Cattura foto fallita:', err);
      presentResult({
        status: 'error',
        is_allowed: null,
        scan_mode: 'ocr',
        error: 'Impossibile scattare la foto. Riprova.',
      });
    } finally {
      setIsCapturing(false);
      scanGuardRef.current = false;
    }
  }, [busy, scanProductPhoto, presentResult]);

  const closeResult = useCallback(() => {
    setResultVisible(false);
    setScanResult(null);
    setGramsInput('');
    setGramsDialogVisible(false);
  }, []);

  const openGramsDialog = useCallback(() => setGramsDialogVisible(true), []);
  const closeGramsDialog = useCallback(() => setGramsDialogVisible(false), []);

  // Autofocus del campo grammi all'apertura del popup (cross-platform: niente
  // dipendenza dall'onShow del Modal, che non usiamo più).
  useEffect(() => {
    if (!gramsDialogVisible) return;
    const t = setTimeout(() => gramsInputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [gramsDialogVisible]);

  // Android: il tasto Indietro chiude SOLO il popup grammi (non l'intero
  // risultato). Su iOS BackHandler è inerte, nessun effetto collaterale.
  useEffect(() => {
    if (!gramsDialogVisible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setGramsDialogVisible(false);
      return true;
    });
    return () => sub.remove();
  }, [gramsDialogVisible]);

  // Riapre la camera nella modalità corrente. Su iOS presentare un Modal mentre
  // un altro si sta chiudendo può far fallire la presentazione: piccola attesa.
  const handleScanAgain = useCallback(() => {
    setResultVisible(false);
    setScanResult(null);
    setTimeout(() => {
      void handleOpenCamera();
    }, 400);
  }, [handleOpenCamera]);

  // Backup: dal "prodotto non trovato" passa alla modalità foto della tabella.
  const handlePhotoBackup = useCallback(() => {
    setResultVisible(false);
    setScanResult(null);
    setTimeout(() => {
      void handleOpenCamera('photo');
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

  // Popup dedicato per il peso della porzione. Posizionato in alto così la
  // tastiera (che occupa la metà bassa) non lo copre mai; il numero è un display
  // grande e centrato (estetica premium), con conferma manuale.
  // Overlay (NON un Modal annidato) reso DENTRO il Modal risultato: stesso
  // comportamento su iOS e Android (i Modal annidati su Android sono fragili).
  const renderGramsOverlay = () => {
    const valid = parseGrams(gramsInput) != null;
    return (
      <View style={styles.gramsDialogRoot}>
        <ScrollView
          style={styles.gramsScroll}
          contentContainerStyle={[styles.gramsScrollContent, { paddingTop: insets.top + 44 }]}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.gramsDialogCard}>
            <View style={styles.gramsBadge}>
              <Text style={styles.gramsBadgeIcon}>⚖️</Text>
            </View>
            <Text style={styles.gramsDialogTitle}>Peso della porzione</Text>
            <Text style={styles.gramsDialogSubtitle}>Inserisci i grammi che stai mangiando.</Text>

            <View style={styles.gramsDisplay}>
              <TextInput
                ref={gramsInputRef}
                style={styles.gramsDisplayInput}
                value={gramsInput}
                onChangeText={setGramsInput}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#D1D5DB"
                maxLength={4}
                autoFocus
                editable={!busy}
                selectionColor={colors.secondary}
              />
              <Text style={styles.gramsDisplayUnit}>g</Text>
            </View>

            <TouchableOpacity
              style={[styles.gramsConfirmBtn, (!valid || busy) && styles.gramsConfirmBtnDisabled]}
              onPress={handleRecompute}
              disabled={!valid || busy}
              activeOpacity={0.85}
            >
              {busy ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.gramsConfirmText}>Conferma</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.gramsCancelBtn}
              onPress={closeGramsDialog}
              activeOpacity={0.7}
            >
              <Text style={styles.gramsCancelText}>Annulla</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  };

  // Stati con scheda prodotto: 'ok' (consentito/non adatto) e 'not_evaluable'
  const renderProductResult = (result: ScanResponse) => {
    const isOk = result.status === 'ok';
    const allowed = result.is_allowed === true;
    const isOcr = result.scan_mode === 'ocr';
    // Manca SOLO la porzione: non è un errore, va chiesto il peso (niente foto).
    const needsGrams = result.needs_serving_grams === true;
    const hasValues = !!result.nutritional_values;
    const header = isOk
      ? allowed
        ? { color: ALLOWED_COLOR, icon: '✅', title: 'Prodotto Consentito' }
        : { color: REJECTED_COLOR, icon: '🚫', title: 'Prodotto Non Adatto' }
      : needsGrams
        ? { color: WARNING_COLOR, icon: '⚖️', title: 'Manca solo la porzione' }
        : { color: WARNING_COLOR, icon: '⚠️', title: 'Non valutabile' };

    const product = result.product;
    const productName =
      product?.name ?? result.product_name ?? (isOcr ? 'Valori dalla foto' : 'Prodotto senza nome');
    // peso porzione normalizzato ("50 gr" → "50 g"), mostrato nella scheda prodotto
    const servingGrams = product?.serving_quantity_g ?? null;
    const servingLabel =
      servingGrams != null
        ? `${formatNumber(servingGrams)} g`
        : (result.nutritional_values?.per_serving?.serving_size ?? product?.serving_size ?? null);
    // motivi mostrati per il verdetto negativo o per "non valutabile" reale; mai
    // quando manca solo la porzione (le righe "dato non disponibile" non sono problemi).
    const showReasons = (isOk && !allowed) || (!isOk && !needsGrams);
    const failedReasons = showReasons ? (result.reasons ?? []) : [];
    // verdetto vero e proprio (consentito/non adatto con valori): consente di
    // ritoccare la porzione.
    const isVerdict = isOk && hasValues;
    // foto come fallback solo quando mancano DAVVERO i dati (non la porzione) e
    // non siamo già nella modalità foto.
    const showPhotoCta = !isOk && !needsGrams && !isOcr;

    return (
      <View style={styles.resultCard}>
        <View style={[styles.resultHeader, { backgroundColor: header.color }]}>
          <Text style={styles.resultHeaderIcon}>{header.icon}</Text>
          <Text style={styles.resultHeaderTitle}>{header.title}</Text>
          {!isOk && needsGrams && (
            <Text style={styles.resultHeaderSubtitle}>
              Indica i grammi che stai mangiando per ottenere il verdetto.
            </Text>
          )}
          {!isOk && !needsGrams && (
            <Text style={styles.resultHeaderSubtitle}>
              Mancano alcuni dati nutrizionali: prova a fotografare la tabella.
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
          {needsGrams && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={openGramsDialog}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>⚖️ Inserisci la porzione</Text>
            </TouchableOpacity>
          )}
          {showPhotoCta && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handlePhotoBackup}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>📷 Fotografa la tabella</Text>
            </TouchableOpacity>
          )}
          {isVerdict && (
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={openGramsDialog}
              activeOpacity={0.8}
            >
              <Text style={styles.outlineButtonText}>Modifica la porzione</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={isVerdict ? styles.primaryButton : styles.secondaryButton}
            onPress={handleScanAgain}
            activeOpacity={0.85}
          >
            <Text style={isVerdict ? styles.primaryButtonText : styles.secondaryButtonText}>
              {scanMode === 'photo' ? "Scatta un'altra foto" : 'Scansiona un altro'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={closeResult}
            activeOpacity={0.7}
          >
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
    // messaggio dal backend se presente (thin client), altrimenti default locale
    const message = result.error ?? info.message;
    const isNotFound = result.status === 'product_not_found';
    const isOcr = result.scan_mode === 'ocr';
    // Invito alla foto su tutti gli stati "senza dati" tranne no_objective (la
    // foto non aiuta) e tranne quando siamo già in modalità foto (lì "Riprova"
    // riapre direttamente la foto). Obiettivo: il barcode non resta mai bloccato.
    const showPhotoCta =
      !isOcr &&
      (result.status === 'product_not_found' ||
        result.status === 'invalid_barcode' ||
        result.status === 'error');

    return (
      <View style={styles.resultCard}>
        <View style={styles.simpleBody}>
          <Text style={styles.simpleIcon}>{info.icon}</Text>
          <Text style={styles.simpleTitle}>{info.title}</Text>
          <Text style={styles.simpleMessage}>{message}</Text>
          {isNotFound && result.barcode ? (
            <Text style={styles.simpleBarcode}>Codice scansionato: {result.barcode}</Text>
          ) : null}
        </View>

        <View style={styles.resultActions}>
          {showPhotoCta ? (
            <>
              <TouchableOpacity style={styles.primaryButton} onPress={handlePhotoBackup}>
                <Text style={styles.primaryButtonText}>📷 Fotografa la tabella nutrizionale</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleScanAgain}>
                <Text style={styles.secondaryButtonText}>
                  {isNotFound ? 'Riprova col codice' : 'Riprova'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.primaryButton} onPress={handleScanAgain}>
              <Text style={styles.primaryButtonText}>Riprova</Text>
            </TouchableOpacity>
          )}
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

      <TouchableOpacity
        style={styles.scanButton}
        activeOpacity={0.9}
        onPress={() => handleOpenCamera('barcode')}
      >
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
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'],
            }}
            onBarcodeScanned={scanMode === 'barcode' ? handleBarcodeScanned : undefined}
          />

          {/* Overlay Caricamento durante scansione / lettura */}
          {busy && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#ED5192" />
              <Text style={{ color: 'white', marginTop: 10 }}>
                {scanMode === 'photo' ? 'Lettura della tabella…' : 'Analisi in corso…'}
              </Text>
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
            {!busy && (
              <>
                <View style={styles.overlayTop}>
                  {/* Toggle modalità: barcode <-> foto tabella */}
                  <View style={styles.modeToggle}>
                    <TouchableOpacity
                      style={[styles.modeChip, scanMode === 'barcode' && styles.modeChipActive]}
                      onPress={() => switchMode('barcode')}
                    >
                      <Text
                        style={[
                          styles.modeChipText,
                          scanMode === 'barcode' && styles.modeChipTextActive,
                        ]}
                      >
                        Barcode
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modeChip, scanMode === 'photo' && styles.modeChipActive]}
                      onPress={() => switchMode('photo')}
                    >
                      <Text
                        style={[
                          styles.modeChipText,
                          scanMode === 'photo' && styles.modeChipTextActive,
                        ]}
                      >
                        Foto tabella
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.overlayTitle}>
                    {scanMode === 'photo'
                      ? 'Inquadra la tabella nutrizionale'
                      : 'Inquadra il codice a barre'}
                  </Text>
                </View>

                <View style={[styles.scanFrame, scanMode === 'photo' && styles.scanFramePhoto]} />

                <View style={styles.overlayBottom}>
                  {scanMode === 'photo' && (
                    <TouchableOpacity
                      style={styles.shutterButton}
                      onPress={handleTakePhoto}
                      activeOpacity={0.8}
                    >
                      <View style={styles.shutterInner} />
                    </TouchableOpacity>
                  )}
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
        {/* Popup grammi: overlay (non Modal) DENTRO il Modal risultato → si
            comporta uguale su iOS e Android, niente Modal annidati. */}
        {gramsDialogVisible && renderGramsOverlay()}
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
  overlayTop: { alignItems: 'center', marginTop: 12, gap: 14 },
  overlayTitle: { fontFamily: GraphitFonts.GraphitRegular, fontSize: 18, color: '#FFFFFF' },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 999,
    padding: 4,
  },
  modeChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
  },
  modeChipActive: { backgroundColor: '#ED5192' },
  modeChipText: {
    fontFamily: GraphitFonts.GraphitBold,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  modeChipTextActive: { color: '#FFFFFF' },
  scanFrame: {
    alignSelf: 'center',
    width: '100%',
    height: '20%',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ED5192',
    backgroundColor: 'transparent',
  },
  scanFramePhoto: { height: '45%' },
  overlayBottom: { alignItems: 'center', gap: 18 },
  shutterButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  shutterInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
  },
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
  // Variante outline coerente coi pill (stesso raggio/padding dei primari)
  outlineButton: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.secondary,
    backgroundColor: 'rgba(237,81,146,0.06)',
  },
  outlineButtonText: {
    fontFamily: GraphitFonts.GraphitBold,
    fontSize: 15,
    color: colors.secondary,
  },
  // Popup dedicato peso porzione
  gramsDialogRoot: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17,17,17,0.55)',
  },
  gramsScroll: { flex: 1 },
  gramsScrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  gramsDialogCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.white,
    borderRadius: 28,
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 14,
  },
  gramsBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(237,81,146,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  gramsBadgeIcon: { fontSize: 28 },
  gramsDialogTitle: {
    fontFamily: GraphitFonts.GraphitBold,
    fontSize: 19,
    color: colors.text,
    textAlign: 'center',
  },
  gramsDialogSubtitle: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 13,
    color: '#6B6B6B',
    textAlign: 'center',
    marginTop: 4,
  },
  gramsDisplay: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    alignSelf: 'stretch',
    marginTop: 22,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#EFE6F2',
  },
  gramsDisplayInput: {
    fontFamily: GraphitFonts.GraphitBold,
    fontSize: 46,
    color: colors.text,
    textAlign: 'center',
    minWidth: 90,
    padding: 0,
    includeFontPadding: false,
  },
  gramsDisplayUnit: {
    fontFamily: GraphitFonts.GraphitBold,
    fontSize: 22,
    color: '#9CA3AF',
    marginLeft: 8,
    marginBottom: 8,
  },
  gramsConfirmBtn: {
    alignSelf: 'stretch',
    marginTop: 24,
    backgroundColor: colors.secondary,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  gramsConfirmBtnDisabled: { opacity: 0.45 },
  gramsConfirmText: {
    fontFamily: GraphitFonts.GraphitBold,
    fontSize: 16,
    color: colors.white,
  },
  gramsCancelBtn: {
    alignSelf: 'stretch',
    marginTop: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  gramsCancelText: {
    fontFamily: GraphitFonts.GraphitBold,
    fontSize: 14,
    color: '#9CA3AF',
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
