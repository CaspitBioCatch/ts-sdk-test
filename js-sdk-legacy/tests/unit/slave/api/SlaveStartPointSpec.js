import SlaveStartPoint from "../../../../src/slave/SlaveStartPoint";
import SlaveSystemLoader from "../../../../src/slave/SlaveSystemLoader";

describe('SlaveStartPoint tests', function () {

    it('should return instance of SlaveSystemLoader ', function () {
        const startResult = new SlaveStartPoint().start()
        assert.instanceOf(startResult, SlaveSystemLoader)
    })

    it('should return undefined when start slave', function () {
        const weakMap = window.WeakMap;
        window.WeakMap = undefined
        const startResult = new SlaveStartPoint().start()
        assert.isUndefined(startResult)
        window.WeakMap = weakMap
    });
})