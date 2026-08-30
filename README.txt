Drive Factuur v4.5

Nieuw:
- Echte creditfactuurfunctie toegevoegd bij opgeslagen facturen.
- Klik bij een gewone factuur op “Credit maken”.
- Creditfactuur wordt gekoppeld via de referentie naar de oorspronkelijke factuur.
- PDF/preview toont duidelijk CREDITFACTUUR en Creditfactuurnummer.
- Voor de Denise/DJR-verrekening worden de drie regels direct klaargezet:
  * 1 uur voorrijden € 61,00 incl. btw
  * examenvergoeding € 93,00 incl. btw
  * verrekening brandstof -€ 25,01 incl. btw
  * totaal te crediteren € 128,99 incl. btw
- Vul zelf een nieuw uniek creditfactuurnummer in voordat je opslaat.

Bestaande facturen en instellingen blijven in localStorage bewaard.

V4.6:
- Knop 'Losse creditfactuur' toegevoegd onder Facturen.
- Hiermee maak je direct een creditfactuur voor oude/externe facturen (bijv. Plengo), zonder eerst een gewone factuur in Drive Factuur aan te maken.
- Referentie kan handmatig naar één of meerdere oorspronkelijke factuurnummers verwijzen.


Drive Factuur v5 - DrivePlan / DrivePortal koppeling
- Leerling kiezen uit portal_students (DrivePlan/Supabase).
- Naam en e-mailadres worden automatisch ingevuld.
- Na succesvol Gmail-versturen wordt de factuur ook geschreven naar portal_payments.
- De leerling ziet hem daarna onder Betalingen in DrivePortal.
- Als DrivePortal bijwerken mislukt, blijft Gmail-verzending succesvol en krijg je een aparte melding.
- Factuurnummering is in deze versie nog handmatig; automatische jaarreeksen volgen apart.
