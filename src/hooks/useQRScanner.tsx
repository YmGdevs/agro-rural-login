import { useState } from 'react';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';

export function useQRScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();

  const checkPermissions = async () => {
    console.log('Checking permissions...');
    console.log('Is native platform:', Capacitor.isNativePlatform());
    
    if (!Capacitor.isNativePlatform()) {
      console.log('Not a native platform, showing warning');
      toast({
        title: "Scanner apenas em mobile",
        description: "O scanner de QR code funciona apenas no aplicativo móvel. Use o campo de código manual.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const status = await BarcodeScanner.checkPermission({ force: true });
      
      if (status.granted) {
        return true;
      } else if (status.denied) {
        toast({
          title: "Permissão negada",
          description: "É necessário permitir o acesso à câmera para escanear QR codes.",
          variant: "destructive",
        });
        return false;
      } else {
        // Permission not determined, request it
        const result = await BarcodeScanner.checkPermission({ force: true });
        return result.granted;
      }
    } catch (error) {
      console.error('Error checking camera permission:', error);
      toast({
        title: "Erro",
        description: "Não foi possível verificar as permissões da câmera.",
        variant: "destructive",
      });
      return false;
    }
  };

  const startScan = async (): Promise<string | null> => {
    try {
      const hasPermission = await checkPermissions();
      if (!hasPermission) {
        return null;
      }

      setIsScanning(true);
      
      // Hide the app content
      document.body.style.background = 'transparent';
      
      const result = await BarcodeScanner.startScan();
      
      if (result.hasContent) {
        return result.content;
      }
      
      return null;
    } catch (error) {
      console.error('Error starting scan:', error);
      toast({
        title: "Erro no scanner",
        description: "Não foi possível iniciar o scanner de QR code.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsScanning(false);
      await stopScan();
    }
  };

  const stopScan = async () => {
    try {
      await BarcodeScanner.stopScan();
      document.body.style.background = '';
      setIsScanning(false);
    } catch (error) {
      console.error('Error stopping scan:', error);
    }
  };

  return {
    isScanning,
    startScan,
    stopScan,
    isNativePlatform: Capacitor.isNativePlatform()
  };
}