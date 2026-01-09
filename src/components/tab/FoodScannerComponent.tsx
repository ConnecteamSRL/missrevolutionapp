import React, { useCallback, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FoodIcon from '@components/ui/icons/FoodIcon';
import BarCodeIcon from '@components/ui/icons/BarCodeIcon';
import { colors, GraphitFonts } from '@/src/theme';

export default function FoodScannerComponent() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraVisible, setCameraVisible] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

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
    (result: { data: string; type: string }) => {
      if (hasScanned) return;
      setHasScanned(true);
      console.log('Barcode scanned:', result);
      Alert.alert('Codice scansionato', result.data, [
        { text: 'OK', onPress: () => setCameraVisible(false) },
      ]);
    },
    [hasScanned],
  );

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

          <View
            style={[
              styles.cameraOverlay,
              {
                paddingTop: 24 + insets.top,
                paddingBottom: 16 + insets.bottom,
              },
            ]}
          >
            <View style={styles.overlayTop}>
              <Text style={styles.overlayTitle}>Inquadra il codice a barre</Text>
              <Text style={styles.overlaySubtitle}>
                Mantieni il prodotto fermo all’interno del riquadro
              </Text>
            </View>

            <View style={styles.scanFrame} />

            <View style={[styles.overlayBottom, { paddingBottom: Math.max(insets.bottom, 0) }]}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setCameraVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.closeButtonText}>Chiudi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  overlayTop: {
    alignItems: 'center',
    marginTop: 12,
  },
  overlayTitle: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  overlaySubtitle: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  scanFrame: {
    alignSelf: 'center',
    width: '100%',
    height: '20%',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ED5192',
    backgroundColor: 'transparent',
  },
  overlayBottom: {
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: 'rgba(237, 81, 146, 0.4)',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
  },
  closeButtonText: {
    fontFamily: GraphitFonts.GraphitBold,
    color: '#FFF',
    fontSize: 16,
  },
});
