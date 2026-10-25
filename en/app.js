        const EMAIL_USER = 'info'; 
        const EMAIL_DOMAIN = 'grieveskbend.com';

        // Legge numeri anche quando il browser italiano usa la virgola decimale.
        const INCH_TO_MM = 25.4;
        const DIMENSIONAL_INPUTS = ['skThickness','skRi','skFlat','skFlangeA','skFlangeB','skRpReference','devThickness','devRp','devFlangeA','devFlangeB'];
        function currentUnit() { return document.getElementById('unitSystem')?.value || 'mm'; }
        function displayLength(mm, digits=3) {
            const n = currentUnit() === 'in' ? mm / INCH_TO_MM : mm;
            return Number.isFinite(n) ? n.toFixed(digits) + (currentUnit() === 'in' ? ' in' : ' mm') : '—';
        }
        function readNumericField(id) {
            const raw = document.getElementById(id)?.value ?? '';
            const normalized = String(raw).trim().replace(/\s/g, '').replace(',', '.');
            if (normalized === '') return NaN;
            const n = Number(normalized);
            return currentUnit() === 'in' && DIMENSIONAL_INPUTS.includes(id) ? n * INCH_TO_MM : n;
        }
        function changeUnitSystem(next) {
            const previous = currentUnit();
            if (next !== 'mm' && next !== 'in') next = 'mm';
            if (previous === next) return;
            DIMENSIONAL_INPUTS.forEach(id => {
                const el = document.getElementById(id);
                if (!el || !el.value.trim()) return;
                const n = Number(String(el.value).trim().replace(',', '.'));
                if (!Number.isFinite(n)) return;
                const converted = previous === 'mm' ? n / INCH_TO_MM : n * INCH_TO_MM;
                el.value = String(Number(converted.toFixed(5)));
            });
            document.querySelectorAll('label[for]').forEach(label => {
                if (/\(mm\)/i.test(label.textContent)) label.innerHTML = label.innerHTML.replace(/\(mm\)/gi, next === 'in' ? '(in)' : '(mm)');
            });
            renderMatrixTable();
            calculateSampleK();
            calculateDevelopment();
            const url = new URL(location.href);
            url.searchParams.set('units', next);
            history.replaceState(null, '', url);
        }

        function initProtectedEmail() {
            const emailLink = document.getElementById('protectedEmail');
            if (emailLink) {
                const fullAddress = `${EMAIL_USER}@${EMAIL_DOMAIN}`;
                emailLink.href = `mailto:${fullAddress}`;
                emailLink.textContent = fullAddress;
            }
        }

        const METHOD_INFO = {
            air: {
                tag: "Air Bending",
                hint: "The inside radius (Ri) depends on the V-die opening. Moderate force and maximum flexibility for angles.",
                labelV: "V-die opening (mm)"
            },
            wing: {
                tag: "Rotating Die (WingBend)",
                hint: "Rotating wings support the sheet: no sliding, reduced minimum flange (~0.45×V) and inside radius guided by the punch.",
                labelV: "Equivalent Opening / Wing Clearance (mm)"
            },
            coining: {
                tag: "Bottoming / Coining",
                hint: "The sheet is pressed to the bottom of the die: the punch sets the inside radius (Ri = Rp), with very little springback but 3.5×–5× the air-bending force.",
                labelV: "V-die opening (mm)"
            },
            panel: {
                tag: "Panel Bender (Tangential)",
                hint: "Lavorazione per flessione a sbalzo: la lama piega il lembo sporgente dal premilamiera. Ideale per scatolati e profili complessi.",
                labelV: "Braccio di Leva / Gioco Lama (mm)"
            }
        };

        const STANDARD_DIES = [4, 6, 7, 8, 10, 12, 14, 16, 18, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250];

        function switchTab(tab) {
            if (!['sample', 'development', 'matrix'].includes(tab)) tab = 'sample';
            ['sample', 'development', 'matrix'].forEach(key => {
                const panelId = key === 'sample' ? 'tab-sample' : key === 'development' ? 'tab-development' : 'tab-matrix';
                const panel = document.getElementById(panelId);
                const button = document.getElementById('tab-btn-' + key);
                const active = key === tab;
                panel.classList.toggle('hidden', !active);
                button.classList.toggle('tab-active', active);
                button.classList.toggle('text-slate-600', !active);
                button.setAttribute('aria-selected', String(active));
            });
            if (tab === 'matrix') renderMatrixTable();
            if (tab === 'sample') calculateSampleK();
            if (tab === 'development') calculateDevelopment();
        }

        // Formula implementation lives in engine.js and is shared by every locale.
        const recommendedV = (...args) => GrieveskBendEngine.recommendedV(...args);

        function populateVSelect(selectId, targetV) {
            const select = document.getElementById(selectId);
            const isSample = selectId === 'skV';
            const s = readNumericField(isSample ? 'skThickness' : 'devThickness');
            const method = document.getElementById(isSample ? 'skMethod' : 'devMethod').value;
            const previous = Number(select.value);
            let choices = STANDARD_DIES.filter(v => Number.isFinite(s) && s > 0 && v / s >= 4.5 && v / s <= 18);
            if (!choices.length) choices = STANDARD_DIES.slice();
            select.innerHTML = '';
            const placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.textContent = method === 'wing' ? 'Select available equivalent V' : 'Select V opening';
            select.appendChild(placeholder);
            choices.forEach(v => {
                const option = document.createElement('option');
                option.value = String(v);
                option.textContent = `${v} mm` + (method === 'wing' ? ' · riferimento da verificare sul modello' : '');
                select.appendChild(option);
            });
            if (choices.length) {
                const selected = choices.includes(previous) ? previous : choices.reduce((best, v) => Math.abs(v - targetV) < Math.abs(best - targetV) ? v : best, choices[0]);
                select.value = String(selected);
            }
        }

        function updateSampleVOptions() {
            const s = readNumericField('skThickness') || 2;
            const rm = readNumericField('skRm') || 420;
            const method = document.getElementById('skMethod').value;
            populateVSelect('skV', recommendedV(s, rm, method));
        }

        function onSampleMaterialChange() {
            const material = document.getElementById('skMaterial').value;
            if (material !== 'custom') document.getElementById('skRm').value = material;
            updateSampleVOptions();
            calculateSampleK();
        }

        function onDevelopmentMaterialChange() {
            const material = document.getElementById('devMaterial').value;
            if (material !== 'custom') document.getElementById('devRm').value = material;
            refreshDevelopmentModel(true);
        }

        function onDevelopmentThicknessChange() { refreshDevelopmentModel(true); }
        function onDevelopmentMethodChange() { refreshDevelopmentModel(true); }

        function refreshDevelopmentModel(reselectV = false) {
            const s = readNumericField('devThickness');
            const rm = readNumericField('devRm');
            const method = document.getElementById('devMethod').value;
            if (!Number.isFinite(s) || s <= 0 || !Number.isFinite(rm) || rm <= 0) return;
            const target = recommendedV(s, rm, method);
            if (reselectV || !document.getElementById('devV').value) populateVSelect('devV', target);
            document.getElementById('devVLabel').textContent = method === 'wing' ? 'V equivalente (selezionabile)' : 'Cava V suggerita (selezionabile)';
            document.getElementById('devVHelp').textContent = method === 'wing' ? 'Seleziona la V equivalente disponibile per l’esatto modello WingBend. Le misure elencate sono riferimenti dimensionali: verifica la scheda del costruttore.' : 'La cava suggerita segue una regola pratica; puoi selezionare un’altra misura disponibile nell’elenco.';
            calculateDevelopment();
        }

        function calculateSampleK() {
            const s = readNumericField('skThickness');
            const angle = readNumericField('skAngle');
            const ri = readNumericField('skRi');
            const flat = readNumericField('skFlat');
            const a = readNumericField('skFlangeA');
            const b = readNumericField('skFlangeB');
            const warning = document.getElementById('sampleWarning');
            const resultIds = ['skResultK', 'skResultBA', 'skResultBD'];
            const clearResults = () => resultIds.forEach(id => document.getElementById(id).textContent = '—');

            if (![s, angle, ri, flat, a, b].every(Number.isFinite) || s <= 0 || angle <= 0 || angle >= 180 || ri <= 0 || flat <= 0 || a <= 0 || b <= 0) {
                clearResults();
                warning.textContent = 'Enter positive numeric values for all required geometric fields.';
                warning.className = 'rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900';
                return;
            }

            const result = GrieveskBendEngine.calculateSampleK({ thickness: s, angle, innerRadius: ri, flatLength: flat, flangeA: a, flangeB: b });
            const { bendAllowance: ba, bendDeduction: bd, k } = result;

            document.getElementById('skResultK').textContent = Number.isFinite(k) ? k.toFixed(4) : '—';
            document.getElementById('skResultBA').textContent = Number.isFinite(ba) ? displayLength(ba, 3) : '—';
            document.getElementById('skResultBD').textContent = Number.isFinite(bd) ? displayLength(bd, 3) : '—';

            const material = document.getElementById('skMaterial').selectedOptions[0]?.textContent || 'Not specified';
            const rm = document.getElementById('skRm').value || 'not specified';
            const method = document.getElementById('skMethod').selectedOptions[0]?.textContent || 'not specified';
            const v = document.getElementById('skV').value || 'not specified';
            const rp = document.getElementById('skRpReference').value || 'not specified';
            document.getElementById('skSummary').textContent = `Misure: s ${s} mm · angolo interno ${angle}° · Ri ${ri} mm · sviluppo piano ${flat} mm · quote esterne A/B ${a}/${b} mm fino alla proiezione dell’ingombro esterno della piega. Configurazione facoltativa: ${material} · Rm ${rm} N/mm² · ${method} · V ${v} mm · Rp ${rp} mm. Questi dati di processo non entrano nel calcolo di K.`;

            if (!Number.isFinite(k) || k < 0 || k > 1 || ba <= 0 || bd < 0) {
                warning.textContent = 'The geometric result is inconsistent or outside the expected range. Check flat length, outside dimensions A/B, angle and radius; verify K before use.';
                warning.className = 'rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900';
            } else {
                warning.textContent = 'K is derived exclusively from the sample geometry. Method, V opening, nominal punch radius and Rm are optional and do not contribute to the calculation.';
                warning.className = 'rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900';
            }
        }

        const estimatedKFromGeometry = (...args) => GrieveskBendEngine.estimatedKFromGeometry(...args);

        function calculateDevelopment() {
            const s = readNumericField('devThickness');
            const rm = readNumericField('devRm');
            const method = document.getElementById('devMethod').value;
            const v = Number(document.getElementById('devV').value);
            const rp = readNumericField('devRp');
            const angle = readNumericField('devAngle');
            const a = readNumericField('devFlangeA');
            const b = readNumericField('devFlangeB');
            const warning = document.getElementById('devWarning');
            if (![s, rm, v, rp, angle, a, b].every(Number.isFinite) || s <= 0 || rm <= 0 || v <= 0 || rp <= 0 || angle <= 0 || angle >= 180 || a <= 0 || b <= 0) {
                warning.textContent = 'Enter numeric values to calculate the flat pattern.';
                warning.className = 'rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900';
                return;
            }
            const result = GrieveskBendEngine.calculateDevelopment({ thickness: s, tensileStrength: rm, method, v, punchRadius: rp, angle, flangeA: a, flangeB: b });
            const { innerRadius: ri, minFlange: bmin, radiusSource: riSource, k, bendAllowance: ba, bendDeduction: bd, flatLength: flat } = result;

            document.getElementById('devResultV').textContent = displayLength(v, 1);
            document.getElementById('devResultRi').textContent = displayLength(ri, 2);
            document.getElementById('devResultBmin').textContent = displayLength(bmin, 2);
            document.getElementById('devResultK').textContent = k.toFixed(3);
            document.getElementById('devResultBA').textContent = `${ba.toFixed(3)} mm`;
            document.getElementById('devResultBD').textContent = `${bd.toFixed(3)} mm`;
            document.getElementById('devResultFlat').textContent = displayLength(flat, 3);
            document.getElementById('devKSource').textContent = method === 'wing' ? 'Preliminary WingBend geometric model: validate using samples from the specific model.' : 'Model estimate based on Ri/thickness; this is not a fixed K read from a table.';
            document.getElementById('devModelNote').textContent = `${riSource}. The minimum flange is a reference value and must be checked against the installed tool chart.`;
            warning.textContent = method === 'wing' ? 'For WingBend, equivalent V and minimum flange must match the exact manufacturer model; generic values do not replace the technical datasheet.' : '';
            warning.className = method === 'wing' ? 'rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900' : 'hidden rounded-lg border p-3 text-sm';
        }

        function copyShareLink(whichTab = null) {
            const activeTab = whichTab || (!document.getElementById('tab-development').classList.contains('hidden') ? 'development' : !document.getElementById('tab-matrix').classList.contains('hidden') ? 'matrix' : 'sample');
            const params = new URLSearchParams({ tab: activeTab, units: currentUnit() });
            const map = activeTab === 'development' ? {material:'devMaterial',rm:'devRm',s:'devThickness',method:'devMethod',v:'devV',rp:'devRp',angle:'devAngle',a:'devFlangeA',b:'devFlangeB'} : {material:'skMaterial',rm:'skRm',s:'skThickness',method:'skMethod',v:'skV',rp:'skRpReference',angle:'skAngle',ri:'skRi',flat:'skFlat',a:'skFlangeA',b:'skFlangeB'};
            if (activeTab === 'matrix') params.set('material', document.getElementById('tableMaterial').value);
            else Object.entries(map).forEach(([key,id]) => params.set(key, document.getElementById(id).value));
            const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(shareUrl).then(() => { const btn = document.getElementById('shareBtnHeader'); if (btn) { const old = btn.innerHTML; btn.innerHTML = '<span>✅ Link copied</span>'; setTimeout(() => btn.innerHTML = old, 2000); } }).catch(() => window.prompt('Copy this link:', shareUrl));
            else window.prompt('Copy this link:', shareUrl);
        }

        function loadFromUrlParams() {
            const p = new URLSearchParams(window.location.search);
            const set = (key, id) => { if (p.has(key)) document.getElementById(id).value = p.get(key); };
            const tab = p.get('tab') || 'sample';
            if (tab === 'development') {
                const map = {material:'devMaterial',rm:'devRm',s:'devThickness',method:'devMethod',v:'devV',rp:'devRp',angle:'devAngle',a:'devFlangeA',b:'devFlangeB'};
                Object.entries(map).forEach(([key,id]) => set(key,id));
                refreshDevelopmentModel(false);
            } else if (tab === 'matrix') { set('material','tableMaterial'); renderMatrixTable(); }
            else {
                if (p.has('m')) document.getElementById('skMethod').value = p.get('m');
                const map = {material:'skMaterial',rm:'skRm',s:'skThickness',method:'skMethod',v:'skV',rp:'skRpReference',angle:'skAngle',ri:'skRi',flat:'skFlat',a:'skFlangeA',b:'skFlangeB'};
                Object.entries(map).forEach(([key,id]) => set(key,id));
                updateSampleVOptions();
                if (p.has('v')) document.getElementById('skV').value = p.get('v');
                calculateSampleK();
            }
            switchTab(tab);
        }
        function renderMatrixTable() {
            const rm = parseFloat(document.getElementById('tableMaterial').value) || 420;
            const thicknesses = [0.8, 1.0, 1.2, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 8.0, 10.0];
            const dies = [6, 8, 10, 12, 16, 20, 24, 32, 40, 50, 63, 80];

            let vFactor = rm >= 650 ? 0.20 : (rm <= 280 ? 0.14 : 0.16);

            let html = `<thead><tr class="bg-slate-900 text-white">
                <th class="p-2.5 border border-slate-700 sticky left-0 bg-slate-900">Thickness s \\ V-die</th>`;
            dies.forEach(v => {
                html += `<th class="p-2.5 border border-slate-700 font-mono">V = ${v} mm</th>`;
            });
            html += `</tr></thead><tbody>`;

            thicknesses.forEach(s => {
                html += `<tr onclick="this.classList.toggle('ring-2'); this.classList.toggle('ring-blue-600')" class="cursor-pointer hover:bg-blue-50/40 transition">
                    <td class="p-2.5 border border-slate-300 font-bold font-mono bg-slate-100 sticky left-0">${s.toFixed(1)} mm</td>`;

                dies.forEach(v => {
                    const cell = GrieveskBendEngine.matrixCell({ thickness: s, v, tensileStrength: rm });
                    if (!cell) {
                        html += `<td class="p-2 border border-slate-200 bg-slate-50 text-slate-300">—</td>`;
                    } else {
                        const cellBg = cell.optimal ? "bg-emerald-50/90 border-emerald-300" : "bg-white border-slate-200";
                        html += `<td class="p-2 border ${cellBg}">
                            <div class="font-bold font-mono text-slate-900">${cell.forceTonsPerMetre.toFixed(1)} t/m</div>
                            <div class="text-[10px] text-slate-500 font-mono">ri:${cell.innerRadius.toFixed(1)} | b:${cell.minFlange.toFixed(1)}</div>
                        </td>`;
                    }
                });
                html += `</tr>`;
            });

            html += `</tbody>`;
            document.getElementById('interactiveMatrix').innerHTML = html;
        }

        window.addEventListener('DOMContentLoaded', () => {
            // Seleziona il valore esistente al focus, così digitare lo sostituisce invece di accodare cifre.
            document.querySelectorAll('input[inputmode="decimal"]').forEach(input => {
                input.addEventListener('focus', () => {
                    try { input.select(); } catch (_) {}
                });
            });
            initProtectedEmail();
            const unitSelect = document.getElementById("unitSystem");
            if (unitSelect) unitSelect.value = "mm";
            updateSampleVOptions();
            refreshDevelopmentModel(true);
            loadFromUrlParams();
            renderMatrixTable();
            if (new URLSearchParams(window.location.search).get("units") === "in") changeUnitSystem("in");
        });
    