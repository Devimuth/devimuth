import proj4 from 'proj4'

// Define common EPSG projections
proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs')

// Add UTM zones (1-60) for both hemispheres
for (let zone = 1; zone <= 60; zone++) {
  const zoneStr = zone.toString().padStart(2, '0')
  // UTM North (EPSG:32601-32660)
  proj4.defs(`EPSG:326${zoneStr}`, `+proj=utm +zone=${zone} +datum=WGS84 +units=m +no_defs`)
  // UTM South (EPSG:32701-32760)
  proj4.defs(`EPSG:327${zoneStr}`, `+proj=utm +zone=${zone} +south +datum=WGS84 +units=m +no_defs`)
}

export default proj4

