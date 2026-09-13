# Financial disclaimer and privacy statement

**Task:** PD-009  
**Document version:** `1.0.0-draft`  
**Applies to:** ImmoPilot DE Version 1  
**Jurisdictional focus:** Germany and the European Union  
**Verified:** 13 September 2026

This document contains the public-facing financial disclaimer and privacy statement for ImmoPilot DE, plus the shorter German and English text required in the application interface. It also defines privacy requirements that the implementation must preserve.

> **Release blocker:** Replace `{{OPERATOR_LEGAL_NAME}}`, `{{CONTACT_EMAIL}}` and `{{POSTAL_ADDRESS}}` with the site operator's verified details before publication. Obtain a German legal review before treating this draft as a final Datenschutzerklärung or legal notice. A separate Impressum may be required under § 5 DDG depending on how the site is operated.

---

## English

### 1. Operator and contact

The operator responsible for ImmoPilot DE is:

```text
{{OPERATOR_LEGAL_NAME}}
{{POSTAL_ADDRESS}}
Email: {{CONTACT_EMAIL}}
```

This information must match the final Impressum and deployment configuration.

### 2. Financial disclaimer

ImmoPilot DE is an educational planning tool. It produces estimates from user-entered information, published assumptions and the calculation rules identified in the displayed assumption-set and calculation-specification versions.

The application does not provide financial, mortgage, investment, tax, accounting or legal advice. It does not assess personal suitability, creditworthiness, affordability or risk tolerance. Results are not a recommendation to buy, sell, rent, finance or refinance a property.

No result is a mortgage offer, financing approval, binding quotation, valuation, tax assessment, contract or guarantee. Only a lender can decide whether to offer financing and on what terms. Actual loan costs may include an effective annual rate, commitment interest, valuation costs, account charges, insurance, collateral requirements and other conditions not represented by the calculator.

Transfer-tax rates may change. Notary and land-register percentages are editable planning proxies for transaction-specific statutory fee calculations, not fixed tariffs. Broker commission depends on the signed contract, the property and the legally applicable buyer–seller allocation. Renovation, moving and setup costs are user-specific budgets. Source-backed defaults have a verification date but are not live data.

Rent, property-value growth, operating costs, alternative investment returns, refinancing rates, sale proceeds and tax outcomes are uncertain. Past market behaviour and illustrative growth assumptions do not predict future results. The application does not model every legal, technical or financial circumstance.

Users must check material figures with the relevant lender, notary, land registry, broker, tax adviser, lawyer, building professional or other qualified adviser before making a commitment. Users remain responsible for their inputs, assumptions and decisions.

Reasonable care is taken to document formulas and sources, but the operator does not promise that the application will be uninterrupted, complete, current or error-free. Nothing in this disclaimer excludes liability where exclusion is prohibited by applicable law.

### 3. Privacy summary

ImmoPilot DE is designed as a static, client-side application without user accounts or an application backend. Property and financing inputs are calculated in the user's browser. The application operator does not receive the scenario contents unless the user separately sends them to the operator.

The application itself must not include first-party analytics, advertising, tracking pixels, remote error reporting or third-party scripts in Version 1. It must not set cookies. Any later introduction of such functionality requires a new privacy assessment and an updated notice before release.

The site is hosted by GitHub Pages. When a Pages site is visited, GitHub states that it logs and stores the visitor's IP address for security purposes. GitHub's wider Services privacy statement also describes automatically collected service and website usage information. This hosting-layer processing is separate from the local calculator data.

### 4. Information entered into the calculator

The calculator accepts property and financial planning values, such as purchase price, Bundesland, available equity, interest rate, repayment rate, rent and owner costs.

Users do not need to provide a name, home address, email address, telephone number, account number, tax identification number, loan application, payslip or other identifying document. Scenario names should not identify a person or exact private address.

The application must not request special-category data, identification documents, bank credentials or authentication secrets. Do not enter personal or confidential information into free-text fields, scenario names or exported files.

### 5. In-memory processing

Unsaved values exist in the current browser tab and are processed only to calculate and display results. Closing or reloading the tab may remove them, subject to normal browser behaviour such as form restoration, history, caching or crash recovery.

