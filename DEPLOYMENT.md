# Deployment Guide

## GitHub Pages Deployment

This project is configured for GitHub Pages deployment.

### Prerequisites

1. Create a GitHub repository
2. Update the base path in `vite.config.ts` to match your repository name
3. Update URLs in `public/sitemap.xml` and `public/robots.txt` with your actual GitHub Pages URL

### Deployment Steps

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Deploy to GitHub Pages:
   ```bash
   npm run deploy
   ```

   This will:
   - Build the project
   - Deploy the `dist` folder to the `gh-pages` branch
   - Make your site available at `https://yourusername.github.io/Devimuth/`

### Configuration

1. **Update base path** in `vite.config.ts`:
   ```typescript
   base: '/YourRepositoryName/',
   ```

2. **Update sitemap.xml** with your actual domain:
   ```xml
   <loc>https://yourusername.github.io/Devimuth/</loc>
   ```

3. **Update robots.txt** with your actual domain:
   ```
   Sitemap: https://yourusername.github.io/Devimuth/sitemap.xml
   ```

4. **Enable GitHub Pages** in your repository settings:
   - Go to Settings > Pages
   - Select source: `gh-pages` branch
   - Select folder: `/ (root)`

### Local Development

Run the development server:
```bash
npm run dev
```

The site will be available at `http://localhost:5173`

### Production Build

Test the production build locally:
```bash
npm run build
npm run preview
```

