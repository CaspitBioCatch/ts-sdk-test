
window.onload = function () {
    let selector = "input:not([type='color']):not([type='hidden']):not([type='file']):not([type='image']), textarea, button, checkbox, select";
    let inputs = exports.$(document)(selector);
    for (let x of inputs) {
        console.log(x.id);
    }

    console.log('##### frame #####');
    let frameS = exports.$(self.frames[0].document);
    let inputsFrame = frameS(selector)

    for (let x of inputsFrame) {
        console.log(x.id);
    }

    
}