No application request may transmit scenario values to GitHub, the operator or a third party. Static assets and versioned assumptions may be loaded from the same site origin.

### 6. Local storage

When the user explicitly chooses **Save scenario**, the application may store the versioned scenario JSON in that browser's `localStorage`. The purpose is solely to restore a scenario on the same device and browser profile.

- Local storage remains on the device unless browser software, extensions, device synchronization or enterprise controls handle it differently.
- It remains until the user deletes the scenario, selects **Clear all local data**, clears site data in the browser or the browser removes it.
- Other people who can use the same device and browser profile may be able to open saved scenarios.
- Private-browsing modes may delete storage when the private session ends.

The application must not save a scenario automatically before the user requests it. Storage must be limited to the selected feature and must not be reused for analytics, profiling or advertising. The release implementation must reassess § 25 TDDDG if this behaviour changes.

The application must provide visible **Delete scenario** and **Clear all local data** controls. Because local scenarios are not sent to the operator, the operator cannot inspect, restore or remotely delete them.

### 7. Shareable URLs

If URL sharing is implemented, the encoded scenario must be placed after the URL fragment marker (`#`), never in the path or query string. URI fragments are handled by the browser and are not included in the HTTP request to the host.

Fragment-based sharing reduces transmission to the hosting server, but it does not make the scenario secret:

- anyone receiving the full link can read the included scenario;
- the link may remain in browser history, bookmarks, clipboard history, screenshots, messages or browser synchronization;
- browser extensions and scripts running on the page can read the fragment; and
- forwarding the link forwards the data.

Before creating a share link, the application must show a clear warning and require a deliberate action. Shared payloads must exclude scenario names or optional fields that appear identifying unless the user expressly includes them. A **Remove shared data from URL** control must clear the fragment after import.

### 8. JSON export and import

Export creates a JSON file on the user's device. The operator does not receive it. The file remains under the user's control and may be accessible to device users, backups, synchronization services or anyone with whom it is shared.

Import reads the selected JSON file locally. The application must validate it against the supported schema before calculation and must not upload it. Imported filenames must not be sent to the operator.

The export screen must remind users that a scenario can reveal purchase plans and financial circumstances even without a name. Users should review the content before sharing it and store it appropriately.

### 9. GitHub Pages hosting data

GitHub Pages delivers the site's HTML, CSS, JavaScript, JSON and other static assets. According to GitHub's Pages documentation, visitor IP addresses are logged and stored by GitHub for security purposes whether or not the visitor is signed into GitHub.

GitHub's current privacy statement describes collection that may include IP address, device and session information, request time, referring site, pages viewed and links clicked. GitHub determines the details, security measures, retention and international transfers for its own infrastructure processing under its published policies.

The provisional legal basis for the operator's use of necessary hosting connection data is Article 6(1)(f) GDPR: the legitimate interest in securely and reliably providing the public website and detecting abuse. The privacy impact is reduced by the static architecture, the absence of application analytics and the fact that calculator scenarios are not sent with hosting requests.

GitHub states that personal data may be processed in the United States and other countries and describes the safeguards it generally uses for international transfers. Users should consult the current [GitHub General Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).

The application operator must not state a specific GitHub log-retention period unless GitHub publishes one that applies to Pages. The operator does not receive visitor IP addresses through ImmoPilot DE's application code. Repository traffic statistics, if consulted, must remain aggregate and must not be combined with scenario information.

### 10. Cookies and similar technologies

ImmoPilot DE Version 1 must not set application cookies or use advertising or analytics trackers. The deliberate local-save feature uses browser storage only to provide the storage requested by the user.

GitHub may apply cookies or similar technologies to GitHub Services under its own policies. GitHub's general cookie disclosures do not establish that every GitHub Pages visit sets every listed cookie. The operator must retest the deployed Pages site before release and after hosting changes.

If analytics, embedded videos, maps, fonts, social widgets, external APIs, error-reporting services or other third-party resources are later added, deployment must pause until the data flows, legal basis, consent requirements, transfer safeguards and privacy text are reviewed.

### 11. External links

