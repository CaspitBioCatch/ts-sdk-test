import CDUtils from '../../technicalServices/CDUtils';

export default class Event {
    // There is a bug in jquery (1.7.1) that timestamp doesn't work correctly (ie, firefox)
    // The bug is defined in http://bugs.jquery.com/ticket/10755
    // The timestamp in FF is from the opening of the browser
    // timestamp doesn't always exist
    getEventTimestamp() {
        return CDUtils.dateNow();
    }

    getTimestampFromEvent(e) {
        return e.timeStamp ? CDUtils.cutDecimalPointDigits(e.timeStamp, 3) : 0;
    }

    updateFeatureConfig() {
    }

    processElements(elements, isChange, elementsHandler, resendMethod, getMethod) {
        elements.forEach((element) => {
            const isListed = elementsHandler.isListed(element);
            if (isListed && !isChange) {
                resendMethod.call(elementsHandler, element);
            } else if (!isListed) {
                getMethod.call(elementsHandler, element, false);
            }
        });
    }
}
