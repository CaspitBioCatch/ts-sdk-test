const createGruntKarmaConfig = require('./gruntKarmaConfigurations');

module.exports = function (grunt) {
    var config = {
        karma: createGruntKarmaConfig(),
        copy: {
            preCommitHook: {
                files: [
                    {
                        src: '<%= srcTestsHooksDirectory %>/pre-commit',
                        dest: '<%= hooksDirectory%>/',
                        expand: true,
                        flatten: true
                    }
                ]
            },
        },
        exec: {
            setPreCommitFilePermissions: {
                cwd: './<%= hooksDirectory %>',
                cmd: 'chmod +x pre-commit'
            }
        }
    };

    grunt.initConfig(config);

    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-exec');

    // Testing tasks
    grunt.registerTask('unit-tests', ['copyPreCommitHook', 'karma:unitTests']);
    grunt.registerTask('unit-tests-dev', ['copyPreCommitHook', 'karma:unitTestsDev']);
    grunt.registerTask('ci-unit-tests', ['karma:ciUT']);
    grunt.registerTask('ci-unit-tests-min-output', ['karma:ciUTMinOutput']);
    grunt.registerTask('ci-unit-tests-excluding-ios-min-output', ['karma:ciUTExcludingIosMinOutput']);
    grunt.registerTask('ci-unit-tests-safari', ['karma:ciUTSafariMinOutput']);
    grunt.registerTask('ci-unit-tests-android', ['karma:ciUTAndroidMinOutput']);
    grunt.registerTask('ci-unit-tests-mac', ['karma:ciUTMacMinOutput']);
    grunt.registerTask('ci-unit-tests-windows', ['karma:ciUTWindowsMinOutput']);
    grunt.registerTask('ci-unit-tests-legacy', ['karma:ciUTLegacyMinOutput']);
    grunt.registerTask('integration-tests', ['karma:integrationTests']);
    grunt.registerTask('integration-tests-dev', ['karma:integrationTestsDev']);
    grunt.registerTask('cross-domain-integration-tests-dev', ['karma:crossDomainIntegrationTestsDev']);
    grunt.registerTask('integration-slave', ['karma:slaveIntegration', 'karma:slaveBootstrapIntegration']);
    grunt.registerTask('ci-integration-tests', ['copyPreCommitHook','karma:ciIT']);
    grunt.registerTask('ci-integration-slave-tests-min-output', ['karma:ciITSlaveMinOutput']);
    grunt.registerTask('ci-integration-slave-latest-beta-min-output', ['karma:ciITSlaveLatestBetaMinOutput']);
    grunt.registerTask('ci-integration-tests-min-output', ['karma:ciITMinOutput']);
    grunt.registerTask('ci-integration-tests-excluding-ios-min-output', ['karma:ciITExcludingIosMinOutput']);
    grunt.registerTask('ci-integration-tests-safari', ['karma:ciITSafariMinOutput']);
    grunt.registerTask('ci-crossdomain-integration-tests-safari', ['karma:ciCDITMinOutput']);
    grunt.registerTask('ci-integration-tests-opera', ['karma:ciITOperaMinOutput']);
    grunt.registerTask('ci-integration-tests-latest-beta-win', ['karma:ciITLatestBetaMinOutputWin']);
    grunt.registerTask('ci-integration-tests-latest-beta-macOS', ['karma:ciITLatestBetaMinOutputMacOS']);
    grunt.registerTask('ci-integration-tests-latest-beta-android', ['karma:ciITLatestBetaMinOutputAndroid']);
    grunt.registerTask('ci-integration-tests-latest-beta-ios', ['karma:ciITLatestBetaMinOutputIOS']);
    grunt.registerTask('ci-integration-tests-android', ['karma:ciITAndroidMinOutput']);
    grunt.registerTask('ci-integration-tests-mac', ['karma:ciITMacMinOutput']);
    grunt.registerTask('ci-integration-tests-windows', ['karma:ciITWindowsMinOutput']);
    grunt.registerTask('ci-integration-tests-legacy', ['karma:ciITLegacyMinOutput']);
    grunt.registerTask('ci-integration-tests-desktop', ['karma:ciITMacMinOutput', 'karma:ciITWindowsMinOutput']);

    grunt.registerTask('copyPreCommitHook', 'Copy pre-commit hook to .git/hooks directory',
        function (srcTestsHooksDirectory, hooksDirectory) {
            srcTestsHooksDirectory = srcTestsHooksDirectory || 'scripts/git';
            hooksDirectory = hooksDirectory || '.git/hooks';
            grunt.config.set('srcTestsHooksDirectory', srcTestsHooksDirectory);
            grunt.config.set('hooksDirectory', hooksDirectory);
            grunt.task.run('copy:preCommitHook'); // copy the "pre-commit" hook to .git/hooks directory
            if (process.platform !== "win32") { // Set permission only for linux operating systems (all but windows)
                grunt.task.run('exec:setPreCommitFilePermissions'); //set execute permissions on the pre-commit file
            }
        }
    );

    grunt.registerTask('default', ['dev', 'integration']);
};
