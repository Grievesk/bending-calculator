# Modello empirico del raggio interno e sviluppo del fattore K — Grievesk Bend

**Stato:** ricerca/calibrazione in corso. Non implementato nel motore pubblico.  
**Ultimo aggiornamento:** 2026-11-07  
**Dataset:** 19 campioni ordinari Bysoft riportati in `Bysoft Cam 2.txt`, più le tabelle software `TABLE` e `Table Entry`. Il campione di orlo schiacciato (Ri = 0,05 mm) è escluso dal modello ordinario perché è una condizione di processo distinta. I valori originali Bysoft non vengono modificati.

## Obiettivo e ordine di lavoro

Questa fase riguarda prima la previsione del raggio interno reale (Ri), poi la deduzione del fattore K e infine il confronto della deduzione con Bysoft.

1. prevedere Ri dai parametri di processo e utensile;
2. ricavare K dai dati geometrici/Bysoft usando il raggio previsto o misurato;
3. calcolare la BA dalla linea neutra (Rn = Ri + K s);
4. confrontare successivamente la deduzione calcolata con la deduzione Bysoft.

Non usare la formula di deduzione precedentemente presente nel sito come riferimento per questa ricerca.

## Dati e convenzioni

- `s`: spessore lamiera, mm.
- `V`: apertura nominale matrice, mm.
- `Rp`: raggio punzone, mm.
- `alpha`: angolo interno della piega, gradi. Il segno, se presente nei dati originali, indica il verso e non rende negativo l’angolo fisico.
- `beta`: angolo nominale della matrice, gradi.
- `Rm`: resistenza a trazione del materiale, N/mm².
- `Ri`: raggio interno misurato/riportato da Bysoft, mm.
- `Re`: raggio ingresso matrice. In assenza del dato del costruttore si usa l’approssimazione concordata (Re = V/9).

Tutti i 19 campioni Bysoft attualmente disponibili hanno Rm = 420 N/mm² e Rp = 1 mm. Di conseguenza l’effetto indipendente di Rm e Rp non è identificabile in modo affidabile da quel solo dataset.

## Nuova struttura delle tabelle software

Le esportazioni Excel rappresentano due livelli collegati nell’interfaccia del programma.

### Livello 1: TABLE

La tabella superiore si chiama semplicemente `TABLE`. È stata esportata per i diversi materiali e contiene una riga per una configurazione di materiale e utensile.

Le colonne sono:

| Colonna | Significato operativo |
|---|---|
| Sheet thickness [mm] | spessore `s` |
| Top tool radius [mm] | raggio punzone `Rp` |
| Infeed width of die [mm] | larghezza/apertura d’ingresso della matrice, candidata a rappresentare `V` |
| Infeed radius of die [mm] | raggio d’ingresso della matrice, candidato a rappresentare `Re` |
| Radius factor | fattore di riferimento della configurazione |
| Radius factor, angle measurement system | secondo fattore associato al sistema di misura dell’angolo |

Il materiale e la resistenza nominale sono indicati dal nome del workbook, non da una colonna interna. La riga deve quindi essere conservata insieme al nome del file materiale.

### Livello 2: Table Entry

La tabella inferiore si chiama `Table Entry`. Non è una tabella indipendente: cambia quando viene selezionata una riga di `TABLE`.

La sua struttura osservata è:

| Colonna | Significato da verificare |
|---|---|
| Bend angle [°] | angolo per il quale è calcolato l’entry |
| Delta X [mm] | quantità geometrica derivata, potenzialmente utile per la deduzione |
| W-Gamma [mm] | correzione o termine geometrico aggiuntivo |
| Radius factor | fattore dipendente dall’angolo per la riga selezionata |

La chiave corretta non è quindi soltanto l’angolo. Ogni riga di `Table Entry` deve essere identificata da:

\[
(\text{materiale},s,Rp,V,Re,\text{fattori TABLE},\alpha)
\]

