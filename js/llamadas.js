//Revisa la documentación de la API en https://pruebasjo.polarier.com:501/Swagger/index.html

import { formatCurrency, animateNumber, formatPercentage } from "./utils";

export const getDataAsync = async () => {

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based, so add 1
    const firstDayOfMonth = `${year}-${month}-01`;
    const lastDayOfMonth = `${year}-${month}-${new Date(year, month, 0).getDate()}`; // Get the last day of the month
    
    const ventasResponse = await fetch(`https://pruebasjo.polarier.com:501/api/Venta?fechaDesde=${firstDayOfMonth}&fechaHasta=${lastDayOfMonth}`);

    const productosResponse = await fetch("https://pruebasjo.polarier.com:501/api/Producto");
    const categoriasResponse = await fetch("https://pruebasjo.polarier.com:501/api/Categoria");

    // Parse the JSON responses
    const ventasData = await ventasResponse.json();
    const productosData = await productosResponse.json();
    const categoriasData = await categoriasResponse.json();

    return { ventasData, productosData, categoriasData };
}
export const UpdateData = async (alldata) => {
    if (!alldata) alldata = await getDataAsync();
    const ventasData = alldata.ventasData;
    const productosData = alldata.productosData;
    const categoriasData = alldata.categoriasData;
    const today = new Date();
    console.log("Date",today)
    // Declare todayDate here
    const todayDate = today.toISOString().split('T')[0];
    console.log("todaydate",todayDate)
    // yesterday date 
    const yesterday = new Date(todayDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];

    const todayVentasCount = getTodayVentasCount(ventasData, todayDate);
    const todaySalesAmount = TodaySales(productosData, ventasData, todayDate);
    const yesterdayVentasCount = getTodayVentasCount(ventasData, yesterdayDate);
    const yesterdaySalesAmount = TodaySales(productosData, ventasData, yesterdayDate);
    const percentage = ((todaySalesAmount - yesterdaySalesAmount) / yesterdaySalesAmount) * 100;
    // const percentage =20;
    DisplayData(todayVentasCount, document.getElementById("ventasCountField"));
    DisplayData(todaySalesAmount, document.getElementById("ventasSalesField"), formatCurrency, true);
    DisplayData(percentage, document.getElementById("ventasPercentageField"), formatPercentage, true);
    if (percentage < 0) {
        document.getElementById("ventasPercentageField").style.color = "red";
    } else{
        document.getElementById("ventasPercentageField").style.color = "";
    }
    SaleschartsByrevenue(productosData,ventasData)
    monthProductHistory(productosData, ventasData)
}

const DisplayData = (end, destiny, fn = null, fixed = false) => {
    let starttxt = String(destiny.innerText);

    if (starttxt.includes('€')) {
        starttxt = starttxt.replace('€', '').trim();
        starttxt = starttxt.replace(/\./g, '').replace(',', '.');
    }
    if (starttxt.includes('%')) {
        starttxt = starttxt.replace('%', '').trim();
    }

    starttxt = parseFloat(starttxt).toFixed(2);
    const start = isNaN(parseFloat(starttxt)) ? 0 : Number(starttxt);

    return animateNumber(destiny, start, end, 2000, fn, fixed);
}


const getTodayVentasCount = (ventasData, todayDate) => {
    // Filter ventas for today's date and sum the cantidad attribute
    const todayVentas = ventasData.filter((venta) => venta.fecha.substring(0, 10) === todayDate);

    // Sum the cantidad of today's ventas
    const totalCantidad = todayVentas.reduce((total, venta) => total + venta.cantidad, 0);

    return totalCantidad;
}

const TodaySales = (productosData, ventasData, todayDate) => {
    // Filter ventas to get only today's sales
    const todayVentas = ventasData.filter((venta) => venta.fecha.substring(0, 10) === todayDate);

    let totalRevenue = 0;

    // Iterate over today's ventas to calculate revenue
    todayVentas.forEach((venta) => {
        const productoId = venta.productoId; // Assuming 'productoId' is the field in 'venta' that references the product
        const cantidadVendida = venta.cantidad; // Assuming 'cantidad' is the field in 'venta' that indicates the quantity sold

        // Find the product by its ID
        const producto = productosData.find((prod) => prod.id === productoId); // Assuming 'id' is the field in 'producto'

        if (producto) {
            const precio = producto.precio; // Assuming 'precio' is the field in 'producto' that indicates the price
            totalRevenue += precio * cantidadVendida; // Calculate revenue for this sale
        }
    });

    return totalRevenue;
}

const SaleschartsByrevenue = (productosData, ventasData) => {
    const ctx = document.getElementById('incomeChart').getContext('2d');
    const days = [];
    const salesData = []; // Array to hold sales data for each day
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based, so add 1
    const lastDay = new Date().getDate();

    for (let day = 1; day <= lastDay; day++) {
        const formattedDay = String(day).padStart(2, '0'); // Pad single digits with a leading zero
        const formattedMonth = String(month).padStart(2, '0'); // Months are 0-based, so add 1
        days.push(`${formattedDay}/${formattedMonth}`);

        // Calculate sales for this day
        const currentDate = `${year}-${month}-${formattedDay}`;
        const dailySales = TodaySales(productosData, ventasData, currentDate);
        salesData.push(dailySales); // Store the sales amount for this day
    }
    
    const myBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days, // Example labels
            datasets: [{
                label: 'Sales',
                data: salesData, // Use the calculated sales data
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    return myBarChart;
}

// tabla hystorial ventas 
const monthProductHistory = (productosData, ventasData) => {
    const today = new Date();
    const currentMonth = today.getMonth(); // 0-11
    const currentYear = today.getFullYear();

    // Filter ventas to get only this month's sales
    const monthVentas = ventasData.filter((venta) => {
        const ventaDate = new Date(venta.fecha);
        return ventaDate.getMonth() === currentMonth && ventaDate.getFullYear() === currentYear;
    });

    // Create a map to aggregate sales by product
    const productSales = {};

    monthVentas.forEach((venta) => {
        const productoId = venta.idProducto;
        const cantidadVendida = venta.cantidad;

        // Find the product by its ID
        const producto = productosData.find((prod) => prod.id === productoId);

        if (producto) {
            const precio = producto.precio;
            const totalRevenue = precio * cantidadVendida;

            // If the product is already in the map, update the quantity and revenue
            if (productSales[productoId]) {
                productSales[productoId].cantidad += cantidadVendida;
                productSales[productoId].revenue += totalRevenue;
            } else {
                // Otherwise, add the product to the map
                productSales[productoId] = {
                    nombre: producto.nombre, // Assuming 'nombre' is the field in 'producto'
                    categoria: producto.categoria, // Assuming 'categoria' is the field in 'producto'
                    precio: precio,
                    cantidad: cantidadVendida,
                    revenue: totalRevenue
                };
            }
        }
    });

    // Get the tbody element from the existing table
    const tbody = document.querySelector('.min-w-full tbody');

    // Clear existing rows in the tbody
    tbody.innerHTML = '';

    // Populate the table with product sales data
    for (const productoId in productSales) {
        const row = tbody.insertRow();
        row.insertCell().innerText = today.toLocaleString(); // Current date and time
        row.insertCell().innerText = productSales[productoId].nombre;
        row.insertCell().innerHTML = `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">${productSales[productoId].categoria}</span>`;
        row.insertCell().innerText = formatCurrency(productSales[productoId].precio);
        row.insertCell().innerText = productSales[productoId].cantidad;
        row.insertCell().innerText = formatCurrency(productSales[productoId].revenue);
    }
}