Links to statutes, authorities, consumer organisations and other websites lead away from ImmoPilot DE. The receiving website learns the information normally sent during navigation and applies its own privacy policy. No scenario data may be placed in an external link.

External links should use a restrictive referrer policy where practical. The application must not load third-party content merely to display a link.

### 12. Retention and deletion

| Data | Location | Retention | Deletion/control |
|---|---|---|---|
| Unsaved scenario | Browser memory | Current session, subject to browser behaviour | Close/reset the application |
| Saved scenario | Browser `localStorage` | Until removed by the user or browser | Delete scenario, clear all local data, or clear browser site data |
| Shared scenario | URL fragment and places where the link is copied | Controlled by each copy and recipient | Clear the fragment and delete shared copies/messages |
| Exported scenario | User-selected device location and any backups/shares | Controlled by the user and receiving services | Delete the file and copies |
| Hosting connection data | GitHub infrastructure | Determined by GitHub's applicable policies | Use GitHub's privacy request channels where applicable |

### 13. Data-subject rights

Where the operator processes personal data, affected people may have rights under the GDPR, including access, rectification, erasure, restriction, portability and objection, subject to their legal conditions. Requests concerning operator-controlled processing may be sent to `{{CONTACT_EMAIL}}`. A person may also complain to a competent data-protection supervisory authority.

The operator cannot search or delete locally stored scenario data because it is not received. Users can remove it with the controls described above. Requests concerning data that GitHub processes under its own privacy statement should be directed through GitHub's published privacy channels.

### 14. Security and limitations

Client-side processing reduces disclosure but does not make the user's device secure. The application cannot protect data from malware, browser extensions, shared accounts, device compromise, unsafe backups or a recipient of a shared link or file.

The application must use HTTPS, avoid third-party runtime dependencies where practical, apply a restrictive Content Security Policy when GitHub Pages supports the chosen delivery method, and never log scenario values to the browser console in production.

### 15. Changes

This notice must display its version and verification date. It must be reviewed before any release that changes storage, sharing, hosting, external resources, analytics, accounts, backend services or data fields. Material privacy changes require an updated notice before the changed processing begins.

---

## Deutsch

### 1. Verantwortlicher und Kontakt

Verantwortlich für ImmoPilot DE ist:

```text
{{OPERATOR_LEGAL_NAME}}
{{POSTAL_ADDRESS}}
E-Mail: {{CONTACT_EMAIL}}
```

Diese Angaben müssen mit dem endgültigen Impressum und der tatsächlichen Bereitstellung übereinstimmen.

### 2. Finanzhinweis

ImmoPilot DE ist ein Lern- und Planungstool. Die Anwendung erstellt Schätzungen anhand der eingegebenen Daten, der veröffentlichten Annahmen und der angezeigten Versionen des Annahmensatzes und der Berechnungsspezifikation.

Die Anwendung bietet keine Finanzierungs-, Anlage-, Steuer-, Buchhaltungs- oder Rechtsberatung. Sie beurteilt weder die persönliche Eignung noch Kreditwürdigkeit, Tragbarkeit oder Risikobereitschaft. Ergebnisse sind keine Empfehlung, eine Immobilie zu kaufen, zu verkaufen, zu mieten, zu finanzieren oder umzuschulden.

Kein Ergebnis ist ein Darlehensangebot, eine Finanzierungszusage, ein verbindlicher Kostenvoranschlag, ein Wertgutachten, ein Steuerbescheid, ein Vertrag oder eine Garantie. Nur ein Kreditgeber kann über eine Finanzierung und deren Bedingungen entscheiden. Tatsächliche Finanzierungskosten können Effektivzins, Bereitstellungszinsen, Bewertungskosten, Kontogebühren, Versicherungen, Sicherheiten und weitere Bedingungen enthalten, die der Rechner nicht abbildet.

Grunderwerbsteuersätze können sich ändern. Die Prozentsätze für Notar und Grundbuch sind editierbare Planungswerte für transaktionsabhängige gesetzliche Gebührenberechnungen und keine festen Tarife. Die Maklerprovision richtet sich nach dem unterzeichneten Vertrag, der Immobilie und der rechtlich anwendbaren Aufteilung zwischen Käufer und Verkäufer. Renovierungs-, Umzugs- und Einrichtungskosten sind individuelle Budgets. Quellenbasierte Standardwerte besitzen ein Prüfdatum, sind aber keine Live-Daten.

