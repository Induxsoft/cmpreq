function trigger(elementOrSelector,eventName)
{
    if (!elementOrSelector) return;

    const element = (typeof elementOrSelector === "string") ? document.querySelector(elementOrSelector) : elementOrSelector;
    const event = new Event(eventName);
    element.dispatchEvent(event);
}