export async function GET() {
  try {
    // Check environment variables
    const envVars = {
      GOOGLE_API_KEY_EXISTS: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      NODE_ENV: process.env.NODE_ENV,
    };

    // Try importing memory module
    let memoryStatus = "Not attempted";
    try {
      const memoryModule = await import("@/lib/memory");
      memoryStatus = "Import successful";

      // Check if the isMemoryConfigured function exists and what it returns
      const configStatus = memoryModule.isMemoryConfigured
        ? `Function exists, returns: ${memoryModule.isMemoryConfigured()}`
        : "Function does not exist";

      return Response.json({
        status: "success",
        envVars,
        memoryModule: {
          status: memoryStatus,
          configStatus,
          exports: Object.keys(memoryModule),
        },
      });
    } catch (error) {
      memoryStatus = `Error: ${error instanceof Error ? error.message : String(error)}`;
      return Response.json({
        status: "partial_success",
        envVars,
        memoryModule: {
          status: memoryStatus,
        },
      });
    }
  } catch (error) {
    return Response.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
