# Dolce&Salato · Panificio Pasticceria (Mascalucia)

Sito statico (HTML/CSS/JS, nessuna build), mobile-first. Pubblicabile così com'è su GitHub Pages, Netlify o qualunque hosting.

- `index.html` – pagina unica (menu, eventi, volantino, ordina su WhatsApp, dove siamo, FAQ, dati strutturati schema.org)
- `assets/docs/volantino-dolce-e-salato.pdf` – volantino scaricabile
- `assets/js/main.js` – in cima: numero WhatsApp e `HOURS` (orari, per il badge "Aperto ora")
- `_riferimento-idda/` – file preesistenti del progetto "Idda" (altra attività), non usati dal sito

## Da completare prima del lancio
1. Dominio definitivo: sostituire `https://agapasqualino07-eng.github.io/PanificioDolceSalato` in `index.html`, `robots.txt`, `sitemap.xml`.
2. Orari: già inseriti (lun–sab 6:30–21:30, dom 6:30–13:30); aggiornarli in `index.html` e `HOURS` in `main.js` se cambiano.
3. Verificare che 351 5571151 sia attivo su WhatsApp; inserire la P.IVA nel footer.
4. Sostituire le foto con scatti reali del locale.
5. Aprire/ottimizzare la scheda Google Business Profile con gli stessi dati (nome, indirizzo, telefono).

## Vercel
Sito statico: nessuna build. Impostazioni progetto: Framework "Other", Build Command vuoto, Output Directory `.` (root). `vercel.json` gestisce URL puliti, cache e header; `.vercelignore` esclude file di lavoro.
- I push sul branch `claude/inspiring-dirac-khdl50` creano una **Preview Deployment** (URL nella dashboard Vercel o nei check del commit).
- Per la produzione (branch `main`) serve il merge.
- Quando il dominio è deciso: aggiornare l'indirizzo base (canonical, og:url, sitemap, robots, llms.txt) con un cerca-e-sostituisci su `https://agapasqualino07-eng.github.io/PanificioDolceSalato`.

## Pagine
- `/` home · `/pizza-mascalucia/` · `/catering-rustici-mascalucia/` · `/torte-su-ordinazione-mascalucia/` · `/colazione-mascalucia/` · `/prezzi.md` e `/llms.txt` (per AI) · `docs/google-business-profile.md` (guida scheda Google)

## Audit del 14/10/2026
Eseguito con 7 agenti (SEO locale, copy, UX/accessibilità, coerenza dati, schema/AI-SEO, piano conversione, prestazioni). Corretto anche il listino rusticheria in base ai raggruppamenti del volantino (mini hamburger, rustici di sfoglia, mini burger e cornetti con crudo a € 16/kg; cornetti al salmone e mafaldine a € 18/kg; mini hot dog e pizza secca a € 12/kg): da confermare con il titolare.

## Le nostre specialità (stagionali)
`content/specialita.json`: `periodo` (es. "ottobre 2026"), `mese` (la specialità del mese: foto, nome, descrizione, prezzo facoltativo) e `items` (le altre, con `novita` per il badge). Ogni mese: foto della specialità in `assets/img/specialita/` (WebP), aggiorno il JSON e rigenero le pagine.

## Audit del 15/10/2026 (velocità, SEO, sicurezza, UX)
- Font ospitati sul sito (`assets/fonts`, licenza OFL): niente più Google Fonts.
- Header di sicurezza e cache in `vercel.json` (CSP, HSTS, X-Frame-Options). Se si aggiunge GA4 o altri script esterni va aggiornata la CSP.
- Pagina `/privacy/` da completare con ragione sociale e P.IVA.
- Il volantino PDF contiene ancora prezzi del 2024 (semifreddi € 17, "5 cereali"): va rifatto con i prezzi nuovi.
