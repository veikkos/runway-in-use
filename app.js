const xhttp = new XMLHttpRequest();

const maxCrossWindComponent = 20;
const maxTailWindComponent = 5;

const arrPrio = [
    { id: "15", course: 145 },
    { id: "22L", course: 220 },
    { id: "04L", course: 040 },
    { id: "04R", course: 040 },
    { id: "22R", course: 220 },
    { id: "33", course: 325 },
];

const depPrio = [
    { id: "22R", course: 220 },
    { id: "22L", course: 220 },
    { id: "04R", course: 040 },
    { id: "33", course: 325 },
    { id: "04L", course: 040 },
    { id: "15", course: 145 },
];

const isRwyAvailable = (dir, rwy, windDir, windSpeed) => {
    const toRadians = (angle) => angle * (Math.PI / 180);

    const crossWind = Math.abs(windSpeed * Math.sin(toRadians(windDir) - toRadians(rwy.course)));

    if (crossWind >= maxCrossWindComponent) {
        console.log(`Too high crosswind for ${rwy.id}`);
        return false;
    }

    const headWind = windSpeed * Math.cos(toRadians(windDir) - toRadians(rwy.course));

    if (headWind <= -maxTailWindComponent) {
        console.log(`Too high headwind for ${rwy.id}`);
        return false;
    }

    console.log(`Rwy ${rwy.id} ` +
        `(${rwy.course} deg) selected for ${dir} ` +
        `(CWC ${crossWind.toFixed(1)}kt / HWC ${headWind.toFixed(1)}kt))`);

    return true;
}

const rwyParser = metar => {
    const windRegex = /[0-9A-Z]*KT/g;
    const windFull = metar.match(windRegex);

    if (windFull) {
        const gustsRegex = /(G{1}\d*KT)/g;
        const gustsFull = windFull[0].match(gustsRegex);
        let gusts;

        if (gustsFull) {
            const gustRegex = /\d*/g;
            gusts = parseInt(gustsFull[0].match(gustRegex)[1]);

            console.log(`Gusts of ${gusts} kt!`);
        }

        const windOnly = windFull[0].split(/G|KT/)[0];
        const winDir = parseInt(windOnly.substring(0, 3));
        const windSpeed = parseInt(windOnly.substring(3, 5));

        const dep = depPrio.find(item => isRwyAvailable('dep', item, winDir, windSpeed));
        const arr = arrPrio.find(item => isRwyAvailable('arr', item, winDir, windSpeed));

        return [dep ? dep.id : '?', arr ? arr.id : '?']
    }

    return null;
}

xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
        const parser = new DOMParser();
        const xml = parser.parseFromString(xhttp.responseText, "text/xml");
        const metars = xml.getElementsByTagName("metno:meteorologicalAerodromeReport")
        const lastMetar = metars[0].getElementsByTagName("metno:metarText")[0].innerHTML.trim();

        document.getElementById("metar").innerHTML = lastMetar;

        const rwys = rwyParser(lastMetar);

        if (rwys) {
            document.getElementById("rwys").innerHTML = `${rwys[0]} (dep) / ${rwys[1]} (arr)`;
        }
    }
};

xhttp.open("GET", "https://api.met.no/weatherapi/tafmetar/1.0/metar.xml?icao=efhk", true);
xhttp.send();
