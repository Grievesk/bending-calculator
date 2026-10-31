# Modello empirico del raggio interno — Grievesk Bend

**Stato:** ricerca/calibrazione in corso. Non implementato nel motore pubblico.  
**Ultimo aggiornamento:** 2026-10-31  
**Dataset:** 19 campioni ordinari Bysoft riportati in `Bysoft Cam 2.txt`. Il campione di orlo schiacciato (Ri = 0,05 mm) è escluso dal modello ordinario perché è una condizione di processo distinta. I valori originali non vengono modificati.

## Obiettivo e ordine di lavoro

Questa fase riguarda esclusivamente la previsione del raggio interno reale (Ri). Non calcola K e non confronta ancora la deduzione. L'ordine concordato è:

1. prevedere (Ri) dai parametri di processo e utensile;
2. ricavare K dai dati geometrici/Bysoft usando il raggio previsto o misurato;
3. calcolare la BA dalla linea neutra (Rn = Ri + K s);
4. confrontare successivamente la deduzione calcolata con la deduzione Bysoft.

Non usare la formula di deduzione precedentemente presente nel sito come riferimento per questa ricerca.

## Dati e convenzioni

- `s`: spessore lamiera, mm.
- `V`: apertura nominale matrice, mm.
- `Rp`: raggio punzone, mm.
- `alpha`: angolo interno della piega, gradi. Il segno, se presente nei dati originali, indica il verso e non rende negativo l'angolo fisico.
- `beta`: angolo nominale della matrice, gradi.
- `Rm`: resistenza a trazione del materiale, N/mm².
- `Ri`: raggio interno misurato/riportato da Bysoft, mm.
- `Re`: raggio ingresso matrice. In assenza del dato del costruttore si usa l'approssimazione concordata (Re = V/9).

Tutti i campioni attualmente disponibili hanno Rm = 420 N/mm² e Rp = 1 mm. Di conseguenza l'effetto indipendente di Rm e Rp non è identificabile in modo affidabile da questo dataset.

## Struttura geometrica concordata

Il contributo del raggio d'ingresso matrice è nullo fino a 90° e cresce per angoli interni ottusi:

[
Re = V/9
]

Prima funzione da testare:

[
G(\alpha)=
\begin{cases}
0 & \alpha \le 90^\circ \\
((\alpha-90^\circ)/90^\circ)^p & 90^\circ < \alpha < 180^\circ
\end{cases}
]

[
V_{eff}=V+2 Re G(\alpha)
]

Il limite di raggio è:

[
Rp \le Ri \le V_{eff}/2
]

e il raggio previsto:

[
Ri=Rp+C(V_{eff}/2-Rp), \qquad 0\le C\le1
]

La scelta (p=1) è la prima ipotesi lineare. Il valore di p non è ancora validato; deve essere confrontato con alternative senza sovradattare il campione.

## Variabili candidate per C

Per rendere confrontabili utensili di dimensioni diverse, usare variabili adimensionali:

- (u=(\alpha-90)/90): angolo interno normalizzato;
- (x=s/V): spessore relativo all'apertura;
- (y=Rp/V): raggio punzone relativo all'apertura;
- (b=(\beta-30)/60): angolo matrice normalizzato;
- (z=Rm/420): resistenza normalizzata.

Una possibile forma limitata è logistica:

[
C=\frac{1}{1+e^{-Q}}
]

con (Q) funzione da calibrare su u, x, y, b, z e interazioni motivate dai dati. La logistica assicura (0<C<1), ma non rende automaticamente il modello corretto.

## Verifica numerica riproducibile — modello esplorativo

È stata verificata una prima regressione logistica con (p=0,5) e:

[
Q=a_0+a_1u+a_2u^2+a_3x+a_4b+a_5ux
]

Coefficienti ottenuti sul dataset completo (con penalizzazione ridge leggera):

| Coefficiente | Valore |
|---|---:|
| a0 | -1,01993 |
| a1 | 3,52556 |
| a2 | -0,57932 |
| a3 | -1,18255 |
| a4 | -0,80313 |
| a5 | -0,10452 |

**Prestazioni sullo stesso dataset usato per il fit:**

- MAE Ri: 0,124 mm
- RMSE Ri: 0,152 mm
- errore assoluto massimo: 0,317 mm

Queste sono prestazioni in-sample, non una misura di generalizzazione.

**Leave-one-out cross-validation:** con lo stesso modello e la stessa penalizzazione, l'errore medio assoluto aumenta a circa 0,226 mm, RMSE circa 0,381 mm e massimo errore assoluto circa 1,395 mm. Quindi il modello non supera la validazione fuori campione e non è pronto per essere pubblicato. Questo segnala che i 19 dati non identificano ancora una funzione stabile con queste variabili/termini; non significa che i campioni Bysoft siano errati.

> Nota di tracciabilità: una precedente comunicazione riportava MAE 0,045 mm e 18/19 campioni entro ±0,1 mm per una regressione più complessa. Quel risultato non è stato possibile riprodurre con un set di coefficienti e una procedura di validazione conservati. Non va quindi considerato un risultato verificato né usato come base di implementazione.

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

Il campione di orlo schiacciato è conservato nella fonte originale ma non usato in questa regressione ordinaria: s=1, V8, Rp1, alpha 0/180°, Ri=0,05, K=0,78, deduzione=0.

## Cosa suggeriscono i campioni, senza sovrainterpretare

1. A V8, s=1,5 e alpha=90°, la matrice 30° dà Ri=1,434 mm mentre la 85° dà 1,288 mm: l'angolo della matrice è associato a una differenza di 0,146 mm.
2. A V8, beta=30° e alpha=90°, s=1 dà Ri=1,622 mm e s=1,5 dà Ri=1,434 mm: lo spessore relativo è importante.
3. Per la stessa V8 e beta=30°, Ri cresce sensibilmente al crescere dell'angolo interno, soprattutto oltre 90°.
4. I dati non consentono ancora di stimare l'effetto di Rm perché Rm è sempre 420 N/mm².
5. Rp è sempre 1 mm: non si può stimare la sensibilità al raggio punzone da questi campioni.
6. Il modello di raggio d'ingresso (Re=V/9) è un'approssimazione proposta, non una misura certificata del profilo reale della matrice.

## Prossimi passi

- Confrontare (G(\alpha)) lineare, con esponente p e altre curve monotone semplici.
- Preferire modelli con pochi parametri e verificare sempre leave-one-out o, meglio, nuovi campioni indipendenti.
- Evitare termini che non siano identificabili dai dati (in particolare Rm e Rp fino a quando non avremo campioni variati).
- Conservare ogni nuovo campione con tutti i parametri utensile/materiale e senza sovrascrivere i dati storici.
- Obiettivo operativo concordato: errore sul raggio circa 0,1 mm, da verificare anche su campioni non usati nel fit.
- Non modificare ancora `js/engine.js` né il calcolo della deduzione finché la formula Ri non è validata.

## File sorgente e implementazione

- Dati grezzi: `Bysoft Cam 2.txt` (file fornito nel progetto/conversazione).
- Motore attuale: `js/engine.js`.
- Questa documentazione registra la ricerca; non introduce modifiche al motore o alla pagina pubblica.
