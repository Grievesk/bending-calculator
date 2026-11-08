# Roadmap — modello empirico del raggio interno e del fattore K

**Progetto:** BendingCalculator / Grievesk Bend  
**Branch di lavoro:** `feature/radius-model-v1`  
**Stato:** specifica tecnica e direzione di sviluppo; nessuna nuova formula K è stata attivata.  
**Scopo:** lasciare una traccia autonoma, riprendibile da qualsiasi collaboratore in futuro, delle decisioni, delle fonti, delle ipotesi e delle verifiche necessarie.

---

## 1. Decisione di progetto

Non si deve trattare K come una costante universale prevedibile dal solo rapporto (Ri/S), né attribuirgli un valore teorico a priori.

La direzione concordata è costruire un **modello empirico** a partire dai rilievi disponibili e da quelli futuri. Il modello dovrà descrivere come il K osservato varia in funzione delle condizioni di piegatura, in particolare:

- angolo interno del pezzo;
- raggio interno normalizzato rispetto allo spessore (Ri/S);
- resistenza del materiale (Rm), quando i dati consentono di identificarne l'effetto;
- configurazione di processo e utensili, per non attribuire al materiale differenze dovute invece alla lavorazione.

Il K rappresenta il comportamento dell'asse neutro risultante dalla distribuzione delle deformazioni attraverso lo spessore. Compressione sul lato interno ed estensione sul lato esterno sono parte del fenomeno fisico. La funzione empirica non deve però presumere che la sola Rm descriva completamente il comportamento: materiale, stato metallurgico, metodo, utensili e condizioni di processo possono essere confondenti.

**Conseguenza immediata:** l'attuale funzione `estimatedKFromGeometry()`, basata su una formula generica del rapporto (Ri/S), è soltanto una stima provvisoria. Non deve essere considerata una previsione fisica validata e dovrà essere sostituita o chiaramente mantenuta come fallback solo dopo aver costruito e validato il modello empirico.

## 2. Principio di separazione: raggio e K sono due modelli diversi

Il progetto dovrà mantenere due modelli distinti, collegati nel calcolo dello sviluppo:

### Modello A — raggio interno

Stima (Ri) a partire dalle condizioni di piegatura e dai dati disponibili:

[
Ri=f(S,V,Rp,Rm,\alpha,\text{geometria utensili},\text{metodo})
]

Non tutte le variabili saranno sempre disponibili. Il modello dovrà dichiarare quali variabili usa davvero e in quale campo è stato calibrato.

### Modello B — fattore K

Stima K empiricamente a partire dai rilievi:

[
K=g(\alpha,Ri/S,Rm,\text{metodo},\text{configurazione})
]

La prima analisi dovrà concentrarsi sulle variabili concordate — angolo interno, (Ri/S), Rm — senza aggiungere indiscriminatamente parametri. V, Rp, apertura/forma matrice e metodo saranno conservati nel dataset e valutati come possibili variabili di controllo o di stratificazione, per evitare correlazioni spurie.

Il modello B non deve essere addestrato sui K generati dal modello A o dalla vecchia formula predittiva. I target K devono provenire da rilievi indipendenti o da dati di processo affidabili.

## 3. Convenzioni geometriche e reversibilità obbligatoria

Tutti gli angoli forniti al sistema rappresentano l'**angolo interno**. Si usa il valore assoluto; il segno viene ignorato e non si applica il supplementare.

Definendo:

- (S): spessore;
- (Ri): raggio interno;
- (\alpha): angolo interno;
- (\theta=\pi-\alpha\): angolo della zona curva, in radianti;
- (BA): Bend Allowance;
- (BD): Bend Deduction;
- (OSS): Outside Setback;
- (A,B): quote esterne finite definite dall'utente.

Le relazioni geometriche adottate dal sito sono:

[
OSS=(Ri+S)\tan(\theta/2)
]

[
BA=\theta(Ri+KS)
]

[
BD=2OSS-BA
]

[
L=A+B-BD
]

dove (L) è lo sviluppo piano.

