/**
 * Reactium Native App Bootstrap
 *
 * @format
 * @flow strict-local
 */

import _ from 'underscore';
import op from 'object-path';
import pkg from '~/package.json';
import manifest from '~/src/manifest';
import { AppState } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';

import Reactium, {
    ComponentEvent,
    useAsyncEffect,
    useEventEffect,
    useHookComponent,
    useRegisterHandle,
    useStatus,
    useSyncState,
} from 'reactium-core/sdk';

const STATUS = {
    PENDING: 0,
    STARTING: 1,
    BOOTUP: 2,
    READY: 3,
    DONE: 4,
    FETCHING: 5,
};

const BOOT_HOOKS = [
    'init',
    'sdk-init',
    'dependencies',
    'plugin-dependencies',
    'plugin-ready',
    'routes',
    'data-sync',
    'app-ready',
];
const logout = Reactium.User.logOut;

const appID = op.get(pkg, 'actinium.appID');
const serverURL = op.get(pkg, 'actinium.serverURL');
const actinium = Boolean(appID && serverURL);

const App = () => {
    const Navigator = useHookComponent('Navigator');

    const state = useSyncState({
        actinium,
        appstate: 'active',
        route: {
            init: false,
            previous: null,
            current: 'home',
            updated: Date.now(),
        },
    });

    if (!state.User) {
        state.User = Reactium.User;
        state.User.current = () => null;
        if (!state.User.current) {
            state.User.current = () => null;
        }
    }

    const dispatch = Reactium.useDispatcher({ state });
    const [userStats, setUserStatus, isUserStatus] = useStatus(
        STATUS.PENDING,
    );
    const [status, setStatus, isStatus, getStatus] = useStatus(STATUS.STARTING);

    const [navigation, updateNavigation] = useState(null);

    const can = (params, strict) => {
        let u = state.User.current();

        if (!u) return false;
        u = u.toJSON();

        const userRoles = Object.keys(u.roles);

        // is admin?
        const admins = ['super-admin', 'administrator'];
        if (_.intersection(userRoles, admins).length > 0) {
            return true;
        }

        params = params || {};

        let score = 0;
        let max = 0;

        let roles = op.get(params, 'roles', []);
        roles = _.isString(roles) ? [roles] : roles;
        if (roles.length > 0) {
            max += 1;
            if (_.intersection(userRoles, roles).length > 0) {
                score += 1;
            }
        }

        const userCaps = _.pluck(u.capabilities, 'group');
        let caps = op.get(params, 'capabilities', []);
        caps = _.isString(caps) ? [caps] : caps;
        if (caps.length > 0) {
            max += 1;
            if (_.intersection(userCaps, caps).length > 0) {
                score += 1;
            }
        }

        const userLevel = _.max(Object.values(u.roles));
        const level = op.get(params, 'level', 0);
        if (level > 0) {
            max += 1;

            if (userLevel >= level) {
                score += 1;
            }
        }

        if (strict === true && score < max) {
            return false;
        }

        return strict !== true && score > 0;
    };

    const bootup = useCallback(async () => {
        for (let hook of BOOT_HOOKS) {
            await runHook(hook);
        }

        setStatus(STATUS.READY, true);
    });

    const done = useCallback(async () => {
        if (!isUserStatus(STATUS.DONE)) {
            _.defer(() => done());
            return;
        }
        await runHook('ready');
        setStatus(STATUS.DONE, true);
    });

    const loadHooks = useCallback(async () => {
        for (let hook of manifest.hook) {
            try {
                await hook();
            } catch (err) {
                console.log('Error running hook:', hook);
            }
        }

        setStatus(STATUS.BOOTUP, true);
    });

    const onAppState = useCallback(current => {
        const isActive = current === 'active';

        current = !isActive ? 'inactive' : current;

        const previous = state.get('appstate', 'active');

        if (previous === current) return;

        state.set('appstate', current);

        if (!isActive) {
            Reactium.LocalStorage.set('state', state.get());
        }

        dispatch(`appstate-${current}`);
        dispatch('appstate', { current, previous });
    });

    const onRouteChange = useCallback(({ type, ...e }) => {
        if (!navigation) return;

        const { name, params = {} } = navigation.getCurrentRoute() || {
            name: state.get('route.current'),
        };

        if (!name) return;

        switch (type) {
            case 'focus':
                const current = name;
                const route = state.get('route');
                const routeInit = op.get(route, 'init');
                const previous = op.get(route, 'current');
                const newRoute = { current, previous, params, init: true };

                state.set('route', newRoute);

                if (routeInit === true) {
                    const evt = new ComponentEvent('route-change', newRoute);
                    const _onRouteChange = async e => {
                        await Reactium.Hook.run('route-change', e);
                        Reactium.Hook.runSync('route-change', e);
                    };
                    state.addEventListener('route-change', _onRouteChange);
                    state.dispatchEvent(evt);
                    state.removeEventListener('route-change', _onRouteChange);
                }
                break;
        }
    });

    const onStateChange = useCallback(({ path: key, value, ...event }) => {
        key = key === 'undefiend' || !key ? event.__path : key;
        if (key === 'undefined' || !key) return;
        dispatch('change', { key, value });
    }, []);

    const runHook = async (hook, options) => {
        const defaultOptions = {
            event: true,
            synchronous: true,
            asynchronous: true,
        };

        options = _.isObject(options)
            ? { ...defaultOptions, ...options }
            : defaultOptions;

        const startTime = performance.now();

        console.log(`Starting '${hook}' hook...`);

        if (options.event === true) {
            dispatch(hook);
        }

        if (options.synchronous === true) {
            try {
                Reactium.Hook.runSync(hook, state);
            } catch (err) {
                console.log(err);
            }
        }

        if (options.asynchronous === true) {
            try {
                await Reactium.Hook.run(hook, state);
            } catch (err) {
                console.log(err);
            }
        }

        const endTime = performance.now();
        const diff = endTime - startTime;
        const elapsed = Math.round((diff + Number.EPSILON) * 100) / 100;

        console.log(`Finished '${hook}' after ${elapsed} ms`);
        console.log('');
    };

    const setNavigation = useCallback(value => {
        if (navigation || !value) return;
        updateNavigation(value);
    });

    const shouldRender = useCallback(() => {
        if (navigation === null) {
            return false;
        }

        if (!isStatus(STATUS.DONE)) {
            return false;
        }

        if (Reactium.Route.list.length < 1) {
            return false;
        }

        if (!isUserStatus(STATUS.DONE)) {
            return false;
        }

        return true;
    });

    const userINIT = async () => {
        if (!isUserStatus(STATUS.PENDING)) return;
        setUserStatus(STATUS.FETCHING);

        const u = await state.User.currentAsync();

        state.User.current = () => u;

        await runHook('user');
        setUserStatus(STATUS.DONE);
    };

    // External Interface: Extensions
    state.extend('getStatus', getStatus);
    state.extend('isStatus', isStatus);
    state.extend('rerender', () => state.set('updated', Date.now()));
    state.extend('routeChanged', onRouteChange);
    state.extend('runHook', runHook);
    state.extend('shouldRender', shouldRender);
    state.extend('setStatus', setStatus);

    state.User.can = can;

    state.User.auth = async (u, p) => {
        await runHook('before-auth');
        const user = await Reactium.User.logIn(u, p);
        // Reactium.User.current = () => user;
        state.User.current = () => user;
        await runHook('auth');
        return user;
    };

    state.User.logOut = async () => {
        await runHook('before-signout');
        await logout();
        state.User.current = () => null;
        await runHook('signout');
    };

    // Navigation created
    useEffect(() => {
        Reactium.Navigator = navigation;
        state.set('updated', Date.now());
    }, [navigation]);

    // AppState change
    useEffect(() => {
        const subscription = AppState.addEventListener('change', onAppState);

        return () => {
            subscription.remove();
        };
    }, []);

    // Status change
    useAsyncEffect(async () => {
        if (state.status === status) return;

        switch (status) {
            case STATUS.STARTING:
                console.log('');

                await userINIT();
                await loadHooks();
                break;

            case STATUS.BOOTUP:
                await bootup();
                break;

            case STATUS.READY:
                await done();
                break;

            case STATUS.DONE:
                state.set('updated', Date.now());
                await runHook('rendering');
                break;
        }

        state.status = status;
        state.set('updated', Date.now());
    }, [status]);

    // state change
    useEventEffect(state, { set: onStateChange });

    // External Interface: register handle 'AppState'
    useRegisterHandle('app', () => state);

    // Renderer
    return (
        <Navigator
            ref={setNavigation}
            isLoaded={shouldRender()}
            route={state.get('route.current')}
        />
    );
};

export default App;
