'use strict';
/*global mapboxgl, _*/

mapboxgl.accessToken = 'pk.eyJ1IjoibW9sbHltZXJwIiwiYSI6ImNpbHNpZWZ3MDAwMWZ0eWtyNHlkeWtzN2YifQ.5yK3yfANxKfXipnYQgoQTQ';

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v8',
  center: [-98.87695312499999, 40.38002840251183],
  zoom: 3,
  maxBounds: [
    [-143.26171875, 52.908902047770255],
    [-49.5703125, 15.792253570362446]
  ]
});

map.on('style.load', function() {
  map.addSource('solar', {
    type: 'vector',
    url: 'mapbox://mollymerp.9kytkh5o'
  });

  map.addSource('cities', {
    type: 'geojson',
    data: 'data/merged_msa_uac.geojson'
  });

  map.addSource('urban-areas', {
    type: 'geojson',
    data:'data/uac_pop_dni.geojson'
  });

  map.addLayer({
    id: 'urban_area_polygons',
    type: 'fill',
    source: 'cities',
    'source-layer': 'uac_pop_dni',
    interactive: true,
    paint: {
      'fill-color': '#000000',
      'fill-opacity': .15
    }
  }, 'water');

  map.addLayer({
    id: 'metro_area_polygons',
    type:'fill',
    source:'urban-areas',
    'source-layer': 'merged_msa_uac',
    interactive: true,
    paint: {
      'fill-color': '#000000',
      'fill-opacity': .3
    }
  }, 'admin-2-boundaries')
  // add styling based on avg_solar DNI
  // legend values: [ 2.103, 2.945, 3.787, 4.629, 5.471, 6.313, 7.154, 7.996, 8.838]
  var colors = ['#d73027', '#f46d43', '#fdae61', '#fee090', '#e0f3f8', '#abd9e9', '#74add1', '#4575b4'].reverse();
  _.each(colors, function(category, i) {
    map.addLayer({
      id: 'solar-' + (i + 1),
      type: 'fill',
      source: 'solar',
      'source-layer': 'solar',
      paint: {
        'fill-color': category,
        'fill-opacity': .7
      },
      'filter': ['==', 'category', (i + 1)]
    }, 'urban_area_polygons');
  });
  map.on('mousemove', _.debounce(function(e) {
    cityHover(e);
  }, 200));
});

function cityHover(e) {
  map.featuresAt(e.point, {
    radius: 10,
    layer: 'urban_area_polygons'
  }, function(err, features) {
    removeAllTooltips();
    if (err) {
      console.error(err);
    }
    if (features.length) {
      // data source: https://www.cia.gov/library/publications/the-world-factbook/rankorder/2233rank.html
      // total US electricity consumption: 3,832,000,000,000 kWh
      // total US population: 317,848,000 
      // avg annual per capita electricity consumption in US: 12,056 kWh
      // avg daily per capital electricity consumption: 12,056 kWh / 365.25 days = 33kWh/day
      // DNI = kWh/m^2/day

      // formula for % of population whose energy consumption could be offset by solar
      // ALAND10 (land area in m^2) * 0.15 * MEANANN_DN (solar potential) / DP0010001 (people) * 33 kWh/day
      var city = features[0].properties;
      console.log(city);
      var tooltip = new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(tooltip_template(city))
        .addTo(map);
    }
  });
}

var tooltip_template = _.template("<p><strong><%= city.NAME10.replace('--', '; ') %></strong></p><p>If <%= city.NAME10.replace('--', '; ') %> had solar panels on rooftops amounting to just 1% of its total area, solar could produce<strong> <%= city.sol_1perc*100 %>%</strong> of the entire metro area's electricity needs.</p>",{
    variable: 'city'
  });

function removeAllTooltips() {
  var oldTtips = document.getElementsByClassName('mapboxgl-popup');
  if (oldTtips.length > 0) {
    _.forEach(oldTtips, function(ttip) {
      ttip ? ttip.remove() : null;
    })
  }
}