La convenzione delle flange mostrata nell'interfaccia è parte della specifica: A e B sono le quote esterne finite desiderate, parallele ai rispettivi lati; le linee di richiamo sono perpendicolari ai lati e terminano sulla proiezione dell'ingombro esterno della piega. Ogni quota include il tratto rettilineo più il ritiro esterno OSS. Non reinterpretare A/B come sole lunghezze rettilinee fino alla tangenza.

### Identità inversa

Dalle stesse relazioni:

[
BA=A+B-L+2OSS
]

[
K=\frac{BA/\theta-Ri}{S}
]

Quindi, a parità di (S,\alpha,Ri,A,B,L), il K ricavato deve coincidere con quello usato nel calcolo diretto. Questa è un'identità matematica, non una stima statistica.

**Test obbligatorio:** per ogni caso di test, calcolare lo sviluppo con un K noto e ricavare K dal risultato usando il calcolatore inverso. Verificare la corrispondenza entro tolleranza numerica. Il test va eseguito su più angoli interni, compresi 80° e 90°, e su più combinazioni di flange. Non usare arrotondamenti UI come input del test: usare i valori numerici completi del motore.

## 4. Convenzione dei dati e provenienza

Ogni osservazione deve mantenere il dato originale e la sua provenienza. Non sovrascrivere il valore sorgente con una conversione o una correzione.

Campi minimi consigliati per ogni record:

| Campo | Descrizione |
|---|---|
| `source_id` | File, foglio, riga o identificativo origine |
| `source_type` | Bysoft TXT, Excel tecnico, misura diretta, altro |
| `material_label` | Denominazione esatta della fonte |
| `Rm_N_mm2` | Resistenza dichiarata, se disponibile |
| `S_mm` | Spessore |
| `inside_angle_deg` | Angolo interno normalizzato secondo la convenzione progetto |
| `angle_source_raw` | Angolo originale, senza perdita del segno/testo |
| `Ri_mm` | Raggio interno rilevato o tabellare |
| `K_observed` | K esplicitamente riportato dalla fonte |
| `BA_mm` | BA riportato o ricostruibile |
| `BD_mm` | BD riportata dalla fonte |
| `V_mm`, `Rp_mm`, `die_angle_deg` | Dati utensili, se disponibili |
| `method` | Aria, coniatura, piega guidata, pannellatura, se noto |
| `quality_flag` | Misurato, dichiarato dal software, tabellare, derivato, incerto |
| `notes` | Ambiguità, condizioni o note di interpretazione |

Distinguere sempre:
1. dato riportato direttamente;
2. dato convertito senza cambiare significato;
3. dato derivato matematicamente;
4. dato stimato dal modello;
5. ipotesi ancora da verificare.

Non colmare campi mancanti con valori presunti. Le osservazioni con informazioni incomplete possono restare utili per il modello del raggio, ma non necessariamente per quello K.

## 5. Fonte TXT Bysoft: rilievi K disponibili

Il file `Bysoft Cam 2.txt` dichiara esplicitamente che i rilievi Bysoft sono da considerare veritieri e che l'esperienza pratica conferma le deduzioni di sviluppo. Questa indicazione va rispettata: non scartare o correggere autonomamente i valori riportati.

Il file contiene 21 osservazioni descritte. I dati comprendono spessore, punzone, matrice e relativo angolo, resistenza nominale, angolo di piega, Ri, K e BD. La maggior parte dei campioni è in materiale dichiarato 420 N/mm², ma le configurazioni di utensile e spessore variano.

Esempi significativi riportati nel TXT:

