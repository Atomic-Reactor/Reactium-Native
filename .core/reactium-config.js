const version = '0.0.1';

/**
 * Use liberally for additional core configuration.
 * @type {Object}
 */
module.exports = {
    version,
    semver: '^0.0.1',
    update: {
        package: {
            dependencies: {
                remove: [],
            },
            devDependencies: {
                remove: [],
            },
            scripts: {
                add: {
                    android: 'arcli start -t android',
                    ios: 'arcli start -t ios',
                },
                remove: ['android', 'ios', 'start'],
            },
        },
        files: {
            add: [
                {
                    overwrite: true,
                    version: '>=0.0.1',
                    destination: '/.prettierrc.js',
                    source: '/tmp/.prettierrc.js',
                },
                {
                    overwrite: true,
                    version: '>=0.0.1',
                    destination: '/gulpfile.js',
                    source: '/tmp/gulpfile.js',
                },
                {
                    overwrite: true,
                    version: '>=0.0.1',
                    destination: '/.prettierignore',
                    source: '/tmp/.prettierignore',
                },
                {
                    overwrite: false,
                    version: '>=0.0.1',
                    destination: '/.flowconfig',
                    source: '/tmp/.flowconfig',
                },
                {
                    overwrite: false,
                    version: '>=0.0.1',
                    destination: '/.huskyrc',
                    source: '/tmp/.huskyrc',
                },
                {
                    overwrite: true,
                    version: '>=0.0.1',
                    destination: '/index.js',
                    source: '/tmp/index.js',
                },
                {
                    overwrite: true,
                    version: '>=0.0.1',
                    destination: '/babel.config.js',
                    source: '/tmp/babel.config.js',
                },
                {
                    overwrite: true,
                    version: '>=0.0.1',
                    destination: '/metro.config.js',
                    source: '/tmp/metro.config.js',
                },
                {
                    overwrite: true,
                    version: '>=0.0.1',
                    destination: '/ios/Podfile',
                    source: '/tmp/ios/Podfile',
                },
            ],
            remove: [],
        },
    },
};
