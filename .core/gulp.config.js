const path = require('path');
const rootPath = path.resolve(__dirname, '..');

module.exports = {
    manifestFile: path.normalize(path.join(rootPath, 'src', 'manifest.js')),
    DDD: {
        gulp: [
            `${rootPath}/.core/**/reactium-gulp.js`,
            `${rootPath}/src/**/reactium-gulp.js`,
            `${rootPath}/reactium_modules/**/reactium-gulp.js`,
            `${rootPath}/node_modules/**/reactium-plugin/**/reactium-gulp.js`,
        ],
        hook: [
            `${rootPath}/.core/**/reactium-hooks.js`,
            `${rootPath}/src/**/reactium-hooks.js`,
            `${rootPath}/reactium_modules/**/reactium-hooks.js`,
            `${rootPath}/node_modules/**/reactium-plugin/**/reactium-hooks.js`,
        ],
    },
    watch: [
        '**/reactium-gulp.js',
        '**/reactium-hooks.js',
    ],
};
