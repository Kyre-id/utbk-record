const TARGET_KEY = "utbk_tracker_target";

let records = [];
let target =
    Number(localStorage.getItem(TARGET_KEY)) || 650;

let chart = null;


// =========================
// ELEMENT HELPER
// =========================

const $ = id =>
    document.getElementById(id);


// =========================
// API
// =========================

async function loadRecords() {

    try {

        const response =
            await fetch("/api/scores");

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        records =
            await response.json();

        render();

    } catch (error) {

        console.error(
            "Gagal mengambil data:",
            error
        );

        alert(
            "Gagal mengambil data dari D1."
        );
    }
}


// =========================
// SAVE RECORD
// =========================

async function addRecord(data) {

    try {

        const response =
            await fetch(
                "/api/scores",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(data)
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.error ||
                "Gagal menyimpan data."
            );
        }


        await loadRecords();


    } catch (error) {

        console.error(
            "Gagal menyimpan:",
            error
        );

        alert(
            "Gagal menyimpan nilai ke D1."
        );
    }
}


// =========================
// DELETE RECORD
// =========================

async function removeRecord(id) {

    try {

        const response =
            await fetch(
                `/api/scores/${encodeURIComponent(id)}`,
                {
                    method: "DELETE"
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.error ||
                "Gagal menghapus data."
            );
        }


        await loadRecords();


    } catch (error) {

        console.error(
            "Gagal menghapus:",
            error
        );

        alert(
            "Gagal menghapus data."
        );
    }
}


// =========================
// DELETE ALL
// =========================

async function clearAllRecords() {

    try {

        const response =
            await fetch(
                "/api/scores",
                {
                    method: "DELETE"
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.error ||
                "Gagal menghapus data."
            );
        }


        await loadRecords();


    } catch (error) {

        console.error(
            "Gagal menghapus semua:",
            error
        );

        alert(
            "Gagal menghapus semua data."
        );
    }
}


// =========================
// FORMAT DATE
// =========================

