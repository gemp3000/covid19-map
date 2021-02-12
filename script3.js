const margin = {t: 50, r:50, b: 50, l: 50};
const size = {w: 800, h: 800};
const svg = d3.select('svg');



// defining a container group
// which will contain everything within the SVG
// we can transform it to make things everything zoomable
const containerG = svg.append('g').classed('container', true);
let mapData, covidData;
let bubblesG, radiusScale, projection, colorScale;

svg.attr('width', size.w)
    .attr('height', size.h);

let zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", zoomed);
svg.call(zoom);

Promise.all([
    d3.json('data/maps/us-states.geo.json'),
    d3.csv('data/covid_data.csv')
]).then(function (datasets) {
    mapData = datasets[0];
    covidData = datasets[1];

    // --------- DRAW MAP ----------
    // creating a group for map paths
    let mapG = containerG.append('g').classed('map', true);

    // defining a projection that we will use
    projection = d3.geoAlbersUsa()
        .fitSize([size.w, size.h], mapData);

    // defining a geoPath function
    let path = d3.geoPath(projection);

    // adding county paths
    mapG.selectAll('path')
        .data(mapData.features)
        .enter()
        .append('path')
        .attr('d', function(d) {
            return path(d);
        });

    // --------- DRAW BUBBLES ----------
    // creating a group for bubbles
    bubblesG = containerG.append('g').classed('bubbles', true);

    // defining a scale for the radius of bubbles
    radiusScale = d3.scaleSqrt()
        .domain(d3.extent(covidData, d => +d.cases))
        .range([1, 20]);
    
    // color scale for color
    colorScale = d3.scaleSequential()
        .domain(d3.extent(covidData, d => d.deaths).reverse())
        .interpolator(d3.interpolateRdBu);
       
      //  var colorScale function(){
        //    let colors = [FF310D,D9234F,F032F0,8E23D9,3912FC];
          //  let range = [0, max/2, max];

            //return colors
        

    drawBubbles();
});

function drawBubbles(scale = 1) {
    // creating a bubbles selection
    let bubblesSelection = bubblesG.selectAll('circle')
        .data(covidData, d => d.fips);

    // selecting tooltip
    let tooltip = d3.select('div#map-tooltip');
    
    // creating/updating circles
    bubblesSelection
        .join('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .style('fill', d => colorScale(d.deaths))
        .attr('transform', d => 'translate('+projection([d.long, d.lat])+')')
        .attr('r', d => radiusScale(+d.cases)/scale)
        .on('mouseover', (event, d) => {
            tooltip.style('display', 'block');

            tooltip.select('div.county')
                .text(`${d.county} `);
            tooltip.select('div.cases')
                .text(d.cases);
            tooltip.select('div.deaths')
                .text(d.deaths);
            

            tooltip.style('top', (event.pageY+1)+'px')
                .style('left', (event.pageX+1)+'px')
        })
        .on('mouseout', () => {

            tooltip.style('display', 'none');
        });
}

function zoomed(event) {
   let transform = event.transform;
    containerG.attr("transform", transform);
    containerG.attr("stroke-width", 1 / transform.k);

    drawBubbles(transform.k);
}

