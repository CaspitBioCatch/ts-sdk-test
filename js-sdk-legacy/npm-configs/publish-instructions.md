# Publishing a Release to the NPM Repository on JFrog

```text
In order to publish a release to our NPM repository in JFrog we need to follow few steps: 

1. cd root folder
2. run: npm run buildReleaseNpm
   2.1 this will run the webpack.npm.config.js webpack bundler
   2.2 the output file will be generate into npm-configs/ folder
3. cd npm-configs/
4. change version in package.json file
5. run: npm publish (make sure you have .npmrc file with the right configuration)

Here is a link for more detailed information about the solution design. 
https://biocatch.atlassian.net/wiki/spaces/DCS/pages/5912494081/JS+SDK+Distribution+-+Technical+Design+Document