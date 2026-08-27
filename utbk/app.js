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
// SUBJECT
// =========================

const SUBJECT_NAMES = {

    "PU":
        "Penalaran Umum",

    "PPU":
        "Pengetahuan & Pemahaman Umum",

    "PBM":
        "Pemahaman Bacaan & Menulis",

    "PK":
        "Pengetahuan Kuantitatif",

    "Literasi Indonesia":
        "Literasi Bahasa Indonesia",

    "Literasi Inggris":
        "Literasi Bahasa Inggris",

    "Penalaran Matematika":
        "Penalaran Matematika"

};


const SUBJECT_LIST =
    Object.keys(SUBJECT_NAMES);


// =========================
// SETUP
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
// SAVE
// =========================

function saveData() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(records)
    );

}


// =========================
// DATE
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
                a.created - b.created
            );

        }
    );

}


// =========================
// FILTER
// =========================

function getFilteredRecords() {

    const subject =
        $("subjectFilter").value;


    const data =
        getSortedRecords();


    if (subject === "all") {

        return data;

    }


    return data.filter(
        record =>
            record.subject === subject
    );

}


// =========================
// ESCAPE HTML
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
// TREND
// =========================

function getTrend(data) {

    if (data.length < 2) {

        return {
            value: 0,
            text: "Belum cukup data",
            className: "trend-flat"
        };

    }


    const previous =
        data[data.length - 2].score;


    const latest =
        data[data.length - 1].score;


    const difference =
        latest - previous;


    if (difference > 0) {

        return {

            value: difference,

            text:
                `↑ +${difference}`,

            className:
                "trend-up"

        };

    }


    if (difference < 0) {

        return {

            value: difference,

            text:
                `↓ ${difference}`,

            className:
                "trend-down"

        };

    }


    return {

        value: 0,

        text:
            "→ 0",

        className:
            "trend-flat"

    };

}


// =========================
// RENDER
// =========================

function render() {

    const data =
        getFilteredRecords();


    const selectedSubject =
        $("subjectFilter").value;


    renderStats(data);

    renderTarget(data);

    renderFocus();

    renderInsight(data);

    renderSubjectAnalysis();

    renderHistory(data);

    drawChart(data);


    if (selectedSubject === "all") {

        $("chartDescription").textContent =
            "Nilai dari setiap tryout";

    } else {

        $("chartDescription").textContent =
            `Perkembangan ${SUBJECT_NAMES[selectedSubject]}`;

    }

}


// =========================
// STATS
// =========================

function renderStats(data) {

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
                        total + Number(item.score),
                    0
                ) / data.length
            )
            : "-";


    if (!data.length) {

        $("latestChange").textContent =
            "Belum ada data";

        $("latestChange").className = "";

        $("bestDate").textContent =
            "Belum ada data";

        return;

    }


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
        `${SUBJECT_NAMES[best.subject] || best.subject} · ${formatDate(best.date)}`;


    if (data.length > 1) {

        const previous =
            data[data.length - 2];


        const difference =
            Number(latest.score) -
            Number(previous.score);


        $("latestChange").textContent =
            difference === 0
                ? "Sama dari sebelumnya"
                : `${difference > 0 ? "+" : ""}${difference} dari sebelumnya`;


        $("latestChange").className =
            difference > 0
                ? "up"
                : difference < 0
                    ? "down"
                    : "flat";

    } else {

        $("latestChange").textContent =
            "Tryout pertama";

        $("latestChange").className = "";

    }

}


// =========================
// TARGET
// =========================

function renderTarget(data) {

    const latest =
        data.length
            ? Number(data[data.length - 1].score)
            : 0;


    const progress =
        target > 0
            ? Math.min(
                100,
                Math.round(
                    (latest / target) * 100
                )
            )
            : 0;


    $("targetProgressBar").style.width =
        `${progress}%`;


    if (!data.length) {

        $("targetProgressText").textContent =
            "Belum ada nilai";

        return;

    }


    if (latest >= target) {

        $("targetProgressText").textContent =
            `🎯 Target tercapai! ${latest}/${target}`;

    } else {

        const remaining =
            target - latest;


        $("targetProgressText").textContent =
            `${progress}% · Kurang ${remaining} poin lagi`;

    }

}


// =========================
// FOCUS
// =========================

function renderFocus() {

    const subjectStats =
        getSubjectStats();


    if (!subjectStats.length) {

        $("focusContent").innerHTML = `
            <div class="empty-small">
                Belum cukup data untuk dianalisis.
            </div>
        `;

        return;

    }


    const sorted =
        [...subjectStats]
            .sort(
                (a, b) => {

                    const scoreDifference =
                        a.average - b.average;

                    if (scoreDifference !== 0) {

                        return scoreDifference;

                    }

                    return a.trend - b.trend;

                }
            );


    const focus =
        sorted[0];


    let reason;


    if (focus.trend < 0) {

        reason =
            `Nilai terakhir turun ${Math.abs(focus.trend)} poin dari percobaan sebelumnya.`;

    } else if (focus.average < 600) {

        reason =
            `Rata-rata masih ${Math.round(focus.average)}. Masih punya ruang besar untuk naik.`;

    } else if (focus.trend === 0) {

        reason =
            "Perkembangan masih datar. Coba evaluasi bagian yang sering salah.";

    } else {

        reason =
            "Nilainya masih paling rendah dibanding mapel lainnya.";

    }


    $("focusContent").innerHTML = `

        <div class="focus-result">

            <strong>
                ${escapeHTML(focus.name)}
            </strong>

            <span>
                Rata-rata ${Math.round(focus.average)}
                · Terakhir ${focus.latest}
            </span>

            <div class="focus-reason">
                ${escapeHTML(reason)}
            </div>

        </div>

    `;

}