Miete, Wertentwicklung, Bewirtschaftungskosten, alternative Renditen, Anschlusszinsen, Verkaufserlöse und steuerliche Ergebnisse sind unsicher. Historische Marktentwicklungen und beispielhafte Wachstumsannahmen sagen zukünftige Ergebnisse nicht voraus. Die Anwendung bildet nicht jede rechtliche, technische oder finanzielle Besonderheit ab.

Wesentliche Werte sind vor einer Entscheidung mit dem Kreditgeber, Notar, Grundbuchamt, Makler, Steuerberater, Rechtsanwalt, Bausachverständigen oder einer anderen qualifizierten Fachperson zu prüfen. Nutzer bleiben für ihre Eingaben, Annahmen und Entscheidungen verantwortlich.

Formeln und Quellen werden sorgfältig dokumentiert. Der Betreiber garantiert jedoch nicht, dass die Anwendung jederzeit verfügbar, vollständig, aktuell oder fehlerfrei ist. Zwingende gesetzliche Haftung bleibt unberührt.

### 3. Datenschutzübersicht

ImmoPilot DE ist als statische, clientseitige Anwendung ohne Benutzerkonto und ohne Anwendungs-Backend konzipiert. Immobilien- und Finanzierungsdaten werden im Browser des Nutzers berechnet. Der Betreiber erhält die Inhalte eines Szenarios nicht, sofern der Nutzer sie ihm nicht auf einem anderen Weg übermittelt.

Die Anwendung selbst darf in Version 1 keine eigenen Analyse- oder Werbedienste, Tracking-Pixel, externe Fehlerberichte oder Drittanbieter-Skripte einbinden. Sie darf keine Cookies setzen. Jede spätere Einführung solcher Funktionen erfordert vor Veröffentlichung eine neue Datenschutzprüfung und eine aktualisierte Erklärung.

Die Website wird über GitHub Pages bereitgestellt. GitHub erklärt, dass beim Besuch einer Pages-Website die IP-Adresse unabhängig von einer Anmeldung zu Sicherheitszwecken protokolliert und gespeichert wird. Die allgemeine Datenschutzerklärung von GitHub beschreibt außerdem automatisch erhobene Nutzungs- und Website-Daten. Diese Verarbeitung auf Hosting-Ebene ist von den lokal verarbeiteten Rechnerdaten getrennt.

### 4. Eingaben in den Rechner

Der Rechner verarbeitet Immobilien- und Finanzplanungswerte, zum Beispiel Kaufpreis, Bundesland, verfügbares Eigenkapital, Zinssatz, Tilgungssatz, Miete und Eigentümerkosten.

Name, Privatanschrift, E-Mail-Adresse, Telefonnummer, Kontonummer, Steuer-ID, Darlehensantrag, Gehaltsabrechnung oder andere identifizierende Dokumente sind nicht erforderlich. Szenarionamen sollten keine Person oder genaue Privatanschrift erkennen lassen.

Die Anwendung darf keine besonderen Kategorien personenbezogener Daten, Ausweisdokumente, Bankzugangsdaten oder Authentifizierungsgeheimnisse anfordern. Personenbezogene oder vertrauliche Informationen gehören nicht in Freitextfelder, Szenarionamen oder Exportdateien.

### 5. Verarbeitung im Arbeitsspeicher

Nicht gespeicherte Werte befinden sich im aktuellen Browser-Tab und werden nur zur Berechnung und Anzeige verarbeitet. Schließen oder Neuladen kann sie entfernen. Normales Browserverhalten wie Formularwiederherstellung, Verlauf, Cache oder Sitzungswiederherstellung bleibt vorbehalten.

Keine Anfrage der Anwendung darf Szenariowerte an GitHub, den Betreiber oder Dritte übermitteln. Statische Dateien und versionierte Annahmen dürfen vom selben Website-Ursprung geladen werden.

