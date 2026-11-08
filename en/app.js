        const EMAIL_USER = 'info'; 
        const EMAIL_DOMAIN = 'grieveskbend.com';

        // Parse numbers even when the browser locale uses a decimal comma.
        const INCH_TO_MM = 25.4;
        const DIMENSIONAL_INPUTS = ['skThickness','skRi','skFlat','skFlangeA','skFlangeB','skRpReference','devThickness','devRp','devFlangeA','devFlangeB'];
        let activeUnit = 'mm';
        let activeCalculatorTab = 'development';
        function currentUnit() { return activeUnit; }
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
            activeUnit = next;
            const unitSelect = document.getElementById('unitSystem');
            if (unitSelect) unitSelect.value = next;
            document.querySelectorAll('label[for]').forEach(label => {
                if (/\(mm\)/i.test(label.textContent)) label.innerHTML = label.innerHTML.replace(/\(mm\)/gi, next === 'in' ? '(in)' : '(mm)');
            });
            document.querySelectorAll('#skV option, #devV option').forEach(option => {
                const v = Number(option.value);
                if (!Number.isFinite(v) || v <= 0) return;
                const shown = next === 'in' ? (v / INCH_TO_MM).toFixed(3) + ' in' : v + ' mm';
                option.textContent = shown + (option.textContent.includes('·') ? ' · ' + (next === 'in' ? 'verify manufacturer model' : 'verify against the manufacturer model') : '');
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
                hint: "Cantilever bending process: the blade bends the flange projecting beyond the blank holder. Ideal for box-shaped parts and complex profiles.",
                labelV: "Lever Arm / Blade Clearance (mm)"
            }
        };

        const STANDARD_DIES = [4, 6, 7, 8, 10, 12, 14, 16, 18, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250];

        function updateMobileResultBar() {
            const bar = document.getElementById('mobileResultBar');
            const label = document.getElementById('mobileResultLabel');
            const value = document.getElementById('mobileResultValue');
            const link = document.getElementById('mobileResultLink');
            if (!bar || !label || !value || !link) return;
            const states = {
                development: { label: 'FLAT PATTERN LENGTH', value: document.getElementById('devResultFlat')?.textContent || '—', href: '#developmentResultCard', action: 'View result ↑' },
                sample: { label: 'SAMPLE K-FACTOR', value: document.getElementById('skResultK')?.textContent || '—', href: '#sampleResultCard', action: 'View result ↑' },
                matrix: { label: 'S / V / F REFERENCE', value: document.getElementById('tableMaterial')?.selectedOptions[0]?.textContent || '—', href: '#tab-matrix', action: 'Open table ↑' }
            };
            const state = states[activeCalculatorTab] || states.sample;
            label.textContent = state.label;
            value.textContent = state.value.trim() && state.value.trim() !== '—' ? state.value.trim() : 'Complete the required fields';
            link.textContent = state.action;
            link.href = state.href;
            bar.dataset.mode = activeCalculatorTab;
            bar.hidden = false;
        }

        function switchTab(tab) {
            if (!['sample', 'development', 'matrix'].includes(tab)) tab = 'sample';
            activeCalculatorTab = tab;
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
            updateMobileResultBar();
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
                option.textContent = `${currentUnit() === 'in' ? (v / INCH_TO_MM).toFixed(3) + ' in' : v + ' mm'}` + (method === 'wing' ? (document.documentElement.lang === 'en' ? ' · verify manufacturer model' : ' · verify against the manufacturer model') : '');
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
            document.getElementById('devVLabel').textContent = method === 'wing' ? 'Equivalent V (selectable)' : 'Suggested V-die opening (selectable)';
            document.getElementById('devVHelp').textContent = document.documentElement.lang === 'en' ? (method === 'wing' ? 'Choose the equivalent V for the exact WingBend model. Listed dimensions are references; check the manufacturer datasheet.' : 'The suggested opening follows a practical rule; you can select another available size.') : (method === 'wing' ? 'Select the equivalent V for the exact WingBend model. Listed dimensions are dimensional references; check the manufacturer datasheet.' : 'The suggested V-die opening follows a rule of thumb; you can select another available size from the list.');
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
                updateMobileResultBar();
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
            document.getElementById('skSummary').textContent = `Dimensions: s ${displayLength(s,3)} · inside angle ${angle}° · Ri ${displayLength(ri,3)} · flat length ${displayLength(flat,3)} · outside dimensions A/B ${displayLength(a,3)}/${displayLength(b,3)} to the projected outer bend envelope. Optional setup: ${material} · Rm ${rm} N/mm² · ${method} · V ${v ? displayLength(Number(v),3) : 'not specified'} · Rp ${rp ? displayLength(Number(rp),3) : 'not specified'}. These process details do not enter the K-factor calculation.`;

            if (!Number.isFinite(k) || k < 0 || k > 1 || ba <= 0 || bd < 0) {
                warning.textContent = 'The geometric result is inconsistent or outside the expected range. Check flat length, outside dimensions A/B, angle and radius; verify K before use.';
                warning.className = 'rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900';
            } else {
                warning.textContent = 'K is derived exclusively from the sample geometry. Method, V opening, nominal punch radius and Rm are optional and do not contribute to the calculation.';
                warning.className = 'rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900';
            }
            updateMobileResultBar();
        }

        const estimatedKFromGeometry = (...args) => GrieveskBendEngine.estimatedKFromGeometry(...args);

        function toggleTheme(forceDark = null) {
            const enabled = forceDark === null ? !document.body.classList.contains('gb-dark') : Boolean(forceDark);
            document.body.classList.toggle('gb-dark', enabled);
            const button = document.getElementById('themeToggle');
            if (button) {
                button.setAttribute('aria-label', enabled ? 'Enable light theme' : 'Enable dark theme');
                button.setAttribute('title', enabled ? 'Switch to light theme' : 'Switch to dark theme');
                button.textContent = enabled ? '☼' : '◐';
            }
            try { localStorage.setItem('gb-theme', enabled ? 'dark' : 'light'); } catch (_) {}
        }

        function updateDevelopmentDiagram({ thickness, angle, v, ri, rp }) {
            const sheet = document.getElementById('devGeometrySheet');
            if (!sheet) return;

            // Sezione illustrativa: V, larghezza esterna matrice (2V), spessore e raggi
            // condividono la stessa scala grafica. Il disegno resta schematico, non FEM.
            const safeAngle = Math.max(10, Math.min(175, Math.abs(Number(angle)) || 90));
            const safeV = Number.isFinite(v) && v > 0 ? v : 10;
            const safeS = Number.isFinite(thickness) && thickness > 0 ? thickness : 1;
            const safeRi = Number.isFinite(ri) && ri > 0 ? ri : safeS;
            const safeRp = Number.isFinite(rp) && rp > 0 ? rp : safeRi;

            // Mantiene la matrice entro il disegno: apertura = V, larghezza esterna = 2V.
            const pxPerMm = Math.min(6, 190 / safeV, 20 / safeS, 36 / safeRp, 38 / safeRi);
            const opening = safeV * pxPerMm;
            const dieWidth = 2 * opening;
            const dieHalf = dieWidth / 2;
            const halfOpening = opening / 2;
            const centerX = 260;
            const dieTop = 172;
            const dieBottom = 292;
            const dieDepth = dieBottom - dieTop;
            const bottomOpening = Math.max(4, opening * 0.24);
            const bottomHalf = bottomOpening / 2;
            const leftOuter = centerX - dieHalf;
            const rightOuter = centerX + dieHalf;
            const leftInner = centerX - halfOpening;
            const rightInner = centerX + halfOpening;
            const leftBottom = centerX - bottomHalf;
            const rightBottom = centerX + bottomHalf;

            // Il raggio di punta Rp e il raggio interno Ri usano la stessa scala della V.
            const punchRadius = Math.max(1, safeRp * pxPerMm);
            const insideRadius = Math.max(1, safeRi * pxPerMm);
            const sheetThicknessPx = Math.max(1, safeS * pxPerMm);
            const legAngle = (180 - safeAngle) * Math.PI / 360;
            const rise = Math.max(10, Math.min(66, halfOpening * Math.tan(legAngle)));
            const tangentOffset = Math.max(insideRadius * 0.9, Math.min(halfOpening * 0.72, insideRadius * Math.tan(Math.max(0.15, legAngle))));
            const sheetY = dieTop - rise;
            const leftTangentX = centerX - tangentOffset;
            const rightTangentX = centerX + tangentOffset;
            const arcDepth = Math.min(insideRadius * 0.9, 24);

            sheet.setAttribute('stroke-width', String(sheetThicknessPx));
            sheet.setAttribute('d',
                `M${leftInner.toFixed(1)} ${sheetY.toFixed(1)} L${leftTangentX.toFixed(1)} ${(dieTop-2).toFixed(1)} Q${centerX} ${(dieTop+arcDepth).toFixed(1)} ${rightTangentX.toFixed(1)} ${(dieTop-2).toFixed(1)} L${rightInner.toFixed(1)} ${sheetY.toFixed(1)}`);

            const dieLeft = document.getElementById('devDieLeft');
            const dieRight = document.getElementById('devDieRight');
            if (dieLeft) dieLeft.setAttribute('d',
                `M${leftOuter.toFixed(1)} ${dieTop} H${leftInner.toFixed(1)} L${leftBottom.toFixed(1)} ${dieBottom} H${leftOuter.toFixed(1)} Z`);
            if (dieRight) dieRight.setAttribute('d',
                `M${rightInner.toFixed(1)} ${dieTop} H${rightOuter.toFixed(1)} V${dieBottom} H${rightBottom.toFixed(1)} Z`);

            const punch = document.getElementById('devPunch');
            const punchHalfWidth = Math.max(12, punchRadius * 2.4);
            const punchTipY = 128;
            const punchShoulderY = 56;
            if (punch) punch.setAttribute('d',
                `M${(centerX-punchHalfWidth).toFixed(1)} 18 H${(centerX+punchHalfWidth).toFixed(1)} V${punchShoulderY} L${(centerX+punchRadius).toFixed(1)} ${(punchTipY-punchRadius*0.35).toFixed(1)} Q${centerX} ${(punchTipY+punchRadius*0.65).toFixed(1)} ${(centerX-punchRadius).toFixed(1)} ${(punchTipY-punchRadius*0.35).toFixed(1)} L${(centerX-punchHalfWidth).toFixed(1)} ${punchShoulderY} Z`);

            const radiusPath = document.getElementById('devGeometryRadius');
            if (radiusPath) radiusPath.setAttribute('d',
                `M${leftTangentX.toFixed(1)} ${(dieTop-2).toFixed(1)} Q${centerX} ${(dieTop+arcDepth).toFixed(1)} ${rightTangentX.toFixed(1)} ${(dieTop-2).toFixed(1)}`);

            const anglePath = document.getElementById('devGeometryAngle');
            const arcRadius = Math.max(12, Math.min(28, insideRadius + 8));
            if (anglePath) anglePath.setAttribute('d',
                `M${(centerX-arcRadius).toFixed(1)} ${(dieTop-arcRadius*0.2).toFixed(1)} Q${centerX} ${(dieTop+arcRadius*0.7).toFixed(1)} ${(centerX+arcRadius).toFixed(1)} ${(dieTop-arcRadius*0.2).toFixed(1)}`);

            const angleLabel = document.getElementById('devGeometryAngleLabel');
            if (angleLabel) { angleLabel.textContent = `${safeAngle.toFixed(0)}°`; angleLabel.setAttribute('x', String(Math.min(390, centerX + halfOpening + 10))); angleLabel.setAttribute('y', String(dieTop + 34)); }
            const thicknessLabel = document.getElementById('devGeometryThicknessLabel');
            if (thicknessLabel) { thicknessLabel.textContent = `s = ${displayLength(safeS, 2)}`; thicknessLabel.setAttribute('x', String(Math.max(18, leftOuter))); }
            const radiusLabel = document.getElementById('devGeometryRadiusLabel');
            if (radiusLabel) { radiusLabel.textContent = `Ri ≈ ${displayLength(safeRi, 2)}`; radiusLabel.setAttribute('x', String(Math.min(365, centerX + halfOpening + 10))); }
            const vLabel = document.getElementById('devGeometryVLabel');
            if (vLabel) { vLabel.textContent = `V = ${displayLength(safeV, 1)}`; vLabel.setAttribute('x', String(Math.min(365, centerX + halfOpening + 10))); }
            const desc = document.getElementById('devGeometryDesc');
            if (desc) desc.textContent = `Sezione illustrativa della piegatura in aria: apertura matrice V ${displayLength(safeV, 1)}, larghezza esterna schematica matrice 2V, spessore ${displayLength(safeS, 2)}, raggio punta punzone Rp ${displayLength(safeRp, 2)}, raggio interno ${displayLength(safeRi, 2)} e angolo interno ${safeAngle.toFixed(0)} gradi. Le dimensioni seguono una scala grafica comune, con limiti di leggibilità; il disegno non è una simulazione fisica né una verifica utensile.`;
        }

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
                updateMobileResultBar();
                return;
            }
            const result = GrieveskBendEngine.calculateDevelopment({ thickness: s, tensileStrength: rm, method, v, punchRadius: rp, angle, flangeA: a, flangeB: b });
            const { innerRadius: ri, minFlange: bmin, radiusSource: riSource, k, bendAllowance: ba, bendDeduction: bd, flatLength: flat } = result;

            document.getElementById('devResultV').textContent = displayLength(v, 1);
            document.getElementById('devResultRi').textContent = displayLength(ri, 2);
            document.getElementById('devResultBmin').textContent = displayLength(bmin, 2);
            document.getElementById('devResultK').textContent = k.toFixed(3);
            document.getElementById('devResultBA').textContent = displayLength(ba, 3);
            document.getElementById('devResultBD').textContent = displayLength(bd, 3);
            document.getElementById('devResultFlat').textContent = displayLength(flat, 3);
            updateDevelopmentDiagram({ thickness: s, angle, v, ri, rp });
            document.getElementById('devKSource').textContent = method === 'wing' ? 'Preliminary WingBend geometric model: validate using samples from the specific model.' : 'Model estimate based on Ri/thickness; this is not a fixed K read from a table.';
            document.getElementById('devModelNote').textContent = `${riSource}. The minimum flange is a reference value and must be checked against the installed tool chart.`;
            warning.textContent = method === 'wing' ? 'For WingBend, equivalent V and minimum flange must match the exact manufacturer model; generic values do not replace the technical datasheet.' : '';
            warning.className = method === 'wing' ? 'rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900' : 'hidden rounded-lg border p-3 text-sm';
            updateMobileResultBar();
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
            const tab = p.get('tab') || 'development';
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
        window.addEventListener('DOMContentLoaded', () => {
            try { toggleTheme(localStorage.getItem('gb-theme') === 'dark'); } catch (_) { toggleTheme(false); }
            // Select the current value on focus so typing replaces it instead of appending digits.
            document.querySelectorAll('input[inputmode="decimal"]').forEach(input => {
                input.addEventListener('focus', () => {
                    document.body.classList.add('gb-input-focused');
                    try { input.select(); } catch (_) {}
                });
                input.addEventListener('blur', () => document.body.classList.remove('gb-input-focused'));
            });
            initProtectedEmail();
            const unitSelect = document.getElementById("unitSystem");
            const params = new URLSearchParams(window.location.search);
            activeUnit = params.get("units") === "in" && params.has("s") ? "in" : "mm";
            if (unitSelect) unitSelect.value = activeUnit;
            updateSampleVOptions();
            refreshDevelopmentModel(true);
            loadFromUrlParams();
            renderMatrixTable();
            if (params.get("units") === "in" && !params.has("s")) changeUnitSystem("in");

        });
    