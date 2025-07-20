let StandardInputEventsEmitter = null;
let StandardOnClickEventsEmitter = null;
let StandardOnChangeEventsEmitter = null;
let StandardOnFormEventsEmitter = null;

function _bindInputEvents(element) {
    StandardInputEventsEmitter.removeElementEvents(element);
    StandardInputEventsEmitter.addElementEvents(element, true);
}

function _bindOnClickEvents(element) {
    StandardOnClickEventsEmitter.removeElementEvents(element);
    StandardOnClickEventsEmitter.addElementEvents(element, true);
}

function _bindOnChangeEvents(element) {
    StandardOnChangeEventsEmitter.removeElementEvents(element);
    StandardOnChangeEventsEmitter.addElementEvents(element, true);
}

function _bindOnFormsEvents(element) {
    StandardOnFormEventsEmitter.removeElementEvents(element);
    StandardOnFormEventsEmitter.addElementEvents(element, true);
}

export default function JqueryElementsHandler(
    StandardInputEventsEmitterService,
    StandardOnClickEventsEmitterService,
    StandardOnChangeEventsEmitterService,
    StandardOnFormEventsEmitterService,
    ) {
    StandardInputEventsEmitter = StandardInputEventsEmitterService;
    StandardOnClickEventsEmitter = StandardOnClickEventsEmitterService;
    StandardOnChangeEventsEmitter = StandardOnChangeEventsEmitterService;
    StandardOnFormEventsEmitter = StandardOnFormEventsEmitterService;

    return {
        bindInputEvents: _bindInputEvents,
        bindOnClickEvents: _bindOnClickEvents,
        bindOnChangeEvents: _bindOnChangeEvents,
        bindOnFormsEvents: _bindOnFormsEvents,
    };
}