| S | Angolo interno secondo convenzione progetto | Ri | K | BD | Configurazione |
|---:|---:|---:|---:|---:|---|
| 1,0 | 80° (fonte: −80°) | 1,519 | 0,474 | 1,560 | R1, V8 @ 30°, Rm 420 |
| 1,0 | 90° | 1,622 | 0,392 | 2,080 | R1, V8 @ 30°, Rm 420 |
| 1,0 | 90° | 1,481 | 0,378 | 2,041 | R1, V8 @ 85°, Rm 420 |
| 1,0 | 100° | 1,952 | 0,415 | 1,649 | R1, V8 @ 30°, Rm 420 |
| 1,0 | 120° | 2,728 | 0,417 | 1,011 | R1, V8 @ 30°, Rm 420 |
| 1,0 | 135° | 3,329 | 0,391 | 0,664 | R1, V8 @ 30°, Rm 420 |
| 1,0 | 150° | 3,967 | 0,362 | 0,395 | R1, V8 @ 30°, Rm 420 |
| 1,5 | 45° | 1,053 | 0,578 | 0,582 | R1, V8 @ 30°, Rm 420 |
| 1,5 | 60° | 1,171 | 0,544 | 1,179 | R1, V8 @ 30°, Rm 420 |
| 1,5 | 90° | 1,434 | 0,423 | 2,620 | R1, V8 @ 30°, Rm 420 |
| 1,5 | 120° | 2,412 | 0,457 | 1,273 | R1, V8 @ 30°, Rm 420 |
| 1,5 | 150° | 3,507 | 0,445 | 0,498 | R1, V8 @ 30°, Rm 420 |
| 1,5 | 175° | 4,506 | 0,429 | 0,075 | R1, V8 @ 30°, Rm 420 |
| 2,0 | 135° | 3,524 | 0,424 | 1,142 | R1, V12 @ 86°, Rm 420 |
| 3,0 | 90° | 1,870 | 0,430 | 4,775 | R1, V16 @ 86°, Rm 420 |
| 3,0 | 175,2° | 6,733 | 0,479 | 0,130 | R1, V16 @ 86°, Rm 420 |

La tabella è una selezione leggibile, non una sostituzione del TXT originale. Il file contiene anche casi speciali di orlo/rischiacciatura e altri record da conservare.

**Nota sugli angoli:** il TXT usa espressioni come acuto/ottuso e riporta in un caso −80°. Per il modello si applica la convenzione di progetto: angolo interno in valore assoluto. Non si converte un angolo nel supplementare. I casi 0/180° di orlo/rischiacciatura sono casi speciali e non vanno inseriti automaticamente nella stessa regressione delle pieghe ordinarie.

### Limiti attuali del TXT

- Non rappresenta ancora una matrice completa di prove controllate.
- Molti record condividono materiale e utensili; non permettono da soli di isolare l'effetto Rm.
- Non tutte le combinazioni di spessore e angolo sono presenti.
- I dati geometrici A/B e lo sviluppo piano grezzo associato a ciascun K non sono riportati nel TXT.
- Le deduzioni dichiarate vanno mantenute come riferimento della fonte; per ricalcolare K in modo indipendente serve verificare la convenzione e la geometria sottostante.

Il campione 1 mm, V8 @ 30°, angolo interno 80°, Ri 1,519, K 0,474 e BD 1,560 è un riferimento prioritario. Il campione 1,5 mm, V8 @ 30°, 90°, Ri 1,434, K 0,423 e BD 2,620 è un altro riferimento utile.

## 6. Tabelle Excel: fonte valida per il modello del raggio, non ancora per K

Sono stati esaminati gli Excel disponibili. I fogli presentano queste intestazioni:

- `Sheet thickness [mm]`
- `Top tool radius [mm]`
- `Infeed width of die [mm]`
- `Infeed radius of die [mm]`
- `Radius factor`
- `Radius factor, angle measurement system`

I file presenti e il numero di righe dati lette sono:

| File | Righe dati |
|---|---:|
| `Steel-420Nmm2.xlsx` | 698 |
| `Steel-420Nmm2-V2.xlsx` | 619 |
| `StainlesSteel-650Nmm2.xlsx` | 303 |
| `Aluminium-250Nmm2.xlsx` | 222 |
| `DC01-430Nmm2.xlsx` | 19 |
| `Weldox900-1050Nmm2.xlsx` | 30 |
| `S235JR-510Nmm2.xlsx` | 38 |
| **Totale righe nei file** | **1.929** |

Il totale è il numero di righe presenti nei file, **non** il numero di osservazioni indipendenti: i due file Steel-420 possono sovrapporsi e sono presenti righe ripetute. Prima di addestrare o validare un modello occorre identificare duplicati e differenze tra versioni, senza cancellare le fonti originali.

### Cosa supportano attualmente questi Excel

Le tabelle forniscono informazioni preziose per il modello del raggio e per il rapporto tra spessore e utensili: spessore, raggio punzone, larghezza V e raggio d'ingresso matrice, oltre a due campi chiamati `Radius factor` e `Radius factor, angle measurement system`.

