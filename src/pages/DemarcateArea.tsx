import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Play, Square, RotateCcw, Save, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface GpsPoint {
  id: string;
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: Date;
}

interface Producer {
  id: string;
  nome_completo: string;
}

type DemarcationMode = "manual" | "walking";

const DemarcateArea: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<DemarcationMode>("manual");
  const [points, setPoints] = useState<GpsPoint[]>([]);
  const [isWalking, setIsWalking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [selectedProducer, setSelectedProducer] = useState<string>("");
  const [parcelaName, setParcelaName] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const polygonRef = useRef<any>(null);

  useEffect(() => {
    initializeMapbox();
    loadProducers();
    
    // Auto-select producer if passed in URL
    const producerIdFromUrl = searchParams.get('producerId');
    if (producerIdFromUrl) {
      setSelectedProducer(producerIdFromUrl);
    }
  }, [searchParams]);

  const loadProducers = async () => {
    try {
      const { data, error } = await supabase
        .from('producers')
        .select('id, nome_completo')
        .order('nome_completo');
      
      if (error) throw error;
      setProducers(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtores:', error);
      toast.error('Erro ao carregar lista de produtores');
    }
  };

  // Calculate area using shoelace formula
  const calculateArea = (coordinates: GpsPoint[]) => {
    if (coordinates.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < coordinates.length; i++) {
      const j = (i + 1) % coordinates.length;
      area += coordinates[i].lat * coordinates[j].lng;
      area -= coordinates[j].lat * coordinates[i].lng;
    }
    
    area = Math.abs(area) / 2;
    // Convert to square meters (approximate)
    return area * 111320 * 111320 * Math.cos((coordinates[0].lat * Math.PI) / 180);
  };

  const calculatePerimeter = (coordinates: GpsPoint[]) => {
    if (coordinates.length < 2) return 0;
    
    let perimeter = 0;
    for (let i = 0; i < coordinates.length; i++) {
      const j = (i + 1) % coordinates.length;
      const R = 6371000; // Earth radius in meters
      const dLat = (coordinates[j].lat - coordinates[i].lat) * Math.PI / 180;
      const dLon = (coordinates[j].lng - coordinates[i].lng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(coordinates[i].lat * Math.PI / 180) * Math.cos(coordinates[j].lat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      perimeter += R * c;
    }
    return perimeter;
  };

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocalização não suportada"));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    });
  };

  const addPoint = async (lat?: number, lng?: number): Promise<void> => {
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

      setPoints(prev => [...prev, newPoint]);
      updateMapDisplay([...points, newPoint]);
      toast.success(`Ponto ${points.length + 1} adicionado`);
    } catch (error) {
      toast.error("Erro ao capturar localização");
      console.error(error);
    }
  };

  const toggleWalkingMode = (): void => {
    if (isWalking) {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      setIsWalking(false);
      toast.info("Modo caminhada parado");
    } else {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const newPoint: GpsPoint = {
            id: Date.now().toString(),
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy || 0,
            timestamp: new Date()
          };
          setPoints(prev => {
            const newPoints = [...prev, newPoint];
            updateMapDisplay(newPoints);
            return newPoints;
          });
        },
        (error) => console.error(error),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
      setWatchId(id);
      setIsWalking(true);
      toast.success("Modo caminhada iniciado");
    }
  };

  const removeLastPoint = (): void => {
    if (points.length > 0) {
      const newPoints = points.slice(0, -1);
      setPoints(newPoints);
      updateMapDisplay(newPoints);
      toast.info("Último ponto removido");
    }
  };

  const clearAllPoints = (): void => {
    setPoints([]);
    updateMapDisplay([]);
    toast.info("Todos os pontos limpos");
  };

  const saveDemarcation = async () => {
    if (!selectedProducer) {
      toast.error("Selecione um produtor antes de salvar");
      return;
    }

    if (!parcelaName.trim()) {
      toast.error("Digite um nome para a parcela");
      return;
    }

    if (points.length < 3) {
      toast.error("É necessário pelo menos 3 pontos para definir uma área");
      return;
    }

    setIsSaving(true);
    try {
      const area = calculateArea(points);
      const perimeter = calculatePerimeter(points);
      
      const { error } = await supabase
        .from('parcelas')
        .insert({
          nome: parcelaName,
          produtor_id: selectedProducer,
          coordenadas: JSON.stringify(points),
          area_metros_quadrados: area,
          perimetro_metros: perimeter
        });

      if (error) throw error;

      toast.success("Parcela salva com sucesso!");
      
      // Navigate back to producer profile if coming from there
      const producerIdFromUrl = searchParams.get('producerId');
      if (producerIdFromUrl) {
        navigate(`/producer/${producerIdFromUrl}/parcelas`);
        return;
      }
      
      // Reset form if not coming from producer profile
      setPoints([]);
      setParcelaName("");
      setSelectedProducer("");
      updateMapDisplay([]);
      
    } catch (error) {
      console.error('Erro ao salvar parcela:', error);
      toast.error('Erro ao salvar parcela');
    } finally {
      setIsSaving(false);
    }
  };

  const initializeMapbox = async (): Promise<void> => {
    try {
      if (!mapContainer.current) return;

      // Set Mapbox access token
      mapboxgl.accessToken = 'KLV3F4L5RqU1UdgO';

      // Get user's current location
      const position = await getCurrentPosition();
      const center: [number, number] = [position.coords.longitude, position.coords.latitude];

      // Initialize map
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-v9',
        center: center,
        zoom: 16
      });

      // Add navigation controls
      mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add click handler for manual point addition
      mapInstance.on('click', (e) => {
        if (mode === 'manual' && selectedProducer) {
          addPoint(e.lngLat.lat, e.lngLat.lng);
        }
      });

      setMap(mapInstance);
      setIsLoading(false);
      toast.success("Mapa carregado com sucesso");
    } catch (error) {
      console.error("Erro ao inicializar mapa:", error);
      setIsLoading(false);
      toast.error("Erro ao carregar mapa");
    }
  };

  const updateMapDisplay = (currentPoints: GpsPoint[] = points): void => {
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Remove existing polygon
    if (polygonRef.current) {
      map.removeLayer('polygon-fill');
      map.removeLayer('polygon-outline');
      map.removeSource('polygon');
      polygonRef.current = null;
    }

    // Add markers for each point
    currentPoints.forEach((point, index) => {
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.backgroundColor = '#10b981';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontSize = '10px';
      el.style.fontWeight = 'bold';
      el.style.color = 'white';
      el.textContent = (index + 1).toString();

      const marker = new mapboxgl.Marker(el)
        .setLngLat([point.lng, point.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Create polygon if we have at least 3 points
    if (currentPoints.length >= 3) {
      const coordinates = currentPoints.map(point => [point.lng, point.lat]);
      coordinates.push(coordinates[0]); // Close the polygon

      map.addSource('polygon', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [coordinates]
          },
          properties: {}
        }
      });

      map.addLayer({
        id: 'polygon-fill',
        type: 'fill',
        source: 'polygon',
        paint: {
          'fill-color': '#10b981',
          'fill-opacity': 0.3
        }
      });

      map.addLayer({
        id: 'polygon-outline',
        type: 'line',
        source: 'polygon',
        paint: {
          'line-color': '#10b981',
          'line-width': 2
        }
      });

      polygonRef.current = true;
    }

    // Fit map to points if we have any
    if (currentPoints.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      currentPoints.forEach(point => {
        bounds.extend([point.lng, point.lat]);
      });
      map.fitBounds(bounds, { padding: 50 });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  const area = calculateArea(points);
  const perimeter = calculatePerimeter(points);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="mr-3"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Demarcar Parcela</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Configuração da Parcela</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Producer Selection */}
              <div className="space-y-2">
                <Label htmlFor="producer">Selecionar Produtor</Label>
                <Select value={selectedProducer} onValueChange={setSelectedProducer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um produtor" />
                  </SelectTrigger>
                  <SelectContent>
                    {producers.map((producer) => (
                      <SelectItem key={producer.id} value={producer.id}>
                        {producer.nome_completo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {searchParams.get('producerId') && (
                  <p className="text-sm text-muted-foreground">
                    Produtor pré-selecionado do perfil
                  </p>
                )}
              </div>

              {/* Plot Name */}
              <div className="space-y-2">
                <Label htmlFor="parcela-name">Nome da Parcela</Label>
                <Input
                  id="parcela-name"
                  value={parcelaName}
                  onChange={(e) => setParcelaName(e.target.value)}
                  placeholder="Digite o nome da parcela"
                />
              </div>

              {/* Mode Selection */}
              <div className="flex gap-2">
                <Button
                  variant={mode === "manual" ? "default" : "outline"}
                  onClick={() => setMode("manual")}
                  className="flex-1"
                  disabled={!selectedProducer}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Manual
                </Button>
                <Button
                  variant={mode === "walking" ? "default" : "outline"}
                  onClick={() => setMode("walking")}
                  className="flex-1"
                  disabled={!selectedProducer}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Caminhada
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{points.length}</div>
                  <div className="text-sm text-muted-foreground">Pontos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {(area / 10000).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Hectares</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {(perimeter / 1000).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Km</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={mode === "manual" ? () => addPoint() : toggleWalkingMode}
                  disabled={!selectedProducer}
                  className="flex-1"
                >
                  {mode === "manual" ? (
                    <>
                      <MapPin className="mr-2 h-4 w-4" />
                      Adicionar Ponto
                    </>
                  ) : isWalking ? (
                    <>
                      <Square className="mr-2 h-4 w-4" />
                      Parar
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Iniciar
                    </>
                  )}
                </Button>
                
                <Button variant="outline" onClick={removeLastPoint} disabled={points.length === 0}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Desfazer
                </Button>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={clearAllPoints} disabled={points.length === 0}>
                  Limpar Tudo
                </Button>
                <Button 
                  onClick={saveDemarcation} 
                  disabled={points.length < 3 || !selectedProducer || !parcelaName.trim() || isSaving}
                  className="flex-1"
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Salvar Parcela
                </Button>
              </div>

              {/* Points List */}
              {points.length > 0 && (
                <div className="space-y-2">
                  <Label>Pontos Capturados</Label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {points.map((point, index) => (
                      <div key={point.id} className="flex justify-between items-center text-sm bg-muted p-2 rounded">
                        <span>Ponto {index + 1}</span>
                        <Badge variant="secondary">
                          {point.accuracy.toFixed(1)}m
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Instruções:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Selecione primeiro um produtor e dê um nome à parcela</li>
                  <li>• Use modo Manual para adicionar pontos clicando no mapa</li>
                  <li>• Use modo Caminhada para capturar pontos automaticamente</li>
                  <li>• São necessários pelo menos 3 pontos para formar uma área</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Map Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Mapa Interativo</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div 
                ref={mapContainer} 
                className="w-full h-[600px] rounded-lg"
                style={{ minHeight: '600px' }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DemarcateArea;