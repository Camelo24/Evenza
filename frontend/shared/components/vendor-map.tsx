"use client";

import L from "leaflet";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

type MapVendor = {
  id: string;
  businessName: string;
  slug: string;
  city: string;
  latitude: string | null;
  longitude: string | null;
  startingPrice: number;
  imageUrl: string;
};

const cameroonCenter: L.LatLngExpression = [5.5, 12.4];
const vendorIcon = L.divIcon({ className: "trufeta-map-marker", html: '<span aria-hidden="true">●</span>', iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -16] });
const userIcon = L.divIcon({ className: "trufeta-user-marker", html: '<span aria-hidden="true">●</span>', iconSize: [20, 20], iconAnchor: [10, 10] });

function MapViewport({ vendors, userLocation }: { vendors: Array<MapVendor & { position: L.LatLngExpression }>; userLocation: L.LatLngExpression | null }) {
  const map = useMap();

  useEffect(() => {
    const points = [...vendors.map((vendor) => vendor.position), ...(userLocation ? [userLocation] : [])];
    if (points.length === 1) map.setView(points[0], 13);
    else if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [36, 36], maxZoom: 13 });
    else map.setView(cameroonCenter, 6);
  }, [map, vendors, userLocation]);

  return null;
}

export function ServiceProviderMap({ vendors }: { vendors: MapVendor[] }) {
  const [userLocation, setUserLocation] = useState<L.LatLngExpression | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const mappedVendors = useMemo(() => vendors.flatMap((vendor) => {
    const latitude = Number(vendor.latitude);
    const longitude = Number(vendor.longitude);
    return Number.isFinite(latitude) && Number.isFinite(longitude) ? [{ ...vendor, position: [latitude, longitude] as L.LatLngExpression }] : [];
  }), [vendors]);

  function locateUser() {
    if (!navigator.geolocation) return setLocationError("Location is not available in this browser.");
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setUserLocation([coords.latitude, coords.longitude]),
      () => setLocationError("We could not access your location. Check your browser permission and try again."),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 300_000 },
    );
  }

  return (
    <div className="relative min-h-[360px] overflow-hidden sm:min-h-[480px]">
      <MapContainer center={cameroonCenter} zoom={6} scrollWheelZoom className="h-full min-h-[360px] w-full sm:min-h-[480px]" aria-label="Vendor locations map">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapViewport vendors={mappedVendors} userLocation={userLocation} />
        {mappedVendors.map((vendor) => (
          <Marker key={vendor.id} position={vendor.position} icon={vendorIcon}>
            <Popup>
              <div className="flex gap-3">
                <img
                  src={vendor.imageUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Ccircle cx='12' cy='8' r='4'/%3E%3Cpath d='M12 14c-4.42 0-8 2.69-8 6v2h16v-2c0-3.31-3.58-6-8-6z'/%3E%3C/svg%3E"}
                  alt={vendor.businessName}
                  className="size-16 rounded-full object-cover bg-ink/10"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Ccircle cx='12' cy='8' r='4'/%3E%3Cpath d='M12 14c-4.42 0-8 2.69-8 6v2h16v-2c0-3.31-3.58-6-8-6z'/%3E%3C/svg%3E";
                  }}
                />
                <div>
                  <p className="font-semibold text-ink">{vendor.businessName}</p>
                  <p className="mt-1 text-xs text-ink/60">{vendor.city} · From {vendor.startingPrice.toLocaleString("en-CM")} FCFA</p>
                  <Link href={`/vendors/${vendor.slug}`} className="mt-2 inline-block text-xs font-bold text-berry">View profile</Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        {userLocation && <Marker position={userLocation} icon={userIcon}><Popup>Your approximate location</Popup></Marker>}
      </MapContainer>
        <div className="absolute bottom-4 left-1/2 z-[1000] -translate-x-1/2 rounded-full bg-white px-3 py-2 text-center text-[10px] font-semibold shadow-lg">
          <button type="button" onClick={locateUser} className="text-forest hover:text-berry">Use my location</button><span className="mx-2 text-ink/25">·</span><span>{mappedVendors.length} approximate service provider locations</span>
        {locationError && <span className="mt-1 block font-normal text-berry">{locationError}</span>}
      </div>
    </div>
  );
}
