async function getJSONAsync() {
  let json = await axios.get('https://restcountries.eu/rest/v2/all');
  return json;
}
getJSONAsync().then(function ({ data }) {
  let myData = data.reduce((acc, el) => {
    console.log(el)
    acc.push({
      id: el.alpha3Code,
      name: el.name,
      nativeName: el.nativeName,
      capital: el.capital,
      population: el.population,
      currenciesCode: el.currencies[0].code,
      currenciesSymbol: el.currencies[0].symbol,
      timezone: el.timezones[0],
      flag: el.flag
    })
    return acc
  }, []);

  var format = d3.format(",");

  // Set tooltips
  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function (d) {
      return "<strong>Country: </strong><span class='details'>" + d.properties.name + "<br></span>" + "<strong>Native Name: </strong><span class='details'>" + d.nativeName + "<br></span>" + "<strong>Capital: </strong><span class='details'>" + d.capital + "<br></span>" + "<strong>Population: </strong><span class='details'>" + `${format(d.population)} people` + "<br></span>" + "<strong>Currency: </strong><span class='details'>" + d.currenciesCode + d.currenciesSymbol + "<br></span>" + "<strong>Flag: </strong><span class='details'>" + `<img src='${d.flag}' class="flag"></img>` + "<br></span>" + "<strong>Timezone: </strong><span class='details'>" + d.timezone + "<br></span>";
    })
  const margin = { top: 0, right: 0, bottom: 0, left: 0 };
  const width = 960 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const color = d3.scaleThreshold()
    .domain([
      10000,
      100000,
      500000,
      1000000,
      5000000,
      10000000,
      50000000,
      100000000,
      500000000,
      1500000000
    ])
    .range([
      'rgb(247,251,255)',
      'rgb(222,235,247)',
      'rgb(198,219,239)',
      'rgb(158,202,225)',
      'rgb(107,174,214)',
      'rgb(66,146,198)',
      'rgb(33,113,181)',
      'rgb(8,81,156)',
      'rgb(8,48,107)',
      'rgb(3,19,43)'
    ]);

  const svg = d3.select('#my-map')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('class', 'map');

  const projection = d3.geoRobinson()
    .scale(148)
    .rotate([352, 0, 0])
    .translate([width / 2, height / 2]);

  const path = d3.geoPath().projection(projection);

  svg.call(tip);

  queue()
    .defer(d3.json, './data/world_countries.json')
    .await(ready);

  function ready(error, data) {
    let nativeNameById = {};
    let populationById = {};
    let capitalById = {};
    let currenciesSymbolById = {};
    let currenciesCodeById = {};
    let flagById = {};
    let timezoneById = {};

    myData.forEach(function (d) { populationById[d.id] = +d.population; });
    myData.forEach(function (d) { nativeNameById[d.id] = d.nativeName });
    myData.forEach(function (d) { capitalById[d.id] = d.capital });
    myData.forEach(function (d) { currenciesCodeById[d.id] = d.currenciesCode });
    myData.forEach(function (d) { currenciesSymbolById[d.id] = d.currenciesSymbol });
    myData.forEach(function (d) { flagById[d.id] = d.flag });
    myData.forEach(function (d) { timezoneById[d.id] = d.timezone });

    data.features.forEach(function (d) { d.population = populationById[d.id] });
    data.features.forEach(function (d) { d.nativeName = nativeNameById[d.id] });
    data.features.forEach(function (d) { d.capital = capitalById[d.id] });
    data.features.forEach(function (d) { d.currenciesCode = currenciesCodeById[d.id] });
    data.features.forEach(function (d) { d.currenciesSymbol = ` (${currenciesSymbolById[d.id]})` });
    data.features.forEach(function (d) { d.flag = flagById[d.id] });
    data.features.forEach(function (d) { d.timezone = timezoneById[d.id] });

    svg.append('g')
      .attr('class', 'countries')
      .selectAll('path')
      .data(data.features)
      .enter().append('path')
      .attr('d', path)
      .style('fill', d => color(populationById[d.id]))
      .style('stroke', 'white')
      .style('opacity', 0.8)
      .style('stroke-width', 0.3)
      // tooltips
      .on('mouseover', function (d) {
        tip.show(d);
        d3.select(this)
          .style('opacity', 1)
          .style('stroke-width', 3);
      })
      .on('mouseout', function (d) {
        tip.hide(d);
        d3.select(this)
          .style('opacity', 0.8)
          .style('stroke-width', 0.3);
      });

    svg.append('path')
      .datum(topojson.mesh(data.features, (a, b) => a.id !== b.id))
      .attr('class', 'names')
      .attr('d', path);
  }
});