**Nei fogli esaminati non è presente una colonna esplicita per K, Bend Allowance, Bend Deduction o angolo della piega.** Pertanto, allo stato attuale, questi Excel non costituiscono una fonte diretta di K né permettono di associare con certezza i fattori riportati a un K.

Non rinominare i campi `Radius factor` come K. Non interpretare il campo `Radius factor, angle measurement system` come K o come correzione angolare senza la relativa documentazione tecnica. I due campi vanno conservati con i nomi originali fino a quando non sarà chiarita la loro definizione.

### Impiego previsto degli Excel

1. Usarli come fonte tabellare per il modello Ri e per verificare la dipendenza da spessore, punzone, V, raggio d'ingresso e materiale.
2. Conservare il nome del file, il foglio e il numero di riga per ogni record.
3. Confrontare le versioni Steel-420 e identificare duplicati o modifiche.
4. Non generare K da questi dati in assenza di BA/BD o di una definizione documentata del fattore.
5. Se in futuro si ottengono esportazioni Table Entry o documentazione dei campi, aggiungerle come nuove fonti con tracciabilità, senza reinterpretare retroattivamente i valori già importati.

La distinzione tra i due modelli permette di sfruttare gli Excel anche se, per ora, non contengono riferimenti diretti a K.

## 7. Metodo di costruzione del modello empirico K

### Fase 1 — preparazione e controllo qualità dei dati

- Trascrivere i TXT in un dataset strutturato, mantenendo sempre il dato originale.
- Importare gli Excel in un dataset separato per il modello Ri.
- Normalizzare solo le unità e la convenzione dell'angolo; conservare sempre il valore sorgente.
- Marcare i casi speciali (orlo, schiacciatura, pieghe limite) e tenerli fuori dalla prima curva delle pieghe ordinarie.
- Identificare duplicati esatti e quasi duplicati, senza confondere repliche con errori.
- Non fondere record con materiali, utensili o metodi differenti solo perché hanno lo stesso spessore.

### Fase 2 — analisi esplorativa

Per i record K disponibili, produrre grafici e tabelle di K rispetto a:
- angolo interno;
- (Ri/S);
- Rm;
- combinazioni angolo–(Ri/S).

Iniziare da gruppi omogenei (stesso materiale dichiarato, utensili e metodo comparabili). Solo dopo valutare l'aggregazione tra gruppi.

Verificare se l'effetto dell'angolo è monotono, curvo o differente in zone diverse. Non imporre una curva monotona se i dati affidabili mostrano un andamento diverso.

### Fase 3 — normalizzazione e identificabilità

La normalizzazione (Ri/S) consente il confronto tra spessori diversi, ma non garantisce da sola che i processi siano equivalenti.

La resistenza può essere rappresentata anche con un rapporto normalizzato, ad esempio (Rm/Rm_{ref}), solo dopo aver scelto e documentato un riferimento. La normalizzazione non crea informazione che i dati non contengono.

Con gli attuali campioni TXT prevalentemente a Rm 420 N/mm², l'effetto indipendente della resistenza **non è identificabile**. Per stimarlo servono campioni comparabili per angolo, (Ri/S), utensili e metodo, ma con Rm differenti.

### Fase 4 — scelta della funzione

Confrontare modelli semplici e interpretabili prima di modelli complessi:

1. curve per gruppi omogenei;
2. regressione con termini non lineari e interazioni motivate;
3. eventuale modello gerarchico o per materiale, se il volume e la distribuzione dei dati lo giustificano.

Non fissare coefficienti prima dell'analisi. Evitare extrapolazioni oltre il campo dei dati. Il modello deve poter restituire anche uno stato di bassa affidabilità o fuori dominio, non un numero apparentemente preciso senza supporto.

### Fase 5 — validazione

- Separare calibrazione e validazione prima di scegliere i coefficienti.
- Evitare che duplicati o repliche dello stesso gruppo finiscano sia nel training sia nel test.
- Usare validazione per gruppi/configurazioni, non soltanto una divisione casuale delle righe.
- Misurare errore assoluto e distribuzione dei residui su K, BA, BD e sviluppo.
- Confrontare sempre il risultato con i dati originali e con la baseline provvisoria.
- Documentare il campo valido: spessori, angoli, materiali, utensili e metodi coperti.
- Non chiamare il modello validato finché non dimostra prestazioni su dati non usati per stimarlo.

