/**
 * @param {*} elementOrSelector Elemento HTML o selector del elemento.
 * @param {string} eventName Nombre qualificado del evento.
 * @returns 
 */
function trigger(elementOrSelector,eventName)
{
    if (!elementOrSelector) return;

    const element = (typeof elementOrSelector === "string") ? document.querySelector(elementOrSelector) : elementOrSelector;
    const event = new Event(eventName);
    element.dispatchEvent(event);
}

/**
 * @param {string} selector selector del contenedor de la alerta.
 * @param {string} content contenido HTML de la alerta.
 * @param {number} timeout cantidad en segundos en la que sera visible la alerta.
 * @returns 
 */
function show_alert(selector,content,timeout)
{
    const alert = document.querySelector(selector);
    if (!alert) return;
    if (!content) return;
    
    alert.classList.remove("d-none");
    alert.innerHTML = content;

    setTimeout(function() {
        alert.classList.add("d-none");
        alert.innerHTML = "";
    }, (timeout * 1000));
}