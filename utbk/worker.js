export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    const origin = request.headers.get("Origin");

    const corsHeaders = {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Content-Type": "application/json"
    };


    // =========================
    // CORS PREFLIGHT
    // =========================

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }


    // =========================
    // RESPONSE
    // =========================

    function json(data, status = 200, extra = {}) {

      return new Response(
        JSON.stringify(data),
        {
          status,

          headers: {
            ...corsHeaders,
            ...extra
          }
        }
      );

    }


    // =========================
    // PASSWORD HASH
    // =========================

    async function hashPassword(password) {

      const data =
        new TextEncoder().encode(password);

      const hash =
        await crypto.subtle.digest(
          "SHA-256",
          data
        );

      return Array
        .from(new Uint8Array(hash))
        .map(
          byte =>
            byte
              .toString(16)
              .padStart(2, "0")
        )
        .join("");

    }


    // =========================
    // SESSION TOKEN
    // =========================

    function createToken() {

      const bytes =
        crypto.getRandomValues(
          new Uint8Array(32)
        );

      return Array
        .from(bytes)
        .map(
          byte =>
            byte
              .toString(16)
              .padStart(2, "0")
        )
        .join("");

    }


    // =========================
    // COOKIE
    // =========================

    function sessionCookie(
      token,
      maxAge = 604800
    ) {

      return [
        `session=${token}`,
        "HttpOnly",
        "Secure",
        "SameSite=None",
        "Path=/",
        `Max-Age=${maxAge}`
      ].join("; ");

    }


    // =========================
    // GET COOKIE
    // =========================

    function getSessionToken() {

      const cookie =
        request.headers.get("Cookie");

      if (!cookie) {
        return null;
      }

      const match =
        cookie.match(
          /(?:^|;\s*)session=([^;]+)/
        );

      return match
        ? match[1]
        : null;

    }


    // =========================
    // REGISTER
    // =========================

    if (
      url.pathname === "/api/register" &&
      request.method === "POST"
    ) {

      let body;

      try {

        body =
          await request.json();

      } catch {

        return json(
          {
            error:
              "JSON tidak valid."
          },
          400
        );

      }


      const name =
        String(body.name || "")
          .trim();

      const email =
        String(body.email || "")
          .trim()
          .toLowerCase();

      const password =
        String(body.password || "");


      if (
        !name ||
        !email ||
        !password
      ) {

        return json(
          {
            error:
              "Nama, email, dan password wajib diisi."
          },
          400
        );

      }


      if (password.length < 8) {

        return json(
          {
            error:
              "Password minimal 8 karakter."
          },
          400
        );

      }


      const existing =
        await env.DB
          .prepare(
            `
            SELECT id
            FROM users
            WHERE email = ?
            `
          )
          .bind(email)
          .first();


      if (existing) {

        return json(
          {
            error:
              "Email sudah terdaftar."
          },
          409
        );

      }


      const passwordHash =
        await hashPassword(password);


      await env.DB
        .prepare(
          `
          INSERT INTO users
          (
            email,
            password_hash,
            name,
            created_at
          )
          VALUES (?, ?, ?, ?)
          `
        )
        .bind(
          email,
          passwordHash,
          name,
          new Date().toISOString()
        )
        .run();


      return json({
        success: true,

        message:
          "Akun berhasil dibuat."
      });

    }


    // =========================
    // LOGIN
    // =========================

    if (
      url.pathname === "/api/login" &&
      request.method === "POST"
    ) {

      let body;

      try {

        body =
          await request.json();

      } catch {

        return json(
          {
            error:
              "JSON tidak valid."
          },
          400
        );

      }


      const email =
        String(body.email || "")
          .trim()
          .toLowerCase();

      const password =
        String(body.password || "");


      if (!email || !password) {

        return json(
          {
            error:
              "Email dan password wajib diisi."
          },
          400
        );

      }


      const user =
        await env.DB
          .prepare(
            `
            SELECT
              id,
              email,
              name,
              password_hash
            FROM users
            WHERE email = ?
            `
          )
          .bind(email)
          .first();


      if (!user) {

        return json(
          {
            error:
              "Email atau password salah."
          },
          401
        );

      }


      const passwordHash =
        await hashPassword(password);


      if (
        passwordHash !==
        user.password_hash
      ) {

        return json(
          {
            error:
              "Email atau password salah."
          },
          401
        );

      }


      const token =
        createToken();


      const expires =
        new Date(
          Date.now() +
          7 * 24 * 60 * 60 * 1000
        ).toISOString();


      await env.DB
        .prepare(
          `
          INSERT INTO sessions
          (
            token,
            user_id,
            expires_at
          )
          VALUES (?, ?, ?)
          `
        )
        .bind(
          token,
          user.id,
          expires
        )
        .run();


      return json(
        {
          success: true,

          user: {
            id: user.id,
            name: user.name,
            email: user.email
          }
        },

        200,

        {
          "Set-Cookie":
            sessionCookie(token)
        }
      );

    }


    // =========================
    // CURRENT USER
    // =========================

    if (
      url.pathname === "/api/me" &&
      request.method === "GET"
    ) {

      const token =
        getSessionToken();


      if (!token) {

        return json(
          {
            authenticated: false
          },
          401
        );

      }


      const session =
        await env.DB
          .prepare(
            `
            SELECT
              sessions.user_id,
              sessions.expires_at,
              users.email,
              users.name
            FROM sessions

            JOIN users
              ON users.id =
                 sessions.user_id

            WHERE sessions.token = ?
            `
          )
          .bind(token)
          .first();


      if (!session) {

        return json(
          {
            authenticated: false
          },
          401
        );

      }


      if (
        new Date(session.expires_at)
        <= new Date()
      ) {

        await env.DB
          .prepare(
            `
            DELETE FROM sessions
            WHERE token = ?
            `
          )
          .bind(token)
          .run();


        return json(
          {
            authenticated: false
          },
          401
        );

      }


      return json({

        authenticated: true,

        user: {
          id:
            session.user_id,

          name:
            session.name,

          email:
            session.email
        }

      });

    }


    // =========================
    // LOGOUT
    // =========================

    if (
      url.pathname === "/api/logout" &&
      request.method === "POST"
    ) {

      const token =
        getSessionToken();


      if (token) {

        await env.DB
          .prepare(
            `
            DELETE FROM sessions
            WHERE token = ?
            `
          )
          .bind(token)
          .run();

      }


      return json(
        {
          success: true
        },

        200,

        {
          "Set-Cookie":
            sessionCookie(
              "",
              0
            )
        }
      );

    }


    // =========================
    // AUTH HELPER
    // =========================

    async function getUserId() {

      const token =
        getSessionToken();


      if (!token) {
        return null;
      }


      const session =
        await env.DB
          .prepare(
            `
            SELECT
              user_id,
              expires_at
            FROM sessions
            WHERE token = ?
            `
          )
          .bind(token)
          .first();


      if (!session) {
        return null;
      }


      if (
        new Date(session.expires_at)
        <= new Date()
      ) {

        return null;

      }


      return session.user_id;

    }


    // =========================
    // GET SCORES
    // =========================

    if (
      url.pathname === "/api/scores" &&
      request.method === "GET"
    ) {

      const userId =
        await getUserId();


      if (!userId) {

        return json(
          {
            error:
              "Unauthorized"
          },
          401
        );

      }


      const result =
        await env.DB
          .prepare(
            `
            SELECT
              id,
              name,
              date,
              score,
              note,
              created_at
            FROM scores
            WHERE user_id = ?
            ORDER BY date ASC
            `
          )
          .bind(userId)
          .all();


      return json({
        scores:
          result.results
      });

    }


    // =========================
    // ADD SCORE
    // =========================

    if (
      url.pathname === "/api/scores" &&
      request.method === "POST"
    ) {

      const userId =
        await getUserId();


      if (!userId) {

        return json(
          {
            error:
              "Unauthorized"
          },
          401
        );

      }


      let body;

      try {

        body =
          await request.json();

      } catch {

        return json(
          {
            error:
              "JSON tidak valid."
          },
          400
        );

      }


      const name =
        String(body.name || "")
          .trim();

      const date =
        String(body.date || "");

      const score =
        Number(body.score);

      const note =
        String(body.note || "")
          .trim();


      if (
        !name ||
        !date ||
        Number.isNaN(score)
      ) {

        return json(
          {
            error:
              "Data tryout belum lengkap."
          },
          400
        );

      }


      if (
        score < 0 ||
        score > 1000
      ) {

        return json(
          {
            error:
              "Nilai harus antara 0 sampai 1000."
          },
          400
        );

      }


      const result =
        await env.DB
          .prepare(
            `
            INSERT INTO scores
            (
              user_id,
              name,
              date,
              score,
              note,
              created_at
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `
          )
          .bind(
            userId,
            name,
            date,
            score,
            note,
            new Date().toISOString()
          )
          .run();


      return json({
        success: true,

        id:
          result.meta.last_row_id
      });

    }


    // =========================
    // DELETE SCORE
    // =========================

    const match =
      url.pathname.match(
        /^\/api\/scores\/(\d+)$/
      );


    if (
      match &&
      request.method === "DELETE"
    ) {

      const userId =
        await getUserId();


      if (!userId) {

        return json(
          {
            error:
              "Unauthorized"
          },
          401
        );

      }


      const scoreId =
        Number(match[1]);


      await env.DB
        .prepare(
          `
          DELETE FROM scores
          WHERE id = ?
          AND user_id = ?
          `
        )
        .bind(
          scoreId,
          userId
        )
        .run();


      return json({
        success: true
      });

    }


    return json(
      {
        error:
          "Endpoint tidak ditemukan."
      },
      404
    );

  }
};

type OrderRow = {
  Id; string;
  CustomerName: string;
  OrderDate: number;
};

export default {
  async fetch(request, env) {
    const result = await env.DB
      .prepare("SELECT 1 AS test")
      .first();

    return Response.json(result);
  }
};