### 6. Lokale Speicherung

Wenn der Nutzer ausdrücklich **Szenario speichern** auswählt, darf die Anwendung das versionierte Szenario-JSON im `localStorage` dieses Browsers speichern. Einziger Zweck ist die Wiederherstellung im selben Gerät und Browserprofil.

- Die Daten bleiben grundsätzlich auf dem Gerät. Browser, Erweiterungen, Gerätesynchronisierung oder Unternehmensrichtlinien können sie jedoch anders behandeln.
- Sie bleiben gespeichert, bis der Nutzer das Szenario löscht, **Alle lokalen Daten löschen** auswählt, die Website-Daten im Browser löscht oder der Browser sie entfernt.
- Andere Personen mit Zugriff auf dasselbe Gerät und Browserprofil können gespeicherte Szenarien möglicherweise öffnen.
- Im privaten Modus kann der Browser die Daten am Ende der privaten Sitzung löschen.

Die Anwendung darf ein Szenario nicht automatisch speichern, bevor der Nutzer dies verlangt. Die Speicherung ist auf diese Funktion zu beschränken und darf nicht für Analyse, Profilbildung oder Werbung verwendet werden. Bei einer Änderung dieses Verhaltens ist § 25 TDDDG neu zu prüfen.

Die Anwendung muss sichtbare Funktionen **Szenario löschen** und **Alle lokalen Daten löschen** anbieten. Der Betreiber kann lokal gespeicherte Szenarien weder einsehen noch wiederherstellen oder aus der Ferne löschen, weil er sie nicht erhält.

### 7. Teilbare URLs

Wird das Teilen per URL umgesetzt, muss das codierte Szenario nach dem Fragmentzeichen (`#`) stehen und darf nicht im Pfad oder in der Abfragezeichenfolge enthalten sein. URL-Fragmente werden vom Browser verarbeitet und nicht als Teil der HTTP-Anfrage an den Host gesendet.

Ein Fragment verhindert jedoch nicht jede Offenlegung:

- Jeder Empfänger des vollständigen Links kann das enthaltene Szenario lesen.
- Der Link kann im Browserverlauf, in Lesezeichen, in der Zwischenablage, in Screenshots, Nachrichten oder der Browsersynchronisierung verbleiben.
- Browser-Erweiterungen und Skripte der Seite können das Fragment lesen.
- Das Weiterleiten des Links leitet auch die Daten weiter.

Vor der Linkerstellung muss die Anwendung deutlich warnen und eine bewusste Handlung verlangen. Geteilte Daten müssen Szenarionamen und optionale möglicherweise identifizierende Felder ausschließen, sofern der Nutzer deren Aufnahme nicht ausdrücklich wählt. **Geteilte Daten aus URL entfernen** muss das Fragment nach dem Import löschen.

### 8. JSON-Export und -Import

Beim Export entsteht eine JSON-Datei auf dem Gerät des Nutzers. Der Betreiber erhält sie nicht. Sie kann für andere Gerätenutzer, Backups, Synchronisierungsdienste oder Empfänger einer Weitergabe zugänglich sein.

Der Import liest die ausgewählte JSON-Datei lokal. Die Anwendung muss sie vor der Berechnung gegen das unterstützte Schema prüfen und darf sie nicht hochladen. Dateinamen dürfen nicht an den Betreiber übertragen werden.

Der Exportdialog muss darauf hinweisen, dass ein Szenario auch ohne Namen Rückschlüsse auf Kaufpläne und finanzielle Verhältnisse zulassen kann. Nutzer sollten den Inhalt vor dem Teilen prüfen und die Datei angemessen schützen.

### 9. Hosting durch GitHub Pages

GitHub Pages liefert HTML, CSS, JavaScript, JSON und andere statische Dateien der Website aus. Laut GitHub-Pages-Dokumentation protokolliert und speichert GitHub die IP-Adresse von Besuchern zu Sicherheitszwecken unabhängig davon, ob sie bei GitHub angemeldet sind.

