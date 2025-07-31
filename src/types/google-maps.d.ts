declare global {
  namespace google {
    namespace maps {
      class Map {
        constructor(element: Element, opts?: MapOptions);
        addListener(eventName: string, handler: Function): MapsEventListener;
        fitBounds(bounds: LatLngBounds | LatLngBoundsLiteral): void;
        getZoom(): number | undefined;
        setZoom(zoom: number): void;
      }

      interface MapOptions {
        center: LatLng | LatLngLiteral;
        zoom: number;
        mapTypeId?: MapTypeId;
        mapTypeControl?: boolean;
        streetViewControl?: boolean;
        fullscreenControl?: boolean;
        zoomControl?: boolean;
      }

      interface LatLng {
        lat(): number;
        lng(): number;
      }

      interface LatLngLiteral {
        lat: number;
        lng: number;
      }

      class LatLngBounds {
        constructor();
        extend(point: LatLng | LatLngLiteral): LatLngBounds;
      }

      interface LatLngBoundsLiteral {
        east: number;
        north: number;
        south: number;
        west: number;
      }

      class Marker {
        constructor(opts?: MarkerOptions);
        setMap(map: Map | null): void;
      }

      interface MarkerOptions {
        position: LatLng | LatLngLiteral;
        map?: Map;
        title?: string;
        label?: string | MarkerLabel;
        icon?: string | Icon | Symbol;
      }

      interface MarkerLabel {
        text: string;
        color?: string;
        fontWeight?: string;
      }

      interface Icon {
        url?: string;
        size?: Size;
        origin?: Point;
        anchor?: Point;
        scaledSize?: Size;
      }

      interface Symbol {
        path: SymbolPath | string;
        fillColor?: string;
        fillOpacity?: number;
        strokeColor?: string;
        strokeWeight?: number;
        scale?: number;
      }

      enum SymbolPath {
        CIRCLE = 0,
        FORWARD_CLOSED_ARROW = 1,
        FORWARD_OPEN_ARROW = 2,
        BACKWARD_CLOSED_ARROW = 3,
        BACKWARD_OPEN_ARROW = 4
      }

      class Polygon {
        constructor(opts?: PolygonOptions);
        setMap(map: Map | null): void;
      }

      interface PolygonOptions {
        paths: LatLng[] | LatLngLiteral[] | MVCArray<LatLng> | MVCArray<MVCArray<LatLng>>;
        strokeColor?: string;
        strokeOpacity?: number;
        strokeWeight?: number;
        fillColor?: string;
        fillOpacity?: number;
      }

      interface MapMouseEvent {
        latLng: LatLng | null;
      }

      enum MapTypeId {
        HYBRID = 'hybrid',
        ROADMAP = 'roadmap',
        SATELLITE = 'satellite',
        TERRAIN = 'terrain'
      }

      interface MapsEventListener {
        remove(): void;
      }

      namespace event {
        function addListener(instance: any, eventName: string, handler: Function): MapsEventListener;
        function removeListener(listener: MapsEventListener): void;
      }

      class MVCArray<T> {
        constructor(array?: T[]);
      }

      class Size {
        constructor(width: number, height: number, widthUnit?: string, heightUnit?: string);
      }

      class Point {
        constructor(x: number, y: number);
      }
    }
  }
}

declare global {
  interface Window {
    google: typeof google;
  }
}

export {};