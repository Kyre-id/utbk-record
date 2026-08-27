export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Tes koneksi D1
    if (url.pathname === "/api/test-db") {
      try {
        const result = await env.DB
          .prepare("SELECT 1 AS test")
          .first();

        return Response.json({
          success: true,
          database: result
        });
      } catch (error) {
        return Response.json(
          {
            success: false,
            error: error.message
          },
          { status: 500 }
        );
      }
    }

    // Sajikan file HTML/CSS/JS
    return env.ASSETS.fetch(request);
  }
};