L’esportazione completa richiesta per la calibrazione dovrà riportare i parametri della riga `TABLE` accanto a ogni riga `Table Entry`. Non è sufficiente conservare soltanto il file figlio, perché altrimenti si perde il collegamento con materiale e utensile.

## Prima verifica della relazione TABLE–Table Entry

Il file `Steel-420Nmm2-TableEntry.xlsx` contiene gli angoli 60°, 70°, 80°, 90°, 105°, 120° e 135°.

Per la prima riga di `Steel-420Nmm2.xlsx`:

\[
s=0,5,\quad Rp=0,5,\quad V=11,5,\quad Re=1,5
\]

il `Radius factor` della tabella superiore è 0,239.

Nel relativo `Table Entry` il fattore è:

| Angolo | Radius factor |
|---:|---:|
| 60° | 0,229 |
| 70° | 0,229 |
| 80° | 0,231 |
| 90° | 0,239 |
| 105° | 0,268 |
| 120° | 0,301 |
| 135° | 0,374 |

La coincidenza:

\[
\text{Radius factor}_{Table\ Entry,90^\circ}
=
\text{Radius factor}_{TABLE}
=
0,239
\]

è un’evidenza forte che il valore della tabella superiore sia un riferimento a 90° e che `Table Entry` contenga la variazione angolare dello stesso fattore.

Non è ancora una dimostrazione generale. Va verificata su più righe `TABLE`, mantenendo gli stessi parametri di materiale e utensile.

## Impatto sul modello di Ri

Il contributo del raggio d’ingresso matrice era stato modellato come nullo fino a 90° e crescente per angoli interni ottusi:

\[
Re = V/9
\]

\[
G(\alpha)=
\begin{cases}
0 & \alpha \le 90^\circ \\
((\alpha-90^\circ)/90^\circ)^p & 90^\circ < \alpha < 180^\circ
\end{cases}
\]

\[
V_{eff}=V+2 Re G(\alpha)
\]

Il limite di raggio è:

\[
Rp \le Ri \le V_{eff}/2
\]

e il raggio previsto:

\[
Ri=Rp+C(V_{eff}/2-Rp), \qquad 0\le C\le1
\]

Le nuove tabelle suggeriscono che il fattore angolare non debba essere rappresentato soltanto da una funzione teorica `G(alpha)`. È possibile che il software usi direttamente una funzione tabellare:

\[
F = F(s,Rp,V,Re,Rm,\alpha)
\]

dove `F` è il `Radius factor` di `Table Entry`.

Prima di scegliere tra una regressione continua e una lookup table interpolata, occorre verificare come `F` viene trasformato in `Ri`. Non è ancora dimostrato che:

\[
Ri = F \cdot V
\]

né che `F` sia direttamente sostituibile al coefficiente logistico `C`. Il fattore potrebbe essere un termine intermedio del calcolo software.

## Utilità per la formula di K

Le tabelle non contengono direttamente K, BA o deduzione. Tuttavia `Table Entry` può essere utile per K in due modi.

### 1. Miglioramento indiretto tramite Ri

Il fattore K dipende dalla posizione della linea neutra e quindi dal raggio interno usato nel calcolo della BA. Se `Table Entry` permette di prevedere meglio Ri in funzione dell’angolo, la stima di K sarà meno influenzata da un errore del raggio.

La sequenza corretta resta:

\[
\text{TABLE}+\text{Table Entry}
\longrightarrow Ri
\longrightarrow K
\longrightarrow BA
\longrightarrow \text{deduzione}
\]

Non bisogna calibrare K direttamente sui valori di `Radius factor` finché non è chiarita la formula software che collega il fattore a Ri.

### 2. Possibile informazione geometrica diretta

Le colonne `Delta X` e `W-Gamma` potrebbero contenere componenti geometriche della deduzione o della posizione della linea neutra. Il nome `Delta X` è compatibile con uno spostamento geometrico, ma non è sufficiente per assegnargli un significato fisico definitivo.