## 8. Esempio di applicazione ai dati attuali

Per il campione Bysoft da 1 mm:
- angolo interno = 80°;
- (Ri=1,519) mm;
- (Ri/S=1,519);
- Rm dichiarata = 420 N/mm²;
- K riportato = 0,474;
- BD riportata = 1,560 mm;
- utensili: punzone R1, matrice V8 @ 30°.

Questo è un punto osservato del modello K. Non va sostituito dal valore 0,376 generato dalla vecchia formula empirica Ri/S.

Per il campione da 1,5 mm a 90°:
- (Ri=1,434) mm;
- (Ri/S=0,956);
- Rm = 420 N/mm²;
- K = 0,423;
- BD = 2,620 mm;
- punzone R1, matrice V8 @ 30°.

Il confronto tra i due campioni è utile per osservare variazioni, ma non isola l'effetto dell'angolo perché cambiano sia spessore sia rapporto (Ri/S). Per questo la regressione deve considerare simultaneamente le variabili e non trarre conclusioni da una semplice differenza tra due righe.

## 9. Integrazione futura nel calcolatore

Quando il modello empirico sarà validato:

1. Il calcolatore di sviluppo stimerà Ri con il modello A, oppure userà Ri misurato quando disponibile.
2. Il modello B stimerà K usando angolo interno, (Ri/S), resistenza e le variabili di processo effettivamente validate.
3. Il motore calcolerà BA, OSS, BD e sviluppo con le formule geometriche documentate.
4. Il calcolatore inverso ricaverà K dalle stesse geometrie e dovrà restituire il K usato dal diretto.
5. La UI mostrerà chiaramente se Ri/K sono misurati, tabellari o stimati e segnalerà quando l'input è fuori dal dominio di calibrazione.

La funzione K non deve essere usata per correggere errori geometrici. Prima si verifica la convenzione delle quote e la reversibilità; poi si valuta la qualità predittiva del modello empirico.

## 10. Prossime attività, in ordine

- [ ] Conservare questo documento come specifica di riferimento del filone Ri/K.
- [ ] Creare un dataset strutturato dai 21 rilievi Bysoft, con collegamento a file e record originali.
- [ ] Verificare tutte le convenzioni di angolo e marcare i casi speciali.
- [ ] Fare inventario/deduplicazione delle 1.929 righe Excel, mantenendo i due file Steel-420 distinti fino al confronto.
- [ ] Documentare la semantica dei due campi Radius factor prima di usarli in formule.
- [ ] Produrre analisi esplorativa e grafici del K TXT rispetto ad angolo e (Ri/S).
- [ ] Definire il piano per raccogliere campioni con Rm differenti e condizioni comparabili.
- [ ] Costruire e confrontare funzioni candidate senza modificare ancora il calcolo pubblico.
- [ ] Validare su dati indipendenti e documentare il dominio di applicabilità.
- [ ] Solo dopo la validazione, proporre l'integrazione del modello K nel motore.

## 11. Regole per chi riprende il lavoro

- Leggere questo documento prima di intervenire sul filone Ri/K.
- Consultare i file sorgente originali; questo documento non li sostituisce.
- Non inventare dati mancanti e non modificare le fonti originali.
- Non usare i K generati dalla vecchia funzione come target di calibrazione.
- Non interpretare i fattori Excel come K.
- Non cambiare la convenzione dell'angolo interno.
- Non modificare formule o UI pubbliche finché l'analisi non ha dimostrato una correzione.
- Lavorare su branch e PR; nessun merge senza approvazione.
- Mantenere Preview Cloudflare funzionante secondo la configurazione già verificata nel progetto.
- Registrare ogni nuova decisione, formula, dataset, test e limite in questo documento o in un documento collegato.

**Criterio di successo:** un modello empirico tracciabile, validato su osservazioni indipendenti, che stimi K entro un campo di applicabilità dichiarato e che resti matematicamente reversibile con il calcolatore di sviluppo.
