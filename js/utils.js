export const formatCurrency = (value) => {
    return new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "EUR", // Aquí puedes cambiar a 'USD' o cualquier otra moneda
    }).format(value);
};

// a function that formats percentatge
export const formatPercentage = (value) => {
    return `${value}%`;
    };

//animateNumber recibe un elemento del DOM, un valor inicial, un valor final, la duración de la animación y una función opcional para formatear el número.
export const animateNumber = (element, start, end, duration, fn = null, fixed = false) => {
    const startTime = performance.now();

    function update(time) {
        const elapsedTime = time - startTime;
        const progress = Math.min(elapsedTime / duration, 1); // Asegura que el progreso no exceda 1
        const value = fixed
            ? (start + (end - start) * progress).toFixed(2)
            : Math.floor(start + (end - start) * progress);
        element.textContent = fn ? fn(value) : value;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
};
