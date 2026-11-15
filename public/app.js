
const $ = s => document.querySelector(s),
    $$ = s => [...document.querySelectorAll(s)];

const escapeHTML = s =>
    String(s ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[c]));

const api = async (url) => {
    const r = await fetch(url);
    const d = await r.json();

    if (!r.ok) throw new Error(d.error || "Request failed");

    return d;
};

const navToggle = $(".menu-toggle");

if (navToggle) {
    navToggle.addEventListener("click", () =>
        $(".nav")?.classList.toggle("open")
    );
}

async function nasaSearch(q, page = 1, media = "image") {
    return api(`/api/nasa/search?q=${encodeURIComponent(q)}&page=${page}&media_type=${media}`);
}

function analogCard(a, withImage = true) {
    return `
        <article class="analog-card">
            <div class="analog-image">
                ${withImage ? `<img loading="lazy" alt="" data-nasa-query="${escapeHTML(a.query)}">` : ""}
                <span class="image-label">EARTH → ${escapeHTML(a.target.toUpperCase())}</span>
            </div>

            <div class="analog-body">
                <div class="pills">
                    <span class="pill">${escapeHTML(a.target)}</span>
                    <span class="pill">${escapeHTML(a.theme)}</span>
                </div>

                <h3>${escapeHTML(a.name)}</h3>
                <div class="location">${escapeHTML(a.earth)}</div>
                <p>${escapeHTML(a.summary)}</p>

                <div class="card-bottom">
                    <span>NASA source-linked profile</span>
                    <button class="detail-button" data-analog-id="${escapeHTML(a.id)}">
                        Scientific details ↗
                    </button>
                </div>
            </div>
        </article>
    `;
}

async function loadAnalogs() {
    let records = [];

    try {
        records = await (await fetch("/analogs.json")).json();
    } catch {
        return;
    }

    const grid = $("#analogGrid");

    if (grid) {
        const search = $("#analogSearch"),
            filter = $("#targetFilter"),
            params = new URLSearchParams(location.search);

        if (params.has("target") && filter) {
            filter.value = params.get("target");
        }

        const render = () => {
            const q = (search?.value || "").toLowerCase();
            const t = filter?.value || "all";

            const found = records.filter(a =>
                (t === "all" || a.target.includes(t)) &&
                [a.name, a.earth, a.theme, a.process, a.summary, a.target]
                    .join(" ")
                    .toLowerCase()
                    .includes(q)
            );

            grid.innerHTML = found.length
                ? found.map(a => analogCard(a)).join("")
                : `<div class="loading-card">No records match. Try another search.</div>`;

            if ($("#analogCount")) {
                $("#analogCount").textContent =
                    `${found.length} of ${records.length} NASA-documented profiles`;
            }

            grid.querySelectorAll("[data-nasa-query]")
                .forEach(img => loadCardImage(img));
        };

        search?.addEventListener("input", render);
        filter?.addEventListener("change", render);

        render();
    }

    const featured = $("#featuredGrid");

    if (featured) {
        featured.innerHTML = records.slice(0, 3)
            .map(a => analogCard(a))
            .join("");

        featured.querySelectorAll("[data-nasa-query]")
            .forEach(loadCardImage);
    }

    const detailHost = $("#detailDialog");
    const eventHost = grid || featured;

    if (eventHost) {
        eventHost.addEventListener("click", e => {
            const btn = e.target.closest("[data-analog-id]");

            if (!btn) return;

            const a = records.find(x => x.id === btn.dataset.analogId);

            if (!a || !detailHost) return;

            $("#detailContent").innerHTML = `
                <div class="eyebrow">
                    ${escapeHTML(a.theme)} / ${escapeHTML(a.target)}
                </div>

                <h2>${escapeHTML(a.name)}</h2>

                <p>
                    <b>Earth field site:</b> ${escapeHTML(a.earth)}
                </p>

                <h3>Shared process</h3>
                <p>${escapeHTML(a.process)}</p>

                <h3>Scientific relevance</h3>
                <p>${escapeHTML(a.summary)}</p>

                <h3>Documented evidence</h3>
                <p>${escapeHTML(a.evidence)}</p>

                <h3>Limitations</h3>
                <p>${escapeHTML(a.limits)}</p>

                <p>
                    <a href="${escapeHTML(a.source)}" target="_blank" rel="noopener">
                        Open NASA source ↗
                    </a>
                </p>
            `;

            detailHost.showModal();
        });
    }

    $("#closeDialog")?.addEventListener("click", () => detailHost?.close());
}

