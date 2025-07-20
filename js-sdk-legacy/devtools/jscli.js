#!/usr/bin/env node


const PATHS = {
  service: `${__dirname}/../src/services`,
  serviceindex: `${__dirname}/../src/services/index.js`,
  collector: `${__dirname}/../src/features/events`,
  collectorindex: `${__dirname}/../src/features/events/index.js`,
  TEMPLATES: `${__dirname}/templates`
};

var program = require('commander');
const inquirer = require('inquirer');
const fs = require('fs');

console.log("jscli is running...");

const fileGenerator = {
    generateservice: function(name) {
        const filePath = PATHS.TEMPLATES + "/service.tpl";

        const fStats = fs.statSync(filePath);

        if( fStats.isFile() ) {

            let contents = fs.readFileSync(filePath, 'utf8');

            contents = contents.replace(new RegExp("%%CLASSNAME%%", 'g'), name);
            const writePath = `${PATHS["service"]}/${name}.js`;
            fs.writeFileSync(writePath, contents, 'utf8');

            let serviceIndexContent = fs.readFileSync(PATHS.serviceindex, 'utf8');
            let nextExport = `export { default as ${name} } from './${name}';`;
            serviceIndexContent = serviceIndexContent + "\r\n" + nextExport;

            fs.writeFileSync(PATHS.serviceindex, serviceIndexContent, 'utf8');
        }
    },

    deleteservice: function(name) {

        const filePath = `${PATHS["service"]}/${name}.js`;

        // delete the file
        if( fs.existsSync(filePath) ) {
           fs.unlinkSync(filePath);
        }

        const serviceIndexContent = fs.readFileSync(PATHS["serviceindex"],'utf8');
        const _match= '\\s' + name + '\\s';
        console.log(_match);
        const res = serviceIndexContent.split('\n').map( (data) => {
            if( data.match(_match) ) {
                return null;
            }
            return data;
        }).join("\n");

        fs.writeFileSync(PATHS["serviceindex"], res, 'utf8');
    },

    generatecollector: function(name) {
        const filePath = PATHS.TEMPLATES + "/collector.tpl";

        const fStats = fs.statSync(filePath);

        if( fStats.isFile() ) {

            let contents = fs.readFileSync(filePath, 'utf8');

            contents = contents.replace(new RegExp("%%CLASSNAME%%", 'g'), name);
            const writePath = `${PATHS["collector"]}/${name}.js`;
            fs.writeFileSync(writePath, contents, 'utf8');
        }
    },
};


program
    .version('0.1.0');

program
    .command('generate [file] [name]')
    .description('JSCLIENT File Templating')
    .action(function(file, name, options){
        console.log("generate file",file, name);
        const command = "generate" + file;
        fileGenerator[command](name);
    });

program
    .version('0.1.0')
    .command('delete [file] [name]')
    .description('JSCLIENT File Templating')
    .action(function(file, name, options){
        console.log("delete file",file, name);
        const command = "delete" + file;
        fileGenerator[command](name);
    });


program.parse(process.argv);

