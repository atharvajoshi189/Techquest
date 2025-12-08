"use client";

import { useEffect } from "react";
import { MapContainer, ImageOverlay, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Team {
    id: number;
    name: string;
    current_step: number;
    x_coord: number;
    y_coord: number;
    last_updated: string;
}

interface AdminMapProps {
    teams: Team[];
}

const bounds: L.LatLngBoundsExpression = [[0, 0], [1000, 1000]];

const createTeamIcon = (teamName: string) => {
    // Create icon HTML directly without using renderToString
    const iconHtml = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; transform: translate(-50%, -50%);">
            <div style="color: #8B0000; font-size: 24px; margin-bottom: 4px;">👣</div>
            <span style="margin-top: 4px; font-weight: bold; color: #1a1a1a; white-space: nowrap; background: rgba(245, 230, 200, 0.8); padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(26, 26, 26, 0.2); box-shadow: 0 1px 2px rgba(0,0,0,0.1); font-size: 14px;">
                ${teamName}
            </span>
        </div>
    `;

    return L.divIcon({
        html: iconHtml,
        className: "custom-team-marker",
        iconSize: [60, 60],
        iconAnchor: [30, 30],
    });
};

const MapController = () => {
    const map = useMap();
    useEffect(() => {
        map.fitBounds(bounds);
    }, [map]);
    return null;
}

const AdminMap = ({ teams }: AdminMapProps) => {
    return (
        <div className="h-full w-full rounded-xl overflow-hidden shadow-2xl border-4 border-double border-ink-black/30 bg-[#f5e6c8]">
            <div className="marauders-map h-full w-full">
                <MapContainer
                    bounds={bounds}
                    center={[500, 500]}
                    zoom={1}
                    crs={L.CRS.Simple}
                    style={{ height: "100%", width: "100%", background: "#f5e6c8" }}
                    minZoom={-1}
                    maxZoom={4}
                    attributionControl={false}
                >
                    <ImageOverlay
                        url="https://via.placeholder.com/1000x800.png?text=Hogwarts+Blueprint"
                        bounds={bounds}
                        opacity={0.8}
                    />

                    {teams.map((team) => (
                        <Marker
                            key={team.id}
                            position={[team.y_coord, team.x_coord]}
                            icon={createTeamIcon(team.name)}
                        >
                            <Popup className="font-cinzel text-center">
                                <div className="font-bold text-lg border-b border-gray-300 pb-1 mb-1">{team.name}</div>
                                <div className="font-sans">Location Code: {team.current_step}</div>
                            </Popup>
                        </Marker>
                    ))}

                    <MapController />
                </MapContainer>
            </div>
        </div>
    );
};

export default AdminMap;
