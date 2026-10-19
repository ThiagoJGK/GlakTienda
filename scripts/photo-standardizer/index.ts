import { loadConfig } from './config.js';
import { initSupabase, fetchPendingJob, updateJobStatus, getProductImages } from './supabase-client.js';
import { FlowOrchestrator } from './flow-orchestrator.js';
import { uploadToCloudinary } from './cloudinary-upload.js';

let isShuttingDown = false;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("=========================================");
  console.log(" GLak Photo Standardizer Daemon Starting ");
  console.log("=========================================\n");

  const config = loadConfig();
  initSupabase(config);

  console.log(`Configuration loaded:`);
  console.log(`- Supabase URL: ${config.supabaseUrl}`);
  console.log(`- Cloudinary Cloud: ${config.cloudinaryCloudName}`);
  console.log(`- Poll Interval: ${config.pollIntervalSeconds}s`);
  console.log(`- Temp Dir: ${config.tempDir}\n`);

  const orchestrator = new FlowOrchestrator(config);

  console.log("Starting polling loop... Press Ctrl+C to stop.");

  while (!isShuttingDown) {
    try {
      const job = await fetchPendingJob();

      if (!job) {
        // No pending jobs, wait
        await sleep(config.pollIntervalSeconds * 1000);
        continue;
      }

      console.log(`\n[${new Date().toISOString()}] Found pending job: ${job.id}`);
      
      // Update status to processing
      await updateJobStatus(job.id, 'processing', {
        started_at: new Date().toISOString()
      });

      // Fetch product images and slug
      const productData = await getProductImages(job.product_id);
      
      const flowJob = {
        jobId: job.id,
        productSlug: productData.slug,
        sourceImages: productData.images, // Assuming images is an array of cloudinary IDs/URLs
        presets: job.presets
      };

      // Run Flow Orchestrator
      const localResults = await orchestrator.processJob(flowJob);
      
      // Upload results to Cloudinary
      const finalResults = [];
      for (const res of localResults) {
        if (res.status === 'completed') {
          console.log(`Uploading result for preset ${res.preset} to Cloudinary...`);
          const publicId = `products/standardized/${productData.slug}/${res.preset}`;
          
          try {
            const uploadRes = await uploadToCloudinary(res.localPath, publicId, config);
            finalResults.push({
              preset_id: res.preset,
              image_id: uploadRes.public_id,
              url: uploadRes.secure_url
            });
            console.log(`  Uploaded to ${uploadRes.secure_url}`);
          } catch (uploadError: any) {
            console.error(`  Upload failed for preset ${res.preset}:`, uploadError);
            finalResults.push({
              preset_id: res.preset,
              error: uploadError.message
            });
          }
        } else {
          finalResults.push({
            preset_id: res.preset,
            error: res.error
          });
        }
      }

      // Update job to completed
      await updateJobStatus(job.id, 'completed', {
        completed_at: new Date().toISOString(),
        results: finalResults
      });
      
      console.log(`\n[${new Date().toISOString()}] Job ${job.id} completed successfully.`);

    } catch (error: any) {
      console.error(`\n[ERROR] Polling loop error:`, error);
      // If we have a current job context, we should ideally mark it failed here,
      // but fetchPendingJob itself might fail. We rely on the orchestrator to throw.
      await sleep(config.pollIntervalSeconds * 1000);
    }
  }

  console.log("Daemon shutdown complete.");
}

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log("\nReceived SIGINT. Shutting down gracefully...");
  isShuttingDown = true;
});

process.on('SIGTERM', () => {
  console.log("\nReceived SIGTERM. Shutting down gracefully...");
  isShuttingDown = true;
});

// Start the daemon
main().catch((err) => {
  console.error("Fatal error starting daemon:", err);
  process.exit(1);
});
