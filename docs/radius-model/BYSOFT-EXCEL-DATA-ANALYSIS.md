# Analisi delle tabelle Excel BySoft e dei campi Radius factor

**Stato:** analisi delle fonti disponibili al 2026-11-11. Nessuna formula nuova è stata attivata.  
**Scopo:** inventariare i nuovi Table Entry e le tabelle utensili, distinguere i parametri documentati dalle ipotesi e definire come usarli nei modelli Ri/K.

## 1. Fonti esaminate

### Tabelle utensili per materiale

I file hanno queste colonne:

- `Sheet thickness [mm]`
- `Top tool radius [mm]`
- `Infeed width of die [mm]`
- `Infeed radius of die [mm]`
- `Radius factor`
- `Radius factor, angle measurement system`

Conteggi rilevati (righe dati; tra parentesi record unici esatti sulle sei colonne):

| File | Righe | Record unici |
|---|---:|---:|
| Aluminium-250Nmm2.xlsx | 222 | 197 |
| StainlesSteel-650Nmm2.xlsx | 303 | 267 |
| DC01-430Nmm2.xlsx | 19 | 15 |
| S235JR-510Nmm2.xlsx | 38 | 37 |
| Steel-420Nmm2.xlsx | 698 | 651 |
| Steel-420Nmm2-V2.xlsx | 619 | 572 |
| Weldox900-1050Nmm2.xlsx | 30 | 30 |
| **Totale** | **1.929** | — |

I conteggi unici sono interni a ciascun file. Non rappresentano osservazioni indipendenti tra file: Steel-420 e Steel-420-V2 possono sovrapporsi e vanno confrontati prima di essere uniti. I duplicati interni non vanno cancellati dalle fonti originali; si può creare una vista deduplicata per l'analisi.

### Nuovi file Table Entry

I tre file contengono sette righe ciascuno e quattro colonne:

- `Bend angle [°]`
- `Delta X [mm]`
- `W-Gamma [mm]`
- `Radius factor`

I dati sono:

| Bend angle raw | Radius factor TE1 | Radius factor TE2 | Radius factor TE3 |
|---:|---:|---:|---:|
| 60 | 0,229 | 0,275 | 0,274 |
| 70 | 0,229 | 0,275 | 0,272 |
| 80 | 0,231 | 0,280 | 0,273 |
| 90 | 0,239 | 0,283 | 0,283 |
| 105 | 0,268 | 0,307 | 0,307 |
| 120 | 0,302 | 0,363 | 0,363 |
| 135 | 0,374 | 0,443 | 0,443 |

Delta X varia tra i tre file; W-Gamma è zero in tutte le 21 righe. Non sono presenti nei workbook metadati, note, commenti o definizioni che spieghino i campi. I tre file vanno mantenuti separati: non sappiamo ancora se rappresentino tre configurazioni di utensili, tre tabelle di processo o tre varianti di un'esportazione.

## 2. Cosa sappiamo e cosa non sappiamo sui campi

### Radius factor delle tabelle utensili

È un campo tabellare fornito dalla fonte, associato alla combinazione di spessore, raggio utensile superiore, larghezza e raggio d'ingresso matrice. È quindi una variabile potenzialmente utile per il modello del raggio interno.

**Non è dimostrato che sia il K-factor.** I valori tipici sono circa 0,15–0,35, mentre i K BySoft esplicitamente riportati nel TXT sono circa 0,36–0,61 per le pieghe ordinarie. Inoltre le tabelle utensili non riportano angolo, BA o BD, necessari per ricavare K indipendentemente. Non rinominare questo campo K e non usarlo come target K.

Il significato fisico preciso del fattore (formula, raggio a cui si riferisce, sistema di misura, condizioni di applicazione) non è specificato nei file ricevuti. Occorre recuperare la legenda/documentazione della tabella o un esempio BySoft che mostri il valore calcolato e il raggio risultante.

### Radius factor, angle measurement system

È un secondo campo numerico. In Steel-420.xlsx assume prevalentemente 0,15, in Steel-420-V2.xlsx è sempre 0; negli altri materiali assume valori differenti, in alcuni casi 0 o 1. Il nome suggerisce una variante legata al sistema di misura dell'angolo, ma il workbook non ne documenta la semantica.

**Non interpretarlo come angolo, flag booleano o K senza documentazione.** Conservare valore e nome originale. Il fatto che in alcune righe sia 0/1 non prova che sia un interruttore.

### Bend angle nei Table Entry

La documentazione ufficiale BySoft CAM descrive il campo Bend angle del Part Editor come angolo definito in base all'angolo esterno (α); il valore può essere positivo o negativo. La documentazione descrive separatamente il K-factor come posizione della fibra neutra, compreso tra 0 e 1, e il suo effetto sul bend allowance. Fonte: manuale ufficiale BySoft CAM, sezione Part Editor / Bend / Normal bending, disponibile nel Bystronic Media Center: https://bystronic-mediacenter.picturepark.com/v/uSPrfoiG/

Di conseguenza, per i Table Entry non assumere automaticamente che `Bend angle` sia già l'angolo interno usato da BendingCalculator. La conversione candidata, se confermata che il campo esportato usa la stessa convenzione del manuale, è:

`inside_angle = 180° - abs(raw_outside_angle)`

Questa conversione è una **interpretazione da verificare**, non ancora un dato accertato per questi specifici file. Conservare sempre il valore grezzo e aggiungere un campo normalizzato separato solo dopo conferma. La convenzione interna di BendingCalculator non cambia: i suoi angoli sono sempre angoli interni, valore assoluto, senza supplementare.

### Delta X e W-Gamma

