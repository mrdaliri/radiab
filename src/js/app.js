const API = 'http://localhost:8080';

const issImages = [
    '/dist/img/1.jpg',
    '/dist/img/2.jpg',
    '/dist/img/3.jpg',
    '/dist/img/4.jpg',
    '/dist/img/5.jpg',
    '/dist/img/6.jpg'
];

$(function () {
    let selectedFactors = [
        ['inhalation_radiation', 'Inhalation Radiation'],
        ['cosmic_radiation', 'Cosmic Radiation'],
        ['terrestrial_radiation', 'Terrestrial Radiation'],
        ['radionuclide_radiation', 'Radionuclide Radiation'],
        ['neutron_radiation', 'Neutron Radiation']
    ];

    let tiles = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 8,
        minZoom: 3,
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1IjoibXJkYWxpcmkiLCJhIjoiY2sxeHN4emgyMGczczNubDJxeGxvMng4NCJ9.UeSLlOWRGvJR-HesGdPRLg'
    });

    let heatmapLayer = new HeatmapOverlay({
        "radius": 70,
        "scaleRadius": false,
        "useLocalExtrema": false,
        // which field name in your data represents the latitude - default "lat"
        latField: 'lat',
        // which field name in your data represents the longitude - default "lng"
        lngField: 'lng',
        // which field name in your data represents the data value - default "value"
        valueField: 'total_radiation'
    });

    let map = new L.Map('map', {
        center: new L.LatLng(50.701779, -98.088385),
        zoom: 4,
        layers: [tiles, heatmapLayer]
    });

    let datePicker = $('#date-picker');
    data.forEach(row => {
        datePicker.append($('<option>', {
            value: row['date']['date'],
            text: row['date']['label']
        }));
    });

    let markerOnClick = function (e) {
        selectedRecord = this.options['record'];
        updateStatus();
        updateISS();
        $('#info').removeClass('d-none');
        updateChart();
    };

    datePicker.change(function () {
        records = data.filter(row => {
            return row['date']['date'] == datePicker.val();
        })[0]['records'];
        updateMap();
        updateHeatmap();
    });

    let records = [];
    let otherRadiation = 0;
    let selectedRecord = null;
    let chart = null;
    let currentMarkers = [];

    let updateMap = function () {
        if (currentMarkers) {
            currentMarkers.forEach(marker => map.removeLayer(marker));
        }
        records.forEach(record => {
            let marker = L.marker([record['lat'], record['lng']], {'record': record});
            marker.on('click', markerOnClick).addTo(map);
            currentMarkers.push(marker);
        });
        $('#info').addClass('d-none');
    };

    let updateHeatmap = function () {
        let max_radiation = 0;
        records.forEach(record => {
            let total_radiation = 0;
            selectedFactors.forEach(factor => total_radiation += record[factor[0]]);
            record['total_radiation'] = total_radiation;
            if (max_radiation < total_radiation) {
                max_radiation = total_radiation;
            }
        });
        heatmapLayer.setData({'max': max_radiation, 'data': max_radiation > 0 ? records : []});
    };
    updateHeatmap();

    let updateChart = function () {
        if (chart) {
            chart.destroy();
        }
        let dataPoints = [];
        let totalRadiation = otherRadiation + selectedRecord['total_radiation'];
        selectedFactors.forEach(factor => {
            dataPoints.push({
                y: Math.round(selectedRecord[factor[0]] / totalRadiation * 100),
                name: factor[1],
                exact: selectedRecord[factor[0]]
            });
        });
        if (otherRadiation > 0) {
            dataPoints.push({
                y: Math.round(otherRadiation / totalRadiation * 100),
                name: 'Other',
                exact: otherRadiation.toFixed(3)
            });
        }

        chart = new CanvasJS.Chart("chart", {
            animationEnabled: true,
            data: [{
                type: "pie",
                toolTipContent: "{name}: <strong>{y}%</strong>",
                indexLabel: "{name} - {exact} mrem ({y}%)",
                dataPoints: dataPoints
            }]
        });
        chart.render();
    };

    let updateStatus = function () {
        let box = $('#conclusion');
        let safeValue = parseFloat(box.data('safe'));
        if (selectedRecord['total_radiation'] > safeValue) {
            box.removeClass('alert-success').addClass('alert-danger');
            box.find('strong.status').text('UNSAFE');
        } else {
            box.removeClass('alert-danger').addClass('alert-success');
            box.find('strong.status').text('SAFE');
        }
        box.find('strong.value').text((selectedRecord['total_radiation'] + otherRadiation).toFixed(3) + " mrem");
        box.find('strong.city').text(selectedRecord['city'] + ', ' + selectedRecord['province']);
    };

    let updateISS = function () {
        let container = $('#iss-comparison');
        let randomImage = issImages[Math.floor(Math.random() * issImages.length)];
        container.find('img').attr('src', randomImage);
        container.find('strong.value').text(selectedRecord['iss_neutron_radiation'] + " mrem");
    };

    $('input.activity').change(function () {
        let input = $(this);
        let notes = $('#notes');
        if (input.is(':checked')) {
            notes.find('.empty').hide();
            notes.find('#note-' + input.attr('id')).removeClass('d-none');
            otherRadiation += parseFloat(input.data('exposure'));
        } else {
            notes.find('#note-' + input.attr('id')).addClass('d-none');
            otherRadiation -= parseFloat(input.data('exposure'));
            if (notes.find('p:visible').length === 0) {
                notes.find('.empty').show();
                otherRadiation = 0;
            }
        }
        if (selectedRecord) {
            updateChart();
            updateStatus();
        }
    });

    $('input.filter').change(function () {
        let input = $(this);
        if (input.is(':checked')) {
            selectedFactors.push([input.attr('name'), input.parent().find('label').text()]);
        } else {
            selectedFactors = selectedFactors.filter(factor => factor[0] !== input.attr('name'));
        }
        updateHeatmap();
        if (selectedRecord) {
            updateChart();
            updateStatus();
        }
    });
});