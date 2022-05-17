import _ from 'underscore';
import op from 'object-path';
import Reactium from 'reactium-core/sdk';

const can = (params, strict, state) => {
    state = state || Reactium.Handle.get('app').current;

    if (!state) return false;

    let u = state.User.current();

    if (!u) return false;

    u = u.toJSON();

    if (!u.roles) return false;

    let userRoles = Array.from(Object.keys(u.roles));
    userRoles.push('anonymous');
    userRoles.push('user');
    userRoles = _.chain(userRoles)
        .compact()
        .uniq()
        .value();

    // is admin?
    const admins = ['super-admin', 'super-administrator', 'administrator'];
    if (_.intersection(userRoles, admins).length > 0) {
        return true;
    }

    params = params || {};

    let score = 0;
    let max = 0;

    let roles = op.get(params, 'roles');
    roles = roles || op.get(params, 'role', []);
    roles = _.isString(roles) ? [roles] : roles;
    roles = _.chain(roles)
        .compact()
        .uniq()
        .value();
    if (roles.length > 0) {
        max += 1;
        score += _.intersection(userRoles, roles).length > 0 ? 1 : 0;
    }

    const userCaps = _.pluck(u.capabilities, 'group');
    let caps = op.get(params, 'capabilities', []);
    caps = _.isString(caps) ? [caps] : caps;
    if (caps.length > 0) {
        max += 1;
        score += _.intersection(userCaps, caps).length > 0 ? 1 : 0;
    }

    const userLevel = _.max(Object.values(u.roles));
    const level = op.get(params, 'level', 0);
    if (level > 0) {
        max += 1;
        score += userLevel >= level ? 1 : 0;
    }

    return strict === true ? score >= max : score > 0;
};

const useUserCan = state => {
    state = state || Reactium.Handle.get('app').current;

    const _can = (...args) => can(...args, state);

    return _can;
};

export { useUserCan, can };
