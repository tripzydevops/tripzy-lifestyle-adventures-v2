import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapItem } from "../../types";
import { useTripzy } from "../../hooks/useTripzy";

// Import standard icons for fallback
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import {
  MapPin,
  Navigation,
  Utensils,
  Castle,
  TreePine,
  Eye,
  Activity,
} from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";

// Fallback Default Icon
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

const getCategoryIcon = (category: string = "View") => {
  let color = "bg-purple-600";
  let icon = <Eye size={16} color="white" />;

  const safeCat = category.toLowerCase();

  if (safeCat.includes("history")) {
    color = "bg-amber-600";
    icon = <Castle size={16} color="white" />;
  } else if (safeCat.includes("food")) {
    color = "bg-red-600";
    icon = <Utensils size={16} color="white" />;
  } else if (safeCat.includes("nature")) {
    color = "bg-green-600";
    icon = <TreePine size={16} color="white" />;
  } else if (safeCat.includes("activity")) {
    color = "bg-blue-600";
    icon = <Activity size={16} color="white" />;
  }

  const html = renderToStaticMarkup(
    <div
      className={`w-8 h-8 rounded-full ${color} border-2 border-white shadow-lg flex items-center justify-center transform hover:scale-110 transition-transform`}
    >
      {icon}
    </div>
  );

  return L.divIcon({
    html: html,
    className: "custom-marker-icon", // Remove default leaflet styles
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
  });
};

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
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {mapData.data?.map((point: any, idx: number) => (
            <Marker
              key={idx}
              position={[point.lat, point.lng]}
              icon={getCategoryIcon(point.category)}
              eventHandlers={{
                click: () => handleMarkerClick(point),
              }}
            >
              <Popup className="custom-popup rounded-xl overflow-hidden shadow-xl border-none">
                <div className="p-3 min-w-[200px] bg-white text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded text-white ${
                        (point.category || "View")
                          .toLowerCase()
                          .includes("food")
                          ? "bg-red-500"
                          : (point.category || "View")
                              .toLowerCase()
                              .includes("history")
                          ? "bg-amber-500"
                          : (point.category || "View")
                              .toLowerCase()
                              .includes("nature")
                          ? "bg-green-500"
                          : "bg-purple-500"
                      }`}
                    >
                      {point.category || "POI"}
                    </span>
                  </div>
                  <h4
                    className="font-bold text-base mb-1"
                    style={{ color: "black", textShadow: "none" }}
                  >
                    {point.title}
                  </h4>
                  {point.description && (
                    <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                      {point.description}
                    </p>
                  )}

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${point.lat},${point.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold py-2.5 px-3 rounded-lg transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <Navigation size={14} className="text-black" />
                    Get Directions
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="bg-navy-900 p-6 border-t border-white/5 flex flex-wrap gap-4">
        {mapData.data?.map((point: any, idx: number) => (
          <button
            key={idx}
            onClick={() => {
              // Logic to focus map on this point could be added here
              setActiveMarker(point.title);
            }}
            className={`text-base font-semibold px-6 py-3 rounded-xl border transition-all shadow-md ${
              activeMarker === point.title
                ? "bg-gold text-black border-gold shadow-gold/20 scale-105"
                : "bg-white/5 text-white/90 border-white/10 hover:bg-white/10 hover:border-gold/50 hover:text-gold"
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