Queste colonne diventano utilizzabili per K solo dopo aver verificato:

- definizione geometrica esatta;
- convenzione dell’angolo;
- relazione con BA, BD o deduzione;
- unità e segno;
- presenza o assenza del raggio interno nel calcolo;
- comportamento a 90° e agli angoli ottusi.

Nel file osservato `W-Gamma` vale sempre zero. Questo campione non consente quindi di stimarne l’effetto.

## Variabili candidate per C o per il fattore F

Per rendere confrontabili utensili di dimensioni diverse, usare variabili adimensionali:

- `u=(alpha-90)/90`: angolo interno normalizzato;
- `x=s/V`: spessore relativo all’apertura;
- `y=Rp/V`: raggio punzone relativo all’apertura;
- `e=Re/V`: raggio d’ingresso relativo;
- `b=(beta-30)/60`: angolo matrice normalizzato;
- `z=Rm/420`: resistenza normalizzata.

Una possibile forma limitata resta logistica:

\[
C=\frac{1}{1+e^{-Q}}
\]

con `Q` funzione da calibrare su `u`, `x`, `y`, `e`, `b`, `z` e interazioni motivate dai dati.

La nuova alternativa è trattare `Table Entry` come una sorgente di osservazioni per `F(alpha)` e usare una regressione o interpolazione vincolata:

\[
F(\alpha\mid s,Rp,V,Re,Rm)
\]

Questa strada è preferibile soltanto se le entry sono confermate come valori deterministici del software e se la loro relazione con Ri viene ricostruita.

## Piano di esportazione completo

Per ogni riga della `TABLE` occorre esportare tutte le righe della relativa `Table Entry` e creare un dataset lungo con almeno queste colonne:

| Campo | Origine |
|---|---|
| Materiale | nome workbook |
| Rm nominale | nome workbook |
| s | TABLE |
| Rp | TABLE |
| V/infeed width | TABLE |
| Re/infeed radius | TABLE |
| Radius factor base | TABLE |
| fattore angle measurement system | TABLE |
| Bend angle | Table Entry |
| Delta X | Table Entry |
| W-Gamma | Table Entry |
| Radius factor angolare | Table Entry |
| Identificativo riga TABLE | da creare durante l’esportazione |

Gli identificativi sono importanti perché esistono righe duplicate nei workbook. Una chiave basata soltanto su s, Rp, V e Re potrebbe non essere sufficiente.

Per la prima fase non è necessario esportare tutte le righe dei materiali. È più utile iniziare con un campione controllato:

1. tutte le righe dell’acciaio 420;
2. almeno le righe condivise con acciaio inox, DC01 e S235JR;
3. alcune righe Weldox;
4. più righe con lo stesso s, Rp e V ma diverso Re;
5. righe con angoli Table Entry comuni tra configurazioni.

## Verifiche necessarie prima della calibrazione

1. Verificare che il valore a 90° della `Table Entry` coincida con il fattore `TABLE` per più configurazioni.

2. Verificare se `Bend angle` usa la stessa convenzione dell’angolo `alpha` dei campioni Bysoft.

3. Verificare se `Infeed width of die` equivale davvero a V.

4. Verificare se `Infeed radius of die` equivale davvero a Re.

5. Ricostruire la formula che trasforma `Radius factor` in Ri.

6. Verificare il significato di `Delta X` e `W-Gamma` tramite una configurazione in cui il programma mostri anche deduzione, BA o BD.

7. Esportare almeno due Table Entry per la stessa geometria con materiali diversi.

8. Separare i campioni prodotti dal software dalle misure Bysoft. Le tabelle possono descrivere la logica interna del software, ma non sono automaticamente misure indipendenti.

9. Controllare i duplicati della TABLE e conservare l’identificativo originale della riga.

10. Non usare ancora le Table Entry per calibrare K direttamente.

## Verifica numerica riproducibile — modello esplorativo

