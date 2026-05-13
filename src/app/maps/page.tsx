"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MapPin, Navigation, Info, Locate, Loader2, Search } from "lucide-react";
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin,
  InfoWindow,
  useMap,
  useMapsLibrary
} from "@vis.gl/react-google-maps";

const defaultCenter = {
  lat: -6.2088, // Jakarta
  lng: 106.8456,
};

// Component to handle modern Routing (Routes API)
function RoutePath({ origin, destination, onResponse }: { 
  origin: google.maps.LatLngLiteral | null, 
  destination: google.maps.LatLngLiteral | null,
  onResponse: (response: any) => void 
}) {
  const map = useMap();
  const routesLibrary = useMapsLibrary("routes");
  const geometryLibrary = useMapsLibrary("geometry");
  const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!geometryLibrary || !map || !origin || !destination) {
      if (polyline) polyline.setMap(null);
      return;
    }

    if (polyline) polyline.setMap(null);

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
    if (!apiKey) return;

    const requestBody = {
      origin: {
        location: {
          latLng: {
            latitude: origin.lat,
            longitude: origin.lng
          }
        }
      },
      destination: {
        location: {
          latLng: {
            latitude: destination.lat,
            longitude: destination.lng
          }
        }
      },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE'
    };

    fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'
      },
      body: JSON.stringify(requestBody)
    })
    .then(res => res.json())
    .then(data => {
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const encodedPath = route.polyline.encodedPolyline;
        const decodedPath = geometryLibrary.encoding.decodePath(encodedPath);

        const newPolyline = new google.maps.Polyline({
          path: decodedPath,
          geodesic: true,
          strokeColor: "#10b981",
          strokeOpacity: 0.8,
          strokeWeight: 5,
          map: map
        });

        setPolyline(newPolyline);
        onResponse(route);
      } else {
        onResponse(null);
      }
    })
    .catch(err => {
      console.error("Routes REST API Error:", err);
      onResponse(null);
    });

    return () => {
      if (polyline) polyline.setMap(null);
    };
  }, [geometryLibrary, map, origin, destination]);

  return null;
}

