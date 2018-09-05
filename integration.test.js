"use strict";

// IMPORTS
const request = require("request-promise-native");
const CONFIG = require("../src/config/defaults.json");
const TARA_HOST = (process.env.JEST_ENV === "ci") ? CONFIG.int.TARA_HOST : `127.0.0.1:${CONFIG.base.PORT}`;

// HELPERS
/**
 * POST Message to Tara, optionally storing cookies to keep session.
 *
 * @param {string} message - Input string.
 * @param {Object} [session] - Session object.
 * @returns {*}
 */
async function postMessage(message, session) {
    return await request({
        jar: session,
        json: true,
        method: "POST",
        url: `https://${TARA_HOST}/messages`,
        headers: {"Proxy-Authorization": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXX"},
        body: {text: message}
    })
}

// TESTS
describe("Tara integration with Watson Assistant", () => {
    it("handles health check", async() => {
        let response = await request({
            method: "GET",
            url: `https://${TARA_HOST}/health`
        });
        response = JSON.parse(response);

        expect(response.uptime).toBeDefined();
    });

    it("performs diagnostic process", async() => {
        let response = await request({
            method: "GET",
            url: `https://${TARA_HOST}/diagnostic`
        });

        expect(response).toEqual("Diagnostic complete.");
    });

    it("handles bogus input message", async() => {
        let message = "Aadlsfdklsjadsf";
        // We expect the response to equal one of the elements in this array.
        let responseTextVariations = [[{
            text: "Wil je het anders formuleren? Ik begrijp het niet. Sorry..."
        }], [{
            text: "Ik begrijp niet wat je bedoelt."
        }], [{
            text: "Sorry, ik doe mijn best, maar ik begrijp je niet helemaal."
        }], [{
            text: "Sorry, het ligt niet aan jou hoor. Ik moet nog veel leren. Kun je het anders formuleren?"
        }], [{
            text: "Ik heb het niet begrepen. Zou je het misschien anders willen formuleren? Sorry..."
        }]];

        let response = await postMessage(message);

        expect(responseTextVariations).toContainEqual(response);
    });

    it("handles simple intent-based input message", async() => {
        let message = "hebben jullie winkels";

        let response = await postMessage(message);

        expect(response).toEqual([
            {
                "text": "We hebben overal in Nederland Tele2 Winkels. Bekijk [[onze kaart|https://www.tele2.nl/winkels/]] om te zien waar de dichtstbijzijnde winkel zit."
            },
            {
                "text": "Je bent hier altijd welkom voor vragen of een gezellig praatje."
            }
        ]);
    });

    it("handles simple entity-based input message", async() => {
        let message = "gdpr";

        let response = await postMessage(message);

        expect(response).toEqual([{"text": "Je hebt bepaalde wettelijke rechten als het gaat om de verwerking van je persoonsgegevens. [[Online|https://www.tele2.nl/klantenservice/privacy/]] vind je diverse formulieren om jouw gegevens op te halen en om deze aan te passen."}]);
    });

    it("handles traversing a dialog tree", async() => {
        let session = request.jar();
        let firstMessage = "Test";
        let secondMessage = "Ja";

        let firstResponse = await postMessage(firstMessage, session);
        let secondResponse = await postMessage(secondMessage, session);

        expect(firstResponse).toEqual([{text: "Ben ik voor de test geslaagd?"}]);
        expect(secondResponse).toEqual([{text: "Aight!"}]);
    });

    it("handles 'jumping' from one workspace to another workspace", async() => {
        let session = request.jar();
        let firstMessage = "bankrekeningnummer";
        let secondMessage = "tele2";

        let firstResponse = await postMessage(firstMessage, session);
        let secondResponse = await postMessage(secondMessage, session);

        expect(firstResponse).toEqual([{"text": "Welk rekeningnummer wil je graag weten? Dat van Tele2 of jouw rekeningnummer dat bij ons bekend is?"}]);
        expect(secondResponse).toEqual([
            {
                "text": "Het rekeningnummer voor Tele2 Mobiel is NL50 COBA 0637 0537 37."
            },
            {
                "text": "Mocht je je factuur handmatig willen overmaken, noteer dan altijd je factuurnummer in de omschrijving. Zet bij de ontvanger: tav Tele2 te Diemen. Alvast bedankt!"
            }
        ]);
    });

    it("handles digression from a dialog tree", async() => {
        let session = request.jar();
        let firstMessage = "Test";
        let secondMessage = "Hoi";

        let firstResponse = await postMessage(firstMessage, session);
        let secondResponse = await postMessage(secondMessage, session);

        expect(firstResponse).toEqual([{text: "Ben ik voor de test geslaagd?"}]);
        expect(secondResponse).toEqual([{text: "Hoi! Wat kan ik voor je doen?"}]);
    });

    // it("handles enrichment with customerProducts data", async() => {
    //     let message = "Wat is mijn puk?";
    //
    //     let response = await postMessage(message);
    //
    //     expect(response).toEqual([{"text": "Je pukcode is 11111111"}]);
    // });
    //
    // it("handles enrichment with customerDetails data", async() => {
    //     let message = "Wat is mijn geboortedatum?";
    //
    //     let response = await postMessage(message);
    //
    //     expect(response).toEqual([{"text": "De geboortedatum die bij ons bekend is, is 1 oktober 1970"}]);
    // });
    //
    // it("handles pingpong with networkSettings data", async() => {
    //     let message = "Kan ik naar 0900 nummers bellen?";
    //
    //     let response = await postMessage(message);
    //
    //     expect(response).toEqual([{"text": "Je kunt nu naar 0900-nummers bellen. We kunnen dit voor je blocken. Wil je dat?"}]);
    // });

    describe("workspaces", async() => {

        it("can return responses from all different workspaces", async(done) => {
            let conversations = {
                abroad: {
                    input: "Kan ik in het buitenland bellen?",
                    responseText: "Binnen de EU kan je bellen en sms'en vanuit je huidige bundel zonder extra kosten. Lekker toch?! Als je bundel op is, gelden er [[buiten-de-bundel tarieven|https://www.tele2.nl/mobiel/tarieven/buitenland/]]."
                },
                account: {
                    input: "Ik wil mijn pincode veranderen",
                    responseText: "Je kunt je pincode heel easy aanpassen. Weet je je huidige code nog?"
                },
                chitchat: {
                    input: "Hoe gaat het?",
                    responseText: "Leuk dat je het vraagt! Met mij gaat het goed."
                },
                email: {
                    input: "Hoe stel ik mijn email in",
                    responseText: "Dat kun je heel easy zelf fixen! Check op [[deze pagina|https://www.tele2.nl/klantenservice/mobiel/e-mail-instellen-op-telefoon-of-tablet/]] wat de juiste instellingen zijn. Succes!"
                },
                general: {
                    input: "Bankrekening",
                    responseText: "Welk rekeningnummer wil je graag weten? Dat van Tele2 of jouw rekeningnummer dat bij ons bekend is?"
                },
                internet: {
                    input: "Hoe snel is 4g?",
                    responseText: "In testomgevingen hebben we snelheden van 225 Mb/s gehaald! Dat is binnen 1 seconde een nummertje van Spotify streamen of een foto uploaden naar Facebook."
                },
                invoice: {
                    input: "waar kan ik mijn factuur downloaden?",
                    responseText: "Uiteraard kan je je factuur downloaden. Als je naar [[je factuur|Invoices]] gaat, klik je op de factuur die je wilt downloaden/printen etc. Als de factuur geopend is, zie je rechtsonderin een ronde button met een pijltje erin. Als je hierop klikt, heb je de optie om de factuur te printen, te mailen, op te slaan etc."
                },
                mytele2: {
                    input: "Feedback over de app",
                    responseText: "Jouw feedback is altijd welkom! Via het Menu kan je naar [[Feedback|Feedback]] gaan. Laat hier jouw suggesties/ideeën/verbeteringen achter. Zo proberen we de app nog beter te maken."
                },
                order: {
                    input: "Wat is de bedenkperiode?",
                    responseText: "Dat verschilt waar je je bestelling geplaatst hebt. Heb je je bestelling geplaatst via de Tele2 website, telefonisch, in een Tele2 winkel of bij een van onze partners?"
                },
                payment: {
                    input: "Hoe kan ik mijn factuur betalen?",
                    responseText: "Je factuur wordt rond de 25e automatisch afgeschreven."
                },
                personal: {
                    input: "Ik ben afgesloten",
                    responseText: "Afgesloten zijn wil je natuurlijk niet. Staan al je facturen op betaald? Check je [[factuuroverzicht|Invoices]]."
                },
                phone: {
                    input: "Wat voor telefoons heeft Tele2?",
                    responseText: "Check op [[onze website|https://www.tele2.nl/mobiel/smartphones/]] welke genadeloos goedkope telefoons we voor jou in de aanbieding hebben."
                },
                price: {
                    input: "Wat zijn de tarieven?",
                    responseText: "Check alle tarieven op [[de tarievenpagina|https://www.tele2.nl/mobiel/tarieven/]]. Via de tabjes bovenin kies je welke tarieven je precies wilt zien."
                },
                service: {
                    input: "Wat is het telefoonnummer van de klantenservice?",
                    responseText: "Onze telefonische klantenservice is 6 dagen per week bereikbaar. Check op [[deze pagina|PhoneContact]] het nummer en de openingstijden."
                },
                sim: {
                    input: "Ik wil een tweede simkaart",
                    responseText: "Je kan voor dit abonnement geen duo simkaart bestellen."
                },
                subscription: {
                    input: "Mag ik mijn abonnement tussentijds opzeggen",
                    responseText: "Echt heel jammer!"
                },
                usage: {
                    input: "Wat is mijn verbruik",
                    responseText: "[[Check hier|UsageOverview]] wat je verbruik op dit moment is. Goed om te weten!"
                },
            };
            let workspaces = Object.keys(conversations);

            let responses = await Promise.all(workspaces.map((workspace) => postMessage(conversations[workspace].input)));

            responses.forEach((response, index) => {
                // For each response, test the first object of the expected result array.
                let expectedResponse = {
                    text: conversations[workspaces[index]].responseText
                };
                expect(response[0]).toEqual(expectedResponse)
            });
            done();

        })

    })

});
