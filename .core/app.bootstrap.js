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

let INIT_HOOKS = ['user', 'init', 'sdk-init', 'routes'];

let BOOT_HOOKS = [
    'dependencies',
    'plugin-dependencies',
    'plugin-ready',
    'data-sync',
    'app-ready',
];
const logout = Reactium.User.logOut;

const appID = op.get(pkg, 'actinium.appID');
const serverURL = op.get(pkg, 'actinium.serverURL');
const actinium = Boolean(appID && serverURL);

const screenName = target =>
    String(target)
        .split('-')
        .shift();

const defaultState = {
    actinium,
    appstate: 'active',
    route: {
        init: false,
        previous: null,
        current: null,
    },
};

Reactium.Route.remember = screen => Reactium.LocalStorage.set('screen', screen);

const App = () => {
    const Navigator = useHookComponent('Navigator');

    const state = useSyncState(defaultState);

    const can = Reactium.useUserCan(state);

    const runHook = Reactium.useRunHook(state);

    const dispatch = Reactium.useDispatcher({ state });

    state.STATUS = STATUS;

    if (!state.User) {
        state.User = Reactium.User;
        state.User.current = () => null;
        if (!state.User.current) {
            state.User.current = () => null;
        }
    }

    const [, setUserStatus, isUserStatus] = useStatus(STATUS.PENDING);
    const [status, setStatus, isStatus, getStatus] = useStatus(STATUS.STARTING);

    const [navigation, setNavigation] = useState(null);

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
        await runHook('done');
        setStatus(STATUS.DONE, true);
    });

    const init = async () => {
        if (!isUserStatus(STATUS.PENDING)) return;
        setUserStatus(STATUS.FETCHING);

        let u;

        try {
            u = await state.User.currentAsync();
            if (u) u = await u.fetch();
        } catch (err) {}

        state.User.current = () => u;

        if (u) {
            const cachedState = Reactium.LocalStorage.get('state');
            if (cachedState) state.set({ ...cachedState, appstate: 'active' });
        }

        for (let hook of INIT_HOOKS) {
            await runHook(hook);
        }
        setUserStatus(STATUS.DONE);
    };

    const loadHooks = useCallback(async () => {
        for (let hook of manifest.hook) {
            try {
                await hook();
            } catch (err) {
                console.log('Error running hook:', hook);
            }
        }

        await runHook('init-hooks', { event: false }, { INIT_HOOKS });
        await runHook('boot-hooks', { event: false }, { BOOT_HOOKS });
        await init();

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

    const onRouteBlur = useCallback(props => {
        const screen = screenName(props.target);

        const newRoute = {
            ...state.get('route'),
            previous: screen,
            screen,
        };

        state.set('route', newRoute);

        return runHook('route-blur', null, newRoute);
    });

    const onRouteChange = useCallback(props => {
        if (!isUserStatus(STATUS.DONE)) return;

        if (!navigation) return;

        const { params = {} } = navigation.getCurrentRoute();

        const screen = screenName(props.target);

        const routeObj = _.findWhere(Reactium.Route.list, { name: screen });

        const newRoute = {
            ...routeObj,
            current: screen,
            previous: state.get('route.current'),
            screen,
            params,
        };

        newRoute.remember = op.get(routeObj, 'remember', false);

        state.set('route', newRoute);

        return status > 3
            ? runHook('route-change', null, { route: newRoute })
            : null;
    });

    const onStateChange = useCallback(({ path: key, value, ...event }) => {
        key = key === 'undefiend' || !key ? event.__path : key;
        if (key === 'undefined' || !key) return;
        dispatch('change', { key, value });
    }, []);

    const onStatusChange = async () => {
        if (state.status === status) return;

        switch (status) {
            case STATUS.STARTING:
                console.log('');
                await loadHooks();
                break;

            case STATUS.BOOTUP:
                state.set('updated', Date.now());
                await bootup();
                break;

            case STATUS.READY:
                state.set('updated', Date.now());
                await done();
                break;

            case STATUS.DONE:
                state.set('updated', Date.now());
                await setAppLoaded();
                break;
        }

        state.status = status;
        await runHook('status', { asynchronous: false }, { status });
        state.set('updated', Date.now());
    };

    const setAppLoaded = () => {
        if (navigation) {
            if (
                typeof navigation.isReady === 'function' &&
                typeof navigation.getCurrentRoute === 'function'
            ) {
                if (navigation.getCurrentRoute()) {
                    return runHook('rendered');
                }
            }
        }
    };

    // External Interface: Extensions
    state.extend('dispatch', dispatch);
    state.extend('getStatus', getStatus);
    state.extend('isInit', () => isUserStatus(STATUS.DONE));
    state.extend('isStatus', isStatus);
    state.extend('rerender', () => state.set('updated', Date.now()));
    state.extend('routeBlur', onRouteBlur);
    state.extend('routeChanged', onRouteChange);
    state.extend('runHook', runHook);
    state.extend('setAppLoaded', setAppLoaded);
    state.extend('setStatus', setStatus);

    state.User.can = can;

    state.User.auth = async (u, p) => {
        let authFunction = (u, p) => Reactium.User.logIn(u, p);

        const context = { authFunction };

        await runHook('before-auth', null, context);

        try {
            let user = await context.authFunction(u, p);
            user = await user.fetch();

            state.User.current = () => user;

            state.set('update', Date.now());

            await new Promise(resolve => {
                setTimeout(async () => {
                    await runHook('auth');
                    resolve();
                }, 1);
            });
            return user;
        } catch (err) {
            console.log(err);
            throw new Error('invalid username or password');
        }
    };

    state.User.logOut = async () => {
        await runHook('before-signout');
        logout();
        state.User.current = () => null;
        return runHook('signout');
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
    useAsyncEffect(onStatusChange, [status]);

    // state change
    useEventEffect(state, { set: onStateChange });

    // External Interface: register handle 'app'
    useRegisterHandle('app', () => state);

    // Renderer
    return <Navigator ref={setNavigation} route={state.get('route.current')} />;
};

App.STATUS = STATUS;

export default App;