async function loadCardImage(img) {
    try {
        const d = await nasaSearch(img.dataset.nasaQuery);

        if (d.items?.[0]?.image) {
            img.src = d.items[0].image;
            img.alt = d.items[0].title;
        } else {
            img.remove();
        }
    } catch {
        img.remove();
    }
}

async function loadHome() {
    const hero = $("#heroBg");

    if (hero) {
        try {
            const d = await nasaSearch("Earth from space NASA blue marble");

            if (d.items?.[0]?.image) {
                hero.style.backgroundImage = `url("${d.items[0].image}")`;
            }
        } catch {}
    }

    const feature = $("#liveFeature");

    if (feature) {
        try {
            const d = await nasaSearch("Earth from space");
            const item = d.items?.[0];

            if (item) {
                feature.innerHTML = `
                    <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.title)}">

                    <div class="live-feature-label">
                        NASA IMAGE ARCHIVE
                        <b>${escapeHTML(item.title)}</b>
                        <span>
                            ${escapeHTML(item.center)} ·
                            ${escapeHTML(item.dateCreated?.slice(0, 10) || "Date not supplied")}
                        </span>
                    </div>
                `;
            }
        } catch {
            feature.innerHTML = `
                <div class="live-placeholder">
                    <span>ARCHIVE TEMPORARILY UNAVAILABLE</span>
                    <b>Try the NASA imagery page later.</b>
                </div>
            `;
        }
    }
}

async function loadWorldImages() {
    const targets = [
        {
            selector: "#earth .world-detail-image",
            query: "NASA Blue Marble Earth full disk global image"
        },
        {
            selector: "#moon .world-detail-image",
            query: "NASA Lunar Reconnaissance Orbiter Moon global mosaic"
        },
        {
            selector: "#mars .world-detail-image",
            query: "NASA Mars Viking global color mosaic surface rover panorama"
        },
        {
            selector: ".world-art.earth-art",
            query: "NASA Blue Marble Earth full disk global image"
        },
        {
            selector: ".world-art.moon-art",
            query: "NASA Lunar Reconnaissance Orbiter Moon global mosaic"
        },
        {
            selector: ".world-art.mars-art",
            query: "NASA Mars Viking global color mosaic surface rover panorama"
        }
    ];

    for (const target of targets) {
        const host = $(target.selector);

        if (!host) continue;

        try {
            const d = await nasaSearch(target.query);
            const item = d.items?.[0];

            if (item?.image) {
                const img = document.createElement("img");

                img.src = item.image;
                img.alt = item.title;
                img.loading = "lazy";

                img.style.cssText =
                    "width:100%;height:100%;min-height:inherit;object-fit:cover;opacity:.9;display:block";

                host.append(img);

                const credit = document.createElement("span");

                credit.textContent = `NASA ARCHIVE · ${item.center}`;

                credit.style.cssText =
                    "position:absolute;bottom:14px;left:16px;padding:5px 8px;background:#07101cbb;color:#e8f1f5;font:9px var(--mono);letter-spacing:.08em";

                host.style.position = "relative";
                host.append(credit);
            }
        } catch {}
    }
}

function loadArchive() {
    const form = $("#nasaForm");

    if (!form) return;

    let page = 1,
        lastQuery = $("#nasaQuery").value,
        media = $("#mediaType").value;

    const status = $("#nasaStatus"),
        results = $("#nasaResults"),
        prev = $("#prevPage"),
        next = $("#nextPage"),
        label = $("#pageLabel");

    async function run() {
        lastQuery = $("#nasaQuery").value.trim();
        media = $("#mediaType").value;

        if (lastQuery.length < 2) return;

        status.textContent = "Contacting NASA Image and Video Library…";
        results.innerHTML = "";

        try {
            const d = await nasaSearch(lastQuery, page, media);

            status.textContent =
                `${d.totalHits ?? "Unknown"} archive matches · ${d.items.length} shown · ${d.cached ? "cached response" : "fetched " + new Date(d.fetchedAt).toLocaleString()} · Source: ${d.source}`;

            results.innerHTML = d.items.length
                ? d.items.map(x => `
                    <article class="nasa-item">
                        <img loading="lazy" src="${escapeHTML(x.image)}" alt="${escapeHTML(x.title)}">

                        <div class="nasa-item-content">
                            <h3>${escapeHTML(x.title)}</h3>

                            <p>
                                ${escapeHTML(x.dateCreated?.slice(0, 10) || "Date not supplied")}
                                · ${escapeHTML(x.center)}
                            </p>

                            <a href="${escapeHTML(x.nasaUrl)}" target="_blank" rel="noopener">
                                Open NASA record ↗
                            </a>
                        </div>
                    </article>
                `).join("")
                : `<div class="loading-card">No results returned. Try a broader search.</div>`;

            label.textContent = `Page ${page}`;
            prev.disabled = page <= 1;
            next.disabled = d.items.length === 0;
        } catch (e) {
            status.textContent = e.message;

            results.innerHTML = `
                <div class="loading-card">
                    NASA archive request failed. Check your internet connection and retry.
                </div>
            `;

            next.disabled = true;
        }
    }

    form.addEventListener("submit", e => {
        e.preventDefault();
        page = 1;
        run();
    });

    prev?.addEventListener("click", () => {
        if (page > 1) {
            page--;
            run();
        }
    });

    next?.addEventListener("click", () => {
        page++;
        run();
    });

    run();
}

