const path = require('path');
const chalk = require('chalk');
const gulpConfig = require('./gulp.config');
const globby = require('./globby-patch').sync;

global.ReactiumMetro =
    global.ReactiumMetro ||
    require('@atomic-reactor/reactium-native-sdk-core').default;

// Load reactium-metro.js DDD artifacts
const loadHooks = () =>
    globby(gulpConfig.DDD.metro).forEach(item => {
        const p = path.normalize(item);
        try {
            require(p);
        } catch (error) {
            console.error(chalk.red(`Error loading ${p}:`));
            console.error(error);
        }
    });

const runHooks = metroConfig => {
    const hooks = ['metro-config'];
    hooks.forEach(hook => ReactiumMetro.Hook.runSync(hook, metroConfig));
};

module.exports = (() => {
    let baseMetroConfig = {
        transformer: {
            getTransformOptions: async () => ({
                transform: {
                    experimentalImportSupport: false,
                    inlineRequires: true,
                },
            }),
        },
        resolver: {
            assetExts: ['png', 'jpg', 'svg'],
            sourceExts: ['jsx', 'js', 'ts', 'tsx'],
        },
        watchFolders: ['./.core', './src'],
    };

    loadHooks();

    console.log('');
    runHooks(baseMetroConfig);
    console.log('');

    return baseMetroConfig;
})();
