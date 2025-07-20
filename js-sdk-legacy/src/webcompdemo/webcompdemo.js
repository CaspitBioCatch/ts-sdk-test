import { WebCompDemo } from './Application';

window.customElements.define('custom-shadow-element', WebCompDemo);

window.document.addEventListener('DOMContentLoaded', function () {
    const el = document.createElement('custom-shadow-element');
    const wcroot = document.getElementById('wcroot');

    window.setTimeout(() => {
        wcroot.innerHTML = '';
        wcroot.appendChild(el);
    }, 2000);
});
