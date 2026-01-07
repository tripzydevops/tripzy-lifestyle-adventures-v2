import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapItem } from "../../types";
import { useTripzy } from "../../hooks/useTripzy";

// Fix Leaflet default icon issues in React
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { MapPin } from "lucide-react";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewerProps {
  mapData: MapItem;
  postTitle?: string;
}

const MapViewer: React.FC<MapViewerProps> = ({ mapData, postTitle }) => {
  const tripzy = useTripzy();
  const [activeMarker, setActiveMarker] = useState<string | null>(null);

  const handleMarkerClick = (point: any) => {
    setActiveMarker(point.title);

    // Layer 1: Geospatial Signal Collection
    if (tripzy) {
      tripzy.track("map_interaction", {
        action: "marker_click",
        poi_name: point.title,
        map_name: mapData.name,
        post_context: postTitle,
        lat: point.lat,
        lng: point.lng,
      });
    }
  };

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-navy-900 relative">
      <div className="absolute top-4 left-4 z-[1000] bg-navy-900/90 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 shadow-lg">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <MapPin size={16} className="text-gold" />
          {mapData.name}
        </h4>
      </div>

      <div className="h-[400px] w-full">
        <MapContainer
          center={[mapData.centerLat, mapData.centerLng]}
          zoom={mapData.zoom}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url={
              mapData.mapStyle === "satellite"
                ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            }
          />
          {mapData.data?.map((point: any, idx: number) => (
            <Marker
              key={idx}
              position={[point.lat, point.lng]}
              eventHandlers={{
                click: () => handleMarkerClick(point),
              }}
            >
              <Popup className="custom-popup">
                <div className="p-1">
                  <h4 className="font-bold text-navy-950 text-sm mb-1">
                    {point.title}
                  </h4>
                  {point.description && (
                    <p className="text-xs text-gray-600 m-0 leading-tight">
                      {point.description}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="bg-navy-900 p-4 border-t border-white/5 flex flex-wrap gap-2">
        {mapData.data?.map((point: any, idx: number) => (
          <button
            key={idx}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
              activeMarker === point.title
                ? "bg-gold text-navy-950 border-gold font-bold"
                : "bg-navy-800 text-gray-400 border-white/5 hover:bg-white/5"
            }`}
          >
            {point.title}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MapViewer;