function formatDate(date) {

    return new Date(
        date + "T00:00:00"
    ).toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


// =========================
// SORT
// =========================

function getSortedRecords() {

    return [...records].sort(
        (a, b) => {

            return (
                a.date.localeCompare(b.date)
                ||
                Number(a.created) -
                Number(b.created)
            );

        }
    );
}


// =========================
// HTML ESCAPE
// =========================

function escapeHTML(value) {

    return String(value)
        .replace(
            /[&<>"']/g,
            char => {

                const map = {

                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#039;"

                };

                return map[char];
            }
        );
}


// =========================
// RENDER
// =========================

function render() {

    const data =
        getSortedRecords();


    // =====================
    // STATISTICS
    // =====================

    $("countStat").textContent =
        data.length;


    $("latestStat").textContent =
        data.length
            ? data[data.length - 1].score
            : "-";


    $("bestStat").textContent =
        data.length
            ? Math.max(
                ...data.map(
                    item =>
                        Number(item.score)
                )
            )
            : "-";


    $("avgStat").textContent =
        data.length
            ? Math.round(
                data.reduce(
                    (total, item) =>
                        total +
                        Number(item.score),
                    0
                ) / data.length
            )
            : "-";


    if (data.length) {

        const latest =
            data[data.length - 1];


        const best =
            data.reduce(
                (a, b) =>
                    Number(b.score) >
                    Number(a.score)
                        ? b
                        : a
            );


        $("bestDate").textContent =
            `${best.name} · ${formatDate(best.date)}`;


        if (data.length > 1) {

            const previous =
                data[data.length - 2];


            const difference =
                Number(latest.score) -
                Number(previous.score);


            $("latestChange").textContent =
                difference === 0
                    ? "Sama dari sebelumnya"
                    : `${difference > 0 ? "+" : ""}${difference} dari TO sebelumnya`;


            $("latestChange").className =
                difference > 0
                    ? "up"
                    : difference < 0
                        ? "down"
                        : "flat";

        } else {

            $("latestChange").textContent =
                "Tryout pertama";

            $("latestChange").className =
                "";
        }

    } else {

        $("bestDate").textContent =
            "Belum ada data";

        $("latestChange").textContent =
            "Belum ada data";

        $("latestChange").className =
            "";
    }


    // =====================
    // HISTORY
    // =====================

    const tbody =
        $("historyBody");


    tbody.innerHTML =
        data
            .slice()
            .reverse()
            .map(
                (record, reverseIndex) => {

                    const index =
                        data.length -
                        1 -
                        reverseIndex;


                    const previous =
                        index > 0
                            ? Number(
                                data[index - 1]
                                    .score
                            )
                            : null;


                    const difference =
                        previous === null
                            ? null
                            : Number(
                                record.score
                            ) - previous;


                    let changeHTML =
                        "-";


                    if (
                        difference !== null
                    ) {

                        const className =
                            difference > 0
                                ? "up"
                                : difference < 0
                                    ? "down"
                                    : "flat";


                        changeHTML =
                            `<span class="${className}">
                                ${difference > 0 ? "+" : ""}
                                ${difference}
                            </span>`;
                    }


                    return `
                        <tr>

                            <td>
                                <strong>
                                    ${escapeHTML(record.name)}
                                </strong>
                            </td>

                            <td>
                                ${formatDate(record.date)}
                            </td>

                            <td class="score">
                                ${record.score}
                            </td>

                            <td>
                                ${changeHTML}
                            </td>

                            <td>
                                ${
                                    record.note
                                        ? escapeHTML(
                                            record.note
                                        )
                                        : "—"
                                }
                            </td>

                            <td>

                                <button
                                    class="delete-button"
                                    data-id="${escapeHTML(record.id)}"
                                    title="Hapus"
                                >
                                    ✕
                                </button>

                            </td>

                        </tr>
                    `;
                }
            )
            .join("");


    // EMPTY HISTORY

    $("emptyHistory").style.display =
        data.length
            ? "none"
            : "grid";


    $("historyBody").style.display =
        data.length
            ? "table-row-group"
            : "none";


    // DELETE BUTTON

    document
        .querySelectorAll(".delete-button")
        .forEach(button => {

            button.onclick = async () => {

                await removeRecord(
                    button.dataset.id
                );

            };

        });


    drawChart(data);
}


// =========================
// CHART
// =========================

function drawChart(data) {

    const range =
        $("chartRange").value;


    let shown;


    if (range === "all") {

        shown = data;

    } else {

        shown =
            data.slice(
                -Number(range)
            );
    }


    $("emptyChart").style.display =
        data.length
            ? "none"
            : "grid";


    if (chart) {

        chart.destroy();

        chart = null;
    }


    if (!data.length) {
        return;
    }


    const canvas =
        $("progressChart");


    chart =
        new Chart(
            canvas,
            {
                type: "line",

                data: {

                    labels:
                        shown.map(
                            item =>
                                item.name
                        ),

                    datasets: [

                        {

                            data:
                                shown.map(
                                    item =>
                                        Number(
                                            item.score
                                        )
                                ),

                            borderWidth: 3,

                            pointRadius: 5,

                            pointHoverRadius: 7,

                            tension: .35,

                            fill: true,

                            backgroundColor:
                                "rgba(99,91,255,.10)",

                            borderColor:
                                "#635bff",

                            pointBackgroundColor:
                                "#635bff"

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: false
                        },

                        tooltip: {

                            displayColors: false,

                            callbacks: {

                                label:
                                    context =>
                                        ` Nilai: ${context.raw}`

                            }

                        }

                    },

                    scales: {

                        x: {

                            grid: {
                                display: false
                            },

                            ticks: {

                                color:
                                    getComputedStyle(
                                        document.body
                                    )
                                    .getPropertyValue(
                                        "--muted"
                                    ),

                                font: {
                                    size: 10
                                }

                            }

                        },

                        y: {

                            min: 0,

                            max: 1000,

                            grid: {

                                color:
                                    getComputedStyle(
                                        document.body
                                    )
                                    .getPropertyValue(
                                        "--border"
                                    )

                            },

                            ticks: {

                                color:
                                    getComputedStyle(
                                        document.body
                                    )
                                    .getPropertyValue(
                                        "--muted"
                                    ),

                                font: {
                                    size: 10
                                }

                            }

                        }

                    }

                }

            }
        );
}


// =========================
// ADD FORM
// =========================

$("scoreForm").onsubmit =
    async event => {

        event.preventDefault();


        const name =
            $("nameInput")
                .value
                .trim();


        const date =
            $("dateInput")
                .value;


        const score =
            Number(
                $("scoreInput")
                    .value
            );


        const note =
            $("noteInput")
                .value
                .trim();


        if (
            !name ||
            !date ||
            !Number.isFinite(score) ||
            score < 0 ||
            score > 1000
        ) {

            alert(
                "Isi data tryout dengan benar."
            );

            return;
        }


        await addRecord({

            name,
            date,
            score,
            note

        });


        event.target.reset();


        $("dateInput").value =
            new Date()
                .toISOString()
                .slice(0, 10);
    };


// =========================
// CLEAR ALL
// =========================

$("clearAll").onclick =
    async () => {

        if (!records.length) {
            return;
        }


        const confirmed =
            confirm(
                "Hapus semua riwayat tryout?\n\nData tidak bisa dikembalikan."
            );


        if (!confirmed) {
            return;
        }


        await clearAllRecords();
    };


// =========================
// TARGET
// =========================

$("targetInput").value =
    target;

$("targetValue").textContent =
    target;


$("saveTarget").onclick =
    () => {

        let value =
            Number(
                $("targetInput")
                    .value
            );


        value =
            Math.max(
                0,
                Math.min(
                    1000,
                    value || 0
                )
            );


        target = value;


        localStorage.setItem(
            TARGET_KEY,
            target
        );


        $("targetValue")
            .textContent =
            target;
    };


// =========================
// CHART RANGE
// =========================

$("chartRange").onchange =
    render;


// =========================
// DARK MODE
// =========================

$("themeToggle").onclick =
    () => {

        const isDark =
            document.documentElement
                .dataset
                .theme === "dark";


        document.documentElement
            .dataset
            .theme =
                isDark
                    ? ""
                    : "dark";


        $("themeToggle")
            .textContent =
                isDark
                    ? "☾"
                    : "☀";


        localStorage.setItem(
            "utbk_theme",
            isDark
                ? "light"
                : "dark"
        );


        render();
    };


// =========================
// LOAD THEME
// =========================

if (
    localStorage.getItem(
        "utbk_theme"
    ) === "dark"
) {

    document.documentElement
        .dataset
        .theme = "dark";


    $("themeToggle")
        .textContent = "☀";
}


// =========================
// DATE DEFAULT
// =========================

$("dateInput").value =
    new Date()
        .toISOString()
        .slice(0, 10);


// =========================
// START
// =========================

loadRecords();
