module.exports = {
    presets: [
        'module:metro-react-native-babel-preset'
    ],
    plugins: [
        [
            'module-resolver',
            {
                root: ['./'],
                alias: {
                    '^~(.+)': './\\1',
                    'reactium-core/sdk': './.core/reactium/index.js',
                    'reactium-core/bootstrap': './.core/app.bootstrap.js',
                },
                extensions: ['.js', '.json', '.jsx', 'ts', 'tsx'],
            },
        ],
        'react-native-reanimated/plugin',
    ],
};
