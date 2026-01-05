import React from 'react'
import Map from 'react-map-gl/mapbox'

export const MapView = () => {
  return (
    <Map
      mapStyle='mapbox://styles/mapbox/streets-v12'
      style={{height: '100%', width: '100%'}}
      attributionControl={false}
      mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
      minZoom={10}
      initialViewState={{
        latitude: 34.052235,
        longitude: -118.243683,
        zoom: 10,
      }}
    >
      MapView
    </Map>
  )
}
