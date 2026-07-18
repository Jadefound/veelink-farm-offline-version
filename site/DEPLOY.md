# VeeLink Farm Landing Page - Cloudflare Deploy Guide

This is a static, marketing + download landing page for VeeLink Farm. It is designed to be deployed to **Cloudflare Pages**.

## What's included

- `index.html` - Landing page (hero, features, download, contact, footer)
- `styles.css` - Responsive styles
- `main.js` - Mobile menu + download placeholder tracking
- `images/` - Logo, favicon, and selected marketing screenshots from `/images`

## Deploy with Wrangler CLI

1. Install Wrangler (if you haven't):
   ```bash
   npm install -g wrangler
   ```

2. Authenticate with your Cloudflare account:
   ```bash
   npx wrangler login
   ```

3. Deploy:
   ```bash
   cd site
   npx wrangler pages deploy .
   ```

The first deploy will create the project and give you a `*.pages.dev` URL.

## Option A: Auto-deploy via GitHub Actions (recommended)

A workflow is already configured in `.github/workflows/deploy-site.yml`. It deploys the `site/` folder to Cloudflare Pages on every push to `main`.

### One-time setup

1. Create a Cloudflare Pages project named `veelink-farm` (or update `projectName` in `.github/workflows/deploy-site.yml`).
2. Get your Cloudflare **Account ID** from the right sidebar of any Cloudflare dashboard page.
3. Create a Cloudflare **API token** with the following permissions:
   - **Cloudflare Pages**: Edit
   - **Account**: Read (optional, for listing projects)
4. Add these as GitHub secrets in your repo:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN`
5. Push to `main`. GitHub Actions will deploy automatically.

## Option B: Direct Cloudflare Pages + GitHub integration

1. Push the repo to GitHub.
2. In the Cloudflare dashboard, go to **Pages** > **Create a project** > **Connect to Git**.
3. Select the `veelink-farm-offline-version` repo.
4. Set build command to: `echo "No build needed"` (or leave empty)
5. Set build output directory to: `site`
6. Save and deploy.

Every push to `main` will automatically redeploy the site.

## Replace placeholder links

The two download buttons are placeholders (`href="#"`). Update them once your builds are ready:

- **Download Android APK**: Replace with the direct URL to your APK file (e.g., hosted on Cloudflare R2, GitHub Releases, or your own server).
- **Use on Web**: Replace with the URL of your web app build.

Look for these buttons in `index.html` inside the `<section class="download">` block. The iOS note is informational until you publish to the App Store.

## Optional: Add custom domain

In the Cloudflare Pages dashboard, go to **Custom domains** and follow the prompts to add your domain (e.g., `veelink.farm`).
