import PointerHoverDetector from '../../../../../src/main/collectors/static/PointerHoverDetector';

describe('PointerHoverDetector tests:', function () {
    describe('getPointerHover', function () {
        it('get pointer hover', function () {
            const pointerHover = PointerHoverDetector.getPointerHover();

            assert.exists(pointerHover);
        });
    });
});
