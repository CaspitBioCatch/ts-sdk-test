console.log('pt.js');
function T() {
    // if (window.Proxy) {
    //     return new Proxy(this, {
    //         get: function(target, propKey, receiver) {
    //             if (propKey == 'foo') {
    //                 console.log('get handler');
    //                 var origMethod = target[propKey];
    //                 return function () {
    //                     console.log('function handler');
    //                     var result = origMethod.apply(this, arguments);
    //
    //                     return result;
    //                 };
    //             }
    //         }
    //     });
    // }
}


T.prototype.foo = function () {
    console.log('foo');
};

console.log('creating T');
var t = new T();
t.foo();