I file riportano Delta X in mm e W-Gamma in mm, ma non ne forniscono definizione, riferimento geometrico o formula. Delta X è variabile tra le tre tabelle; W-Gamma vale zero in tutte le righe.

Non è possibile stabilire dai soli fogli se Delta X sia uno spostamento della linea di piega, una correzione di geometria/utensile, una compensazione o un altro parametro del Table Entry. W-Gamma a zero potrebbe indicare un termine nullo/non utilizzato, ma non è dimostrato.

Non usare Delta X o W-Gamma per calcolare K finché non ne è nota la semantica.

## 3. Confronto preliminare con il TXT BySoft

Il TXT contiene osservazioni che riportano esplicitamente K, Ri e BD. Per esempio:

- S=1 mm, R1, V8 @ 30°, Rm=420, angolo sorgente −80° (normalizzato nel progetto a interno 80°), Ri=1,519 mm, K=0,474, BD=1,560 mm.
- S=1,5 mm, R1, V8 @ 30°, Rm=420, angolo interno 90°, Ri=1,434 mm, K=0,423, BD=2,620 mm.
- S=1 mm, R1, V8 @ 30°, Rm=420, angolo interno 90°, Ri=1,622 mm, K=0,392, BD=2,080 mm.

Questi K sono target osservati per il modello empirico K. I valori Radius factor delle tabelle Excel/Table Entry non coincidono automaticamente con tali K. Un confronto numerico tra campi omonimi non dimostra equivalenza fisica.

I tre Table Entry hanno angoli raw 60–135° e Radius factor crescenti soprattutto oltre 90°. Questo andamento potrebbe contenere informazione sull'effetto angolare di un fattore di raggio, ma non dimostra un andamento di K: prima occorre identificare il parametro e la convenzione angolare.

## 4. Normalizzazione da applicare ai dataset

### Tabelle utensili

Aggiungere colonne derivate senza alterare i dati originali:

- `tool_radius_over_thickness = Top tool radius / Sheet thickness`
- `die_width_over_thickness = Infeed width of die / Sheet thickness`
- `die_entry_radius_over_thickness = Infeed radius of die / Sheet thickness`
- `radius_factor_raw` e `radius_factor_angle_system_raw` invariati.

Queste normalizzazioni rendono confrontabili le proporzioni geometriche tra spessori. Non trasformano i fattori in K.

La Rm può essere associata al materiale solo come etichetta della fonte (es. 420, 430, 510, 650, 900–1050 N/mm²), evitando di assumere che la resistenza nominale descriva da sola tutte le proprietà meccaniche.

### Table Entry

Conservare:
- file di provenienza;
- indice/riga;
- angolo raw;
- Delta X raw;
- W-Gamma raw;
- Radius factor raw.

Dopo conferma della convenzione angolare, creare `inside_angle_deg`. Non convertire il dato sovrascrivendo `Bend angle`.

### TXT

Per ciascun campione K:
- `Ri_over_S = Ri/S`;
- angolo interno normalizzato secondo la convenzione del progetto;
- conservare Rm, V, Rp, angolo matrice e metodo;
- conservare K e BD originali come osservati, senza ricalcolarli e sostituirli.

## 5. Come arrivare a K senza confondere i fattori

La via primaria resta quella geometrica, usando osservazioni che forniscano geometria completa e sviluppo/BA/BD:

`OSS = (Ri + S) * tan((180° - inside_angle)/2)`

`BA = 2*OSS - BD`

`K = (BA/theta - Ri)/S`, con `theta = (180° - inside_angle)` espresso in radianti.

In alternativa, se sono note le quote esterne A/B e lo sviluppo piano L secondo la convenzione flange documentata sul sito:

`BD = A + B - L`

`BA = 2*OSS - BD`

`K = (BA/theta - Ri)/S`.

Questa deduzione richiede dati coerenti e riferimenti geometrici verificati. Il K già dichiarato nel TXT resta un dato osservato e non deve essere sostituito da una ricostruzione basata su informazioni incomplete.

Le tabelle Excel utensili possono aiutare a modellare Ri e a descrivere il contesto utensile/materiale. I Table Entry possono fornire una seconda relazione angolare dopo aver chiarito i campi. Nessuno dei due gruppi può attualmente produrre K in modo univoco dai soli dati contenuti nei file.

## 6. Attività successive

1. Ottenere da BySoft/Bystronic la definizione dei campi `Radius factor`, `Radius factor, angle measurement system`, `Delta X` e `W-Gamma`.
2. Identificare a quale configurazione materiale/spessore/punzone/matrice appartiene ciascuno dei tre Table Entry.
3. Confermare se `Bend angle` nei Table Entry è espresso come angolo esterno BySoft; non assumere la conversione senza prova.
4. Deduplicare e confrontare Steel-420.xlsx e Steel-420-V2.xlsx; mantenere le versioni originali.
5. Normalizzare i parametri utensile con i rapporti rispetto allo spessore.
6. Usare le tabelle utensili come dataset per il modello Ri, non come K.
7. Usare il TXT come fonte dei K osservati per il modello K.
8. Cercare campioni aggiuntivi che contengano geometria completa, sviluppo/BD e condizioni di processo, così da poter ricavare K in modo indipendente.
9. Solo dopo la definizione dei campi Table Entry, verificare se i relativi fattori possono entrare come predittori del modello K o Ri.

## 7. Regola di interpretazione

Un campo chiamato `Radius factor` non è automaticamente un K-factor. Un fattore numerico compreso tra 0 e 1 non identifica da solo una grandezza fisica. Prima di usarlo in una formula servono definizione, unità/normalizzazione, convenzione angolare e relazione documentata con il raggio risultante.

Nessun modello K va calibrato su valori non identificati come K.
