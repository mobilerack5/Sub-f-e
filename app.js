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
        e.preventDefault(); // Alapértelmezett küldés megállítása

        const ltUrl = localtunnelUrlInput.value.trim();
        if (!ltUrl) {
            updateStatus("Hiba: A Localtunnel URL megadása kötelező!", "error");
            return;
        }

        // Gomb letiltása és státusz frissítése
        processButton.disabled = true;
        updateStatus("Feldolgozás indítása... A backend válaszára várva. Ez percekig is tarthat!", "loading");

        try {
            // FormData objektum létrehozása
            const formData = new FormData();
            
            const sourceType = document.querySelector('input[name="source_type"]:checked').value;
            formData.append("source_type", sourceType);
            formData.append("kimeneti_formatum", formatumSelect.value);

            // Adatok hozzáadása a forrás típusa alapján
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

                // Opcionális feliratfájl
                const subtitleFile = subtitleFileInput.files[0];
                if (subtitleFile) {
                    formData.append("subtitle_file", subtitleFile);
                }
            }

            // Fetch kérés küldése a Colab backendnek
            const response = await fetch(`${ltUrl}/process`, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                updateStatus(`<strong>Siker!</strong> A feldolgozás befejeződött.<br>
                             A kimeneti fájl a Google Drive-odon található:<br>
                             <code>${data.output_path}</code>`, "success");
            } else {
                throw new Error(data.error || "Ismeretlen hiba történt a backend oldalon.");
            }

        } catch (error) {
            console.error("Hiba:", error);
            updateStatus(`<strong>Hiba történt:</strong> ${error.message}<br>
                         Ellenőrizd a Localtunnel URL-t és a Colab cella futását!`, "error");
        } finally {
            // Gomb visszakapcsolása
            processButton.disabled = false;
        }
    });

    // Státusz frissítő segédfüggvény
    function updateStatus(message, type) {
        statusArea.innerHTML = `<p>${message}</p>`;
        statusArea.className = ""; // Osztályok törlése
        if (type === "loading") {
            statusArea.classList.add("status-loading");
        } else if (type === "success") {
            statusArea.classList.add("status-success");
        } else if (type === "error") {
            statusArea.classList.add("status-error");
        }
    }
});
