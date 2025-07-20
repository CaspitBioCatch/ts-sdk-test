const POINTER_TYPE = {
    FINE: 1,
    COARSE: 2,
    NONE: 3,
    ANY: 4,
    NOT_SUPPORTED: 5,
};

const HOVER_TYPE = {
    HOVER: 1,
    ON_DEMAND: 2,
    NONE: 3,
    ANY: 4,
    NOT_SUPPORTED: 5,
};

export default class PointerHoverDetector {
    static getPointerHover() {
        const inputMechanism = {
            pointer: POINTER_TYPE.NOT_SUPPORTED,
            hover: POINTER_TYPE.NOT_SUPPORTED,
        };

        // fine pointer - mouse or pen
        if (window.matchMedia) {
            const mm = window.matchMedia;
            if (mm('( any-pointer: fine )').matches) { // hige level accuracy - mouse or pen
                inputMechanism.pointer = POINTER_TYPE.FINE;
            } else if (mm('( any-pointer: coarse )').matches) { // less accurate pointer - touch screen
                inputMechanism.pointer = POINTER_TYPE.COARSE;
            } else if (mm('( any-pointer: none )').matches) {
                inputMechanism.pointer = POINTER_TYPE.NONE;
            } else if (mm('( any-pointer )').matches) {
                inputMechanism.pointer = POINTER_TYPE.ANY;
            }

            // The primary input mechanism of the device includes a pointing device of limited accuracy
            if (mm('( any-hover: hover )').matches) {
                inputMechanism.hover = HOVER_TYPE.HOVER;
            } else if (mm('( any-hover: on-demand )').matches) {
                inputMechanism.hover = HOVER_TYPE.ON_DEMAND;
            } else if (mm('( any-hove: none )').matches) {
                inputMechanism.hover = HOVER_TYPE.NONE;
            } else if (window.matchMedia('( any-hover )').matches) {
                inputMechanism.hover = HOVER_TYPE.ANY;
            }
        }

        return inputMechanism;
    }
}
