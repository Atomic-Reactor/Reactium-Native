const manifestGen = require('./manifest-gen');

const reactiumTasks = (gulp, config, task) => {
    const manifest = done => {
        manifestGen(config);
        done();
    };

    const watch = done => {
        ReactiumGulp.Hook.registerSync('change', () => manifestGen(config));

        const watcher = gulp.watch(['**/reactium-hooks.js']);
        watcher.on('change', (path, stats) => {
            ReactiumGulp.Hook.runSync('change', { path, stats });
        });
        watcher.on('add', (path, stats) => {
            ReactiumGulp.Hook.runSync('add', { path, stats });
            ReactiumGulp.Hook.runSync('change', { path, stats });
        });
        watcher.on('unlink', (path, stats) => {
            ReactiumGulp.Hook.runSync('delete', { path, stats });
            ReactiumGulp.Hook.runSync('change', { path, stats });
        });
    };

    const tasks = {
        manifest,
        watch,
    };

    return tasks;
};

module.exports = reactiumTasks;
