import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader } from "@googlemaps/js-api-loader";
import { 
  ArrowLeft, 
  MapPin, 
  Play, 
  Square, 
  Trash2, 
  Save, 
  Navigation,
  Smartphone,
  Circle,
  Settings
} from "lucide-react";

interface GpsPoint {
  id: string;
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: Date;
}

type DemarcationMode = "manual" | "walking";

declare global {
  interface Window {
    google: any;
    currentPolyline?: any;
  }
}

const DemarcateArea = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<DemarcationMode>("manual");
  const [points, setPoints] = useState<GpsPoint[]>([]);
  const [isWalking, setIsWalking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [area, setArea] = useState<number>(0);
  const [googleMap, setGoogleMap] = useState<any>(null);
  const [polygon, setPolygon] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [mapApiKey, setMapApiKey] = useState<string>("");
  const mapRef = useRef<HTMLDivElement>(null);
  const walkingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate area using shoelace formula
  const calculateArea = (coordinates: GpsPoint[]) => {
    if (coordinates.length < 3) return 0;
    
    let area = 0;
    const n = coordinates.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += coordinates[i].lat * coordinates[j].lng;
      area -= coordinates[j].lat * coordinates[i].lng;
    }
    
    area = Math.abs(area) / 2;
    // Convert to square meters (approximate)
    const areaInSquareMeters = area * 111320 * 111320 * Math.cos((coordinates[0].lat * Math.PI) / 180);
    return areaInSquareMeters / 10000; // Convert to hectares
  };

  // Update area when points change
  useEffect(() => {
    if (points.length >= 3) {
      const calculatedArea = calculateArea(points);
      setArea(calculatedArea);
    } else {
      setArea(0);
    }
  }, [points]);

  // Get current GPS position
  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocalização não é suportada pelo browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  // Add a point manually or automatically
  const addPoint = async (lat?: number, lng?: number) => {
    try {
      let position;
      
      if (lat && lng) {
        position = { coords: { latitude: lat, longitude: lng, accuracy: 5 } };
      } else {
        position = await getCurrentPosition();
      }

      const newPoint: GpsPoint = {
        id: Date.now().toString(),
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy || 0,
        timestamp: new Date()
      };

      // Check GPS accuracy
      if (position.coords.accuracy && position.coords.accuracy > 10) {
        toast.warning(`Precisão GPS baixa: ${position.coords.accuracy.toFixed(1)}m`);
      }

      setPoints(prev => {
        const updated = [...prev, newPoint];
        // Update map display after state update
        setTimeout(() => updateMapDisplay(), 100);
        return updated;
      });
      setGpsAccuracy(position.coords.accuracy || null);
      toast.success(`Ponto ${points.length + 1} capturado`);
    } catch (error) {
      toast.error("Erro ao capturar localização GPS");
      console.error(error);
    }
  };

  // Start/stop walking mode
  const toggleWalkingMode = () => {
    if (isWalking) {
      // Stop walking
      if (walkingIntervalRef.current) {
        clearInterval(walkingIntervalRef.current);
        walkingIntervalRef.current = null;
      }
      setIsWalking(false);
      toast.info("Modo caminhada parado");
    } else {
      // Start walking
      setIsWalking(true);
      toast.info("Modo caminhada iniciado - pontos serão capturados automaticamente");
      
      walkingIntervalRef.current = setInterval(() => {
        addPoint();
      }, 5000); // Capture point every 5 seconds
    }
  };

  // Remove last point
  const removeLastPoint = () => {
    if (points.length > 0) {
      setPoints(prev => {
        const updated = prev.slice(0, -1);
        setTimeout(() => updateMapDisplay(), 100);
        return updated;
      });
      toast.info("Último ponto removido");
    }
  };

  // Clear all points
  const clearAllPoints = () => {
    setPoints([]);
    setArea(0);
    setTimeout(() => updateMapDisplay(), 100);
    toast.info("Todos os pontos removidos");
  };

  // Save demarcation
  const saveDemarcation = () => {
    if (points.length < 3) {
      toast.error("Mínimo de 3 pontos necessários para formar uma área");
      return;
    }

    // Here you would save to Supabase
    const demarcationData = {
      points,
      area,
      perimeter: calculatePerimeter(points),
      createdAt: new Date(),
      producerId: "temp-id" // This would come from context/props
    };

    console.log("Saving demarcation:", demarcationData);
    toast.success(`Área de ${area.toFixed(2)} hectares salva com sucesso!`);
    navigate("/dashboard");
  };

  const calculatePerimeter = (coordinates: GpsPoint[]) => {
    if (coordinates.length < 2) return 0;
    
    let perimeter = 0;
    for (let i = 0; i < coordinates.length; i++) {
      const j = (i + 1) % coordinates.length;
      const distance = getDistanceFromLatLonInKm(
        coordinates[i].lat, 
        coordinates[i].lng, 
        coordinates[j].lat, 
        coordinates[j].lng
      );
      perimeter += distance;
    }
    return perimeter * 1000; // Convert to meters
  };

  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  // Initialize Google Maps
  const initializeGoogleMaps = async () => {
    if (!mapApiKey) return;
    
    try {
      const loader = new Loader({
        apiKey: mapApiKey,
        version: "weekly",
        libraries: ["places", "geometry"]
      });

      await loader.load();
      
      if (!mapRef.current || !currentPosition) return;

      const map = new window.google.maps.Map(mapRef.current, {
        center: currentPosition,
        zoom: 18,
        mapTypeId: window.google.maps.MapTypeId.SATELLITE,
        tilt: 0,
        heading: 0,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        fullscreenControl: false,
      });

      // Add click listener for manual mode
      map.addListener("click", (e: any) => {
        if (mode === "manual" && !isWalking) {
          addPoint(e.latLng.lat(), e.latLng.lng());
        }
      });

      setGoogleMap(map);
      
      // Add current location marker
      new window.google.maps.Marker({
        position: currentPosition,
        map: map,
        title: "Sua localização atual",
        icon: {
          url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23059669'%3E%3Ccircle cx='12' cy='12' r='8'/%3E%3C/svg%3E",
          scaledSize: new window.google.maps.Size(20, 20),
        }
      });

      toast.success("Google Maps carregado com sucesso!");
    } catch (error) {
      console.error("Erro ao carregar Google Maps:", error);
      toast.error("Erro ao carregar Google Maps");
    }
  };

  // Update Google Maps markers and polygon
  const updateMapDisplay = () => {
    if (!googleMap) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);

    // Add new markers
    const newMarkers = points.map((point, index) => {
      return new window.google.maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        map: googleMap,
        title: `Ponto ${index + 1}`,
        label: (index + 1).toString(),
        icon: {
          url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23dc2626'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z'/%3E%3C/svg%3E",
          scaledSize: new window.google.maps.Size(30, 30),
        }
      });
    });

    setMarkers(newMarkers);

    // Clear existing polyline and polygon
    if (window.currentPolyline) {
      window.currentPolyline.setMap(null);
    }
    if (polygon) {
      polygon.setMap(null);
    }

    // Draw line connecting all points (polyline)
    if (points.length >= 2) {
      const polyline = new window.google.maps.Polyline({
        path: points.map(p => ({ lat: p.lat, lng: p.lng })),
        geodesic: true,
        strokeColor: "#059669",
        strokeOpacity: 1.0,
        strokeWeight: 3,
      });

      polyline.setMap(googleMap);
      window.currentPolyline = polyline;
    }

    // Draw filled area (polygon) when we have at least 3 points
    if (points.length >= 3) {
      const newPolygon = new window.google.maps.Polygon({
        paths: points.map(p => ({ lat: p.lat, lng: p.lng })),
        strokeColor: "#059669",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#059669",
        fillOpacity: 0.2,
      });

      newPolygon.setMap(googleMap);
      setPolygon(newPolygon);
    }
  };

  // Initialize Google Maps when API key is available
  useEffect(() => {
    if (mapApiKey && currentPosition) {
      initializeGoogleMaps();
    }
  }, [mapApiKey, currentPosition]);

  // Get user's current location on mount
  useEffect(() => {
    getCurrentPosition()
      .then(position => {
        setCurrentPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setGpsAccuracy(position.coords.accuracy || null);
      })
      .catch(error => {
        console.error("Error getting initial position:", error);
        // Default to Maputo, Mozambique
        setCurrentPosition({ lat: -25.9692, lng: 32.5732 });
      });

    return () => {
      if (walkingIntervalRef.current) {
        clearInterval(walkingIntervalRef.current);
      }
    };
  }, []);

  if (!currentPosition) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <Circle className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">A obter localização GPS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="rounded-full bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Demarcar Área</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant={gpsAccuracy && gpsAccuracy < 5 ? "default" : "secondary"}>
              <Navigation className="h-3 w-3 mr-1" />
              GPS: {gpsAccuracy ? `${gpsAccuracy.toFixed(1)}m` : "N/A"}
            </Badge>
          </div>
        </div>

        {/* Google Maps API Key Input */}
        {!mapApiKey && (
          <Card className="bg-blue-50 rounded-xl border-blue-200 mb-4">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Settings className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900">Configure Google Maps</h3>
                  <p className="text-sm text-blue-700">Insira sua chave API do Google Maps para ver mapas de satélite</p>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <input
                  type="text"
                  placeholder="Chave API do Google Maps"
                  value={mapApiKey}
                  onChange={(e) => setMapApiKey(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-blue-600">
                  Obtenha sua chave em: <a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="underline">Google Cloud Console</a>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mode Toggle */}
        <div className="flex space-x-2 mb-4">
          <Button
            variant={mode === "manual" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("manual")}
            className="flex-1"
          >
            <Smartphone className="h-4 w-4 mr-2" />
            Manual
          </Button>
          <Button
            variant={mode === "walking" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("walking")}
            className="flex-1"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Caminhada
          </Button>
        </div>
      </div>

      <div className="px-6 pb-6">
        {/* Map Container */}
        {/* Map Container */}
        <Card className="bg-white rounded-2xl shadow-sm border-0 mb-6 overflow-hidden">
          <CardContent className="p-0">
            <div className="h-80 relative">
              {mapApiKey ? (
                <div ref={mapRef} className="w-full h-full rounded-2xl" />
              ) : (
                <div className="relative w-full h-full bg-gray-100 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <Settings className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 font-medium">Configure Google Maps API</p>
                    <p className="text-sm text-gray-500">
                      Insira sua chave API acima para ver mapas de satélite
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-white rounded-xl shadow-sm border-0">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{points.length}</div>
              <div className="text-xs text-gray-500">Pontos</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-xl shadow-sm border-0">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {area.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">Hectares</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-xl shadow-sm border-0">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {points.length >= 2 ? (calculatePerimeter(points) / 1000).toFixed(2) : "0.00"}
              </div>
              <div className="text-xs text-gray-500">Km</div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {mode === "manual" ? (
            <Button
              onClick={() => addPoint()}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <MapPin className="h-5 w-5 mr-2" />
              Marcar Ponto Atual
            </Button>
          ) : (
            <Button
              onClick={toggleWalkingMode}
              className={`w-full ${isWalking ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
              size="lg"
            >
              {isWalking ? (
                <>
                  <Square className="h-5 w-5 mr-2" />
                  Parar Caminhada
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Iniciar Caminhada
                </>
              )}
            </Button>
          )}

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={removeLastPoint}
              className="flex-1"
              disabled={points.length === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Remover Último
            </Button>
            
            <Button
              variant="outline"
              onClick={clearAllPoints}
              className="flex-1"
              disabled={points.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Tudo
            </Button>
          </div>

          <Button
            onClick={saveDemarcation}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
            disabled={points.length < 3}
          >
            <Save className="h-5 w-5 mr-2" />
            Salvar Demarcação
          </Button>
        </div>

        {/* Instructions */}
        <Card className="bg-blue-50 rounded-xl border-blue-200 mt-6">
          <CardContent className="p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Instruções:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Manual:</strong> Toque no mapa ou use "Marcar Ponto Atual"</li>
              <li>• <strong>Caminhada:</strong> Pontos capturados automaticamente a cada 5 segundos</li>
              <li>• Mínimo de 3 pontos para formar uma área</li>
              <li>• Precisão GPS ideal: menor que 5 metros</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DemarcateArea;