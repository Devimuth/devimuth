import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Home from './pages/Home'
import GISTools from './pages/GISTools'
import DevTools from './pages/DevTools'
import VATools from './pages/VATools'
import CoordinateConverter from './tools/gis/CoordinateConverter'
import GeoJSONVisualizer from './tools/gis/GeoJSONVisualizer'
import BBOXSelector from './tools/gis/BBOXSelector'
import DistanceArea from './tools/gis/DistanceArea'
import JSONCSVConverter from './tools/dev/JSONCSVConverter'
import UUIDHashGenerator from './tools/dev/UUIDHashGenerator'
import JWTDecoder from './tools/dev/JWTDecoder'
import JSONFormatter from './tools/dev/JSONFormatter'
import Base64URLEncoder from './tools/dev/Base64URLEncoder'
import DiffViewer from './tools/dev/DiffViewer'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gis-tools" element={<GISTools />} />
          <Route path="/dev-tools" element={<DevTools />} />
          <Route path="/va-tools" element={<VATools />} />
          <Route path="/coordinate-converter" element={<CoordinateConverter />} />
          <Route path="/geojson-visualizer" element={<GeoJSONVisualizer />} />
          <Route path="/bbox-selector" element={<BBOXSelector />} />
          <Route path="/distance-area" element={<DistanceArea />} />
          <Route path="/json-csv-converter" element={<JSONCSVConverter />} />
          <Route path="/uuid-hash-generator" element={<UUIDHashGenerator />} />
          <Route path="/jwt-decoder" element={<JWTDecoder />} />
          <Route path="/json-formatter" element={<JSONFormatter />} />
          <Route path="/base64-url-encoder" element={<Base64URLEncoder />} />
          <Route path="/diff-viewer" element={<DiffViewer />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App