È stata verificata una prima regressione logistica con `p=0,5` e:

\[
Q=a_0+a_1u+a_2u^2+a_3x+a_4b+a_5ux
\]

Coefficienti ottenuti sul dataset completo:

| Coefficiente | Valore |
|---|---:|
| a0 | -1,01993 |
| a1 | 3,52556 |
| a2 | -0,57932 |
| a3 | -1,18255 |
| a4 | -0,80313 |
| a5 | -0,10452 |

Prestazioni sullo stesso dataset usato per il fit:

- MAE Ri: 0,124 mm;
- RMSE Ri: 0,152 mm;
- errore assoluto massimo: 0,317 mm.

Leave-one-out cross-validation:

- MAE circa 0,226 mm;
- RMSE circa 0,381 mm;
- massimo errore assoluto circa 1,395 mm.

Il modello non è pronto per essere pubblicato. Le Table Entry possono fornire una descrizione più ricca dell’andamento angolare, ma non eliminano la necessità di validazione fuori campione.

## Campioni Bysoft inclusi

| s | V | Rp | alpha | beta | Rm | Ri |
|---:|---:|---:|---:|---:|---:|---:|
| 1 | 8 | 1 | 80 | 30 | 420 | 1,519 |
| 1,5 | 8 | 1 | 90 | 30 | 420 | 1,434 |
| 1,5 | 8 | 1 | 90 | 85 | 420 | 1,288 |
| 2 | 12 | 1 | 135 | 86 | 420 | 3,524 |
| 3 | 16 | 1 | 90 | 86 | 420 | 1,870 |
| 3 | 16 | 1 | 175,2 | 86 | 420 | 6,733 |
| 1 | 8 | 1 | 90 | 30 | 420 | 1,622 |
| 1 | 8 | 1 | 90 | 85 | 420 | 1,481 |
| 1 | 8 | 1 | 100 | 30 | 420 | 1,952 |
| 1 | 8 | 1 | 120 | 30 | 420 | 2,728 |
| 1 | 8 | 1 | 135 | 30 | 420 | 3,329 |
| 1 | 8 | 1 | 150 | 30 | 420 | 3,967 |
| 1 | 8 | 1 | 45 | 30 | 420 | 1,192 |
| 1,5 | 8 | 1 | 45 | 30 | 420 | 1,053 |
| 1,5 | 8 | 1 | 30 | 30 | 420 | 1,000 |
| 1,5 | 8 | 1 | 60 | 30 | 420 | 1,171 |
| 1,5 | 8 | 1 | 120 | 30 | 420 | 2,412 |
| 1,5 | 8 | 1 | 150 | 30 | 420 | 3,507 |
| 1,5 | 8 | 1 | 175 | 30 | 420 | 4,506 |

Il campione di orlo schiacciato è conservato nella fonte originale ma non usato nella regressione ordinaria.

## Prossimi passi

- Esportare le `Table Entry` per tutte le righe dell’acciaio 420, mantenendo il legame con la riga `TABLE`.
- Verificare prima la coincidenza a 90° tra i due livelli.
- Ricostruire la trasformazione del `Radius factor` in Ri.
- Verificare `Delta X` e `W-Gamma` contro deduzione, BA e BD.
- Solo dopo questa verifica estendere l’analisi alla formula di K.
- Preferire modelli con pochi parametri e validazione leave-one-out o nuovi campioni indipendenti.
- Non modificare `js/engine.js` né il calcolo della deduzione finché la formula Ri e la relazione con K non sono validate.

## File sorgente e implementazione

- Dati grezzi Bysoft: `Bysoft Cam 2.txt`.
- Tabelle principali: file `*Nm2.xlsx` esportati dal programma.
- Table Entry: esportazioni dipendenti dalla riga selezionata della TABLE.
- Motore attuale: `js/engine.js`.
- Questa documentazione registra la ricerca; non introduce modifiche al motore o alla pagina pubblica.
