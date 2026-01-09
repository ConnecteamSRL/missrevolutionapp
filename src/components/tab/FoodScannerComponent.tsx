import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FoodIcon from '@components/ui/icons/FoodIcon';
import BarCodeIcon from '@components/ui/icons/BarCodeIcon';
import { colors, GraphitFonts } from '@/src/theme';
import { ScanResponse } from '@mr-types/barcode.types';
import { useProductScanner } from '@/src/hooks/content/useProductScanner';

export default function FoodScannerComponent() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();

  const [cameraVisible, setCameraVisible] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  const [resultVisible, setResultVisible] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const { scanProduct, isLoading } = useProductScanner();

  const handleOpenCamera = useCallback(async () => {
    if (!permission || !permission.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert('Permesso negato', 'Non puoi aprire la fotocamera senza autorizzazione.');
        return;
      }
    }
    setHasScanned(false);
    setCameraVisible(true);
  }, [permission, requestPermission]);

  const handleBarcodeScanned = useCallback(
    async (result: { data: string; type: string }) => {
      if (hasScanned || isLoading) return;
      setHasScanned(true);

      const response = await scanProduct(result.data);

      if (response) {
        setScanResult(response);
        setCameraVisible(false);
        setResultVisible(true);
      } else {
        setTimeout(() => setHasScanned(false), 2000);
      }
    },
    [hasScanned, isLoading, scanProduct],
  );

  const closeResult = () => {
    setResultVisible(false);
    setScanResult(null);
    setHasScanned(false);
  };

  const renderResultContent = () => {
    if (!scanResult) return null;

    const isAllowed = scanResult.is_allowed;
    const bgColor = isAllowed ? '#4CAF50' : '#EF4444'; // Verde : Rosso
    const icon = isAllowed ? '✅' : '🚫';
    const title = isAllowed ? 'Prodotto Consentito' : 'Prodotto Non Adatto';

    return (
      <View style={[styles.resultContainer, { backgroundColor: bgColor }]}>
        <View style={styles.resultIconContainer}>
          <Text style={{ fontSize: 60 }}>{icon}</Text>
        </View>

        <Text style={styles.resultTitle}>{title}</Text>
        <Text style={styles.productName}>{scanResult.product_name}</Text>

        <TouchableOpacity style={styles.resultButton} onPress={closeResult}>
          <Text style={[styles.resultButtonText, { color: bgColor }]}>
            {isAllowed ? 'Ottimo!' : 'Capito'}
          </Text>
        </TouchableOpacity>
      </View>
    );
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
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'qr'],
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

      {/* --- Modale Risultato (Verde/Rosso) --- */}
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

  // Camera styles
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

  // NUOVI STILI PER IL LOADING E RISULTATI
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
  resultContainer: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  resultIconContainer: {
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 50,
    padding: 10,
  },
  resultTitle: {
    fontFamily: GraphitFonts.GraphitBold,
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  productName: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 20,
    textAlign: 'center',
  },
  reasonsContainer: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    width: '100%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  reasonsTitle: {
    fontFamily: GraphitFonts.GraphitBold,
    color: '#FFF',
    marginBottom: 4,
  },
  reasonText: {
    fontFamily: GraphitFonts.GraphitRegular,
    color: '#FFF',
    fontSize: 14,
    marginBottom: 2,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  macroText: {
    fontFamily: GraphitFonts.GraphitRegular,
    color: '#FFF',
    fontSize: 12,
  },
  resultButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 999,
    width: '100%',
    alignItems: 'center',
  },
  resultButtonText: {
    fontFamily: GraphitFonts.GraphitBold,
    fontSize: 16,
  },
});
