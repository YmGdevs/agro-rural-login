import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  MapPin, 
  Play, 
  Square, 
  Trash2, 
  Save, 
  Navigation,
  Smartphone,
  Circle
} from "lucide-react";

interface GpsPoint {
  id: string;
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: Date;
}

type DemarcationMode = "manual" | "walking";

const DemarcateArea = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<DemarcationMode>("manual");
  const [points, setPoints] = useState<GpsPoint[]>([]);
  const [isWalking, setIsWalking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [area, setArea] = useState<number>(0);
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

      setPoints(prev => [...prev, newPoint]);
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
      setPoints(prev => prev.slice(0, -1));
      toast.info("Último ponto removido");
    }
  };

  // Clear all points
  const clearAllPoints = () => {
    setPoints([]);
    setArea(0);
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

  // Simple map component using basic HTML and CSS
  const SimpleMap = () => {
    return (
      <div className="relative w-full h-full bg-green-100 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-green-600 mx-auto mb-2" />
          <p className="text-green-800 font-medium">Mapa GPS</p>
          <p className="text-sm text-green-600">
            {currentPosition 
              ? `Lat: ${currentPosition.lat.toFixed(4)}, Lng: ${currentPosition.lng.toFixed(4)}`
              : "A obter localização..."
            }
          </p>
          {points.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-green-700">{points.length} pontos marcados</p>
              {points.length >= 3 && (
                <div className="w-32 h-20 bg-green-200 rounded mx-auto mt-2 flex items-center justify-center">
                  <div className="w-24 h-12 border-2 border-green-600 rounded bg-green-300/50"></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

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
        <Card className="bg-white rounded-2xl shadow-sm border-0 mb-6 overflow-hidden">
          <CardContent className="p-0">
            <div className="h-80 relative">
              <SimpleMap />
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