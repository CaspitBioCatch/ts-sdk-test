import { isPrimeNumber } from "./isPrime";

class MySDK {
  start() {
    console.log('SDK started');
  }

  checkPrime(num) {
    console.log(isPrimeNumber(num));
  }

  stop() {
    console.log('SDK stopped');
  }

  pause() {
    console.log('SDK paused');
  }
}

// package module definition 
// goal is to create a package 
// 

export default new MySDK();