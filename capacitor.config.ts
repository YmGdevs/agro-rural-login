import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.89032615ac76445f8a00efd8599ca876',
  appName: 'agro-rural-login',
  webDir: 'dist',
  server: {
    url: "https://89032615-ac76-445f-8a00-efd8599ca876.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  plugins: {
    BarcodeScanner: {
      androidGooglePlayServicesConfiguration: {
        apiKey: "AIzaSyDQMjxH9CXu6f1eDwIrIDqL8ePdkQXlgN4"
      }
    }
  }
};

export default config;