const xhttp = new XMLHttpRequest();

xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
        const parser = new DOMParser();
        const xml = parser.parseFromString(xhttp.responseText, "text/xml");
        const metars = xml.getElementsByTagName("metno:meteorologicalAerodromeReport")

        document.getElementById("metar").innerHTML = metars[0].getElementsByTagName("metno:metarText")[0].innerHTML.trim();
    }
};

xhttp.open("GET", "https://api.met.no/weatherapi/tafmetar/1.0/metar.xml?icao=efhk", true);
xhttp.send();