Die aktuelle Datenschutzerklärung von GitHub beschreibt Daten wie IP-Adresse, Geräte- und Sitzungsinformationen, Anfragezeit, verweisende Website, aufgerufene Seiten und angeklickte Links. Einzelheiten, Sicherheitsmaßnahmen, Speicherdauer und internationale Übermittlungen der Infrastrukturverarbeitung bestimmt GitHub nach seinen veröffentlichten Richtlinien.

Als vorläufige Rechtsgrundlage für die notwendige Bereitstellung über den Hostingdienst ist Art. 6 Abs. 1 lit. f DSGVO vorgesehen: das berechtigte Interesse an einer sicheren und zuverlässigen öffentlichen Website und der Erkennung von Missbrauch. Die statische Architektur, der Verzicht auf Anwendungsanalyse und die fehlende Übermittlung von Szenarien mit Hostinganfragen reduzieren den Eingriff.

GitHub erklärt, dass personenbezogene Daten unter anderem in den USA und anderen Ländern verarbeitet werden können, und beschreibt die üblicherweise verwendeten Garantien für internationale Übermittlungen. Maßgeblich ist die aktuelle [allgemeine Datenschutzerklärung von GitHub](https://docs.github.com/de/site-policy/privacy-policies/github-general-privacy-statement).

Der Betreiber darf keine bestimmte Aufbewahrungsdauer für GitHub-Protokolle nennen, solange GitHub keine speziell für Pages anwendbare Dauer veröffentlicht. Über den Anwendungscode erhält der Betreiber keine IP-Adressen der Besucher. Etwaige Repository-Verkehrsstatistiken dürfen nur aggregiert genutzt und nicht mit Szenariodaten verbunden werden.

### 10. Cookies und ähnliche Technologien

ImmoPilot DE Version 1 darf keine Anwendungscookies, Werbe- oder Analysetracker setzen. Die bewusst ausgelöste lokale Speicherfunktion verwendet Browserspeicher nur für die vom Nutzer gewünschte Speicherung.

GitHub kann nach seinen eigenen Richtlinien Cookies oder ähnliche Technologien für GitHub-Dienste einsetzen. Die allgemeinen Cookie-Angaben von GitHub bedeuten nicht, dass bei jedem Pages-Aufruf jedes dort aufgeführte Cookie gesetzt wird. Die bereitgestellte Pages-Website ist vor Veröffentlichung und nach Hostingänderungen technisch erneut zu prüfen.

Werden später Analysewerkzeuge, eingebettete Videos, Karten, Schriftarten, Social-Media-Elemente, externe APIs, Fehlerberichtsdienste oder andere Drittanbieter-Ressourcen ergänzt, muss die Veröffentlichung bis zur Prüfung der Datenflüsse, Rechtsgrundlage, Einwilligungspflichten, Übermittlungsgarantien und Datenschutzhinweise ausgesetzt werden.

### 11. Externe Links

Links zu Gesetzen, Behörden, Verbraucherorganisationen und anderen Websites führen aus ImmoPilot DE heraus. Die Zielseite erhält die bei einer Navigation üblichen Informationen und wendet ihre eigene Datenschutzerklärung an. Szenariodaten dürfen nicht Bestandteil eines externen Links sein.

Externe Links sollten soweit möglich eine restriktive Referrer-Policy verwenden. Die Anwendung darf keine Inhalte Dritter laden, nur um einen Link anzuzeigen.

### 12. Speicherdauer und Löschung

| Daten | Speicherort | Dauer | Löschung/Kontrolle |
|---|---|---|---|
| Nicht gespeichertes Szenario | Browser-Arbeitsspeicher | Aktuelle Sitzung, vorbehaltlich Browserverhalten | Anwendung schließen oder zurücksetzen |
| Gespeichertes Szenario | Browser-`localStorage` | Bis zur Löschung durch Nutzer oder Browser | Szenario löschen, alle lokalen Daten löschen oder Website-Daten im Browser löschen |
| Geteiltes Szenario | URL-Fragment und Kopien des Links | Durch Kopien und Empfänger bestimmt | Fragment entfernen und geteilte Kopien/Nachrichten löschen |
| Exportiertes Szenario | Vom Nutzer gewählter Speicherort, Backups und Weitergaben | Durch Nutzer und empfangende Dienste bestimmt | Datei und Kopien löschen |
| Hosting-Verbindungsdaten | GitHub-Infrastruktur | Nach anwendbaren GitHub-Richtlinien | Soweit anwendbar Datenschutzkanäle von GitHub nutzen |

### 13. Betroffenenrechte

Soweit der Betreiber personenbezogene Daten verarbeitet, können nach Maßgabe der DSGVO insbesondere Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch bestehen. Anfragen zur Verarbeitung unter Kontrolle des Betreibers können an `{{CONTACT_EMAIL}}` gesendet werden. Betroffene können sich außerdem bei einer zuständigen Datenschutzaufsichtsbehörde beschweren.

Der Betreiber kann lokale Szenariodaten nicht suchen oder löschen, da er sie nicht erhält. Nutzer können sie mit den oben beschriebenen Funktionen entfernen. Anfragen zu Daten, die GitHub nach seiner eigenen Datenschutzerklärung verarbeitet, sind über die von GitHub veröffentlichten Datenschutzkanäle zu stellen.

### 14. Sicherheit und Grenzen

Lokale Verarbeitung reduziert eine Übermittlung, schützt aber nicht das Gerät des Nutzers. Die Anwendung kann Daten nicht vor Schadsoftware, Browser-Erweiterungen, gemeinsam genutzten Konten, kompromittierten Geräten, unsicheren Backups oder Empfängern eines Links oder einer Datei schützen.

Die Anwendung muss HTTPS verwenden, soweit möglich auf Drittanbieter-Abhängigkeiten zur Laufzeit verzichten, eine restriktive Content Security Policy umsetzen, soweit die gewählte Bereitstellung über GitHub Pages dies ermöglicht, und in der Produktionsversion keine Szenariowerte in der Browserkonsole protokollieren.

### 15. Änderungen

Diese Erklärung muss Version und Prüfdatum anzeigen. Vor jeder Veröffentlichung mit Änderungen an Speicherung, Teilen, Hosting, externen Ressourcen, Analyse, Konten, Backend-Diensten oder Datenfeldern ist sie zu überprüfen. Wesentliche Datenschutzänderungen müssen vor Beginn der geänderten Verarbeitung veröffentlicht werden.

---

## Short application text

These strings are normative copy for Version 1. Translations should stay equivalent when edited.

### Footer disclaimer

**English**

> Educational estimates only. Not financial, mortgage, investment, tax or legal advice, and not a financing offer or approval. Check current figures and obtain qualified advice before making a commitment.

**Deutsch**

> Nur unverbindliche Planungswerte. Keine Finanzierungs-, Anlage-, Steuer- oder Rechtsberatung und kein Darlehensangebot oder Finanzierungszusage. Prüfen Sie aktuelle Werte und lassen Sie sich vor einer Entscheidung qualifiziert beraten.

### Results-screen notice

**English**

> Results depend on your inputs and editable, source-dated assumptions. Actual taxes, fees, loan terms, property performance and costs may differ. Version: {{ASSUMPTION_SET_VERSION}} / {{CALCULATION_SPECIFICATION_VERSION}}.

**Deutsch**

> Die Ergebnisse beruhen auf Ihren Eingaben und editierbaren, quellen- und datumsbezogenen Annahmen. Tatsächliche Steuern, Gebühren, Darlehenskonditionen, Wertentwicklungen und Kosten können abweichen. Version: {{ASSUMPTION_SET_VERSION}} / {{CALCULATION_SPECIFICATION_VERSION}}.

### Local-processing notice

**English**

> Your calculator inputs stay in this browser. They are stored only when you choose Save, included in a link only when you choose Share, and written to a file only when you choose Export. GitHub Pages still processes technical connection data such as your IP address to deliver and secure the site.

**Deutsch**

> Ihre Rechnerdaten bleiben in diesem Browser. Sie werden nur nach Auswahl von Speichern lokal abgelegt, nur nach Auswahl von Teilen in einen Link aufgenommen und nur nach Auswahl von Exportieren in eine Datei geschrieben. GitHub Pages verarbeitet zur Bereitstellung und Absicherung der Website weiterhin technische Verbindungsdaten wie die IP-Adresse.

### Share warning

**English**

> Anyone with this link can view the included scenario. Do not include names, exact private addresses or other confidential information.

**Deutsch**

> Jeder mit diesem Link kann das enthaltene Szenario ansehen. Fügen Sie keine Namen, genauen Privatanschriften oder andere vertrauliche Informationen ein.

### JSON export warning

**English**

> This file may reveal your property plans and financial circumstances. Review it before sharing and store it securely.

**Deutsch**

> Diese Datei kann Rückschlüsse auf Ihre Immobilienpläne und finanziellen Verhältnisse zulassen. Prüfen Sie sie vor dem Teilen und bewahren Sie sie sicher auf.

### Not-budgeted warning

**English**

> No amount has been budgeted for {{COST_CATEGORY}}. This is not the same as a confirmed cost of €0.

**Deutsch**

> Für {{COST_CATEGORY}} wurde noch kein Betrag eingeplant. Das ist nicht dasselbe wie bestätigte Kosten von 0 €.

## Implementation acceptance criteria

- The full notice is reachable from every application page in German and English.
- The footer shows the short disclaimer without hiding access to the full notice.
- Results show the assumption-set and calculation-specification versions.
- No calculation result is labelled as approval, advice, guarantee or offer.
- Scenario values are never placed in URL paths, query strings, network requests, telemetry or console logs.
- Sharing uses a URL fragment and requires an explicit warning and action.
- Saving starts only after an explicit user action and has deletion controls.
- JSON import/export stays local and schema validation runs before imported data is calculated.
- Version 1 contains no application analytics, advertising, tracking pixels, third-party scripts or remote error reporting.
- A deployed-site network inspection confirms the actual request, cookie and third-party-resource behaviour.
- Operator identity, postal address and contact email are completed before release.
- The final notice and any required Impressum receive legal review before public launch.

## Sources and verification record

| ID | Source | Used for | Verified | Limitation |
|---|---|---|---|---|
| L1 | [Regulation (EU) 2016/679, including Articles 5, 6, 13 and 25](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng) | Transparency, legal basis, data minimisation, privacy by design and information duties | 13 Sep 2026 | Application depends on facts and controller role; this document is not a legal opinion |
| L2 | [§ 25 TDDDG](https://www.gesetze-im-internet.de/ttdsg/BJNR198210021.html#BJNR198210021BJNE002601116) | Storage or access on a user's device and the requested-service exception | 13 Sep 2026 | Whether a storage operation is strictly necessary depends on the final implementation |
| L3 | [§ 5 DDG](https://www.gesetze-im-internet.de/ddg/__5.html) | Potential separate provider-information/Impressum duty | 13 Sep 2026 | Applicability depends on the operator and manner of offering the site |
| H1 | [GitHub Docs: What is GitHub Pages?](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection) | GitHub Pages IP-address logging for security | 13 Sep 2026 | GitHub controls this documentation and may change its practices |
| H2 | [GitHub General Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement) | GitHub data categories, purposes, legal bases, transfers, rights and retention approach | 13 Sep 2026 | General Services policy; not every described activity necessarily occurs on every Pages request |
| H3 | [GitHub Cookies](https://docs.github.com/en/site-policy/privacy-policies/github-cookies) | Hosting-provider cookie context | 13 Sep 2026 | Requires deployed-site testing; the general table is not proof that a specific Pages site sets a cookie |
| T1 | [MDN: URI fragment](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment) | Fragment is handled client-side and not included in the server request | 13 Sep 2026 | Extensions, page scripts, history and recipients can still access a fragment |

## Review triggers

Re-verify this document immediately if any of the following changes:

- GitHub Pages hosting or GitHub's privacy documentation;
- URL-sharing encoding or use of query parameters;
- automatic saving or the browser-storage mechanism;
- analytics, error reporting, fonts, maps, embeds or third-party scripts;
- accounts, contact forms, cloud sync, APIs or any backend;
- categories of calculator data;
- operator identity, business status or monetisation; or
- applicable German or EU law.
