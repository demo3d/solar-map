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
    data: 'data/cities_pop_area_dni.geojson'
  });

  map.addLayer({
    id: 'cities_polygons',
    type: 'fill',
    source: 'cities',
    'source-layer': 'cities_pop_area_dni',
    interactive: true,
    paint: {
      'fill-color': '#000000',
      'fill-opacity': .15
    }
  });

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
    }, 'water');
  });
  map.on('mousemove', _.debounce(function(e) {
    cityHover(e);
  }, 200));
});

function cityHover(e) {
  map.featuresAt(e.point, {
    radius: 10,
    layer: 'cities_polygons'
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
      var percent_offset = (city.ALAND10 * 0.01 * city.MEANANN_DN) / (city.DP0010001 * 33) 
      console.log(city, percent_offset);
      var tooltip = new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setText(city.NAMELSAD10.replace(' Metro Area', ''))
        .addTo(map);
    }
  });
}

function removeAllTooltips() {
  var oldTtips = document.getElementsByClassName('mapboxgl-popup');
  if (oldTtips.length > 0) {
    _.forEach(oldTtips, function(ttip) {
      ttip ? ttip.remove() : null;
    })
  }
}