// =========================
// INSIGHT
// =========================

function renderInsight(data) {

    const stats =
        getSubjectStats();


    if (!data.length) {

        $("insightContent").innerHTML = `
            <div class="empty-small">
                Tambahkan data tryout untuk melihat insight.
            </div>
        `;

        return;

    }


    const insights = [];


    const best =
        [...stats]
            .sort(
                (a, b) =>
                    b.average - a.average
            )[0];


    const weakest =
        [...stats]
            .sort(
                (a, b) =>
                    a.average - b.average
            )[0];


    if (best) {

        insights.push(
            `🏆 <strong>${escapeHTML(best.name)}</strong>
             menjadi mapel dengan rata-rata tertinggi,
             yaitu <strong>${Math.round(best.average)}</strong>.`
        );

    }


    if (
        weakest &&
        best &&
        weakest.name !== best.name
    ) {

        insights.push(
            `📌 <strong>${escapeHTML(weakest.name)}</strong>
             punya rata-rata terendah,
             yaitu <strong>${Math.round(weakest.average)}</strong>.`
        );

    }


    const latest =
        data[data.length - 1];


    if (data.length >= 2) {

        const previous =
            data[data.length - 2];


        const diff =
            Number(latest.score) -
            Number(previous.score);


        if (diff > 0) {

            insights.push(
                `📈 Nilai terbaru naik
                 <strong>${diff} poin</strong>
                 dibanding tryout sebelumnya.`
            );

        } else if (diff < 0) {

            insights.push(
                `📉 Nilai terbaru turun
                 <strong>${Math.abs(diff)} poin</strong>.
                 Evaluasi kesalahan dari tryout terakhir.`
            );

        } else {

            insights.push(
                `➡️ Nilai terbaru masih sama dengan
                 tryout sebelumnya.`
            );

        }

    }


    $("insightContent").innerHTML = `

        <div class="insight-list">

            ${
                insights
                    .map(
                        item => `
                            <div class="insight-item">
                                ${item}
                            </div>
                        `
                    )
                    .join("")
            }

        </div>

    `;

}


// =========================
// SUBJECT STATS
// =========================

function getSubjectStats() {

    const stats = [];


    SUBJECT_LIST.forEach(
        subject => {

            const data =
                getSortedRecords()
                    .filter(
                        record =>
                            record.subject === subject
                    );


            if (!data.length) {

                return;

            }


            const average =
                data.reduce(
                    (total, item) =>
                        total + Number(item.score),
                    0
                ) / data.length;


            const latest =
                Number(
                    data[data.length - 1].score
                );


            const trend =
                data.length >= 2
                    ? latest -
                        Number(
                            data[data.length - 2].score
                        )
                    : 0;


            stats.push({

                subject,

                name:
                    SUBJECT_NAMES[subject],

                average,

                latest,

                trend,

                count:
                    data.length

            });

        }
    );


    return stats;

}


// =========================
// SUBJECT ANALYSIS UI
// =========================

function renderSubjectAnalysis() {

    const stats =
        getSubjectStats();


    const container =
        $("subjectAnalysis");


    if (!stats.length) {

        container.innerHTML = `
            <div class="empty-small">
                Belum ada data mapel.
            </div>
        `;

        return;

    }


    container.innerHTML =
        stats
            .map(
                item => {

                    const trendClass =
                        item.trend > 0
                            ? "trend-up"
                            : item.trend < 0
                                ? "trend-down"
                                : "trend-flat";


                    const trendText =
                        item.trend > 0
                            ? `↑ +${item.trend}`
                            : item.trend < 0
                                ? `↓ ${item.trend}`
                                : "→ 0";


                    return `

                        <div class="subject-card">

                            <h4>
                                ${escapeHTML(item.name)}
                            </h4>

                            <div class="subject-score">

                                <strong>
                                    ${Math.round(item.average)}
                                </strong>

                                <span>
                                    rata-rata
                                </span>

                            </div>

                            <div class="subject-meta">

                                Terakhir:
                                <strong>
                                    ${item.latest}
                                </strong>

                                ·

                                ${item.count}
                                tryout

                                ·

                                <span class="${trendClass}">
                                    ${trendText}
                                </span>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");

}


// =========================
// HISTORY
// =========================

function renderHistory(data) {

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
                            : Number(record.score) -
                                Number(previous);


                    let changeHTML = "-";


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

                                <span class="subject-badge">
                                    ${escapeHTML(
                                        SUBJECT_NAMES[record.subject]
                                        || record.subject
                                        || "Mapel lama"
                                    )}
                                </span>

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


    $("emptyHistory").style.display =
        data.length
            ? "none"
            : "grid";


    $("historyBody").style.display =
        data.length
            ? "table-row-group"
            : "none";


    document
        .querySelectorAll(".delete-button")
        .forEach(button => {

            button.onclick = () => {

                removeRecord(
                    button.dataset.id
                );

            };

        });

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


    chart =
        new Chart(
            $("progressChart"),
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


        const subject =
            $("subjectInput")
                .value;


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
            !subject ||
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

            subject,

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
// DELETE
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
// SAVE TARGET
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


        render();

    };


// =========================
// FILTER
// =========================

$("subjectFilter").onchange =
    () => {

        render();

    };


// =========================
// CHART RANGE
// =========================

$("chartRange").onchange =
    () => {

        render();

    };


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
