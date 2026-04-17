'use client'

import 'leaflet/dist/leaflet.css'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L, { LatLngExpression, Icon } from 'leaflet'

type Celula = {
  id: string
  nome: string
  endereco: string | null
  latitude: number | null
  longitude: number | null
  lider_id: string | null
  supervisor_id: string | null
  tipo_celula: string | null
  dia_semana: string | null
  quantidade_pessoas: number | null
}

type Props = {
  celulas: Celula[]
  lideresMap: Record<string, string>
}

const markerIcon: Icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

export default function MapaCelulas({ celulas, lideresMap }: Props) {
  const primeiraCelulaComCoordenada = celulas.find(
    (celula) => celula.latitude !== null && celula.longitude !== null
  )

  const centroPadrao: LatLngExpression = primeiraCelulaComCoordenada
    ? [primeiraCelulaComCoordenada.latitude!, primeiraCelulaComCoordenada.longitude!]
    : [-23.4205, -51.9331]

  return (
    <div className="h-[420px] overflow-hidden rounded-2xl">
      <MapContainer
        center={centroPadrao}
        zoom={12}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution="© OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {celulas.map((celula) => {
          if (celula.latitude === null || celula.longitude === null) return null

          return (
            <Marker
              key={celula.id}
              position={[celula.latitude, celula.longitude]}
              icon={markerIcon}
            >
              <Popup>
                <div className="space-y-1">
                  <p>
                    <strong>{celula.nome}</strong>
                  </p>
                  <p>Endereço: {celula.endereco || 'Não informado'}</p>
                  <p>Tipo: {celula.tipo_celula || '-'}</p>
                  <p>Dia: {celula.dia_semana || '-'}</p>
                  <p>
                    Líder:{' '}
                    {celula.lider_id
                      ? lideresMap[celula.lider_id] || 'Não encontrado'
                      : 'Sem líder'}
                  </p>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}