class MySDK {
  start() {
    console.log('SDK started');
  }

  stop() {
    console.log('SDK stopped');
  }
}

// package module definition 
// goal is to create a package 
// 

export default new MySDK();