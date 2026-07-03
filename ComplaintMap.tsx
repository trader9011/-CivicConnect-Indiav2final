import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { db } from '../lib/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';

// Fix Leaflet's default icon path issues with Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface ComplaintMapProps {
  complaints?: any[];
  center?: [number, number];
  zoom?: number;
}

export default function ComplaintMap({ complaints: initialComplaints, center = [20.5937, 78.9629], zoom = 5 }: ComplaintMapProps) {
  const [complaints, setComplaints] = useState<any[]>(initialComplaints || []);

  useEffect(() => {
    if (!initialComplaints) {
      const fetchAll = async () => {
        const q = query(collection(db, 'complaints'));
        const snap = await getDocs(q);
        setComplaints(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      };
      fetchAll();
    } else {
      setComplaints(initialComplaints);
    }
  }, [initialComplaints]);

  // Center on the first complaint if possible and not explicitly set
  const mapCenter = complaints.find(c => c.coordinates?.lat)?.coordinates 
    ? [complaints.find(c => c.coordinates?.lat).coordinates.lat, complaints.find(c => c.coordinates?.lat).coordinates.lng] as [number, number]
    : center;

  return (
    <div className="h-[500px] w-full rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 z-0 relative">
      <MapContainer center={mapCenter} zoom={zoom} style={{ height: '100%', width: '100%', zIndex: 0 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {complaints.filter(c => c.coordinates?.lat).map(complaint => {
          const confidence = complaint.upvotes ? Math.round((complaint.upvotes.length / (complaint.upvotes.length + (complaint.downvotes?.length || 0) || 1)) * 100) : 0;
          return (
            <Marker key={complaint.id} position={[complaint.coordinates.lat, complaint.coordinates.lng]}>
              <Popup>
                <div className="p-1 min-w-[200px]">
                  <p className="font-bold text-sm mb-1">{complaint.category}</p>
                  <p className="text-xs text-gray-500 mb-2 truncate">{complaint.location}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-brand-royal/10 text-brand-royal text-[10px] px-2 py-0.5 rounded font-bold uppercase">{complaint.status}</span>
                    {confidence > 0 && <span className="bg-emerald-500/10 text-emerald-600 text-[10px] px-2 py-0.5 rounded font-bold">{confidence}% Trust</span>}
                  </div>
                  <Link to={`/track?id=${complaint.id}`} className="block text-center w-full bg-brand-navy text-white text-xs py-1.5 rounded-lg font-bold">
                    View Details
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
