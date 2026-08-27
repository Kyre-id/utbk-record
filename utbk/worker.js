export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // =========================
        // CORS
        // =========================

        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Content-Type": "application/json"
        };

        // Handle CORS preflight
        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: corsHeaders
            });
        }


        // =========================
        // GET ALL SCORES
        // =========================

        if (
            request.method === "GET" &&
            url.pathname === "/api/scores"
        ) {
            try {
                const result = await env.DB
                    .prepare(`
                        SELECT
                            id,
                            name,
                            date,
                            score,
                            note,
                            created
                        FROM scores
                        ORDER BY date ASC, created ASC
                    `)
                    .all();

                return new Response(
                    JSON.stringify(result.results || []),
                    {
                        status: 200,
                        headers: corsHeaders
                    }
                );

            } catch (error) {
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: error.message
                    }),
                    {
                        status: 500,
                        headers: corsHeaders
                    }
                );
            }
        }


        // =========================
        // ADD SCORE
        // =========================

        if (
            request.method === "POST" &&
            url.pathname === "/api/scores"
        ) {
            try {
                const data = await request.json();

                const name =
                    String(data.name || "").trim();

                const date =
                    String(data.date || "").trim();

                const score =
                    Number(data.score);

                const note =
                    String(data.note || "").trim();


                // Validasi
                if (
                    !name ||
                    !date ||
                    !Number.isFinite(score) ||
                    score < 0 ||
                    score > 1000
                ) {
                    return new Response(
                        JSON.stringify({
                            success: false,
                            error: "Data tryout tidak valid."
                        }),
                        {
                            status: 400,
                            headers: corsHeaders
                        }
                    );
                }


                const id =
                    crypto.randomUUID();

                const created =
                    Date.now();


                await env.DB
                    .prepare(`
                        INSERT INTO scores
                        (
                            id,
                            name,
                            date,
                            score,
                            note,
                            created
                        )
                        VALUES (?, ?, ?, ?, ?, ?)
                    `)
                    .bind(
                        id,
                        name,
                        date,
                        score,
                        note,
                        created
                    )
                    .run();


                return new Response(
                    JSON.stringify({
                        success: true,
                        id: id
                    }),
                    {
                        status: 201,
                        headers: corsHeaders
                    }
                );

            } catch (error) {
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: error.message
                    }),
                    {
                        status: 500,
                        headers: corsHeaders
                    }
                );
            }
        }


        // =========================
        // DELETE ONE SCORE
        // =========================

        if (
            request.method === "DELETE" &&
            url.pathname.startsWith("/api/scores/")
        ) {
            try {
                const id =
                    url.pathname.split("/").pop();


                await env.DB
                    .prepare(`
                        DELETE FROM scores
                        WHERE id = ?
                    `)
                    .bind(id)
                    .run();


                return new Response(
                    JSON.stringify({
                        success: true
                    }),
                    {
                        status: 200,
                        headers: corsHeaders
                    }
                );

            } catch (error) {
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: error.message
                    }),
                    {
                        status: 500,
                        headers: corsHeaders
                    }
                );
            }
        }


        // =========================
        // DELETE ALL
        // =========================

        if (
            request.method === "DELETE" &&
            url.pathname === "/api/scores"
        ) {
            try {

                await env.DB
                    .prepare(`
                        DELETE FROM scores
                    `)
                    .run();


                return new Response(
                    JSON.stringify({
                        success: true
                    }),
                    {
                        status: 200,
                        headers: corsHeaders
                    }
                );

            } catch (error) {
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: error.message
                    }),
                    {
                        status: 500,
                        headers: corsHeaders
                    }
                );
            }
        }


        // =========================
        // DEFAULT
        // =========================

        return new Response(
            JSON.stringify({
                success: false,
                error: "Endpoint tidak ditemukan."
            }),
            {
                status: 404,
                headers: corsHeaders
            }
        );
    }
};
