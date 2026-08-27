export default {
    async fetch(request, env) {

        const url = new URL(request.url);

        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Content-Type": "application/json"
        };


        // =========================
        // CORS
        // =========================

        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: corsHeaders
            });
        }


        // =========================
        // GET SCORES
        // =========================

        if (
            request.method === "GET" &&
            url.pathname === "/api/scores"
        ) {

            try {

                const result =
                    await env.DB
                        .prepare(`
                            SELECT
                                id,
                                user_id,
                                name,
                                date,
                                score,
                                note,
                                created_at,
                                created
                            FROM scores
                            WHERE user_id = ?
                            ORDER BY date ASC, created ASC
                        `)
                        .bind(1)
                        .all();


                return new Response(
                    JSON.stringify(
                        result.results || []
                    ),
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

                const data =
                    await request.json();


                const name =
                    String(
                        data.name || ""
                    ).trim();


                const date =
                    String(
                        data.date || ""
                    ).trim();


                const score =
                    Number(data.score);


                const note =
                    String(
                        data.note || ""
                    ).trim();


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
                            error:
                                "Data tryout tidak valid."
                        }),
                        {
                            status: 400,
                            headers: corsHeaders
                        }
                    );
                }


                // =========================
                // DATA DATABASE
                // =========================

                const userId = 1;

                const created =
                    Date.now();

                const createdAt =
                    new Date().toISOString();


                // =========================
                // INSERT
                // =========================

                const result =
                    await env.DB
                        .prepare(`
                            INSERT INTO scores
                            (
                                user_id,
                                name,
                                date,
                                score,
                                note,
                                created_at,
                                created
                            )
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        `)
                        .bind(
                            userId,
                            name,
                            date,
                            score,
                            note,
                            createdAt,
                            created
                        )
                        .run();


                return new Response(
                    JSON.stringify({
                        success: true,
                        id: result.meta?.last_row_id ?? null
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
        // DELETE ONE
        // =========================

        if (
            request.method === "DELETE" &&
            url.pathname.startsWith(
                "/api/scores/"
            )
        ) {

            try {

                const id =
                    Number(
                        url.pathname
                            .split("/")
                            .pop()
                    );


                if (!Number.isInteger(id)) {

                    return new Response(
                        JSON.stringify({
                            success: false,
                            error: "ID tidak valid."
                        }),
                        {
                            status: 400,
                            headers: corsHeaders
                        }
                    );
                }


                await env.DB
                    .prepare(`
                        DELETE FROM scores
                        WHERE id = ?
                        AND user_id = ?
                    `)
                    .bind(
                        id,
                        1
                    )
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
                        WHERE user_id = ?
                    `)
                    .bind(1)
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
        // NOT FOUND
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
