# JS SDK #

#### Release Branches Status
|**Branch**|**Status**|
|-------------|------------|
| develop|![CI/CD](https://github.com/biocatchltd/js-sdk/actions/workflows/ci-cd-workflow.yml/badge.svg?branch=develop) |
| main|![CI/CD](https://github.com/biocatchltd/js-sdk/actions/workflows/ci-cd-workflow.yml/badge.svg?branch=main)|

#### Sonar Cloud Status
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=biocatchltd_js-sdk&metric=alert_status&token=f5e73b79fc5ade934b0c40aa36a4d1931d49d610)](https://sonarcloud.io/dashboard?id=biocatchltd_js-sdk)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=biocatchltd_js-sdk&metric=coverage&token=f5e73b79fc5ade934b0c40aa36a4d1931d49d610)](https://sonarcloud.io/dashboard?id=biocatchltd_js-sdk)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=biocatchltd_js-sdk&metric=sqale_rating&token=f5e73b79fc5ade934b0c40aa36a4d1931d49d610)](https://sonarcloud.io/dashboard?id=biocatchltd_js-sdk)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=biocatchltd_js-sdk&metric=reliability_rating&token=f5e73b79fc5ade934b0c40aa36a4d1931d49d610)](https://sonarcloud.io/dashboard?id=biocatchltd_js-sdk)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=biocatchltd_js-sdk&metric=security_rating&token=f5e73b79fc5ade934b0c40aa36a4d1931d49d610)](https://sonarcloud.io/dashboard?id=biocatchltd_js-sdk)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=biocatchltd_js-sdk&metric=vulnerabilities&token=f5e73b79fc5ade934b0c40aa36a4d1931d49d610)](https://sonarcloud.io/dashboard?id=biocatchltd_js-sdk)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=biocatchltd_js-sdk&metric=code_smells&token=f5e73b79fc5ade934b0c40aa36a4d1931d49d610)](https://sonarcloud.io/dashboard?id=biocatchltd_js-sdk)

### How do I get set up? ###

* clone the repo
* run npm install
* run npm install -g grunt

### How do I create the JS file? ###
* run grunt genAll - This will produce files in the dist folder. These files are also automatically copied to the 
devtools/public/customerJs folder for debugging. 
* The files that are created in dist are:
1. slothVersion.Major.Minor.hotFix(which is the number of git commit).min.js - our main JS SDK - for production
2. slaveVersion.Major.Minor.hotFix.min.js - our slave JS SDK for cross-origin frames - for production
3. debug/slothVersion.Major.Minor.hotFix.js - our main JS not minified but do Babeled
4. debug/slaveVersion.Major.Minor.hotFix.js - our salve JS not minified but do Babeled
* The files that are copied to the dev server are slothDebugX_Y.js, slaveDebugX_Y.js which are the same as the 'debug' files and 
the slothX_Y.js and slaveX_Y.js which are like the production files 
* You can also run grunt watch which will watch the src files and will run the genAll for you

### How do I debug the JS? ###

* After running grunt genAll, run the dev server by 'npm run testServer' and navigate to the https://localhost:8000/test.html page 
which will already load the JS files
* The code will run by default with SharedWorker. You can debug the worker using the chrome://inspect. If you wish to ease 
your debug you can change in the Grunt.js to debug mode: look for startSloth and remove the comment on the last parameter (which is true)
Now the code will run with Worker and you can debug it in the devtools without the chrome://inspect and also to see the wups 
in the network panel.
* remember that on every change you should run the grunt genAll in order to take affect.

