document.addEventListener("DOMContentLoaded", () => {
    // Elemek kiválasztása
    const form = document.getElementById("process-form");
    const localtunnelUrlInput = document.getElementById("localtunnel_url");
    const statusArea = document.getElementById("status-area");
    const processButton = document.getElementById("process-button");

    const urlSection = document.getElementById("url-section");
    const uploadSection = document.getElementById("upload-section");
    const sourceTypeRadios = document.querySelectorAll('input[name="source_type"]');

    const videoUrlInput = document.getElementById("video_url");
    const videoFileInput = document.getElementById("video_file");
    const subtitleFileInput = document.getElementById("subtitle_file");
    const formatumSelect = document.getElementById("kimeneti_formatum");

    // Szekciók váltása a rádiógomb alapján
    sourceTypeRadios.forEach(radio => {
        radio.addEventListener("change", (e) => {
            if (e.target.value === "url") {
                urlSection.style.display = "block";
                uploadSection.style.display = "none";
            } else {
                urlSection.style.display = "none";
                uploadSection.style.display = "block";
            }
        });
    });

    // Űrlap elküldésének kezelése
    form.addEventListener("submit", async (e) => {
        e.preventDefault(); 

        const ltUrl = localtunnelUrlInput.value.trim();
        if (!ltUrl) {
            updateStatus("Hiba: A Localtunnel URL megadása kötelező!", "error");
            return;
        }

        if (!ltUrl.startsWith("https://") || !ltUrl.endsWith(".loca.lt")) {
             updateStatus("Hiba: Érvénytelen Localtunnel URL formátum. (pl: httpss://...loca.lt)", "error");
            return;
        }

        processButton.disabled = true;
        updateStatus("Feldolgozás indítása... A backend válaszára várva. Ez percekig is tarthat!", "loading");

        try {
            const formData = new FormData();
            
            const sourceType = document.querySelector('input[name="source_type"]:checked').value;
            formData.append("source_type", sourceType);
            formData.append("kimeneti_formatum", formatumSelect.value);

            if (sourceType === "url") {
                const videoUrl = videoUrlInput.value.trim();
                if (!videoUrl) {
                    throw new Error("Hiba: Videó URL megadása kötelező URL típus esetén.");
                }
                formData.append("video_url", videoUrl);

            } else if (sourceType === "upload") {
                const videoFile = videoFileInput.files[0];
                if (!videoFile) {
                    throw new Error("Hiba: Videó fájl feltöltése kötelező feltöltés típus esetén.");
                }
                formData.append("video_file", videoFile);

                const subtitleFile = subtitleFileInput.files[0];
                if (subtitleFile) {
                    formData.append("subtitle_file", subtitleFile);
                }
            }

            const response = await fetch(`${ltUrl}/process`, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (response.ok && data.success) {
                updateStatus(`<strong>Siker!</strong> A feldolgozás befejeződött.<br>
                             A kimeneti fájl a Google Drive-odon található:<br>
                             <code>${data.output_path}</code>`, "success");
            } else {
                throw new Error(data.error || `A szerver ${response.status} hibával tért vissza.`);
            }

        } catch (error) {
            console.error("Hiba:", error);
            if (error.message.includes("Failed to fetch")) {
                 updateStatus(`<strong>Hálózati hiba:</strong> Nem sikerült elérni a backendet.<br>
                         Ellenőrizd a Localtunnel URL-t és hogy a Colab cella még fut-e!`, "error");
            } else {
                updateStatus(`<strong>Hiba történt:</strong> ${error.message}`, "error");
            }
        } finally {
            processButton.disabled = false;
        }
    });

    // Státusz frissítő segédfüggvény
    function updateStatus(message, type) {
        statusArea.innerHTML = `<p>${message}</p>`;
        statusArea.className = "";
        if (type === "loading") {
            statusArea.classList.add("status-loading");
        } else if (type === "success") {
            statusArea.classList.add("status-success");
        } else if (type === "error") {
            statusArea.classList.add("status-error");
        }
    }

    // --- ÚJ BLOKK KEZDETE ---
    // Figyeli a Colab-tól (szülő ablaktól) érkező üzeneteket
    window.addEventListener("message", (event) => {
        // Biztonsági ellenőrzés (csak Colab-tól fogadunk el)
        if (event.origin !== "https://colab.research.google.com") {
            console.warn("Üzenet elutasítva, az eredet nem megfelelő:", event.origin);
            return;
        }

        const ltUrl = event.data;

        // Ellenőrizzük, hogy az adat egy valós Localtunnel URL-nek tűnik-e
        if (typeof ltUrl === 'string' && ltUrl.startsWith("https://") && ltUrl.endsWith(".loca.lt")) {
            localtunnelUrlInput.value = ltUrl;
            updateStatus("✅ Localtunnel URL automatikusan beillesztve!", "success");
        }
    }, false);
    // --- ÚJ BLOKK VÉGE ---
});
