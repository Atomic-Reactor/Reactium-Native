const path = require('path');
const gulp = require('gulp');
const chalk = require('chalk');
const config = require('./gulp.config');
const globby = require('./globby-patch').sync;
const ReactiumGulp = require('@atomic-reactor/reactium-native-sdk-core').default;

// Globals
global.ReactiumGulp = ReactiumGulp;

// Load reactium-gulp.js DDD artifacts
globby(config.DDD.gulp).forEach(item => {
    const p = path.normalize(item);
    try {
        require(p);
    } catch (error) {
        console.error(chalk.red(`Error loading ${p}:`));
        console.error(error);
    }
});

ReactiumGulp.Hook.runSync('sdk-init', ReactiumGulp);

// Tasks registry
const GulpRegistry = ReactiumGulp.Utils.registryFactory(
    'GulpTasks',
    'name',
    ReactiumGulp.Utils.Registry.MODES.CLEAN,
);

// Run the config hook
ReactiumGulp.Hook.runSync('config', config);

// Register default tasks
const tasks = require('./gulp.tasks')(gulp, config);
Object.entries(tasks).forEach(([name, task]) =>
    GulpRegistry.register(name, {
        name,
        task,
    }),
);

// Run the tasks hook
ReactiumGulp.Hook.runSync('tasks', GulpRegistry, { config, gulp });

// Register gulp tasks
GulpRegistry.list.forEach(({ name, task }) => gulp.task(name, task));

let watch;
const excluded = ['watch'];
const series = GulpRegistry.list
    .filter(({ name, task }) => {
        task.displayName = task.displayName || name;

        if (excluded.includes(name)) {
            if (name === 'watch') {
                watch = task;
            }
            return false;
        }

        return true;
    })
    .map(({ task }) => task);

// If watch is defined ensure it's the last task
if (watch) series.push(watch);

// Export default
module.exports = gulp.series(...series);
