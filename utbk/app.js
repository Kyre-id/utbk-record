const STORAGE_KEY = "utbk_tracker_data";

const TARGET_KEY = "utbk_tracker_target";


// =========================
// DATA
// =========================

let records =
    JSON.parse(
        localStorage.getItem(STORAGE_KEY)
    ) || [];


let target =
    Number(
        localStorage.getItem(TARGET_KEY)
    ) || 650;


let chart = null;


// =========================
// ELEMENT HELPER
// =========================

const $ = id =>
    document.getElementById(id);


// =========================
// INITIAL SETUP
// =========================

$("dateInput").value =
    new Date()
        .toISOString()
        .slice(0, 10);


$("targetInput").value =
    target;


$("targetValue").textContent =
    target;


// =========================
// SAVE DATA
// =========================

function saveData() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(records)
    );
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
// SORT DATA
// =========================

function getSortedRecords() {

    return [...records].sort(
        (a, b) => {

            return (
                a.date.localeCompare(b.date)
                ||
                a.created - b.created
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
// RENDER EVERYTHING
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
                    item => item.score
                )
            )
            : "-";


    $("avgStat").textContent =
        data.length
            ? Math.round(
                data.reduce(
                    (total, item) =>
                        total + item.score,
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
                    b.score > a.score
                        ? b
                        : a
            );


        $("bestDate").textContent =
            `${best.name} · ${formatDate(best.date)}`;


        if (data.length > 1) {

            const previous =
                data[data.length - 2];


            const difference =
                latest.score -
                previous.score;


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
    // HISTORY TABLE
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
                            ? data[index - 1].score
                            : null;


                    const difference =
                        previous === null
                            ? null
                            : record.score - previous;


                    let changeHTML =
                        "-";


                    if (difference !== null) {

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
                                        ? escapeHTML(record.note)
                                        : "—"
                                }
                            </td>

                            <td>

                                <button
                                    class="delete-button"
                                    data-id="${record.id}"
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


    // EMPTY STATE

    $("emptyHistory").style.display =
        data.length
            ? "none"
            : "grid";


    $("historyBody").style.display =
        data.length
            ? "table-row-group"
            : "none";


    // DELETE BUTTONS

    document
        .querySelectorAll(".delete-button")
        .forEach(button => {

            button.onclick = () => {

                removeRecord(
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
                                        item.score
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
// ADD RECORD
// =========================

$("scoreForm").onsubmit =
    event => {

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
            Number.isNaN(score) ||
            score < 0 ||
            score > 1000
        ) {

            alert(
                "Isi data tryout dengan benar."
            );

            return;

        }


        records.push({

            id:
                crypto.randomUUID(),

            name,

            date,

            score,

            note,

            created:
                Date.now()

        });


        saveData();


        event.target.reset();


        $("dateInput").value =
            new Date()
                .toISOString()
                .slice(0, 10);


        render();

    };


// =========================
// DELETE RECORD
// =========================

function removeRecord(id) {

    records =
        records.filter(
            item =>
                item.id !== id
        );


    saveData();

    render();
}


// =========================
// DELETE ALL
// =========================

$("clearAll").onclick =
    () => {

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


        records = [];


        saveData();

        render();

    };


// =========================
// TARGET
// =========================

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
// FIRST RENDER
// =========================

render();