loadAnalogs();
loadHome();
loadWorldImages();
loadArchive();

async function loadAnalogMap() {
    const host = $("#analogMap");

    if (!host || !window.L) return;

    const records = await fetch("/analogs.json")
        .then(r => r.json())
        .catch(() => []);

    let map = L.map(host).setView([-10, 15], 2),
        earthLayer = null,
        markers = [],
        mode = "earth";

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 18,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }
    ).addTo(map);

    const earthPins = records
        .filter(a => a.earthCoordinates)
        .map(a => ({
            name: a.name,
            site: a.earth,
            lat: a.earthCoordinates.lat,
            lon: a.earthCoordinates.lon,
            target: a.target,
            theme: a.theme,
            summary: a.summary,
            source: a.source,
            id: a.id
        }));

    const marsPins = [
        {
            name: "Jezero Crater",
            site: "Perseverance landing region",
            lat: 18.4,
            lon: 77.7,
            why: "Ancient lake and delta deposits; used in NASA comparisons with carbonate-rich shoreline environments such as Lake Salda."
        },
        {
            name: "Utopia Planitia",
            site: "Viking 2 landing region",
            lat: 47.6,
            lon: 225.9,
            why: "A northern plains region used in NASA's visual comparison with rugged terrain in Death Valley."
        },
        {
            name: "Gale Crater",
            site: "Curiosity rover exploration region",
            lat: -5.4,
            lon: 137.8,
            why: "A former lake environment investigated by Curiosity; relevant to sedimentary geology and habitability."
        },
        {
            name: "Phoenix landing region",
            site: "Northern plains of Mars",
            lat: 68.2,
            lon: 234.3,
            why: "NASA's Phoenix lander detected water-ice and studied soil chemistry; NASA compares this region with salt research in Utah's Pilot Valley."
        },
        {
            name: "Meridiani Planum",
            site: "Opportunity rover exploration region",
            lat: -1.9,
            lon: 354.5,
            why: "A region with sedimentary and mineral evidence studied by the Opportunity rover."
        }
    ];

    function clearMarkers() {
        markers.forEach(m => m.remove());
        markers = [];
    }

    function showDetails(item, isMars) {
        const box = $("#mapDetails");

        if (!box) return;

        box.innerHTML = `
            <b>${escapeHTML(item.name)}</b>
            <p>${escapeHTML(item.site || "")}</p>
            <p>${escapeHTML(isMars ? item.why : item.summary || item.theme || "")}</p>
            ${!isMars && item.source
                ? `<a href="${escapeHTML(item.source)}" target="_blank" rel="noopener">NASA source ↗</a>`
                : ""}
        `;
    }

    function earthView() {
        mode = "earth";
        clearMarkers();

        if (map.options.crs !== L.CRS.EPSG3857) {
            map.remove();

            map = L.map(host).setView([-10, 15], 2);

            L.tileLayer(
                "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                {
                    maxZoom: 18,
                    attribution: '&copy; OpenStreetMap'
                }
            ).addTo(map);
        }

        earthPins.forEach(item => {
            const m = L.circleMarker(
                [item.lat, item.lon],
                {
                    radius: 8,
                    color: "#07131a",
                    weight: 2,
                    fillColor: "#84e2df",
                    fillOpacity: .95
                }
            ).addTo(map);

            m.bindPopup(`
                <b>${escapeHTML(item.name)}</b><br>
                ${escapeHTML(item.site)}<br>
                <small>Target: ${escapeHTML(item.target)}</small>
            `);

            m.on("click", () => showDetails(item, false));
            markers.push(m);
        });

        $("#earthMapBtn")?.classList.add("selected");
        $("#marsMapBtn")?.classList.remove("selected");

        $("#mapDetails").innerHTML =
            "<b>Earth analog field sites</b><p>Markers show approximate locations of the named field regions. Select a marker for the research context.</p>";

        setTimeout(() => map.invalidateSize(), 100);
    }

    function marsView() {
        mode = "mars";
        clearMarkers();
        map.remove();

        map = L.map(host, {
            crs: L.CRS.Simple,
            minZoom: -1,
            maxZoom: 3
        }).setView([0, 180], 0);

        // Schematic equirectangular Mars coordinate plane, not a photographic basemap.
        const bounds = [[-90, 0], [90, 360]];

        L.rectangle(
            bounds,
            {
                color: "#b8754d",
                weight: 1,
                fillColor: "#7c3c2b",
                fillOpacity: .78
            }
        ).addTo(map);

        for (let lat = -60; lat <= 60; lat += 30) {
            L.polyline(
                [[lat, 0], [lat, 360]],
                {
                    color: "#e4b28b",
                    weight: 1,
                    opacity: .35,
                    dashArray: "4 7"
                }
            ).addTo(map);
        }

        for (let lon = 0; lon <= 360; lon += 60) {
            L.polyline(
                [[-90, lon], [90, lon]],
                {
                    color: "#e4b28b",
                    weight: 1,
                    opacity: .35,
                    dashArray: "4 7"
                }
            ).addTo(map);
        }

        marsPins.forEach(item => {
            const m = L.circleMarker(
                [item.lat, item.lon],
                {
                    radius: 8,
                    color: "#24120e",
                    weight: 2,
                    fillColor: "#f0b07f",
                    fillOpacity: 1
                }
            ).addTo(map);

            m.bindPopup(`
                <b>${escapeHTML(item.name)}</b><br>
                ${escapeHTML(item.site)}
            `);

            m.on("click", () => showDetails(item, true));
            markers.push(m);
        });

        $("#marsMapBtn")?.classList.add("selected");
        $("#earthMapBtn")?.classList.remove("selected");

        $("#mapDetails").innerHTML =
            "<b>Mars comparison regions</b><p>Schematic latitude–longitude view with approximate locations. It is not a georeferenced basemap or a landing-site navigation tool.</p>";

        setTimeout(() => map.invalidateSize(), 100);
    }

    $("#earthMapBtn")?.addEventListener("click", earthView);
    $("#marsMapBtn")?.addEventListener("click", marsView);

    earthView();
}

