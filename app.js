const xhttp = new XMLHttpRequest();

const maxCrossWindComponent = 20;
const maxTailWindComponent = 5;
const gustLimit = 10;

const rwys = new Map([
    ["15", { course: 145, crossing: ["22L", "04R"] }],
    ["22L", { course: 220, crossing: ["33", "15"] }],
    ["04L", { course: 040 }],
    ["04R", { course: 040, crossing: ["33", "15"] }],
    ["22R", { course: 220 }],
    ["33", { course: 325, crossing: ["22L", "04R"] }],
]);

const arrPrio = [
    "15",
    "22L",
    "04L", ,
    "04R",
    "22R",
    "33",
];

const depPrio = [
    "22R",
    "22L",
    "04R",
    "33",
    "04L",
    "15",
];

const isRwyAvailable = (dir, rwyId, windDir, windSpeed, otherRwys) => {
    const toRadians = angle => angle * (Math.PI / 180);

    const rwyProps = rwys.get(rwyId);

    if (otherRwys && rwyProps.crossing) {
        const crossing = rwyProps.crossing.find(crossingId => otherRwys.find(otherId => otherId === crossingId));

        if (crossing) {
            console.log(`Runway ${rwyId} crossing with ${crossing}`);
            return false;
        }
    }

    const crossWind = Math.abs(windSpeed * Math.sin(toRadians(windDir) - toRadians(rwyProps.course)));

    if (crossWind >= maxCrossWindComponent) {
        console.log(`Too high crosswind (${crossWind.toFixed(1)} kt) for ${rwyId}`);
        return false;
    }

    const headWind = windSpeed * Math.cos(toRadians(windDir) - toRadians(rwyProps.course));

    if (headWind <= -maxTailWindComponent) {
        console.log(`Too high tailwind (${-headWind.toFixed(1)} kt) for ${rwyId}`);
        return false;
    }

    console.log(`Rwy ${rwyId} ` +
        `(${rwyProps.course} deg) selected for ${dir} ` +
        `(CWC ${crossWind.toFixed(1)} kt / HWC ${headWind.toFixed(1)} kt))`);

    return true;
}

const rwyParser = metar => {
    const windRegex = /[0-9A-Z]*KT/g;
    const windFull = metar.match(windRegex);

    if (windFull) {
        const getGusts = wind => {
            const gustsRegex = /(G{1}\d*KT)/g;
            const gustsFull = wind.match(gustsRegex);

            if (gustsFull) {
                const gustRegex = /\d*/g;
                return parseInt(gustsFull[0].match(gustRegex)[1]);
            }

            return 0;
        };

        const gusts = getGusts(windFull[0]);

        if (gusts) {
            console.log(`Gusts of ${gusts} kt!`);
        }

        const windOnly = windFull[0].split(/G|KT/)[0];
        const winDir = parseInt(windOnly.substring(0, 3));
        const windSpeed = parseInt(windOnly.substring(3, 5));
        const windSpeedWithGusts = windSpeed + (gusts >= gustLimit ? (gusts - windSpeed) / 2 : 0);

        const dep = depPrio.find(rwyId => isRwyAvailable('dep', rwyId, winDir, windSpeedWithGusts));
        const arr = arrPrio.find(rwyId => isRwyAvailable('arr', rwyId, winDir, windSpeedWithGusts, [dep]));

        return [dep ? dep : '?', arr ? arr : '?']
    }

    return null;
}

xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
        const parser = new DOMParser();
        const xml = parser.parseFromString(xhttp.responseText, "text/xml");
        const metars = xml.getElementsByTagName("metno:meteorologicalAerodromeReport")
        const lastMetar = metars[metars.length - 1].getElementsByTagName("metno:metarText")[0].innerHTML.trim();

        document.getElementById("metar").innerHTML = lastMetar;

        const rwys = rwyParser(lastMetar);

        if (rwys) {
            document.getElementById("dep").innerHTML = `RWY ${rwys[0]} (dep) /`;
            document.getElementById("arr").innerHTML = `RWY ${rwys[1]} (arr)`;
        }
    }
};

xhttp.open("GET", "https://api.met.no/weatherapi/tafmetar/1.0/metar.xml?icao=efhk", true);
xhttp.send();
