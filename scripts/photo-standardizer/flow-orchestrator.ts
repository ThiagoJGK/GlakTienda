import fs from 'node:fs';
import path from 'node:path';
import { Config } from './config.js';

export interface FlowJob {
  jobId: string;
  productSlug: string;
  sourceImages: string[]; // Cloudinary public IDs or URLs
  presets: { id: string; prompt: string; aspectRatio: string }[];
}

export interface FlowResult {
  preset: string;
  localPath: string;
  status: 'completed' | 'failed';
  error?: string;
}

export class FlowOrchestrator {
  private tempDir: string;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.tempDir = config.tempDir;
  }

  async processJob(job: FlowJob): Promise<FlowResult[]> {
    console.log(`\n--- Starting processing for job ${job.jobId} (Product: ${job.productSlug}) ---`);
    const results: FlowResult[] = [];

    try {
      // 1. Download source images to temp directory
      console.log(`[Step 1] Downloading ${job.sourceImages.length} source images...`);
      const localSourcePaths: string[] = [];
      for (let i = 0; i < job.sourceImages.length; i++) {
        const sourceImg = job.sourceImages[i];
        
        let url = sourceImg;
        if (!sourceImg.startsWith('http')) {
          url = `https://res.cloudinary.com/${this.config.cloudinaryCloudName}/image/upload/${sourceImg}`;
        }
        
        console.log(`  Downloading ${url}...`);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to download source image: ${url}`);
        
        const buffer = await response.arrayBuffer();
        const localPath = path.join(this.tempDir, `source_${job.jobId}_${i}.jpg`);
        fs.writeFileSync(localPath, Buffer.from(buffer));
        localSourcePaths.push(localPath);
        console.log(`  Saved to ${localPath}`);
      }

      // 2. Output MCP Tool Call Sequence
      console.log(`\n[Step 2] Executing MCP Flow Sequence (Simulation)...`);
      
      // TODO: Replace with actual MCP client calls
      console.log(`  > call: project_create { title: "Standardize ${job.productSlug}" }`);
      
      for (const localSource of localSourcePaths) {
        console.log(`  > call: flow_upload_reference { file: "${localSource}" }`);
      }
      
      console.log(`  > call: flow_inspect_page {}`);
      console.log(`  > call: flow_bind_asset { asset_id: "uploaded_ingredient_id" }`);

      // 3. Process each preset
      for (const preset of job.presets) {
        console.log(`\n  Processing Preset: ${preset.id}`);
        console.log(`  > call: flow_prepare_generation { prompt: "${preset.prompt}", aspect_ratio: "${preset.aspectRatio}" }`);
        console.log(`  > call: flow_submit_generation {}`);
        console.log(`  > call: flow_wait_for_generation {}`);
        
        const outFileName = `generated_${job.jobId}_${preset.id}.jpg`;
        const localOutPath = path.join(this.tempDir, outFileName);
        
        console.log(`  > call: flow_download_asset { destination: "${localOutPath}" }`);
        
        // Simulation: create a dummy file
        console.log(`  [SIMULATION] Creating dummy file at ${localOutPath}`);
        fs.writeFileSync(localOutPath, Buffer.from('dummy image data'));

        results.push({
          preset: preset.id,
          localPath: localOutPath,
          status: 'completed'
        });
      }

      console.log(`\n--- Completed processing for job ${job.jobId} ---`);
      
    } catch (error: any) {
      console.error(`\n[ERROR] Failed to process job ${job.jobId}:`, error);
      // If we fail globally, all presets fail or we just throw up to index.ts
      throw error; 
    }

    return results;
  }
}
