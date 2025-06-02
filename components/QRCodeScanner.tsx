import React from 'react';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { View, Text, TouchableOpacity } from 'react-native';

interface QRCodeScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function QRCodeScanner({ onScan, onClose }: QRCodeScannerProps) {
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    onScan(data);
  };

  return (
    <View style={{ flex: 1 }}>
      <BarCodeScanner
        onBarCodeScanned={handleBarCodeScanned}
        style={{ flex: 1 }}
      />
      <View style={{ position: 'absolute', bottom: 50, alignSelf: 'center' }}>
        <TouchableOpacity onPress={onClose}>
          <Text style={{ color: 'white', fontSize: 18 }}>Close Scanner</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
} 