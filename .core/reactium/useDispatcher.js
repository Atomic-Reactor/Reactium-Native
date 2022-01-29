import cc from 'camelcase';
import op from 'object-path';
import { ComponentEvent } from 'reactium-core/sdk';

const useDispatcher = ({ props = {}, state }) => (type, data = {}) => {
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
