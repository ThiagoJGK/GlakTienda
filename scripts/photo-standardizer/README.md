# GLak Photo Standardizer Daemon

Local daemon that processes photo standardization jobs via Google Flow MCP.

## Prerequisites

- Node.js 18+
- Google AI Pro account
- Chrome (for Google Flow)
- Set up the [Google Flow MCP server](https://github.com/google/flow-mcp)

## Installation

1. Navigate to this directory:
   ```bash
   cd scripts/photo-standardizer
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Fill in the values in `.env`:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (NOT the anon key)
   - `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name
   - `CLOUDINARY_API_KEY`: Cloudinary API key
   - `CLOUDINARY_API_SECRET`: Cloudinary API secret
   - `POLL_INTERVAL_SECONDS`: (Optional) Polling interval in seconds (default: 10)
   - `TEMP_DIR`: (Optional) Temp directory for downloaded/generated images (default: `./temp`)

## Usage

To start the daemon:

```bash
npm start
```

For development mode (auto-reload on changes):

```bash
npm run dev
```

## How it works

1. **Polling Loop**: The daemon continuously polls the `photo_standardization_jobs` table in Supabase for jobs with `status = 'pending'`.
2. **MCP Integration**: When a job is found, it downloads the source product images and simulates/orchestrates Google Flow through MCP commands to generate standardized photos based on the job's presets.
3. **Cloudinary Upload**: Once generations are complete, it uploads the resulting images to Cloudinary.
4. **Completion**: Finally, it updates the job status to `completed` in Supabase with the generation results.

## Troubleshooting

- **Missing environment variables**: Ensure `.env` is properly configured. The daemon will crash on startup if required variables are missing.
- **Supabase errors**: Check if the service role key is valid and has permissions to read/write the `photo_standardization_jobs` table.
- **Cloudinary upload failures**: Verify your Cloudinary API key and secret. Check if the folder structure permissions allow uploads.
