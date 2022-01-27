import _ from 'underscore';
import uuid from 'uuid/v4';
import op from 'object-path';
import { MMKV } from 'react-native-mmkv';

const shouldJsonParse = v =>
    Boolean(
        v &&
            ((String(v).startsWith('{') && String(v).endsWith('}')) ||
                (String(v).startsWith('[') && String(v).endsWith('}]'))),
    );

const shouldJsonStringify = v => Boolean(v && (_.isArray(v) || _.isObject(v)));

class LocalStorage {
    constructor() {
        this.storage = new MMKV();
        this._subscribers = {};
        this._subscribedPaths = {};
    }

    clear(silent) {
        this.storage.clearAll();
        return !silent ? this.dispatch('clear') : this;
    }

    del(key) {
        key = _.isArray(key) ? key : String(key).split('.');

        let curr = { ...this.get() };
        const val = op.get(curr, key); 

        op.del(curr, key);

        return this.clear(true).set(curr, null, true).dispatch('del', key, val);
    }

    dispatch(op, key, value) {
        key = _.isArray(key) ? key.join('.') : key;
        this.subscribers(key).forEach(cb => cb({ op, key, value }));
        return this;
    }

    get(key, defaultValue) {
        const keys = this.keys();
        const values = keys
            .map(k => this.storage.getString(k) || this.storage.getNumber(k))
            .map(v => (shouldJsonParse(v) ? JSON.parse(v) : v));

        const value = _.object(keys, values);

        return typeof key !== 'undefined'
            ? op.get(value, key, defaultValue)
            : value;
    }

    keys() {
        return this.storage.getAllKeys();
    }

    put(...args) {
        return this.set(...args);
    }

    set(key, value, silent) {
        const curr = this.get();

        if (_.isObject(key)) {
            value = key;

            Object.entries(value).map(([k, v]) => {
                v = shouldJsonStringify(v) ? JSON.stringify(v) : v;
                this.storage.set(k, v);
                if (!silent) this.dispatch('set', k, v);
            });

            return this;
        } else {
            key = _.isArray(key) ? key : String(key).split('.');
            value = shouldJsonStringify(value) ? JSON.stringify(value) : value;

            op.set(curr, key, value);

            return this.set(curr, null, true).dispatch('set', key, value);
        }
    }

    subscribe(key, cb, id) {
        id = id || uuid();
        const keys = _.isArray(key) ? key : String(key).split('.');

        this._subscribers[id] = cb;

        for (let i = 0; i < keys.length; i++) {
            const key = keys.slice(0, i + 1).join('.');

            if (!(key in this._subscribedPaths)) {
                this._subscribedPaths[key] = {};
            }

            op.set(this._subscribedPaths[key], id, id);
        }

        return () => {
            delete this._subscribers[id];

            for (let i = 0; i < keys.length; i++) {
                const key = keys.slice(0, i + 1).join('.');
                op.del(this._subscribedPaths[key], id);
            }
        };
    }

    subscribers(key) {
        const keys = _.isArray(key) ? key : String(key).split('.');

        let keySubs = [];
        for (let i = 0; i < keys.length; i++) {
            const key = keys.slice(0, i + 1).join('.');
            if (key in this._subscribedPaths) {
                keySubs = _.uniq(
                    keySubs.concat(Object.keys(this._subscribedPaths[key])),
                );
            }
        }

        return keySubs.reduce(
            (subs, id) => subs.concat([this._subscribers[id]]),
            [],
        );
    }
}

const LS = new LocalStorage();
export { LS as LocalStorage };
