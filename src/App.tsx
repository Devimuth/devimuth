import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Home from './pages/Home'
import Tools from './pages/Tools'
import GISTools from './pages/GISTools'
import DevTools from './pages/DevTools'
import ProductivityTools from './pages/ProductivityTools'
import MarketingTools from './pages/MarketingTools'
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
import SEOMetaGenerator from './tools/marketing/SEOMetaGenerator'
import MetaDescriptionGenerator from './tools/marketing/MetaDescriptionGenerator'
import OpenGraphGenerator from './tools/marketing/OpenGraphGenerator'
import SchemaMarkupGenerator from './tools/marketing/SchemaMarkupGenerator'
import SocialPreviewGenerator from './tools/marketing/SocialPreviewGenerator'
import KeywordDensityAnalyzer from './tools/marketing/KeywordDensityAnalyzer'
import URLShortener from './tools/marketing/URLShortener'
import TypingTest from './tools/va/TypingTest'
import SkillsAssessmentGenerator from './tools/va/SkillsAssessmentGenerator'
import CommunicationTest from './tools/va/CommunicationTest'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/gis-tools" element={<GISTools />} />
          <Route path="/dev-tools" element={<DevTools />} />
          <Route path="/productivity-tools" element={<ProductivityTools />} />
          <Route path="/marketing-tools" element={<MarketingTools />} />
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
          <Route path="/seo-meta-generator" element={<SEOMetaGenerator />} />
          <Route path="/meta-description-generator" element={<MetaDescriptionGenerator />} />
          <Route path="/open-graph-generator" element={<OpenGraphGenerator />} />
          <Route path="/schema-markup-generator" element={<SchemaMarkupGenerator />} />
          <Route path="/social-preview-generator" element={<SocialPreviewGenerator />} />
          <Route path="/keyword-density-analyzer" element={<KeywordDensityAnalyzer />} />
          <Route path="/url-shortener" element={<URLShortener />} />
          <Route path="/typing-test" element={<TypingTest />} />
          <Route path="/skills-assessment-generator" element={<SkillsAssessmentGenerator />} />
          <Route path="/communication-test" element={<CommunicationTest />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App

