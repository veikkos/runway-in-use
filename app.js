const xhttp = new XMLHttpRequest();

const rwyParser = metar => {
    const windRegex = /[0-9A-Z]*KT/g;
    const wind = metar.match(windRegex);

    if (wind) {
        const gustRegex = /(G{1}\d*KT)/g;
        const gust = wind[0].match(gustRegex);

        if (gust) {
            console.log("Gusts!");
        }

        const windOnly = wind[0].split(/G|KT/)[0];
        const winDir = parseInt(windOnly.substring(0, 3));
        const windSpeed = parseInt(windOnly.substring(3, 5));

        if (winDir > 130 && winDir < 240 && windSpeed < 15) {
            return ['22R', '15'];
        }
        // more rules ...
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
