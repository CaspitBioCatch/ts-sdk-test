const _ = require('lodash');
const { GitRevisionPlugin } = require('git-revision-webpack-plugin');

// Try to get git version, fallback to 'nogit' if not available
let gitVersion = 'nogit';
try {
    const gitRevisionPlugin = new GitRevisionPlugin({
        versionCommand: 'rev-parse --short HEAD' // Customize the command to produce short git version tags
    });
    gitVersion = gitRevisionPlugin.version();
} catch (error) {
    console.warn('Git not available, using fallback version');
}

const release = {
    majorVersion: process.env.SHORT_VERSION || 'dev-version',
    buildNumber: process.env.GITHUB_RUN_NUMBER || 0,
    version_temp: '<%= majorVersion %>.<%= buildNumber %>.<%=  version %>',
    version: '',
};

class Version {
    constructor() {
        const compiledVersion = _.template(release.version_temp);
        this._formattedString = compiledVersion({
            'majorVersion': release.majorVersion,
            'buildNumber': release.buildNumber,
            'version': gitVersion,
        });
    }

    get formattedString() {
        return this._formattedString;
    }
}

module.exports = new Version();
