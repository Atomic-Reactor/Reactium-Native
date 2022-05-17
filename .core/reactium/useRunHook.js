import _ from 'underscore';
import op from 'object-path';
import Reactium from 'reactium-core/sdk';

const runHook = async (hook, options, params = {}, state) => {
    state = state || Reactium.Handle.get('app').current;

    const isStatus = hook === 'status' && op.get(params, 'status');

    hook = isStatus ? `status-${params.status}` : hook;

    const dispatch = Reactium.useDispatcher({ state });

    const defaultOptions = {
        event: true,
        synchronous: true,
        asynchronous: true,
        log: true,
    };

    if (isStatus) {
        params.status = Object.keys(state.STATUS)[
            Object.values(state.STATUS).indexOf(params.status)
        ];
    }

    options = _.isObject(options)
        ? { ...defaultOptions, ...options }
        : defaultOptions;

    const log = (...args) => {
        if (options.log === true) {
            console.log(...args);
        }
    };

    const startTime = performance.now();

    let msg = isStatus
        ? `Starting '${params.status}' status...`
        : `Starting '${hook}' hook...`;

    log(msg);

    if (options.event === true) {
        dispatch(hook, params);
    }

    if (options.synchronous === true) {
        try {
            Reactium.Hook.runSync(hook, state, params);
        } catch (err) {
            console.log(err);
        }
    }

    if (options.asynchronous === true) {
        try {
            await Reactium.Hook.run(hook, state, params);
        } catch (err) {
            console.log(err);
        }
    }

    const endTime = performance.now();
    const diff = endTime - startTime;
    const elapsed = Math.round((diff + Number.EPSILON) * 100) / 100;

    msg = isStatus
        ? `Finished '${params.status}' status after ${elapsed} ms`
        : `Finished '${hook}' hook after ${elapsed} ms`;

    log(msg);
    log('');
};

const useRunHook = state => {
    state = state || Reactium.Handle.get('app').current;

    const _runHook = (...args) => runHook(...args, state);

    return _runHook;
};

export { useRunHook, runHook };