export default function MapsScreen() {
  const map = useMap();
  const placesLibrary = useMapsLibrary("places");
  
  const [clinics, setClinics] = useState<any[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [routeDestination, setRouteDestination] = useState<google.maps.LatLngLiteral | null>(null);
  const [routeInfo, setRouteInfo] = useState<any>(null);

  const selectedClinic = clinics.find(c => c.place_id === selectedClinicId);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const apiKeyMissing = !apiKey || apiKey === "your_google_maps_api_key_here";

  // Function to search for nearby clinics using Places API (New)
  const searchNearbyClinics = useCallback(async (location: google.maps.LatLngLiteral) => {
    if (!placesLibrary || !map) return;

    setIsSearching(true);
    
    try {
      const { Place, SearchNearbyRankPreference } = placesLibrary as any;
      
      const request = {
        fields: ['id', 'displayName', 'formattedAddress', 'location', 'rating'],
        locationRestriction: {
          center: location,
          radius: 5000,
        },
        includedPrimaryTypes: ['hospital', 'medical_clinic', 'doctor'],
        maxResultCount: 15,
        rankPreference: SearchNearbyRankPreference.POPULARITY,
        language: 'id',
      };

      const { places } = await Place.searchNearby(request);
      
      if (places && places.length > 0) {
        const formattedResults = places.map((place: any) => ({
          place_id: place.id,
          name: place.displayName,
          address: place.formattedAddress,
          position: {
            lat: place.location?.lat() || 0,
            lng: place.location?.lng() || 0
          },
          rating: place.rating
        }));
        setClinics(formattedResults);
      } else {
        setClinics([]);
      }
    } catch (err: any) {
      console.error("Places (New) search failed:", err);
      // Fallback to empty if error
      setClinics([]);
    } finally {
      setIsSearching(false);
    }
  }, [placesLibrary, map]);

  // Initial search or search when location changes
  useEffect(() => {
    if (placesLibrary && map) {
      searchNearbyClinics(mapCenter);
    }
  }, [placesLibrary, map, mapCenter, searchNearbyClinics]);

  const handleLocateMe = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(loc);
          setMapCenter(loc);
          setIsLocating(false);
          // Automatic search at new location
          searchNearbyClinics(loc);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Gagal mendapatkan lokasi. Pastikan izin lokasi sudah diberikan.");
          setIsLocating(false);
        }
      );
    } else {
      alert("Browser Anda tidak mendukung geolokasi.");
      setIsLocating(false);
    }
  };

  const handleGetDirections = (clinic: any) => {
    if (!userLocation) {
      alert("Mohon aktifkan lokasi Anda terlebih dahulu untuk mendapatkan rute.");
      handleLocateMe();
      return;
    }
    setRouteDestination(clinic.position);
    setSelectedClinicId(clinic.place_id);
  };

  if (apiKeyMissing) {
    return (
      <div className="flex flex-col w-full max-w-5xl mx-auto px-6 py-6 md:py-10 h-[calc(100vh-80px)] transition-colors duration-300">
        <div className="flex items-center gap-3 mb-6">
          <MapPin className="w-6 h-6 text-health-green" />
          <h1 className="text-[22px] font-bold text-health-dark-blue dark:text-white">Maps & Clinics</h1>
        </div>
        <div className="flex-1 rounded-[20px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-center p-8 text-center transition-colors">
          <div className="max-w-md">
            <div className="w-16 h-16 bg-health-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-8 h-8 text-health-green" />
            </div>
            <h3 className="text-health-dark-blue dark:text-white text-xl font-bold mb-3">Google Maps API Key Belum Terpasang</h3>
            <p className="text-text-gray dark:text-slate-400 text-sm leading-relaxed mb-6">
              Peta interaktif tidak dapat ditampilkan tanpa API Key yang valid. Silakan buka file 
              <code className="bg-slate-100 dark:bg-slate-800 text-health-dark-blue dark:text-white px-2 py-0.5 rounded mx-1 font-mono text-xs transition-colors">.env.local</code> 
              dan masukkan API Key Anda pada variabel 
              <code className="bg-slate-100 dark:bg-slate-800 text-health-dark-blue dark:text-white px-2 py-0.5 rounded mx-1 font-mono text-xs transition-colors">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>.
            </p>
            <a 
              href="https://console.cloud.google.com/google/maps-apis/credentials" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block bg-health-dark-blue dark:bg-emerald-600 text-white text-sm font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-emerald-500/10"
            >
              Dapatkan API Key
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto px-6 py-6 md:py-10 h-[calc(100vh-80px)] transition-colors duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-health-green" />
            <h1 className="text-[22px] font-bold text-health-dark-blue dark:text-white">Maps & Clinics</h1>
          </div>
          <button 
            onClick={handleLocateMe}
            disabled={isLocating}
            className="flex items-center gap-2 bg-health-green text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-health-green/90 transition-all disabled:opacity-50 active:scale-95"
          >
            {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Locate className="w-4 h-4" />}
            {isLocating ? "Mencari lokasi..." : "Gunakan Lokasi Saya"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
          {/* Sidebar List */}
          <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-text-gray dark:text-slate-500 uppercase tracking-wider">Klinik Terdekat</h2>
                {isSearching && <Loader2 className="w-3 h-3 animate-spin text-health-green" />}
              </div>
              {routeInfo && (
                <span className="text-[10px] font-bold text-health-green bg-health-green/10 px-2 py-0.5 rounded">
                  {routeInfo.distanceMeters ? (routeInfo.distanceMeters / 1000).toFixed(1) + ' km' : ''}
                </span>
              )}
            </div>
            
            {clinics.length === 0 && !isSearching && (
              <div className="bg-white dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center transition-colors">
                <Search className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-text-gray dark:text-slate-500">Tidak ada klinik ditemukan di sekitar area ini.</p>
              </div>
            )}

            {clinics.map((clinic) => (
              <div 
                key={clinic.place_id}
                onClick={() => setSelectedClinicId(clinic.place_id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedClinicId === clinic.place_id 
                  ? "bg-health-green/5 dark:bg-emerald-500/10 border-health-green shadow-sm" 
                  : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-health-green/50 dark:hover:border-emerald-500/50 shadow-sm"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-health-dark-blue dark:text-white text-sm line-clamp-1">{clinic.name}</h3>
                </div>
                <p className="text-xs text-text-gray dark:text-slate-400 mb-3 line-clamp-2">{clinic.address}</p>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGetDirections(clinic);
                    }}
                    className="flex items-center gap-1 text-[10px] font-bold text-health-green bg-health-green/10 dark:bg-emerald-500/20 px-3 py-1.5 rounded-full hover:bg-health-green/20 dark:hover:bg-emerald-500/30 transition-colors"
                  >
                    <Navigation className="w-3 h-3" /> Rute
                  </button>
                  <div className="flex items-center gap-1 text-[10px] text-yellow-500 font-bold ml-auto">
                    ★ {clinic.rating || "N/A"}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Map Container */}
          <div className="md:col-span-2 rounded-[20px] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 relative h-[400px] md:h-full min-h-[400px] transition-colors duration-300">
            <Map
              center={mapCenter}
              onCenterChanged={(e) => setMapCenter(e.detail.center)}
              zoom={14}
              mapId="DEMO_MAP_ID"
              disableDefaultUI={false}
              fullscreenControl={true}
            >
              {/* User Marker */}
              {userLocation && (
                <AdvancedMarker position={userLocation} title="Lokasi Anda">
                  <div className="relative">
                    <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
                    <div className="absolute -inset-2 bg-blue-500/20 rounded-full animate-ping"></div>
                  </div>
                </AdvancedMarker>
              )}

              {/* Clinic Markers */}
              {clinics.map((clinic) => (
                <AdvancedMarker
                  key={clinic.place_id}
                  position={clinic.position}
                  onClick={() => setSelectedClinicId(clinic.place_id)}
                  title={clinic.name}
                >
                  <Pin 
                    background={selectedClinicId === clinic.place_id ? '#059669' : '#10b981'} 
                    borderColor={'#064e3b'} 
                    glyphColor={'#ffffff'} 
                    scale={selectedClinicId === clinic.place_id ? 1.4 : 1.2}
                  />
                </AdvancedMarker>
              ))}

              <RoutePath 
                origin={userLocation} 
                destination={routeDestination} 
                onResponse={setRouteInfo} 
              />

              {selectedClinicId && selectedClinic && (
                <InfoWindow
                  position={selectedClinic.position}
                  onCloseClick={() => setSelectedClinicId(null)}
                >
                  <div className="p-2 min-w-[150px] dark:text-slate-800">
                    <h4 className="font-bold text-sm text-health-dark-blue mb-1">{selectedClinic.name}</h4>
                    <p className="text-[11px] text-text-gray mb-2">{selectedClinic.address}</p>
                    {routeInfo && routeDestination?.lat === selectedClinic.position.lat && (
                       <div className="bg-health-green/5 p-2 rounded-lg mb-2 border border-health-green/10">
                          <p className="text-[10px] text-health-dark-blue font-bold">
                            🚗 {routeInfo.duration ? (parseInt(routeInfo.duration) / 60).toFixed(0) + ' mnt' : '-'} ({routeInfo.distanceMeters ? (routeInfo.distanceMeters / 1000).toFixed(1) + ' km' : '-'})
                          </p>
                       </div>
                    )}
                    <button className="w-full text-[10px] font-bold text-white bg-health-green py-2 rounded-lg hover:bg-health-green/90 transition-colors">
                      Book Appointment
                    </button>
                  </div>
                </InfoWindow>
              )}
            </Map>
        </div>
      </div>
    </div>
  );
}
