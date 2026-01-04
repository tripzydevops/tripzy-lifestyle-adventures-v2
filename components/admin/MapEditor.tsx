import React, { useState, useEffect, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapItem } from "../../types";
import { mapService } from "../../services/mapService";
import { useLanguage } from "../../localization/LanguageContext";
import { useToast } from "../../hooks/useToast";
import {
  Map as MapIcon,
  Plus,
  Save,
  Trash2,
  MapPin,
  Navigation,
  Layers,
  Settings,
} from "lucide-react";

// Fix Leaflet default icon issues in React
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

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

interface MapEditorProps {
  postId: string;
}

const MapEditor: React.FC<MapEditorProps> = ({ postId }) => {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [maps, setMaps] = useState<MapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMap, setSelectedMap] = useState<Partial<MapItem> | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchMaps = useCallback(async () => {
    try {
      setLoading(true);
      const data = await mapService.getMapsByPostId(postId);
      setMaps(data);
    } catch (error) {
      addToast(t("admin.maps.loadError"), "error");
    } finally {
      setLoading(false);
    }
  }, [postId, addToast]);

  useEffect(() => {
    fetchMaps();

    // Subscribe to realtime updates for this post's maps
    const subscription = mapService.subscribeToMaps(postId, () => {
      fetchMaps();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchMaps, postId]);

  const handleAddNew = () => {
    setSelectedMap({
      postId,
      name: t("admin.maps.addMap"),
      type: "markers",
      centerLat: 41.0082, // Default to Istanbul
      centerLng: 28.9784,
      zoom: 13,
      mapStyle: "streets",
      data: [],
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!selectedMap || !selectedMap.name) return;

    try {
      if (selectedMap.id) {
        await mapService.updateMap(selectedMap.id, selectedMap);
        addToast(t("admin.saveSuccess"), "success");
      } else {
        await mapService.addMap(
          selectedMap as Omit<MapItem, "id" | "createdAt">
        );
        addToast(t("admin.saveSuccess"), "success");
      }
      setIsEditing(false);
      setSelectedMap(null);
      fetchMaps();
    } catch (error) {
      addToast(t("common.error"), "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("admin.deleteConfirm"))) return;

    try {
      await mapService.deleteMap(id);
      addToast(t("admin.deleteSuccess"), "success");
      fetchMaps();
    } catch (error) {
      addToast(t("common.error"), "error");
    }
  };

  // Map Click Handler Component
  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        if (!isEditing || !selectedMap) return;

        const newPoint = {
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          title: "New Point",
          description: "",
        };

        if (selectedMap.type === "markers") {
          setSelectedMap((prev) => ({
            ...prev,
            data: [...(prev?.data || []), newPoint],
          }));
        } else if (selectedMap.type === "route") {
          setSelectedMap((prev) => ({
            ...prev,
            data: [...(prev?.data || []), [e.latlng.lat, e.latlng.lng]],
          }));
        }
      },
    });
    return null;
  };

  if (loading)
    return <div className="p-4 text-center">{t("admin.maps.loading")}</div>;

  return (
    <div className="bg-navy-900/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <MapIcon size={20} className="text-gold" />
            {t("admin.maps.title")}
          </h3>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">
            Layer 1 & 3: Geospatial Signal Collection
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-gold/10 text-gold border border-gold/20 rounded-xl hover:bg-gold/20 transition-all text-sm font-bold"
          >
            <Plus size={16} />
            {t("admin.maps.addMap")}
          </button>
        )}
      </div>

      {!isEditing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {maps.map((map) => (
            <div
              key={map.id}
              className="bg-navy-800/30 border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-gold/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-navy-700 rounded-xl text-gold">
                  {map.type === "route" ? (
                    <Navigation size={20} />
                  ) : (
                    <MapPin size={20} />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-white">{map.name}</h4>
                  <p className="text-xs text-gray-500 uppercase tracking-tighter">
                    {map.type} • {map.data.length}{" "}
                    {t("admin.users.role") === "Gezgin" ? "nokta" : "points"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    setSelectedMap(map);
                    setIsEditing(true);
                  }}
                  className="p-2 hover:bg-white/5 text-gray-400 hover:text-white rounded-lg transition-all"
                >
                  <Settings size={18} />
                </button>
                <button
                  onClick={() => handleDelete(map.id)}
                  className="p-2 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-lg transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {maps.length === 0 && (
            <div className="col-span-2 py-10 text-center border-2 border-dashed border-white/5 rounded-3xl text-gray-500">
              {t("admin.maps.noMaps")}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 block mb-2">
                  {t("admin.maps.mapName")}
                </label>
                <input
                  type="text"
                  value={selectedMap?.name || ""}
                  onChange={(e) =>
                    setSelectedMap((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="w-full bg-navy-800/50 border border-white/5 rounded-2xl px-5 py-3 text-white focus:border-gold/50 transition-all"
                  placeholder={t("admin.maps.namePlaceholder")}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 block mb-2">
                  {t("admin.maps.mapType")}
                </label>
                <select
                  value={selectedMap?.type || "markers"}
                  onChange={(e) =>
                    setSelectedMap((prev) => ({
                      ...prev,
                      type: e.target.value as any,
                      data: [],
                    }))
                  }
                  className="w-full bg-navy-800/50 border border-white/5 rounded-2xl px-5 py-3 text-white focus:border-gold/50 transition-all"
                >
                  <option value="markers">{t("admin.maps.markers")}</option>
                  <option value="route">{t("admin.maps.route")}</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-gold text-navy-950 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                >
                  <Save size={18} />
                  {t("admin.maps.saveMap")}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedMap(null);
                  }}
                  className="px-6 py-3 bg-navy-800 text-white rounded-xl font-bold border border-white/5 hover:bg-navy-700 transition-all"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>

            <div className="h-[300px] rounded-2xl overflow-hidden border border-white/10 relative">
              <MapContainer
                center={[
                  selectedMap?.centerLat || 41.0082,
                  selectedMap?.centerLng || 28.9784,
                ]}
                zoom={selectedMap?.zoom || 13}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker />
                {selectedMap?.type === "markers" &&
                  selectedMap?.data?.map((point: any, idx: number) => (
                    <Marker key={idx} position={[point.lat, point.lng]}>
                      <Popup>
                        <div className="p-2">
                          <input
                            className="text-navy-950 font-bold mb-1 border-b"
                            defaultValue={point.title}
                            onBlur={(e) => {
                              const newData = [...selectedMap.data!];
                              newData[idx].title = e.target.value;
                              setSelectedMap((prev) => ({
                                ...prev,
                                data: newData,
                              }));
                            }}
                          />
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                {selectedMap?.type === "route" && selectedMap?.data && (
                  <>
                    {selectedMap.data.map((pos: any, idx: number) => (
                      <Marker key={idx} position={pos} />
                    ))}
                    <Polyline
                      positions={selectedMap.data}
                      color="#d4af37"
                      weight={4}
                    />
                  </>
                )}
              </MapContainer>
              <div className="absolute top-4 right-4 z-[1000] bg-navy-900/80 backdrop-blur-md p-2 rounded-lg border border-white/10 text-[10px] text-gold font-bold uppercase tracking-widest shadow-xl">
                {t("admin.maps.clickToPlace")}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapEditor;
