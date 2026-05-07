// ===== LOGIN GATE =====
(function () {
    const VALID_USER = 'user1';
    const VALID_PASS = '2026';
    const SESSION_KEY = 'mergetopos_auth';

    const overlay  = document.getElementById('loginOverlay');
    const form     = document.getElementById('loginForm');
    const userInput = document.getElementById('loginUser');
    const passInput = document.getElementById('loginPass');
    const errorMsg  = document.getElementById('loginError');

    // Already logged in this session?
    if (sessionStorage.getItem(SESSION_KEY) === 'true') {
        overlay.classList.add('hidden');
    } else {
        // Delay focus slightly so animation plays first
        setTimeout(() => userInput.focus(), 400);
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = userInput.value.trim();
        const pass = passInput.value;

        if (user === VALID_USER && pass === VALID_PASS) {
            sessionStorage.setItem(SESSION_KEY, 'true');
            errorMsg.hidden = true;
            overlay.classList.add('hidden');
        } else {
            errorMsg.hidden = false;
            passInput.value = '';
            passInput.focus();
            // Shake the card
            const card = overlay.querySelector('.login-card');
            card.style.animation = 'none';
            card.offsetHeight; // reflow
            card.style.animation = 'shake 0.4s ease';
        }
    });

    // Shake keyframe injected dynamically
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%       { transform: translateX(-8px); }
            40%       { transform: translateX(8px); }
            60%       { transform: translateX(-6px); }
            80%       { transform: translateX(6px); }
        }
    `;
    document.head.appendChild(style);
})();
// ======================

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');
    const fileList = document.getElementById('fileList');
    const processBtn = document.getElementById('processBtn');
    const resultSection = document.getElementById('resultSection');
    const previewBody = document.getElementById('previewBody');
    const pointStats = document.getElementById('pointStats');
    const downloadBtn = document.getElementById('downloadBtn');
    const showAllBtn = document.getElementById('showAllBtn');

    let filesArray = []; 
    let finalProcessedLines = [];
    let finalContent = "";

    const handleFiles = (selectedFiles) => {
        for (let file of selectedFiles) {
            if (file.name.toLowerCase().endsWith('.txt')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    filesArray.push({
                        name: file.name,
                        content: e.target.result
                    });
                    renderFileList();
                    checkReady();
                };
                reader.readAsText(file);
            }
        }
    };

    fileInput.addEventListener('change', () => handleFiles(fileInput.files));

    const renderFileList = () => {
        fileList.innerHTML = "";
        filesArray.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.innerHTML = `
                <div class="file-item-info">
                    <span class="icon">📄</span>
                    <span class="file-item-name" title="${file.name}">${file.name}</span>
                </div>
                <button class="btn-remove" onclick="removeFile(${index})">×</button>
            `;
            fileList.appendChild(item);
        });
    };

    window.removeFile = (index) => {
        filesArray.splice(index, 1);
        renderFileList();
        checkReady();
    };

    const checkReady = () => {
        processBtn.disabled = filesArray.length === 0;
    };

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    const renderTableRows = (lines) => {
        const fragment = document.createDocumentFragment();
        lines.forEach(line => {
            const p = line.split(',');
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p[0] || ''}</td>
                <td>${p[1] || ''}</td>
                <td>${p[2] || ''}</td>
                <td>${p[3] || ''}</td>
                <td>${p[4] || ''}</td>
            `;
            fragment.appendChild(tr);
        });
        previewBody.appendChild(fragment);
    };

    processBtn.addEventListener('click', async () => {
        const btnText = processBtn.querySelector('.btn-text');
        const loader = processBtn.querySelector('.loader');

        btnText.textContent = "Processando...";
        loader.hidden = false;
        processBtn.disabled = true;

        try {
            await new Promise(resolve => setTimeout(resolve, 800));

            const allPoints = [];
            
            filesArray.forEach(file => {
                const lines = file.content.split(/\r?\n/);
                lines.forEach(line => {
                    const trimmed = line.trim();
                    if (!trimmed) return;

                    const parts = trimmed.split(',');
                    if (parts.length >= 2) {
                        const remaining = parts.slice(1).join(',');
                        allPoints.push(remaining);
                    } else if (parts.length === 1 && trimmed) {
                        allPoints.push(trimmed);
                    }
                });
            });

            finalProcessedLines = allPoints.map((data, index) => {
                return `${index + 1},${data}`;
            });

            finalContent = finalProcessedLines.join('\n');

            // Initial Preview (50 rows)
            previewBody.innerHTML = "";
            const initialSet = finalProcessedLines.slice(0, 50);
            renderTableRows(initialSet);

            if (finalProcessedLines.length > 50) {
                const tr = document.createElement('tr');
                tr.id = "limitRow";
                tr.innerHTML = `<td colspan="5" style="text-align:center; color: var(--text-muted)">... e mais ${finalProcessedLines.length - 50} pontos ...</td>`;
                previewBody.appendChild(tr);
                showAllBtn.hidden = false;
            } else {
                showAllBtn.hidden = true;
            }

            pointStats.textContent = `Total de ${finalProcessedLines.length} pontos de ${filesArray.length} arquivos organizados.`;
            resultSection.hidden = false;
            resultSection.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            alert("Erro ao processar. Verifique se os arquivos estão no formato correto.");
            console.error(error);
        } finally {
            btnText.textContent = "Processar e Organizar Pontos";
            loader.hidden = true;
            processBtn.disabled = false;
        }
    });

    showAllBtn.addEventListener('click', () => {
        const limitRow = document.getElementById('limitRow');
        if (limitRow) limitRow.remove();
        
        // Show the rest of the points
        const remainingPoints = finalProcessedLines.slice(50);
        renderTableRows(remainingPoints);
        
        showAllBtn.hidden = true;
    });

    downloadBtn.addEventListener('click', () => {
        const blob = new Blob([finalContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `levantamento_unificado_${new Date().getTime()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });

    // Dynamic Year
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
});
