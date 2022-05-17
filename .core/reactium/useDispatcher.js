import cc from 'camelcase';
import op from 'object-path';
import Reactium from 'reactium-core/sdk';
import { ComponentEvent } from 'reactium-core/sdk';

const useDispatcher = ({ props = {}, state }) => (type, data = {}) => {
    state = state || Reactium.Handle.get('global').current;
    state = state || Reactium.Handle.get('state').current;
    state = state || Reactium.Handle.get('app').current;
    
    if (!state) return;

    const callback = op.get(props, cc(`on-${type}`));

    if (typeof callback === 'function') {
        state.addEventListener(type, callback);
    }

    data.cancelable = true;
    const evt = new ComponentEvent(type, data);

    state.dispatchEvent(evt);

    if (typeof callback === 'function') {
        state.removeEventListener(type, callback);
    }

    return evt;
};

export { useDispatcher };
