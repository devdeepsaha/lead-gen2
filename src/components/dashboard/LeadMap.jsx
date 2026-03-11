import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import MapController from './MapController';

// RECENTLY CHANGED: Added MapResizer to force Leaflet to recalculate its size on mount
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    // This fixes the "broken tiles" or "half-gray map" issue
    setTimeout(() => {
      map.invalidateSize();
    }, 250);
  }, [map]);
  return null;
}

export default function LeadMap({ mappableLeads, selectedMapLead, markerRefs, getStatusColor, onViewInDirectory }) {
  // Map standard starting position (India/Global center)
  const center = mappableLeads.length > 0 ? [mappableLeads[0].lat, mappableLeads[0].lng] : [20, 77];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col mb-4 select-text">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
        <div>
          <h3 className="text-base font-bold text-slate-800">Geographic Distribution</h3>
          <p className="text-xs text-slate-500 mt-0.5">{mappableLeads.length} leads with location data</p>
        </div>
        <span className="material-symbols-outlined text-slate-300">public</span>
      </div>
      
      {/* IMPORTANT: Standard Leaflet needs an explicit height. 
        The z-index 0 prevents map controls from floating over your navigation headers.
      */}
      <div className="w-full h-[300px] lg:h-[500px] relative z-0">
        {mappableLeads.length > 0 ? (
          <MapContainer 
            center={center} 
            zoom={5} 
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
            {/* Base Tile Provider */}
            <TileLayer 
               url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
               attribution='&copy; CARTO'
            />
            
            {/* Logic Components */}
            <MapResizer />
            <MapController selectedLead={selectedMapLead} markerRefs={markerRefs} />

            {mappableLeads.map(l => (
              <CircleMarker 
                key={l.id} 
                center={[l.lat, l.lng]} 
                radius={6}
                ref={(r) => { if(r) markerRefs.current[l.id] = r; }} 
                pathOptions={{ 
                  color: getStatusColor(l.status), 
                  fillColor: getStatusColor(l.status), 
                  fillOpacity: 0.8, 
                  weight: 2 
                }}
              >
                <Popup className="rounded-lg">
                  <div className="font-display min-w-[150px] select-text">
                    <p className="font-bold text-slate-800 text-sm mb-1">{l.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">{l.category}</p>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase" style={{ backgroundColor: getStatusColor(l.status) }}>
                      {l.status === 'none' ? 'Untagged' : l.status.replace('_', ' ')}
                    </span>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
                      <button onClick={(e) => { e.stopPropagation(); onViewInDirectory(l); }} className="text-[10px] font-bold text-primary flex items-center gap-0.5 hover:underline">
                        View in Directory <span className="material-symbols-outlined" style={{fontSize: '14px'}}>arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-2">location_off</span>
            <p className="text-sm font-semibold">No location data found</p>
          </div>
        )}
      </div>
    </div>
  );
}