(() => {
    const chalk = require('chalk');
    const op = require('object-path');
    
    ReactiumMetro.Hook.registerSync('metro-config', config => {
        console.log(
            `\t${chalk.cyan('sync-hook')}:${chalk.magenta(
                'metro-config',
            )} - ./.core/components/SVG/reactium-metro.js : line 4`,
        );

        const assetExts = op.get(config, 'resolver.assetExts', []);

        op.set(
            config,
            'resolver.assetExts',
            assetExts.filter(ext => ext !== 'svg'),
        );

        op.set(
            config,
            'transformer.babelTransformerPath',
            require.resolve('react-native-svg-transformer'),
        );
    });
})();
