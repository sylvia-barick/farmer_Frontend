import React, { useEffect, useState } from 'react';

const FarmMap = ({ lat, lon }) => {
    const [position, setPosition] = useState([lat, lon]);

    useEffect(() => {
        // Try to get real-time location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    console.log("Real-time location found:", latitude, longitude);
                    setPosition([latitude, longitude]);
                },
                (err) => {
                    console.warn("Geolocation failed or denied, using fallback props:", err);
                    // Fallback to props is handled by initial state, but if props change:
                    setPosition([lat, lon]);
                }
            );
        }
    }, [lat, lon]);

    useEffect(() => {
        // Check if Leaflet is loaded
        if (!window.L) {
            console.error("Leaflet not loaded");
            return;
        }

        // Initialize map
        // We use a unique ID or check if map instance exists to avoid re-initialization issues if using strict mode
        // But for this simple component, just tearing down on cleanup is usually enough.
        const mapContainer = document.getElementById('farm-map');
        if (mapContainer && mapContainer._leaflet_id) {
            mapContainer._leaflet_id = null; // Force re-initialization hack if needed, or better, just rely on cleanup
        }

        const map = window.L.map('farm-map').setView(position, 13);

        // Add tile layer (OpenStreetMap)
        window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        // Add marker
        window.L.marker(position).addTo(map)
            .bindPopup("<b>Current Location</b><br />Real-time view.")
            .openPopup();

        // Cleanup on unmount or dependency change
        return () => {
            map.remove();
        };
    }, [position]);

    return (
        <div id="farm-map" style={{ height: '300px', width: '100%', borderRadius: '8px', zIndex: 0 }}></div>
    );
};

export default FarmMap;