async function loadComparisonGallery() {
    const host = $("#comparisonGallery");

    if (!host) return;

    const pairs = [
        {
            title: "McMurdo Dry Valleys ↔ ancient Martian valleys",
            earth: "McMurdo Dry Valleys, Antarctica",
            mars: "Mars: water-carved channels and valley networks",
            eq: "McMurdo Dry Valleys Antarctica NASA satellite image",
            mq: "Mars ancient valley networks water carved channels NASA orbiter",
            similar: "Extreme cold, aridity, exposed rock and landforms shaped by water in the past make the Dry Valleys valuable for studying how environments preserve clues about ancient water.",
            limit: "Antarctica has liquid water, an atmosphere and Earth biology. Similar-looking channels do not prove the same formation history. NASA's Earth Observatory specifically compares Dry Valleys imagery with Martian orbital images.",
            source: "https://science.nasa.gov/earth/earth-observatory/martian-landscape-antarctica-4420/"
        },
        {
            title: "Atacama Desert ↔ Mars soil science",
            earth: "Atacama Desert, Chile",
            mars: "Mars: rover exploration terrain",
            eq: "Atacama Desert Chile NASA field research soil",
            mq: "NASA Perseverance rover Mars surface landscape",
            similar: "The Atacama's hyperarid soils are useful for testing sensitive instruments and studying how traces of biology may persist in extremely dry environments.",
            limit: "The Atacama is not Mars: atmospheric pressure, radiation, temperature, gravity and water history differ. It is an analog for selected research questions, not a full environmental duplicate.",
            source: "https://science.nasa.gov/solar-system/analog-explorer/"
        },
        {
            title: "Death Valley ↔ Utopia Planitia",
            earth: "Death Valley, California, USA",
            mars: "Utopia Planitia, Mars",
            eq: "Death Valley California NASA rocky terrain",
            mq: "Viking 2 Utopia Planitia Mars surface NASA",
            similar: "NASA describes Death Valley as a place where the Mars 2020 team practiced hazard avoidance. NASA's Analog Explorer also notes visual similarities between Death Valley and the Viking 2 view of Utopia Planitia.",
            limit: "The value is rover operations and terrain interpretation. The two locations differ in gravity, atmosphere, weathering and surface conditions.",
            source: "https://science.nasa.gov/solar-system/analog-explorer/"
        },
        {
            title: "Icelandic gravel ripples ↔ Martian ripples",
            earth: "Vikursundar region near Askja, Iceland",
            mars: "Mars: large wind-shaped ripple fields",
            eq: "Iceland Askja Vikursundar gravel ripples NASA",
            mq: "Mars wind ripples dunes orbital image NASA MRO",
            similar: "Researchers monitor slow-moving gravel ripples in Iceland with drone-derived terrain models and compare surface-pattern change with Martian ripples.",
            limit: "NASA notes the Martian ridges in its comparison are about ten times larger. Similar patterns can form under different conditions and scales.",
            source: "https://science.nasa.gov/solar-system/analog-explorer/"
        },
        {
            title: "Lake Salda ↔ Jezero Crater",
            earth: "Lake Salda, Türkiye",
            mars: "Jezero Crater, Mars",
            eq: "Lake Salda Turkey carbonate shoreline NASA",
            mq: "NASA Perseverance Jezero crater delta aerial orbital",
            similar: "Carbonate-rich shoreline sediments at Lake Salda provide a terrestrial setting for studying mineral and sediment processes relevant to Jezero's ancient lake and delta deposits.",
            limit: "Mineral similarities are not evidence of past life on Mars. The comparison is about geology and preservation potential, not a claim that the sites are identical.",
            source: "https://science.nasa.gov/solar-system/analog-explorer/"
        }
    ];

    // Search several phrases and test whether each image actually loads.
    async function loadPreview(img, queries) {
        for (const query of queries) {
            try {
                const data = await nasaSearch(query);

                for (const item of data.items || []) {
                    if (!item.image) continue;

                    img.loading = "eager";

                    const loaded = await new Promise(resolve => {
                        img.onload = () => resolve(true);
                        img.onerror = () => resolve(false);
                        img.src = item.image;
                    });

                    if (!loaded) continue;

                    img.alt = item.title || "NASA archive image";
                    img.title = item.title || "";

                    const link = document.createElement("a");

                    link.href = item.nasaUrl || "https://images.nasa.gov/";
                    link.target = "_blank";
                    link.rel = "noopener";

                    img.parentNode.insertBefore(link, img);
                    link.appendChild(img);

                    return true;
                }
            } catch (error) {
                console.warn("NASA image search failed:", query, error);
            }
        }

        const fallback = document.createElement("div");

        fallback.className = "side-caption";
        fallback.textContent =
            "Image unavailable. Search the NASA archive for this location.";

        img.replaceWith(fallback);

        return false;
    }

    host.innerHTML = "";

    for (const p of pairs) {
        const card = document.createElement("article");

        card.className = "comparison-card";

        card.innerHTML = `
            <div class="comparison-head">
                <div>
                    <div class="eyebrow">EARTH ↔ MARS / ANALOG PAIR</div>
                    <h3>${escapeHTML(p.title)}</h3>
                    <p>NASA-linked comparison · Read the scientific limits below</p>
                </div>
            </div>

            <div class="comparison-pair">
                <div class="comparison-side">
                    <span class="side-label">EARTH ANALOG</span>
                    <img alt="${escapeHTML(p.earth)}">

                    <div class="side-caption">
                        <b>${escapeHTML(p.earth)}</b>
                        Earth field environment
                    </div>
                </div>

                <div class="comparison-side">
                    <span class="side-label">MARS</span>
                    <img alt="${escapeHTML(p.mars)}">

                    <div class="side-caption">
                        <b>${escapeHTML(p.mars)}</b>
                        Planetary comparison region
                    </div>
                </div>
            </div>

            <div class="comparison-science">
                <div>
                    <h4>WHY COMPARE?</h4>
                    <p>${escapeHTML(p.similar)}</p>
                </div>

                <div>
                    <h4>IMPORTANT LIMITATION</h4>
                    <p>${escapeHTML(p.limit)}</p>
                </div>
            </div>

            <div class="image-source">
                Images: NASA Image and Video Library previews ·
                <a href="${escapeHTML(p.source)}" target="_blank" rel="noopener">
                    Read NASA's analog context ↗
                </a>
            </div>
        `;

        host.append(card);

        const imgs = card.querySelectorAll("img");

        await Promise.all([
            loadPreview(imgs[0], [
                p.eq,
                `${p.earth} NASA image`,
                `${p.earth} landscape`
            ]),

            loadPreview(imgs[1], [
                p.mq,
                `${p.mars} NASA image`,
                "Mars surface NASA image"
            ])
        ]);
    }
}

loadAnalogMap();
loadComparisonGallery();
