let xValues;
let data1 = null;
let windTurbines;

function loadWindTurbines(){
    const url = "https://deluxe-faun-4d8c07.netlify.app/api/get-wind-turbines";
    fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json(); // Parse the JSON data
    })
    .then(data => {
        let windTurbines = document.getElementById('windTurbines');
        let n = data.length;
        for(let i=0;i<n;i++)
        {
            let opt = document.createElement('option');
            opt.value = data[i];
            opt.textContent = data[i];
            windTurbines.appendChild(opt);
            initMap();
        }

    });
}

function viewData() {
    const url = "https://deluxe-faun-4d8c07.netlify.app/api/get-power-curve-values";
    const latitudeValue = document.getElementById("latitudeValue").value;
    const longitudeValue = document.getElementById("longitudeValue").value;

    const body = {
        latitudeValue: latitudeValue,
        longitudeValue: longitudeValue
    };

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json(); // Parse the JSON data
    })
    .then(data => {
        xValues = data[0].xValues;
        windTurbines = data[0].windTurbines;
        data1 = data[0];
        changeDistributionCurve();
        plot_power_curve(windTurbines[document.getElementById('windTurbines').value]);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function plot_monthly_graph(xValues,category,label){
    label = label.charAt(0).toUpperCase()+label.slice(1);
    const data = [];
    if(Object.keys(category).length===301){
        data.push({
            x: xValues,
            y: category,
            mode: 'lines',
            type: 'scatter',
            name: 'Annual',
        });
    }
    else{
        for(let key in category)
            data.push({
                x: xValues,
                y: category[key],
                mode: 'lines',
                type: 'scatter',
                name: key,
            });
    }
    const layout = {
        title: label+' Wind Speed',
        xaxis: {
            title: 'Wind Speed (m/s)'
        },
        yaxis: {
            title: 'Probability Distribution of Wind Speed'
        },
        hovermode: 'closest' ,
        width:"50%"
    };  
    Plotly.newPlot('myChart1', data, layout);
}

function plot_power_curve(windTurbine){
    const data = [{
            x: xValues,
            y: windTurbine,
            mode: 'lines',
            type: 'scatter',
        }];
    const layout = {
        title: "Power Curve ("+document.getElementById('windTurbines').value+")",
        xaxis: {
            title: "Wind Speed(m/s)"
        },
        yaxis: {
            title: 'Power Generated(KW)'
        },
        hovermode: 'closest' ,
        width:"50%"
    };  
    Plotly.newPlot('myChart2', data, layout);
}

function plot_multiplied_curve(xValues, category, windTurbine) {
    const data = [];
    let layout;
    let tableData = '';
    document.getElementById('thead1').innerHTML = "";
    const totalPowerGenerated = calculateArea(xValues, windTurbine);

    if (Object.keys(category).length === 301) { // Annual data
        const multiplied_value = windTurbine.map((number, idx) => number * category[idx]);
        const powerGenerated = calculateArea(xValues, multiplied_value);
        
        const powerGeneratedWatt  = (8640*powerGenerated*Math.pow(10,-6)).toFixed(2);
        const utilizationPercentage = (powerGeneratedWatt / totalPowerGenerated) * 100;
        data.push({
            x: xValues,
            y: multiplied_value,
            mode: 'lines',
            type: 'scatter',
            name: "Annual (" + powerGeneratedWatt + " GWh)",
        });
        layout = {
            title: "Annual Power Generation - (" + powerGeneratedWatt + " GWh)",
            xaxis: {
                title: 'Wind Speed (m/s)'
            },
            yaxis: {
                title: 'Power Generated (kW)'
            },
            hovermode: 'closest',
            width: "50%"
        };

        tableData = `<tr><td>Annual</td><td>${powerGeneratedWatt} GWh</td><td>${utilizationPercentage.toFixed(7)}%</td></tr>`;
    } else {
        for (let key in category) {
            const multiplied_value = windTurbine.map((number, idx) => number * category[key][idx]);
            const powerGenerated = calculateArea(xValues, multiplied_value);
            
            let value = 1;
            if(key==='Winter')
                value = 3;
            else if(key==='Summer')
                value = 3;
            else if(key==='Moonson')
                value = 4;
            else if(key==='PostMoonson')
                value = 2;
            const powerGeneratedWatt = (720*value*powerGenerated*Math.pow(10,-6));
            const utilizationPercentage = (powerGeneratedWatt / totalPowerGenerated) * 100;
            data.push({
                x: xValues,
                y: multiplied_value,
                mode: 'lines',
                type: 'scatter',
                name: key + " (" + powerGeneratedWatt.toFixed(2) + " GWh)",
            });

            // Update table data for each category
            tableData += `<tr><td>${key}</td><td>${powerGeneratedWatt.toFixed(4)} GWh</td><td>${utilizationPercentage.toFixed(7)}%</td></tr>`;
        }
        layout = {
            title: "Power Generation",
            xaxis: {
                title: 'Wind Speed (m/s)'
            },
            yaxis: {
                title: 'Power Generated (kW)'
            },
            hovermode: 'closest',
            width: "50%"
        };
    }

    let thead1 = document.getElementById('thead1');
    let tablerow = document.createElement('tr');
    let value1 = document.createElement('th');
    value1.textContent = "Category";
    let value2 = document.createElement('th');
    value2.textContent = "Power Generated";
    let value3 = document.createElement('th');
    value3.textContent = "Wind Turbine Utilization Potential";
    tablerow.appendChild(value1);
    tablerow.appendChild(value2);
    tablerow.appendChild(value3);
    thead1.appendChild(tablerow);
    document.getElementById('data-table').style.border = "1px solid black";
    // Update the table with new data
    document.getElementById('data-table-body').innerHTML = tableData;

    Plotly.newPlot('myChart3', data, layout);
}

function calculateArea(x, y) {
    // Use the trapezoidal rule to calculate the area under the curve
    let area = 0;
    for (let i = 0; i < x.length - 1; i++) {
        area += (y[i] + y[i + 1]) * (x[i + 1] - x[i]) / 2;
    }
    return area;
}

function changePowerCurve() {
    const windTurbineSelect = document.getElementById('windTurbines');
    const selectedWindTurbine = windTurbineSelect.value;
    if (data1) {
        plot_power_curve(windTurbines[selectedWindTurbine]);
        changeDistributionCurve();
    }
}

function changeDistributionCurve() {
    const selectedCategory = document.querySelector('input[name="category"]:checked').value;
    if (data1) {
        plot_monthly_graph(xValues, data1[selectedCategory], selectedCategory);
        plot_multiplied_curve(xValues, data1[selectedCategory], windTurbines[document.getElementById('windTurbines').value]);
    }
}

function initMap() {
    var map = new google.maps.Map(document.getElementById('map-area'), {
        zoom: 5,
        center: {lat: 20.5937, lng: 78.9629} // Center map over India
    });

    map.addListener('click', function(event) {
        document.getElementById('latitudeValue').value = event.latLng.lat();
        document.getElementById('longitudeValue').value = event.latLng.lng();
    });
}
